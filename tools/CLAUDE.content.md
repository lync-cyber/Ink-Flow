# InkFlow 内容工作区

LLM 辅助内容创作工作流，基于 Claude Code 原生能力。当前领域：微信公众号文章。

## 工作语言

默认工作语言为**中文**。所有 agent 输出、skill 交互、文章内容、审校报告、运营数据均使用中文。代码、CLI 命令、文件名使用英文。

## 关键路径

| 用途 | 路径 |
|------|------|
| 项目配置 | `.inkflow.yaml` |
| 栏目配置（视觉+业务） | `styles/default/columns.yaml` |
| 外部参考材料（学习用） | `references/` |
| 文章产物 | `articles/{slug}/` |
| 运行状态 | `.pipeline-states/{slug}.json` |

## 使用方式

> 以下触发词为自然语言，Claude 识别意图后加载对应 skill 执行。

- **写文章**: 告诉 Claude 主题 → 自动启动 pipeline
- **分析风格**: "分析风格"、"提取风格 DNA" → 从你的文章中提取写作风格
- **学习进修**: "学习这篇文章"、"参考这个模板" → 分析外部材料改进规则（材料放 `references/` 目录）
- **内容排期**: "排期"、"内容日历" → 生成发布计划
- **发布准备**: "发布清单"、"运营清单" → 发布前后检查清单
- **效果分析**: "数据分析"、"KPI" → 多维度运营数据分析
- **创作复盘**: "复盘"、"给反馈" → 对比初稿与终审版，提炼改进规则

## 升级框架

增量更新，仅同步有变更的文件：

```bash
bash tools/bootstrap.sh . {仓库URL}
```

或在 Claude Code 中说"更新 InkFlow"、"升级框架"。

回滚到上一版本：`bash tools/bootstrap.sh --rollback`

## Pipeline 阶段

```
brief → research → outline [CP1] → draft ∥ figures → audit → polish [CP2] → publish [CP3]
```

## 注意事项

- `articles/` 目录纳入版本管理，是你的内容资产
- `.claude/agents/`、`.claude/skills/`、`.claude/rules/`、`tools/` 为框架文件，通过升级命令更新，避免手动修改（如需自定义，使用 `.claude/rules/local/` 或 `.claude/agents/local-*.md`）
- 个性化风格存储在 `styles/default/style-profile.md`，升级不会覆盖
