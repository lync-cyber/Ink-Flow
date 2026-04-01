# InkFlow（墨流）— LLM 辅助内容创作工作流框架

InkFlow 是基于 Claude Code 原生能力（subagent + skill + hook + memory）的通用 LLM 辅助内容创作工作流框架。公众号文章写作是其参考实现，框架核心只理解 pipeline manifest schema，不绑定具体领域。

当前版本：见 `VERSION` 文件

## 设计哲学

1. **交接协议原则** — 每次交给用户的是有具体内容可判断的产出物，不是 yes/no 问题
2. **上下文隔离原则** — 每个阶段使用独立 subagent，避免调研噪音污染写作上下文
3. **审改分离原则** — 审校和润色由不同 agent 独立执行，裁判不下场
4. **记忆极简原则** — 完全依赖 Claude Code 原生 memory 系统（user/feedback/project/reference 四种类型）
5. **契约驱动原则** — 每个 agent 有明确的输入/输出契约和完成标准
6. **声明式流水线原则** — pipeline 通过 YAML 清单定义，框架不绑定具体领域

## 目录结构

```
.claude/
  ├── agents/               # Subagent 定义（RCCF 结构）
  ├── skills/               # Skill 定义（扁平结构，每个 skill 一个目录）
  │   ├── pipeline-orchestrating/  # 编排器（含 references/）
  │   ├── style-profiling/         # 风格提取
  │   ├── writing-guiding/         # 写作指导
  │   ├── opening-crafting/        # 开篇策略
  │   ├── article-structuring/     # 栏目结构
  │   ├── visual-theming/          # 视觉主题
  │   ├── format-linting/          # 格式校验
  │   ├── format-exporting/        # 格式导出
  │   └── ...                      # 更多 skill
  └── rules/                # 声明式约束规则（自动加载到所有会话）
      ├── core/             # 跨领域通用规则
      └── domains/          # 领域特有规则

styles/                     # 风格 & 品牌资源
  └── default/
      ├── columns.yaml       # 栏目统一配置（视觉+业务）
      ├── style-profile.md   # 风格 DNA（由 style-profiling 生成）
      └── markdown-extensions.md

articles/                   # 内容产物（按文章分组）
  └── {slug}/
      ├── brief.md
      ├── research.md
      ├── outline.md
      ├── drafts/
      ├── figures/
      └── output/

.pipeline-states/           # Pipeline 执行状态
.inkflow.yaml               # 项目配置
```

## 快速开始

```bash
# 1. 首次使用前，分析你的写作风格
"分析我的写作风格"

# 2. 启动写作 pipeline
/inkflow
# 或自然语言: "写一篇关于 React Hooks 的文章"

# 3. pipeline 自动推进，在 3 个 checkpoint 暂停等待审核
# Checkpoint 1: 大纲审核
# Checkpoint 2: 终稿审核（审校报告 + 润色结果）
# Checkpoint 3: 发布确认

# 4. 发布后
"复盘"          # 创作复盘（diff 分析 + 规则提炼）
"运营数据"      # 数据追踪（录入 KPI）
"数据分析"      # 效果分析（跨文章对比）
```

## 架构

### Pipeline（8 阶段 + 3 检查点）

```
brief → research → outline → draft ∥ figures → audit → polish → publish
                      ↑CP1                                ↑CP2      ↑CP3
```

- `brief`: 用户交互式填写写作指令卡
- `research`: 调研 + 事实收集（可跳过）
- `outline`: 大纲 + 视觉断点规划 → **Checkpoint 1**
- `draft`: 逐 section 写作（含 Markdown 扩展标记）
- `figures`: 品牌色驱动生成 SVG/Mermaid（与 draft 并行）
- `audit`: 六维审校（只审不改）
- `polish`: 基于审校报告去 AI 味润色 → **Checkpoint 2**
- `publish`: 格式校验 + Markdown 标准化 + 多格式导出 → **Checkpoint 3**

### Agent 清单

| Agent | Model | 阶段 | 职责 |
|-------|-------|------|------|
| orchestrator | opus | 全流程 | 编排 pipeline、调度子 agent、用户交互 |
| researcher | sonnet | research | Web 调研、事实收集、代码片段 |
| outliner | opus | outline | 结构设计、视觉断点规划 |
| writer | opus | draft | 逐 section 写作，使用 Markdown 扩展标记 |
| illustrator | sonnet | figures | 品牌色驱动生成 SVG/Mermaid 配图 |
| auditor | opus | audit | 六维审校（只审不改） |
| polisher | sonnet | polish | 基于审校报告去 AI 味润色 |
| publisher | sonnet | publish | 格式校验 + 标准化 + 多格式导出 |
| style-analyzer | sonnet | — | 七维度风格 DNA 提取（style-profiling 调用） |

所有 agent 使用 RCCF 结构（Role + Context + Constraints + Format + Exit Criteria）。

### Skill 体系

Skill 采用扁平目录结构，每个 agent 在 Context 段按需读取所需 SKILL.md。

| Skill | 工作流阶段 | 说明 |
|-------|-----------|------|
| `pipeline-orchestrating` | 编排 | 编排器入口（orchestrator agent 专用） |
| `style-profiling` | 准备 | 七维度风格 DNA 提取 |
| `style-studying` | 准备 | 外部参考材料学习 |
| `article-structuring` | 构思 | 栏目结构骨架（academic/industry/tech/story） |
| `title-crafting` | 构思 | 标题打磨 + 质量门禁 |
| `writing-guiding` | 创作 | 栏目语气 + 正向替换 + 人味技巧 + 互动设计 |
| `opening-crafting` | 创作 | 5 种开篇策略 |
| `visual-theming` | 创作 | 品牌色板 + SVG 组件规范 |
| `format-linting` | 发布 | 确定性 Markdown 格式校验 |
| `format-exporting` | 发布 | Markdown 标准化 + 多格式导出 |
| `publish-preparing` | 发布 | 发布前后运营清单 |
| `content-planning` | 策划 | 内容排期规划 |
| `creation-reviewing` | 复盘 | 创作复盘（diff 分析 + 规则提炼） |
| `metrics-tracking` | 复盘 | 运营数据追踪 |
| `performance-benchmarking` | 复盘 | 跨文章效果分析 |

### 品牌视觉系统

栏目配置（视觉+业务）统一定义在 `styles/default/columns.yaml`。Writer 使用 Markdown + `:::block` 扩展标记（`:::card`, `:::note`, `:::cta` 等），publish 阶段标准化 Markdown 后由 typesetter 渲染为品牌 HTML。

### 错误处理

| 层级 | 机制 | Token 成本 |
|------|------|------------|
| L1 | 自动重试（最多 2 次） | 0 |
| L2 | 带 violation 上下文重试 | 低 |
| L3 | 模型降级（Opus→Sonnet） | 中 |
| L4 | AskUserQuestion 人工介入 | 0 |

## 领域包机制

框架通过 `domain.yaml` 注册 skill 和 rule，切换领域只需修改 `.inkflow.yaml` 的 `domains` 字段。当前领域包：
- `wechat-article` — 微信公众号文章写作
