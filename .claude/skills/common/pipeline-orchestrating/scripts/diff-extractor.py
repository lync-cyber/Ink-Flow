#!/usr/bin/env python3
"""diff-extractor.py — 提取两个文件的结构化 diff

用法: python diff-extractor.py <original-file> <modified-file>

输出结构化修改报告（Markdown 格式）到 stdout。
"""

import difflib
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 3:
        print("用法: python diff-extractor.py <original-file> <modified-file>", file=sys.stderr)
        sys.exit(1)

    original_path = Path(sys.argv[1])
    modified_path = Path(sys.argv[2])

    if not original_path.exists():
        print(f"Error: 原始文件不存在: {original_path}", file=sys.stderr)
        sys.exit(1)
    if not modified_path.exists():
        print(f"Error: 修改文件不存在: {modified_path}", file=sys.stderr)
        sys.exit(1)

    original_text = original_path.read_text(encoding="utf-8")
    modified_text = modified_path.read_text(encoding="utf-8")

    original_lines = original_text.splitlines(keepends=True)
    modified_lines = modified_text.splitlines(keepends=True)

    original_chars = len(original_text)
    modified_chars = len(modified_text)
    char_diff = modified_chars - original_chars

    original_line_count = len(original_lines)
    modified_line_count = len(modified_lines)

    # 统计新增和删除行数
    added = 0
    deleted = 0
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, original_lines, modified_lines).get_opcodes():
        if tag == "insert":
            added += j2 - j1
        elif tag == "delete":
            deleted += i2 - i1
        elif tag == "replace":
            deleted += i2 - i1
            added += j2 - j1

    # 生成 unified diff
    unified = "".join(difflib.unified_diff(
        original_lines, modified_lines,
        fromfile=str(original_path), tofile=str(modified_path),
        lineterm=""
    ))

    sign = "+" if char_diff >= 0 else ""
    print(f"""## 修改报告

### 统计
- 原始文件: {original_path} ({original_chars} 字符, {original_line_count} 行)
- 修改文件: {modified_path} ({modified_chars} 字符, {modified_line_count} 行)
- 新增行数: {added}
- 删除行数: {deleted}
- 净字符变化: {sign}{char_diff}

### Unified Diff

```diff
{unified}
```""")


if __name__ == "__main__":
    main()
