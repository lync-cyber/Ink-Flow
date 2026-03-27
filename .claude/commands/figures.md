---
description: 执行配图阶段 — 调用 illustrator agent 生成架构图、对比表格和概念示意图
---

## 执行逻辑

### 1. 前置检查
- 读取 `.pipeline-states/{slug}.json`
- 确认 outline 阶段 status 为 completed
- 读取 `briefs/{topic}.md` 检查 `no_figures`: 若为 true → 标记 skipped
- 注意: 此阶段可与 draft 并行执行（parallel_with: [draft]）

### 2. 组装上下文
- 读取 `outlines/{topic}-outline.md`，提取所有标注了视觉断点的 section
- 若 `drafts/{topic}-full-draft.md` 存在 → 读取草稿内容获取更多上下文
- 若草稿不存在（与 draft 并行时）→ 仅基于大纲生成

### 3. 调用 Illustrator Agent
- 使用 `.claude/agents/illustrator.md` 定义的 illustrator subagent
- Agent 输出:
  - 汇总文件: `figures/{topic}-figures.md`
  - 单独图表: `figures/{topic}-fig-{N}.{md|svg}`

### 4. 校验输出
- 运行 contract-validator.sh 校验
- 检查: 至少包含一个 Mermaid 代码块或 SVG
- 检查: SVG 符合公众号兼容约束（无 id/style/script/a 标签）

### 5. 更新状态
- 更新 `.pipeline-states/{slug}.json`:
  - figures.status: "completed"
  - figures.artifacts: ["figures/{topic}-figures.md", ...]
- 追加运行日志

### 6. 输出提示
- 列出生成的图表清单
- 提示: "配图完成。请检查 figures/ 目录下的图表文件。"
