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

触发后，读取 `.claude/agents/orchestrator.md` 获取完整编排指令（意图路由、阶段执行算法、错误处理等均在 orchestrator agent 中定义）。

## Post-Polish 复核（polish checkpoint 前）

在 polish 阶段的标准 validation 之外，执行以下额外检查：
1. 读取 `audit.md` 中严重性为"高"的所有条目
2. 在 `final.md` 的变更溯源表中确认每条高严重性条目有对应记录
3. 对处理方式为"拒绝"的高严重性条目，提示用户确认
4. 若有高严重性条目在溯源表中缺失，要求 polisher 补充处理
