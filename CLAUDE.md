# InkFlow 内容工作区

LLM 辅助内容创作工作流，基于 Claude Code 原生能力。
通用写作内核 + 可插拔 Profile 层：换 Profile 即换"栏目 / 品牌 / 平台"整套设定，内核不动。

## 工作语言

默认工作语言为**中文**。所有 agent 输出、skill 交互、文章内容、审校报告、运营数据均使用中文。代码、CLI 命令、文件名使用英文。

## 目录分层（根目录一眼读懂）

| 组 | 作用 | 你会做什么 |
|------|------|------|
| `content/` | 你的创作资产（articles / references / retrospectives） | 经常改，纳入版本管理 |
| `profiles/` | 创作设定插件包（四类 slot + manifest） | 新建 / 替换 / 提取时改 |
| `runtime/` | 运行时状态（pipeline-states / profile-resolved / profile-lock） | 框架生成，一般不手动动 |
| `framework/` | 框架代码（tools / contracts / config） | 升级命令覆盖，避免手动改 |
| `.claude/` | Claude Code 框架目录（agents / skills / rules / settings） | 只读，升级命令覆盖 |

## 关键路径

| 用途 | 路径 |
|------|------|
| 项目配置 | `framework/config/inkflow.yaml` |
| 产物布局 | `framework/config/artifact-layout.yaml` |
| Profile 协议 | `framework/contracts/profile-protocol.md` + `profile.schema.json` |
| 写作元契约（平台无关） | `framework/contracts/writing-kernel.md` |
| Profile 包目录 | `profiles/{id}/`（`profile.yaml` + 四 slot 文件） |
| Profile 当前绑定 | `runtime/profile-lock.yaml` |
| Profile 合成产物（agent 唯一读源） | `runtime/profile-resolved/{principles.md, voice.md, typesetting.yaml, constraints.yaml, manifest.json}` |
| 外部参考材料 | `content/references/` |
| 文章产物 | `content/articles/{slug}/` |
| 运行状态 | `runtime/pipeline-states/{slug}.json` |
| capabilities 缓存（variant 白名单） | `runtime/typeset-capabilities.json`（由 adapter cli capabilities --cache 产出） |
| 排版适配器（与独立 repo 对接） | `framework/tools/_adapters/`（Python · PlatformAdapter 接口） |
| 排版契约（两端共识） | `framework/contracts/wechat-typeset.schema.json` |
| 本地排版工具（独立 repo） | https://github.com/lync-cyber/wechat-typeset （clone 到 Ink-Flow 同级目录） |

## 工作区结构（单篇文章）

```
content/articles/{slug}/
  intermediate/
    01-brief.md
    02-research-memo.md
    03-outline/{platform}.md
    04a-draft/{platform}/section-NN.md   04a-draft/{platform}/merged-draft.md
    04b-figure/{platform}/fig-NN.png     04b-figure/{platform}/figure-index.md
  review/
    05-audit/{platform}.md                06-polish/{platform}.md
  export/
    07-final/{platform}.md
    08-wechat-publish.md   (含 ::: 容器 + 行内扩展，粘贴到 wechat-typeset 本地工具)
    08-{zhihu|juejin|xiaohongshu}-publish.md   (纯 GFM，平台直接投递)
    08-teaser-120chars.md  (仅 wechat)
```

## Profile 架构

通用内核只暴露"槽位"，Profile 提供填料。四类 slot：

| slot | 内容 | 形态 |
|---|---|---|
| `principles` | 论证方式、叙事骨架、段落推进、开头策略 | markdown |
| `voice` | 人称、用词、句式偏好、金句位 | markdown |
| `typesetting` | 段落 / 句子 / 标题 / 容器 / CSS 安全 / SVG 下限 | yaml |
| `constraints` | 禁用词 / 替换词 / 字数 / 栏目 × 平台矩阵 | yaml |

Agent 只读 `runtime/profile-resolved/*`（resolver 合成产物）；不得直接 Read `profiles/{id}/*`。

### Profile 的生成与装配

- **提取** — `/profile extract goal` 或 `/profile extract sample <refs>`：从目标描述或样本文章生成新 Profile 包
- **装配** — `/profile use <id>` 写 lock + 触发 resolver；`/profile overlay <id>@<stage>` 单篇局部注入；`/profile stack A+B` 临时叠加
- **查看** — `/profile show` 打印当前 lock；`/profile list` 列出可用 Profile

## 通用规则（不随 Profile 变化）

核心写作规范：

@framework/contracts/writing-kernel.md
@.claude/rules/core/writing-quality.md
@.claude/rules/core/fact-check.md

当前绑定 Profile 的合成产物（自动注入到 agent 上下文；SessionStart hook 刷新）：

<!-- inkflow:profile:begin -->
@runtime/profile-resolved/principles.md
@runtime/profile-resolved/voice.md
@runtime/profile-resolved/typesetting.yaml
@runtime/profile-resolved/constraints.yaml
<!-- inkflow:profile:end -->

## 使用方式

> 以下触发词为自然语言，Claude 识别意图后加载对应 agent / skill 执行。

- **写文章**: 告诉 Claude 主题 → `orchestrator` agent 自动接管。可选预设：
  - "快速写一篇 X / quick X" → preset=quick（~10 分钟，单平台，inline 模式，CP1/CP2 自动通过）
  - "草稿 X / draft X" → preset=draft（~5 分钟，跑到 draft 停下，用户接手）
  - 默认 → preset=full（完整流程，3 个 checkpoint 全开）
- **Profile 全生命周期**: "提取 profile / 学这几篇 / 对标"（→ extract）/ "切换 profile / 本次用 X / overlay / stack"（→ use 系列）→ `profile` skill
- **本地排版（wechat）**: pipeline 交付后，启动独立 repo [wechat-typeset](https://github.com/lync-cyber/wechat-typeset) → `npm run dev` → 浏览器 `127.0.0.1:7788` → 粘贴 `export/08-wechat-publish.md` → 挑主题 → 一键复制富文本 → 粘贴到公众号后台
- **刷新 capabilities 缓存**: `python framework/tools/_adapters/cli.py capabilities --cache` → 更新 `runtime/typeset-capabilities.json`，供 lint.py 消费
- **格式校验**: "跑一下 lint"、"检查格式" → 运行 `.claude/skills/quality-linting/scripts/lint.py`（从 `runtime/profile-resolved/*` 拉取规则数据）
- **内容排期**: "排期"、"内容日历" → 生成发布计划
- **发布准备**: "发布清单"、"运营清单" → 发布前后检查清单
- **效果分析**: "数据分析"、"KPI" → 多维度运营数据分析
- **创作复盘**: "复盘"、"给反馈" → 对比初稿与终审版，提炼改进规则

## 升级框架

```bash
bash framework/tools/bootstrap.sh . {仓库URL}
```

或在 Claude Code 中说"更新 InkFlow"、"升级框架"。

## Pipeline 阶段

```
brief → research → atoms → outline [CP1] → draft ∥ figures → audit → polish [CP2] → publish [CP3]
```

- **atoms**：平台无关的内容原子（claims / evidence / cases / …），分叉点前最后一次统一产物
- **outline 起每平台独立**：按 `brief.target_platforms` 扇出
- **writer**：按 Profile 的 `typesetting.containers.whitelist` 决定是否产 `:::` 容器
- **auditor**：capability-conformance 静态校验由 lint.py W1-W4 规则承担
- **publisher**：直接交付 `08-{platform}-publish.md`

## 文件地图

> 按"你可能想改什么"分层。常改 → 偶改 → 只读。

### 常改（你的内容资产，纳入版本管理）

| 场景 | 文件 |
|------|------|
| 新增 / 替换创作设定（栏目 / 品牌 / 平台） | `profiles/{id}/`（`profile.yaml` + 四 slot 文件） |
| 微调现有 Profile 的某个 slot | 对应 slot 文件（`principles.md` / `voice.md` / `typesetting.yaml` / `constraints.yaml`） |
| 调整默认 brief 字段 / 导出格式 | `framework/config/inkflow.yaml` |
| 新增外部参考文章 | `content/references/articles/` |
| 写作中的单篇文章 | `content/articles/{slug}/` |

### 偶改（规则演进时）

| 场景 | 文件 |
|------|------|
| 调整平台 lint 开关 / 严重级别 | `framework/config/platform-lint-rules.yaml` |
| 修订通用写作规范 | `.claude/rules/core/*.md` |
| 修订写作元契约（平台无关基线） | `framework/contracts/writing-kernel.md` |
| 升级 Profile 协议版本 | `framework/contracts/profile-protocol.md` + `profile.schema.json` |
| 新增产物路径占位 | `framework/config/artifact-layout.yaml` |

### 只读（框架代码，升级命令覆盖）

| 范围 | 路径 |
|------|------|
| Subagent 定义 | `.claude/agents/` |
| Skill 定义 | `.claude/skills/` |
| 工具 | `framework/tools/` |
| 启动脚本 | `framework/tools/bootstrap.sh` |
| 排版适配器 | `framework/tools/_adapters/`（Python） |
| 排版契约 | `framework/contracts/*.schema.json` |

## 注意事项

- `content/` 与 `profiles/` 是你的创作资产，纳入版本管理
- `runtime/` 为运行时中间产物，可清空；`.claude/` 和 `framework/tools/` 为框架文件，升级命令覆盖
- Agent **只读** `runtime/profile-resolved/*`，不得直接读 `profiles/{id}/*` 或 `framework/config/` 中的栏目数据
- **主题 / variant 不由 pipeline 决策**：writer 只按 Profile 声明的容器白名单写正文；主题切换在 wechat-typeset 本地编辑器运行时完成
