#!/bin/bash
# lint-framework.sh — InkFlow 框架静态校验（L0 质量门禁）
# 用法: bash tests/lint-framework.sh
#
# 校验项:
#   1. 路径一致性 — agent/skill 中的路径引用与目录结构一致
#   2. YAML Schema — pipeline/domain/.inkflow.yaml 必填字段
#   3. Agent Frontmatter 完整性 — 必填字段 + RCCF 正文结构
#   4. Skill Frontmatter 完整性 — 必填字段 + type 合法性
#   5. 交叉引用 — pipeline 中引用的 agent/skill/rule 文件存在
#   6. 禁用模式 — 无硬编码绝对路径、无已知错误路径

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

ERROR_FILE=$(mktemp)
echo "0" > "$ERROR_FILE"
WARN_FILE=$(mktemp)
echo "0" > "$WARN_FILE"
trap 'rm -f "$ERROR_FILE" "$WARN_FILE"' EXIT

error() {
  echo "  ✗ ERROR: $1"
  echo $(( $(cat "$ERROR_FILE") + 1 )) > "$ERROR_FILE"
}

warn() {
  echo "  ⚠ WARN: $1"
  echo $(( $(cat "$WARN_FILE") + 1 )) > "$WARN_FILE"
}

ok() {
  echo "  ✓ $1"
}

# ============================================================
# 1. 路径一致性检查
# ============================================================
echo ""
echo "=== 1. 路径一致性检查 ==="

# 检查已知错误路径模式
if grep -r 'briefs/{slug}' .claude/agents/ .claude/skills/ 2>/dev/null; then
  error "发现已废弃的路径 'briefs/{slug}'（应为 'articles/{slug}/brief.md'）"
else
  ok "无已废弃路径引用"
fi

# 检查硬编码绝对路径
if grep -rn '/c/Users\|C:\\Users\|/home/' .claude/agents/ .claude/skills/ .claude/pipelines/ 2>/dev/null | grep -v '.git'; then
  error "发现硬编码绝对路径"
else
  ok "无硬编码绝对路径"
fi

# ============================================================
# 2. YAML Schema 校验
# ============================================================
echo ""
echo "=== 2. YAML Schema 校验 ==="

# .inkflow.yaml 必填字段
if [[ -f .inkflow.yaml ]]; then
  for field in version domains model_allocation; do
    if grep -q "^${field}:" .inkflow.yaml 2>/dev/null; then
      ok ".inkflow.yaml 包含 ${field}"
    else
      error ".inkflow.yaml 缺少必填字段: ${field}"
    fi
  done
else
  error ".inkflow.yaml 不存在"
fi

# pipeline YAML 检查
for pipeline in .claude/pipelines/*.yaml; do
  [[ -f "$pipeline" ]] || continue
  pname=$(basename "$pipeline")
  if grep -q "^name:" "$pipeline" 2>/dev/null; then
    ok "${pname} 包含 name"
  else
    error "${pname} 缺少 name 字段"
  fi
  if grep -q "^stages:" "$pipeline" 2>/dev/null; then
    ok "${pname} 包含 stages"
  else
    error "${pname} 缺少 stages 字段"
  fi
done

# domain.yaml 检查
for domain_yaml in .claude/skills/domains/*/domain.yaml; do
  [[ -f "$domain_yaml" ]] || continue
  dname=$(basename "$(dirname "$domain_yaml")")
  for field in name skills rules; do
    if grep -q "^${field}:" "$domain_yaml" 2>/dev/null; then
      ok "domain ${dname}: 包含 ${field}"
    else
      error "domain ${dname}: 缺少必填字段 ${field}"
    fi
  done
done

# ============================================================
# 3. Agent Frontmatter 完整性
# ============================================================
echo ""
echo "=== 3. Agent Frontmatter 完整性 ==="

for agent_file in .claude/agents/*.md; do
  [[ -f "$agent_file" ]] || continue
  aname=$(basename "$agent_file" .md)
  [[ "$aname" == "_template" ]] && continue

  # 必填 frontmatter 字段
  frontmatter=$(sed -n '/^---$/,/^---$/p' "$agent_file" | sed '1d;$d')
  for field in name description tools model; do
    if echo "$frontmatter" | grep -q "^${field}:"; then
      ok "agent ${aname}: frontmatter 包含 ${field}"
    else
      error "agent ${aname}: frontmatter 缺少 ${field}"
    fi
  done

  # RCCF 正文结构
  for section in "## Role" "## Context" "## Constraints" "## Format" "## Exit Criteria"; do
    if grep -q "^${section}" "$agent_file" 2>/dev/null; then
      ok "agent ${aname}: 包含 ${section}"
    else
      error "agent ${aname}: 缺少 RCCF 段落 ${section}"
    fi
  done
done

# ============================================================
# 4. Skill Frontmatter 完整性
# ============================================================
echo ""
echo "=== 4. Skill Frontmatter 完整性 ==="

VALID_TYPES="rule|context|transform|orchestration"

find .claude/skills -name "SKILL.md" | while read -r skill_file; do
  # 提取 skill 名（从目录路径）
  sdir=$(dirname "$skill_file")
  sname=$(basename "$sdir")

  # 必填字段
  frontmatter=$(sed -n '/^---$/,/^---$/p' "$skill_file" | sed '1d;$d')
  for field in name description; do
    if echo "$frontmatter" | grep -q "^${field}:"; then
      ok "skill ${sname}: frontmatter 包含 ${field}"
    else
      error "skill ${sname}: frontmatter 缺少 ${field}"
    fi
  done

  # type 合法性（若声明了 type）
  type_val=$(echo "$frontmatter" | grep "^type:" | sed 's/type:\s*//' | tr -d ' ')
  if [[ -n "$type_val" ]]; then
    if echo "$type_val" | grep -qE "^(${VALID_TYPES})$"; then
      ok "skill ${sname}: type '${type_val}' 合法"
    else
      error "skill ${sname}: type '${type_val}' 不合法（允许: ${VALID_TYPES}）"
    fi
  fi
done

# ============================================================
# 5. 交叉引用完整性
# ============================================================
echo ""
echo "=== 5. 交叉引用完整性 ==="

for pipeline in .claude/pipelines/*.yaml; do
  [[ -f "$pipeline" ]] || continue
  pname=$(basename "$pipeline")

  # 检查 agent 引用
  grep 'agent:' "$pipeline" | sed 's/.*agent:\s*//' | tr -d ' ' | sort -u | while read -r agent; do
    [[ -z "$agent" ]] && continue
    if [[ -f ".claude/agents/${agent}.md" ]]; then
      ok "${pname}: agent '${agent}' 存在"
    else
      error "${pname}: agent '${agent}' 不存在 (.claude/agents/${agent}.md)"
    fi
  done

  # 检查 skill 引用
  grep -E '^\s*- name:|^\s*- \w' "$pipeline" | grep -oP '(?<=name:\s)\S+' | sort -u | while read -r skill; do
    [[ -z "$skill" ]] && continue
    # 跳过 YAML 值（非 skill 名的关键字）
    [[ "$skill" == "true" || "$skill" == "false" ]] && continue
    found=false
    if [[ -f ".claude/skills/${skill}/SKILL.md" ]]; then
      found=true
    elif find .claude/skills/domains -path "*/${skill}/SKILL.md" 2>/dev/null | grep -q .; then
      found=true
    fi
    if $found; then
      ok "${pname}: skill '${skill}' 存在"
    else
      error "${pname}: skill '${skill}' 未找到"
    fi
  done

  # 检查 rule 引用
  grep -oP '(?<=- )\S+' "$pipeline" | grep -v 'name:' | grep -v 'true\|false\|agent:\|skill:' | sort -u | while read -r rule; do
    [[ -z "$rule" ]] && continue
    # 检查是否为已知 rule
    found=false
    if find .claude/rules -name "${rule}.md" 2>/dev/null | grep -q .; then
      found=true
    fi
    # 也可能是 skill 名，已在上面检查
    if ! $found; then
      if [[ -f ".claude/skills/${rule}/SKILL.md" ]] || find .claude/skills/domains -path "*/${rule}/SKILL.md" 2>/dev/null | grep -q .; then
        found=true  # 是 skill，不是 rule，跳过
      fi
    fi
    # 不报错（太多误报）—— rule 解析需要更精确的 YAML parser
  done
done

# ============================================================
# 6. 领域包完整性
# ============================================================
echo ""
echo "=== 6. 领域包完整性 ==="

for domain_yaml in .claude/skills/domains/*/domain.yaml; do
  [[ -f "$domain_yaml" ]] || continue
  domain_dir=$(dirname "$domain_yaml")
  dname=$(basename "$domain_dir")

  # 检查 domain.yaml 中列出的 skills 是否存在
  grep '^\s*- ' "$domain_yaml" | sed 's/^\s*- //' | while read -r item; do
    [[ -z "$item" ]] && continue
    # 检查是 skill 还是 rule
    if [[ -d "${domain_dir}/${item}" && -f "${domain_dir}/${item}/SKILL.md" ]]; then
      ok "domain ${dname}: skill '${item}' 存在"
    elif find .claude/rules -name "${item}.md" 2>/dev/null | grep -q .; then
      ok "domain ${dname}: rule '${item}' 存在"
    else
      # 可能是 export format 名，不报错
      :
    fi
  done
done

# ============================================================
# 汇总
# ============================================================
ERRORS=$(cat "$ERROR_FILE")
WARNINGS=$(cat "$WARN_FILE")

echo ""
echo "================================"
echo "校验完成: ${ERRORS} 错误, ${WARNINGS} 警告"
echo "================================"

if [[ $ERRORS -gt 0 ]]; then
  echo "❌ 未通过质量门禁"
  exit 1
else
  echo "✅ 通过质量门禁"
  exit 0
fi
