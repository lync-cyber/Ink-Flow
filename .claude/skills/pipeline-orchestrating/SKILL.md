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

触发后，读取 `.claude/agents/orchestrator.md` 获取完整编排指令。以下为快速决策入口：

## 意图路由

1. 读取 `config/inkflow.yaml` 建立运行环境
2. 判断用户意图：

| 意图 | 信号 | 动作 |
|------|------|------|
| 新建文章 | 用户提供了主题 | 进入 Brief 创建（orchestrator §2） |
| 继续 pipeline | 存在未完成的 `workspace/pipeline-states/*.json` | 从上次暂停处继续（orchestrator §3） |
| 重跑阶段 | "重跑 {stage}" | 详见 `references/rerun-and-dryrun.md` |
| 预览 / dry-run | "预览"、"dry-run"、"检查配置" | 详见 `references/rerun-and-dryrun.md` |
| 运营操作 | "排期"、"数据分析"、"发布清单" | 提示触发对应运营 skill（不进入 pipeline） |
| 学习进修 | "学习"、"进修"、"对标" | 提示触发 style-learning skill（study 模式） |

## Pipeline 阶段

```
brief → research → outline [CP1] → draft ∥ figures → audit → polish [CP2] → publish [CP3]
```

每个阶段由独立 subagent 执行，skill 和 style 文件由各 agent 自行读取。

### Post-Polish 复核（polish checkpoint 前）

在 polish 阶段的标准 validation 之外，执行以下额外检查：
1. 读取 `05-audit-report.md` 中严重性为"高"的所有条目
2. 在 `07-final-manuscript.md` 的变更溯源表中确认每条高严重性条目有对应记录
3. 对处理方式为"拒绝"的高严重性条目，提示用户确认
4. 若有高严重性条目在溯源表中缺失，要求 polisher 补充处理

## 辅助参考文件（由 orchestrator 按需读取）

- `references/brief-template.md` — Brief frontmatter 模板与栏目 ID 映射
- `references/checkpoint-prompts.md` — Checkpoint 交互文案与审核要点
- `references/error-handling.md` — 四层错误处理策略（L1-L4）
- `references/validation-rules.md` — 7 种验证类型参考
- `references/rerun-and-dryrun.md` — Rerun 和 Dry-Run 模式
