---
name: pipeline-orchestrating
description: >
  InkFlow 写作 pipeline 的总入口。写文章、创建 brief、继续 pipeline、重跑某个阶段，均由此触发。
  当用户说"写一篇文章"、"开始写作"、"继续 pipeline"、"重跑 draft"，
  或直接给出主题（如"写一篇关于 React Hooks 的文章"），都应触发此 skill。
  只要用户的意图是创作内容、启动或恢复写作流程，就使用此 skill，即使用户没有明确说"pipeline"。
argument-hint: "[主题或 slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, AskUserQuestion
---

此 skill 为 InkFlow pipeline 的入口触发器。触发后，读取并遵循 `.claude/agents/orchestrator.md` 中的完整编排指令执行。

辅助参考文件（由 orchestrator 按需读取）：
- `references/brief-template.md` — Brief frontmatter 模板与栏目 ID 映射
- `references/checkpoint-prompts.md` — Checkpoint 交互文案与审核要点
- `references/error-handling.md` — 四层错误处理策略（L1-L4）
- `references/validation-rules.md` — 7 种验证类型参考
