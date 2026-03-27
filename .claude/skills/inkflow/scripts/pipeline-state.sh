#!/bin/bash
# pipeline-state.sh — InkFlow Pipeline 状态管理辅助脚本
# 用法: pipeline-state.sh <command> [args...]
#
# Commands:
#   init <slug> <pipeline>     — 创建初始 state JSON
#   get_stage <slug> <stage>   — 读取阶段状态
#   set_stage <slug> <stage> <status> [artifacts...] — 更新阶段状态
#   get_current <slug>         — 获取当前执行阶段
#   append_log <run_id> <stage> <message> — 追加运行日志

set -euo pipefail

STATE_DIR=".pipeline-states"
LOG_DIR="retro/runs"

cmd="${1:?用法: pipeline-state.sh <command> [args...]}"
shift

case "$cmd" in
  init)
    slug="${1:?缺少 slug}"
    pipeline="${2:?缺少 pipeline}"
    state_file="${STATE_DIR}/${slug}.json"
    run_id="$(date +%Y%m%d)-${slug}"

    mkdir -p "$STATE_DIR" "$LOG_DIR"

    cat > "$state_file" << JSONEOF
{
  "pipeline": "${pipeline}",
  "run_id": "${run_id}",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "current_stage": "brief",
  "stages": {
    "brief": { "status": "completed", "artifacts": ["articles/${slug}/brief.md"] },
    "research": { "status": "pending" },
    "outline": { "status": "pending" },
    "draft": { "status": "pending" },
    "figures": { "status": "pending" },
    "refine": { "status": "pending", "sub_steps": { "audit": "pending", "polish": "pending" } },
    "publish": { "status": "pending" }
  },
  "token_usage": {}
}
JSONEOF
    echo "$state_file"
    ;;

  get_stage)
    slug="${1:?缺少 slug}"
    stage="${2:?缺少 stage}"
    state_file="${STATE_DIR}/${slug}.json"
    if [[ ! -f "$state_file" ]]; then
      echo '{"error": "state file not found"}'
      exit 1
    fi
    # 使用 python 或 node 解析 JSON（跨平台兼容）
    python3 -c "
import json, sys
with open('${state_file}') as f:
    data = json.load(f)
stage = data.get('stages', {}).get('${stage}', {})
print(json.dumps(stage))
" 2>/dev/null || node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('${state_file}'));
console.log(JSON.stringify(data.stages?.['${stage}'] || {}));
"
    ;;

  set_stage)
    slug="${1:?缺少 slug}"
    stage="${2:?缺少 stage}"
    status="${3:?缺少 status}"
    shift 3
    artifacts=("$@")
    state_file="${STATE_DIR}/${slug}.json"

    if [[ ! -f "$state_file" ]]; then
      echo "Error: state file not found: ${state_file}"
      exit 1
    fi

    artifacts_json="[]"
    if [[ ${#artifacts[@]} -gt 0 ]]; then
      artifacts_json=$(printf '"%s",' "${artifacts[@]}")
      artifacts_json="[${artifacts_json%,}]"
    fi

    timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    python3 -c "
import json
with open('${state_file}') as f:
    data = json.load(f)
s = data.setdefault('stages', {}).setdefault('${stage}', {})
s['status'] = '${status}'
if '${status}' == 'in_progress':
    s['started_at'] = '${timestamp}'
elif '${status}' in ('completed', 'failed', 'skipped'):
    s['completed_at'] = '${timestamp}'
arts = json.loads('${artifacts_json}')
if arts:
    s['artifacts'] = arts
# Update current_stage
if '${status}' == 'in_progress':
    data['current_stage'] = '${stage}'
with open('${state_file}', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print('OK')
" 2>/dev/null || echo "WARN: python3 not available, manual update needed"
    ;;

  get_current)
    slug="${1:?缺少 slug}"
    state_file="${STATE_DIR}/${slug}.json"
    if [[ ! -f "$state_file" ]]; then
      echo ""
      exit 1
    fi
    python3 -c "
import json
with open('${state_file}') as f:
    data = json.load(f)
print(data.get('current_stage', ''))
" 2>/dev/null || node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('${state_file}'));
console.log(data.current_stage || '');
"
    ;;

  append_log)
    run_id="${1:?缺少 run_id}"
    stage="${2:?缺少 stage}"
    message="${3:?缺少 message}"
    log_file="${LOG_DIR}/${run_id}.log.md"

    mkdir -p "$LOG_DIR"

    if [[ ! -f "$log_file" ]]; then
      echo "# 运行日志: ${run_id}" > "$log_file"
      echo "" >> "$log_file"
    fi

    echo "## ${stage} — $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$log_file"
    echo "${message}" >> "$log_file"
    echo "" >> "$log_file"
    ;;

  *)
    echo "未知命令: ${cmd}"
    echo "可用命令: init, get_stage, set_stage, get_current, append_log"
    exit 1
    ;;
esac
