#!/bin/bash
# diff-extractor.sh — 提取两个文件的结构化 diff
# 用法: diff-extractor.sh <original-file> <modified-file>
#
# 输出结构化修改报告（Markdown 格式）

set -euo pipefail

ORIGINAL="${1:?用法: diff-extractor.sh <original-file> <modified-file>}"
MODIFIED="${2:?缺少 modified-file 参数}"

if [[ ! -f "$ORIGINAL" ]]; then
  echo "Error: 原始文件不存在: ${ORIGINAL}"
  exit 1
fi

if [[ ! -f "$MODIFIED" ]]; then
  echo "Error: 修改文件不存在: ${MODIFIED}"
  exit 1
fi

# 统计基本信息
original_chars=$(wc -m < "$ORIGINAL" | tr -d ' ')
modified_chars=$(wc -m < "$MODIFIED" | tr -d ' ')
char_diff=$((modified_chars - original_chars))

original_lines=$(wc -l < "$ORIGINAL" | tr -d ' ')
modified_lines=$(wc -l < "$MODIFIED" | tr -d ' ')

# 使用 diff 生成变更统计
added_lines=$(diff "$ORIGINAL" "$MODIFIED" 2>/dev/null | grep '^>' | wc -l | tr -d ' ')
deleted_lines=$(diff "$ORIGINAL" "$MODIFIED" 2>/dev/null | grep '^<' | wc -l | tr -d ' ')

# 生成 unified diff
unified_diff=$(diff -u "$ORIGINAL" "$MODIFIED" 2>/dev/null || true)

# 输出结构化报告
cat << REPORT
## 修改报告

### 统计
- 原始文件: ${ORIGINAL} (${original_chars} 字符, ${original_lines} 行)
- 修改文件: ${MODIFIED} (${modified_chars} 字符, ${modified_lines} 行)
- 新增行数: ${added_lines}
- 删除行数: ${deleted_lines}
- 净字符变化: ${char_diff:+${char_diff}}

### Unified Diff

\`\`\`diff
${unified_diff}
\`\`\`
REPORT
