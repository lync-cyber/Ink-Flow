---
name: de-ai-polish
type: transform
description: 去 AI 味润色规则，将光滑无菌的 AI 输出转化为有人味的文字。
domain: core
version: 1.0.0
input: "{stage_output}"
output: "{polished_output}"
transform_order: 1
inject_at: [refine]
---

> 通用写作质量规则（句式拆分、被动句转换、自检等）见 writing-quality rule。以下为 de-ai-polish 独有的操作。

## 操作规则

### 1. 删除过渡句
- 删除所有起承转合的过渡句（"接下来我们来看..." → 直接开始下一节）
- "让我们先来了解一下..." → 直接开始
- "在深入讨论之前..." → 直接开始
- "值得一提的是..." → 直接说那件事
