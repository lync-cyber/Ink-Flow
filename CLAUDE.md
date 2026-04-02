# InkFlow

LLM 辅助内容创作工作流框架，基于 Claude Code 原生能力（subagent + skill + hook + memory）。

## 工作领域

微信公众号文章

## 工作语言

默认工作语言为**中文**。所有 agent 输出、skill 交互、文章内容、审校报告、运营数据均使用中文。代码、CLI 命令、文件名使用英文。

## 环境

- 始终直接运行 git 命令，无需 `cd` 前缀，当前工作目录默认已经是仓库根目录
- 所有文件操作均使用相对路径

## 关键路径

| 用途 | 路径 |
|------|------|
| 项目配置 + 阶段 + 校验规则 | `.inkflow.yaml` |
| Agent 定义 | `.claude/agents/*.md`（RCCF 结构） |
| Skill 定义 | `.claude/skills/*/SKILL.md` |
| 约束规则 | `.claude/rules/{core,domains}/*.md` |
| 栏目统一配置（视觉+业务） | `styles/default/columns.yaml` |
| Markdown 扩展语法 | `styles/default/markdown-extensions.md` |
| 排版工具 | `tools/wechat-typesetter/index.html` |
| 框架部署/升级 | `tools/bootstrap.sh` |
| 内容版 CLAUDE 模板 | `tools/CLAUDE.content.md` |
| 外部参考材料（学习用） | `references/` |
| 文章产物 | `articles/{slug}/` |
| 运行状态 | `.pipeline-states/{slug}.json` |
| 领域包定义 | `.claude/skills/domain-{name}.yaml` |
| 框架质量门禁 | `tests/lint-framework.py` |

## 使用方式

> 以下触发词为自然语言，Claude 识别意图后加载对应 skill 执行。

- **写文章**: 告诉 Claude 主题 → pipeline-orchestrating skill
- **分析风格**: "分析风格"、"提取风格 DNA" → style-profiling skill
- **学习进修**: "学习这篇文章"、"参考这个模板" → style-studying skill（外部材料放 `references/` 目录）
- **内容排期**: "排期"、"内容日历" → content-planning skill
- **发布准备**: "发布清单"、"运营清单" → publish-preparing skill
- **效果分析**: "数据分析"、"KPI" → performance-benchmarking skill
- **创作复盘**: "复盘"、"给反馈" → creation-reviewing skill

- **初始化工作区**: "初始化工作区"、"创建内容项目" → workspace-init skill

## 工作区模式

`.inkflow.yaml` 的 `workspace_mode` 字段区分两种模式：
- **framework**: 开发 InkFlow 框架本身，`articles/` 被 gitignore
- **content**: 内容创作工作区，`articles/` 纳入版本管理

### 部署与升级

| 工具 | 职责 |
|------|------|
| `tools/bootstrap.sh` | 从远程 GitHub 仓库拉取/同步框架文件 |
| `workspace-init` skill | 初始化项目目录结构和配置文件（.gitignore、.inkflow.yaml） |

首次部署内容工作区：

```bash
# 1. 拉取框架文件
curl -fsSL https://raw.githubusercontent.com/{owner}/InkFlow/main/tools/bootstrap.sh | bash -s -- . https://github.com/{owner}/InkFlow.git
# 2. 在 Claude Code 中说"初始化工作区"完成项目配置
```

升级已有工作区的框架：

```bash
bash tools/bootstrap.sh . https://github.com/{owner}/InkFlow.git
```

或在 Claude Code 中说"更新 InkFlow"、"升级框架" → workspace-init skill 自动调用 bootstrap.sh。

## 记忆系统

Agent 的长期学习通过 Claude Code 原生 memory 系统（`~/.claude/projects/`）持久化，由 `creation-reviewing` 和 `performance-benchmarking` skill 在用户确认后写入。`.claude/agent-memory/` 目录下的模板文件仅作为各 agent 记忆分类的参考文档。

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
| style-analyzer | sonnet | 七维度风格 DNA 提取（style-profiling 调用） |
