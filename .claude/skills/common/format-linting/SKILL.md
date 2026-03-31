---
name: format-linting
description: >
  格式校验 — 在 LLM 处理前运行确定性 lint 脚本，检查 Markdown 格式合规性。
  由 pipeline 在 publish 阶段的格式导出前执行。
compatibility:
  tools: [python]
  scripts: [tools/markdown-lint/lint.py]
---

# 格式校验

在 LLM 处理前，运行确定性 lint 脚本进行格式校验。零 LLM token 消耗。

## 执行命令

```bash
python tools/markdown-lint/lint.py articles/{slug}/output/final.md --column {content_column}
```

## 校验覆盖范围

lint 脚本覆盖以下确定性规则（无需 LLM）：

- `:::block` 语法正确性（闭合、类型合法、无嵌套）
- 排版约束（段落长度、句子长度、标题层级、首行缩进）
- 栏目特有约束（引用、TL;DR、代码块）
- 微信 CSS 安全（禁用属性、标签、SVG id）
- 图片引用完整性

## 结果处理

- **error 级违规** → 停止后续处理，返回 violations JSON 给编排器进入 L2 重试（将 violations 注入 polisher 上下文要求修复）
- **warning 级** → 记录到 audit trail，继续后续处理
- **全部通过** → 继续进入 format-exporting skill

## 输出

不写入文件。返回结构化 JSON：

```json
{
  "status": "pass|warn|fail",
  "errors": [...],
  "warnings": [...]
}
```
