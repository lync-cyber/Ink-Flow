# InkFlow 内容工作区

LLM 辅助内容创作工作流，基于 Claude Code 原生能力。当前领域：微信公众号文章。

## 工作语言

默认工作语言为**中文**。所有 agent 输出、skill 交互、文章内容、审校报告、运营数据均使用中文。代码、CLI 命令、文件名使用英文。

## 关键路径

| 用途 | 路径 |
|------|------|
| 项目配置 | `config/inkflow.yaml` |
| 栏目业务配置 | `config/columns.yaml`（骨架/tone/KPI；视觉已剥离） |
| 产物布局 | `config/artifact-layout.yaml` |
| 风格档案（个人化） | `styles/{profile}/style-profile.md` |
| 外部参考材料 | `references/` |
| 文章产物 | `articles/{slug}/` |
| 运行状态 | `workspace/pipeline-states/{slug}.json` |
| 栏目视觉中间产物 | `workspace/column-design/{slug}/theme.css` + `preview.html` |

## 工作区结构（单篇文章）

```
articles/{slug}/
  intermediate/
    01-brief.md
    02-research-memo.md
    03-outline-structure.md
    04a-draft/section-NN.md   04a-draft/merged-draft.md
    04b-figure/fig-NN.svg     04b-figure/figure-index.md
  review/
    05-audit-report.md        06-polish-trace.md
  export/
    07-final-manuscript.md
    08-wechat-publish.md      08-plain-publish.md    08-teaser-120chars.md
```

## 规则体系（单一事实来源）

所有 lint/agent 共享的规则数据存放在 `.claude/rules/data/`：

@.claude/rules/data/forbidden-phrases.yaml
@.claude/rules/data/css-safety.yaml
@.claude/rules/data/typography-limits.yaml

核心写作/排版/审核规范：

@.claude/rules/core/writing-quality.md
@.claude/rules/core/platform-base.md
@.claude/rules/core/fact-check.md

微信平台特有规则：

@.claude/rules/domains/wechat-article/platform.md
@.claude/rules/domains/wechat-article/redline.md

## 使用方式

> 以下触发词为自然语言，Claude 识别意图后加载对应 skill 执行。

- **写文章**: 告诉 Claude 主题 → 自动启动 pipeline
- **分析风格**: "分析风格"、"提取风格 DNA" → profile 模式，从你的文章提取风格
- **学习进修**: "学习这篇文章"、"参考这个模板" → study 模式，分析外部材料改进规则
- **栏目视觉**: "新开栏目"、"栏目改版"、"ink-xxx 主题" → 主色推导 + 双方向预览 → 产出 `workspace/column-design/{slug}/theme.css` + `preview.html`（下游 skill 接手导入 doocs/md）
- **格式校验**: "跑一下 lint"、"检查格式" → 运行 `tools/lint/lint.py`
- **内容排期**: "排期"、"内容日历" → 生成发布计划
- **发布准备**: "发布清单"、"运营清单" → 发布前后检查清单
- **效果分析**: "数据分析"、"KPI" → 多维度运营数据分析
- **创作复盘**: "复盘"、"给反馈" → 对比初稿与终审版，提炼改进规则

## 升级框架

```bash
bash tools/bootstrap.sh . {仓库URL}
```

或在 Claude Code 中说"更新 InkFlow"、"升级框架"。

## Pipeline 阶段

```
brief → research → outline [CP1] → draft ∥ figures → audit → polish [CP2] → publish [CP3]
```

## 文件地图

> 按"你可能想改什么"分层。常改 → 偶改 → 只读。

### 常改（你的内容资产，纳入版本管理）

| 场景 | 文件 |
|------|------|
| 新增/调整栏目业务字段（骨架、tone、KPI） | `config/columns.yaml` |
| 新增/改版栏目视觉 | 触发 column-designing skill → `workspace/column-design/` |
| 调整默认 brief 字段 / 导出格式 | `config/inkflow.yaml` |
| 微调风格档案 | `styles/default/style-profile.md` |
| 新增外部参考文章 | `references/articles/` |
| 写作中的单篇文章 | `articles/{slug}/` |

### 偶改（规则演进时）

| 场景 | 文件 |
|------|------|
| 新增/删除禁用词 | `.claude/rules/data/forbidden-phrases.yaml` |
| 调整 CSS 白名单 | `.claude/rules/data/css-safety.yaml` |
| 调整字号/段长阈值 | `.claude/rules/data/typography-limits.yaml` |
| 修订写作/审核规范 | `.claude/rules/core/*.md` |
| 新增产物路径占位 | `config/artifact-layout.yaml` |

### 只读（框架代码，升级命令覆盖）

| 范围 | 路径 |
|------|------|
| Subagent 定义 | `.claude/agents/` |
| Skill 定义 | `.claude/skills/` |
| 工具 | `tools/` |
| 启动脚本 | `tools/bootstrap.sh` |

## 注意事项

- `articles/`、`styles/`、`references/`、`config/`、`workspace/` 纳入版本管理，是你的内容资产
- `.claude/`、`tools/` 为框架文件，通过升级命令更新，避免手动修改
- 个性化风格存储在 `styles/{profile}/style-profile.md`，升级不会覆盖
