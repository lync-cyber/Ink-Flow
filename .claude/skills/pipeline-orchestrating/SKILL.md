---
name: pipeline-orchestrating
description: >
  写作 pipeline 总入口 — 创建 brief、推进阶段、重跑某段、查看状态全归此入口。
  触发条件："写一篇文章"、"开始写作"、"继续 pipeline"、"重跑 draft"、"重跑 outline"、
  直接给主题（如"写一篇关于 React Hooks 的文章"）。
  当用户意图是创作内容、启动或恢复写作流程时，应触发此 skill，即使没有明确说"pipeline"。
argument-hint: "[主题或 slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, AskUserQuestion
---

触发后，读取 `.claude/agents/orchestrator.md` 获取完整编排指令（含启动协议、主循环）。

## Pipeline 阶段

```
brief → research → atoms → outline [CP1] → draft ∥ figures → audit → polish [CP2] → publish [CP3]
```

per_platform: outline / draft / figures / audit / polish / publish 按 `brief.target_platforms` 并行派发。每个阶段由独立 subagent 执行，skill 和 style 文件由各 agent 自行读取。wechat 分支的 `:::` 容器由 writer 在 draft 阶段直接产出，publisher 交付 `export/08-wechat-publish.md` 后由用户在本地 [wechat-typeset](https://github.com/lync-cyber/wechat-typeset) 编辑器挑主题复制。

### Post-Polish 复核（polish checkpoint 前）

在 polish 阶段的标准 validation 之外，对每个 `{platform} ∈ brief.target_platforms` 执行：
1. 读取 `review/05-audit/{platform}.md` 中严重性为"高"的所有条目
2. 在 `export/07-final/{platform}.md` 对应的 `review/06-polish/{platform}.md` 变更溯源表中确认每条高严重性条目有对应记录
3. 对处理方式为"拒绝"的高严重性条目，提示用户确认
4. 若有高严重性条目在溯源表中缺失，要求 polisher 补充处理

## 辅助参考文件（由 orchestrator 按需读取）

- `.claude/skills/pipeline-orchestrating/references/brief-template.md` — Brief frontmatter 模板与栏目 ID 映射
- `.claude/skills/pipeline-orchestrating/references/checkpoint-prompts.md` — Checkpoint 交互文案与审核要点
- `.claude/skills/pipeline-orchestrating/references/error-handling.md` — 四层错误处理策略（L1-L4）
- `.claude/skills/pipeline-orchestrating/references/validation-rules.md` — 7 种验证类型参考
- `.claude/skills/pipeline-orchestrating/references/rerun-and-dryrun.md` — Rerun 和 Dry-Run 模式
- `.claude/skills/pipeline-orchestrating/references/interrupt-recovery.md` — 中断恢复机制
- `.claude/skills/pipeline-orchestrating/references/pipeline-state-schema.md` — State 文件 schema
