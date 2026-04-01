# InkFlow

LLM 辅助内容创作工作流框架，基于 Claude Code 原生能力（subagent + skill + hook + memory）。当前领域：微信公众号文章。

## 关键路径

| 用途 | 路径 |
|------|------|
| 项目配置 + 阶段 + 校验规则 | `.inkflow.yaml` |
| Agent 定义 | `.claude/agents/*.md`（RCCF 结构） |
| Skill 定义 | `.claude/skills/{common,domains}/**/SKILL.md` |
| 约束规则 | `.claude/rules/{core,domains}/*.md` |
| 栏目统一配置（视觉+业务） | `styles/default/columns.yaml` |
| Markdown 扩展语法 | `styles/default/markdown-extensions.md` |
| 排版工具 | `tools/wechat-typesetter/index.html` |
| 外部参考材料（学习用） | `references/` |
| 文章产物 | `articles/{slug}/` |
| 运行状态 | `.pipeline-states/{slug}.json` |

## 使用方式

> 以下触发词为自然语言，Claude 识别意图后加载对应 skill 执行。

- **写文章**: 告诉 Claude 主题 → pipeline-orchestrating skill
- **分析风格**: "分析风格"、"提取风格 DNA" → style-profiling skill
- **学习进修**: "学习这篇文章"、"参考这个模板" → style-studying skill（外部材料放 `references/` 目录）
- **内容排期**: "排期"、"内容日历" → content-planning skill
- **发布准备**: "发布清单"、"运营清单" → publish-preparing skill
- **效果分析**: "数据分析"、"KPI" → performance-benchmarking skill
- **创作复盘**: "复盘"、"给反馈" → creation-reviewing skill

## Pipeline 阶段

```
brief → research → outline [CP1] → draft ∥ figures → audit → polish [CP2] → publish [CP3]
```

## Agent 清单

| Agent | Model | 职责 |
|-------|-------|------|
| orchestrator | opus | 编排全流程、调度子 agent、用户交互 |
| researcher | sonnet | 调研 + 事实收集 |
| outliner | opus | 大纲 + 视觉断点规划 |
| writer | opus | 逐 section 写作（含 Markdown 扩展标记） |
| illustrator | sonnet | 品牌色驱动生成 SVG/Mermaid |
| auditor | opus | 六维审校（只审不改） |
| polisher | sonnet | 基于审校报告润色 |
| publisher | sonnet | 格式转换 + 多格式导出 |
