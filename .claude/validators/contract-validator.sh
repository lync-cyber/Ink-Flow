#!/bin/bash
# contract-validator.sh — InkFlow 通用契约校验引擎
# 用法: contract-validator.sh <agent-name> <output-file> [brief-file]
#
# 从 .claude/agents/<agent-name>.md 的 frontmatter 动态读取 validation_rules
# 对 <output-file> 执行校验，输出 JSON 格式结果
#
# 设计原则：校验逻辑与校验规则分离
# - 脚本是通用的校验引擎
# - 规则从 agent .md 的 frontmatter 中动态加载
# - 不硬编码任何领域规则

set -euo pipefail

AGENT_NAME="${1:?用法: contract-validator.sh <agent-name> <output-file> [brief-file]}"
OUTPUT_FILE="${2:?缺少 output-file 参数}"
BRIEF_FILE="${3:-}"

AGENT_DIR=".claude/agents"
AGENT_FILE="${AGENT_DIR}/${AGENT_NAME}.md"

# ============================================================
# 工具函数
# ============================================================

violations=()
passed=true

add_violation() {
  local rule="$1"
  local detail="$2"
  violations+=("{\"rule\": \"${rule}\", \"detail\": \"${detail}\"}")
  passed=false
}

# 从 agent .md 提取 frontmatter（--- 之间的 YAML）
extract_frontmatter() {
  sed -n '/^---$/,/^---$/p' "$AGENT_FILE" | sed '1d;$d'
}

# 从 YAML 提取数组值（简单解析，每行一个 - "value"）
extract_yaml_array() {
  local key="$1"
  local yaml="$2"
  echo "$yaml" | sed -n "/^  ${key}:/,/^  [a-z]/p" | grep '^\s*- ' | sed 's/^\s*- //; s/^"//; s/"$//'
}

# 从 YAML 提取单值
extract_yaml_value() {
  local key="$1"
  local yaml="$2"
  echo "$yaml" | grep "^\s*${key}:" | head -1 | sed "s/.*${key}:\s*//" | sed 's/^\s*//;s/\s*$//'
}

# 从 brief frontmatter 读取字段值
read_brief_field() {
  local field="$1"
  if [[ -z "$BRIEF_FILE" || ! -f "$BRIEF_FILE" ]]; then
    echo ""
    return
  fi
  sed -n '/^---$/,/^---$/p' "$BRIEF_FILE" | grep "^${field}:" | sed "s/^${field}:\s*//" | sed 's/^\s*//;s/\s*$//'
}

# ============================================================
# 校验 Handler
# ============================================================

# Handler: required_sections — 检查 Markdown 标题是否存在
check_required_sections() {
  local yaml="$1"
  local sections
  sections=$(extract_yaml_array "required_sections" "$yaml")

  while IFS= read -r section; do
    [[ -z "$section" ]] && continue
    if ! grep -q "^#\+\s*${section}" "$OUTPUT_FILE" 2>/dev/null; then
      add_violation "required_section" "缺少必需 section: ${section}"
    fi
  done <<< "$sections"
}

# Handler: optional_sections — 解析 skip_if 条件，条件不满足时视为 required [改进#6]
check_optional_sections() {
  local yaml="$1"

  # 提取 optional_sections 块
  local opt_block
  opt_block=$(echo "$yaml" | sed -n '/^  optional_sections:/,/^  [a-z_]*:/p' | sed '1d;$d')

  local current_name=""
  local current_skip_if=""

  while IFS= read -r line; do
    if echo "$line" | grep -q '^\s*- name:'; then
      # 处理上一个条目
      if [[ -n "$current_name" ]]; then
        _check_optional_section "$current_name" "$current_skip_if"
      fi
      current_name=$(echo "$line" | sed 's/.*name:\s*"//;s/".*//')
      current_skip_if=""
    elif echo "$line" | grep -q '^\s*skip_if:'; then
      current_skip_if=$(echo "$line" | sed 's/.*skip_if:\s*"//;s/".*//')
    fi
  done <<< "$opt_block"

  # 处理最后一个条目
  if [[ -n "$current_name" ]]; then
    _check_optional_section "$current_name" "$current_skip_if"
  fi
}

_check_optional_section() {
  local name="$1"
  local skip_if="$2"

  # 解析 skip_if 条件: "brief.field == value"
  if [[ -n "$skip_if" ]]; then
    local field value actual
    field=$(echo "$skip_if" | sed 's/brief\.\(.*\)\s*==.*/\1/' | sed 's/\s*$//')
    value=$(echo "$skip_if" | sed 's/.*==\s*//' | sed 's/^\s*//;s/\s*$//')
    actual=$(read_brief_field "$field")

    # 条件满足 → 跳过该 section
    if [[ "$actual" == "$value" ]]; then
      return
    fi
  fi

  # 条件不满足或无条件 → 视为 required
  if ! grep -q "^#\+\s*${name}" "$OUTPUT_FILE" 2>/dev/null; then
    add_violation "optional_section" "条件必需 section 缺失: ${name}"
  fi
}

# Handler: word_count — 字数统计
check_word_count() {
  local yaml="$1"
  local min max actual

  min=$(echo "$yaml" | grep -A2 "word_count:" | grep "min:" | sed 's/.*min:\s*//')
  max=$(echo "$yaml" | grep -A2 "word_count:" | grep "max:" | sed 's/.*max:\s*//')

  [[ -z "$min" && -z "$max" ]] && return

  # 对中文内容，使用 wc -m 统计字符数更准确
  actual=$(wc -m < "$OUTPUT_FILE" | tr -d ' ')

  if [[ -n "$min" && "$actual" -lt "$min" ]]; then
    add_violation "word_count" "字数不足: 实际 ${actual}, 最少 ${min}"
  fi
  if [[ -n "$max" && "$actual" -gt "$max" ]]; then
    add_violation "word_count" "字数超出: 实际 ${actual}, 最多 ${max}"
  fi
}

# Handler: required_patterns — 正则匹配
check_required_patterns() {
  local yaml="$1"
  local patterns
  patterns=$(extract_yaml_array "required_patterns" "$yaml")

  while IFS= read -r pattern; do
    [[ -z "$pattern" ]] && continue
    if ! grep -qE "$pattern" "$OUTPUT_FILE" 2>/dev/null; then
      add_violation "required_pattern" "缺少匹配模式: ${pattern}"
    fi
  done <<< "$patterns"
}

# Handler: forbidden_patterns — 反向匹配
check_forbidden_patterns() {
  local yaml="$1"
  local patterns
  patterns=$(extract_yaml_array "forbidden_patterns" "$yaml")

  while IFS= read -r pattern; do
    [[ -z "$pattern" ]] && continue
    local match
    match=$(grep -nE "$pattern" "$OUTPUT_FILE" 2>/dev/null | head -3)
    if [[ -n "$match" ]]; then
      local first_line
      first_line=$(echo "$match" | head -1 | cut -d: -f1)
      add_violation "forbidden_pattern" "发现禁用模式 '${pattern}' (行 ${first_line})"
    fi
  done <<< "$patterns"
}

# Handler: platform_checks — 平台适配校验 [改进#6]
check_platform_checks() {
  local yaml="$1"

  # 提取 platform_checks 块
  local pc_block
  pc_block=$(echo "$yaml" | sed -n '/^  platform_checks:/,/^  [a-z_]*:/p' | sed '1d;$d')

  [[ -z "$pc_block" ]] && return

  local current_type=""
  local current_forbidden_css=""
  local current_allowed=""
  local current_max_width=""

  while IFS= read -r line; do
    if echo "$line" | grep -q '^\s*- type:'; then
      # 处理上一个条目
      _run_platform_check "$current_type" "$current_forbidden_css" "$current_allowed" "$current_max_width"
      current_type=$(echo "$line" | sed 's/.*type:\s*//')
      current_forbidden_css=""
      current_allowed=""
      current_max_width=""
    elif echo "$line" | grep -q '^\s*forbidden_css:'; then
      current_forbidden_css=$(echo "$line" | sed 's/.*\[//;s/\].*//' | tr ',' '\n' | sed 's/^\s*"//;s/"$//')
    elif echo "$line" | grep -q '^\s*allowed:'; then
      current_allowed=$(echo "$line" | sed 's/.*\[//;s/\].*//' | tr ',' '\n' | sed 's/^\s*"//;s/"$//')
    elif echo "$line" | grep -q '^\s*max_width:'; then
      current_max_width=$(echo "$line" | sed 's/.*max_width:\s*//')
    fi
  done <<< "$pc_block"

  _run_platform_check "$current_type" "$current_forbidden_css" "$current_allowed" "$current_max_width"
}

_run_platform_check() {
  local type="$1"
  local forbidden_css="$2"
  local allowed="$3"
  local max_width="$4"

  [[ -z "$type" ]] && return

  case "$type" in
    css_safety)
      while IFS= read -r css_prop; do
        [[ -z "$css_prop" ]] && continue
        if grep -q "$css_prop" "$OUTPUT_FILE" 2>/dev/null; then
          add_violation "platform_css_safety" "发现禁用 CSS 属性: ${css_prop}"
        fi
      done <<< "$forbidden_css"
      ;;
    heading_level)
      # 检查是否有不允许的标题级别
      local headings
      headings=$(grep -n "^#" "$OUTPUT_FILE" 2>/dev/null || true)
      while IFS= read -r heading; do
        [[ -z "$heading" ]] && continue
        local level
        level=$(echo "$heading" | sed 's/[0-9]*://' | grep -o "^#*" | wc -c)
        level=$((level - 1))  # wc -c 多算一个换行符
        local prefix
        printf -v prefix '%0.s#' $(seq 1 $level)
        local is_allowed=false
        while IFS= read -r allowed_level; do
          [[ -z "$allowed_level" ]] && continue
          if [[ "$prefix" == "$allowed_level" ]]; then
            is_allowed=true
            break
          fi
        done <<< "$allowed"
        if [[ "$is_allowed" == "false" ]]; then
          local line_num
          line_num=$(echo "$heading" | cut -d: -f1)
          add_violation "platform_heading_level" "行 ${line_num}: 不允许的标题级别 (H${level})"
        fi
      done <<< "$headings"
      ;;
    image_width)
      if [[ -n "$max_width" ]]; then
        local wide_images
        wide_images=$(grep -noE 'width="?[0-9]+"?' "$OUTPUT_FILE" 2>/dev/null | while IFS=: read -r ln match; do
          local w
          w=$(echo "$match" | grep -oE '[0-9]+')
          if [[ "$w" -gt "$max_width" ]]; then
            echo "行 ${ln}: 图片宽度 ${w}px 超过限制 ${max_width}px"
          fi
        done)
        if [[ -n "$wide_images" ]]; then
          while IFS= read -r msg; do
            add_violation "platform_image_width" "$msg"
          done <<< "$wide_images"
        fi
      fi
      ;;
  esac
}

# ============================================================
# 主流程
# ============================================================

# 检查文件存在
if [[ ! -f "$AGENT_FILE" ]]; then
  echo "{\"passed\": false, \"error\": \"Agent 文件不存在: ${AGENT_FILE}\"}"
  exit 1
fi

if [[ ! -f "$OUTPUT_FILE" ]]; then
  echo "{\"passed\": false, \"error\": \"输出文件不存在: ${OUTPUT_FILE}\"}"
  exit 1
fi

# 提取 frontmatter
frontmatter=$(extract_frontmatter)

if [[ -z "$frontmatter" ]]; then
  echo "{\"passed\": true, \"violations\": [], \"note\": \"无 validation_rules\"}"
  exit 0
fi

# 执行各项校验
check_required_sections "$frontmatter"
check_optional_sections "$frontmatter"
check_word_count "$frontmatter"
check_required_patterns "$frontmatter"
check_forbidden_patterns "$frontmatter"
check_platform_checks "$frontmatter"

# ============================================================
# 输出 JSON 结果
# ============================================================

if [[ ${#violations[@]} -eq 0 ]]; then
  echo "{\"passed\": true, \"violations\": []}"
else
  violations_json=$(printf '%s,' "${violations[@]}")
  violations_json="[${violations_json%,}]"
  echo "{\"passed\": false, \"violations\": ${violations_json}}"
fi

exit 0
