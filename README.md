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
  ├── agents/                      # Subagent 定义（RCCF 结构）
  ├── skills/                      # Skill 定义（扁平结构，每个 skill 一个目录）
  │   ├── pipeline-orchestrating/  # 写作流程总入口（含 references/）
  │   ├── style-learning/          # 风格学习（profile / study 两种模式）
  │   ├── workspace-init/          # 工作区初始化与升级
  │   ├── title-crafting/          # 标题打磨
  │   ├── quality-linting/         # 格式 lint
  │   ├── publish-preparing/       # 发布准备
  │   ├── content-planning/        # 内容排期
  │   ├── creation-reviewing/      # 创作复盘
  │   ├── metrics-tracking/        # 数据追踪
  │   └── performance-benchmarking/ # 效果分析
  └── rules/                       # 声明式约束规则
      ├── core/                    # 跨领域通用规则
      ├── domains/                 # 领域特有规则
      └── data/                    # YAML 数据（单一事实来源）

config/                            # 项目配置（纳入版本管理）
  ├── inkflow.yaml                 # 项目配置 + stage 契约
  ├── columns.yaml                 # 栏目统一配置（业务字段：骨架、tone、频率、KPI）
  ├── artifact-layout.yaml         # 产物路径约定
  └── markdown-extensions.md       # 允许的 Markdown 语法白名单（标准 + GFM Alerts）

styles/                            # 个人化风格档案（用户生成，升级不覆盖）
  └── {profile}/style-profile.md

tools/                             # 工具链
  ├── lint/                        # 格式校验脚本 + 配置
  ├── render/                      # mermaid / svg-sanitize
  ├── fetch/                       # 外部文章抓取（微信等）+ 正文清洗
  └── bootstrap.sh                 # 框架部署/升级脚本

workspace/
  ├── pipeline-states/             # Pipeline 执行状态（.gitignore）
  └── column-design/               # 栏目视觉中间产物（theme.css + preview.html）

tests/                             # 框架质量门禁
  └── lint-framework.py            # L0 静态校验（schema + 交叉引用）

articles/                          # 内容产物（按文章分组）
  └── {slug}/
      ├── intermediate/            # brief / research / outline / draft / figure
      ├── review/                  # audit / polish-trace
      └── export/                  # final / wechat / plain / teaser

references/                        # 外部参考材料（风格学习输入）
workspace/pipeline-states/         # Pipeline 执行状态（.gitignore）
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
- `draft`: 逐 section 写作（标准 Markdown + GFM Alerts）
- `figures`: 品牌色驱动生成 SVG/Mermaid（与 draft 并行）
- `audit`: 审校（只审不改）
- `polish`: 基于审校报告去 AI 味润色 → **Checkpoint 2**
- `publish`: 格式校验 + Markdown 标准化 + 多格式导出 → **Checkpoint 3**

### Agent 清单

| Agent | Model | 阶段 | 职责 |
|-------|-------|------|------|
| orchestrator | opus | 全流程 | 编排 pipeline、调度子 agent、用户交互 |
| researcher | sonnet | research | Web 调研、事实收集、代码片段 |
| outliner | opus | outline | 结构设计、视觉断点规划 |
| writer | opus | draft | 逐 section 写作（标准 Markdown + GFM Alerts） |
| illustrator | sonnet | figures | 品牌色驱动生成 SVG/Mermaid 配图 |
| auditor | opus | audit | 审校（只审不改） |
| polisher | sonnet | polish | 基于审校报告去 AI 味润色 |
| publisher | sonnet | publish | 格式校验 + 标准化 + 多格式导出 |
| style-analyzer | sonnet | — | 风格 DNA 提取（由 style-learning skill 调用） |

所有 agent 使用 RCCF 结构（Role + Context + Constraints + Format + Exit Criteria）。

### Skill 体系

Skill 采用扁平目录结构，每个 agent 在 Context 段按需读取所需 SKILL.md。

| Skill | 工作流阶段 | 说明 |
|-------|-----------|------|
| `pipeline-orchestrating` | 编排 | 写作 pipeline 总入口（orchestrator agent 驱动） |
| `workspace-init` | 准备 | 工作区初始化与框架升级 |
| `style-learning` | 准备 | 风格学习（profile：自己文章；study：外部材料/URL） |
| `title-crafting` | 构思 | 标题打磨 + 质量门禁（由 pipeline 在 CP1 前调用） |
| `quality-linting` | 发布 | 确定性格式校验（`tools/lint/lint.py`） |
| `publish-preparing` | 发布 | 发布前后运营清单 |
| `content-planning` | 策划 | 内容排期规划 |
| `creation-reviewing` | 复盘 | 创作复盘（diff 分析 + 规则提炼） |
| `metrics-tracking` | 复盘 | 运营数据追踪 |
| `performance-benchmarking` | 复盘 | 跨文章效果分析 |

> 其他写作期能力（栏目骨架、开头策略、正向替换、视觉主题）不再作为独立 skill，
> 已整合进 `config/columns.yaml` 作为声明式配置，由 writer / illustrator agent 直接读取。

### 栏目业务配置与视觉分离

- **业务字段**（骨架、tone、开头策略、KPI）定义在 `config/columns.yaml`，由 writer / illustrator / auditor agent 直接消费。
- **视觉字段**（主色、字体、标题样式等）不再进入 `columns.yaml`。由 `column-designing` skill 按栏目产出到 `workspace/column-design/{slug}/theme.css` 和 `preview.html`；再由下游 skill 导入到你自部署的 doocs/md 作为可选主题。
- Writer 输出标准 Markdown + GFM Alerts；publish 阶段产出 `export/08-wechat-publish.md`；用户自行粘贴到兼容 doocs/md 的在线/本地排版器，复制富文本发布。

### 错误处理

| 层级 | 机制 | Token 成本 |
|------|------|------------|
| L1 | 自动重试（最多 2 次） | 0 |
| L2 | 带 violation 上下文重试 | 低 |
| L3 | 模型降级（Opus→Sonnet） | 中 |
| L4 | AskUserQuestion 人工介入 | 0 |

## 领域包机制

领域特有规则放在 `.claude/rules/domains/{name}/`，通过 CLAUDE.md 的 `@`-imports 加载。当前领域：
- `wechat-article` — 微信公众号文章写作（规则位于 `.claude/rules/domains/wechat-article/`）

### 质量门禁

```bash
python tests/lint-framework.py
```

L0 静态校验，检查路径一致性、YAML schema、agent/skill frontmatter 完整性、交叉引用和领域包完整性。
