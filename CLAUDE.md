# InkFlow 内容工作区

LLM 辅助内容创作工作流，基于 Claude Code 原生能力。当前领域：微信公众号文章。

## 工作语言

默认工作语言为**中文**。所有 agent 输出、skill 交互、文章内容、审校报告、运营数据均使用中文。代码、CLI 命令、文件名使用英文。

## 目录分层（根目录一眼读懂）

根目录按"谁在用、多久改一次"分成三组：

| 组 | 作用 | 你会做什么 |
|------|------|------|
| `content/` | 你的创作资产（articles / styles / references / retrospectives） | 经常改，纳入版本管理 |
| `runtime/` | 运行时状态（pipeline-states） | 框架生成，一般不手动动 |
| `framework/` | 框架代码（tools / config） | 升级命令覆盖，避免手动改 |
| `.claude/` | Claude Code 框架目录（agents / skills / rules / settings） | 只读，升级命令覆盖 |

## 关键路径

| 用途 | 路径 |
|------|------|
| 项目配置 | `framework/config/inkflow.yaml` |
| 栏目业务配置 | `framework/config/columns.yaml`（骨架/tone/KPI；视觉已剥离） |
| 产物布局 | `framework/config/artifact-layout.yaml` |
| 风格档案（个人化） | `content/styles/default/style-profile.md` |
| 文章排版方案（typesetter agent 产出） | `content/articles/{slug}/intermediate/09-typeset-plan.md` |
| 外部参考材料 | `content/references/` |
| 文章产物 | `content/articles/{slug}/` |
| 运行状态 | `runtime/pipeline-states/{slug}.json` |
| 排版适配器（与独立 repo 对接） | `framework/tools/_adapters/`（Python · PlatformAdapter v2 接口） |
| 排版契约（兩端共识） | `framework/contracts/wechat-typeset-v2.schema.json` |
| 本地排版工具（独立 repo） | https://github.com/lync-cyber/wechat-typeset （约定 clone 到 Ink-Flow 同级目录） |

## 工作区结构（单篇文章）

```
content/articles/{slug}/
  intermediate/
    01-brief.md
    02-research-memo.md
    02-atoms/{index.md + 9 类原子}
    03-outline/{platform}.md                        # per-platform
    04a-draft/{platform}/section-NN.md              # per-platform
    04a-draft/{platform}/merged-draft.md
    04b-figure/{platform}/fig-NN.{svg,html,md,png}  # per-platform
    04b-figure/{platform}/figure-index.md
    09-typeset-plan.md                              # 仅 wechat
  review/
    05-audit/{platform}.md                          # per-platform
    06-polish/{platform}.md                         # per-platform
  export/
    07-final/{platform}.md                          # per-platform
    08-{platform}-publish.md                        # 每平台独立
    08-plain-publish.md        08-teaser-120chars.md  # 仅 wechat 附加
    08-typeset/wechat/{annotated.md, meta.json}     # 仅 wechat
```

## 规则体系（单一事实来源）

所有 lint/agent 共享的规则数据存放在 `.claude/rules/data/`：

@.claude/rules/data/forbidden-phrases.yaml
@.claude/rules/data/platform-limits.yaml

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
- **文章排版方案**: "给这篇排版"、"排版方案"、"挑 persona"、"选签名容器" → 自动触发 `typeset` pipeline 阶段（typesetter agent），或手动 `typeset-authoring` skill → 产出 `intermediate/09-typeset-plan.md` + `export/08-typeset/wechat/annotated.md`。
- **本地排版**: 独立 repo [wechat-typeset](https://github.com/lync-cyber/wechat-typeset) 的 launcher（clone 到 Ink-Flow 同级目录）→ 启 `127.0.0.1:7788` → 粘贴 `annotated.md` → 选 persona → 一键复制富文本 → 粘贴到公众号后台。Ink-Flow 这端通过 `framework/tools/_adapters/cli.py` 读对方 `dist/api/capabilities.json` + 调 `scripts/wechat-typeset-cli.ts` 做 render dry-run，无 HTTP 强依赖。
- **格式校验**: "跑一下 lint"、"检查格式" → 运行 `.claude/skills/quality-linting/scripts/lint.py`
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
brief → research → outline [CP1] → draft ∥ figures → audit → polish [CP2] → publish → typeset [CP3]
```

`publish` 出平台无关的 Markdown；`typeset` 基于 adapter 能力清单产出平台相关的排版方案与 annotated 版本。

## typeset 阶段：容器/主题知识外部化

Ink-Flow **不维护**容器名、variant id、persona id 的离线字典——所有权威知识都在
sibling repo `wechat-typeset/skills/wechat-typeset/` 的 SKILL 与 `docs/container-syntax.md`
里。typesetter agent 在运行时通过 `cli.py docs` 拿绝对路径再 Read，避免副本漂移。

三步上手：

```bash
# 1. 同级目录 clone + build（产出 capabilities.json 与 CLI）
git clone https://github.com/lync-cyber/wechat-typeset.git ../wechat-typeset
cd ../wechat-typeset && npm ci && npm run build

# 2. 回 Ink-Flow，能力清单自动可用
python framework/tools/_adapters/cli.py health         # ok=true + version 即通过
python framework/tools/_adapters/cli.py capabilities --cache
python framework/tools/_adapters/cli.py docs          # 返回 SKILL 绝对路径给 agent Read

# 3. 跑或重排文章 typeset
#    自动路径：pipeline 到 typeset 阶段自动分派 typesetter agent
#    手动路径：说"给 {slug} 排版" → typeset-authoring skill 转派 typesetter agent
```

CP3 三态：`passed`（conform+validate 全通过）/ `degraded`（ok 但带 issues，如图片待手动上传）
/ `failed`（health/conform/validate 任一失败）。meta.json 里的 `adapter_version` 不允许字面值
`unknown`，契约 v2 在 adapter 层就拒绝。

## 文件地图

> 按"你可能想改什么"分层。常改 → 偶改 → 只读。

### 常改（你的内容资产，纳入版本管理）

| 场景 | 文件 |
|------|------|
| 新增/调整栏目业务字段（骨架、tone、KPI） | `framework/config/columns.yaml` |
| 给文章做排版方案 / 选主题 / 选 variant | pipeline 自动跑 typesetter agent；手动触发走 typeset-authoring skill → 写 `intermediate/09-typeset-plan.md` + `export/08-typeset/wechat/annotated.md` |
| 调整默认 brief 字段 / 导出格式 | `framework/config/inkflow.yaml` |
| 微调风格档案 | `content/styles/default/style-profile.md` |
| 新增外部参考文章 | `content/references/articles/` |
| 写作中的单篇文章 | `content/articles/{slug}/` |

### 偶改（规则演进时）

| 场景 | 文件 |
|------|------|
| 新增/删除禁用词 | `.claude/rules/data/forbidden-phrases.yaml` |
| 调整排版/CSS/SVG 阈值 | `.claude/rules/data/platform-limits.yaml` |
| 修订写作/审核规范 | `.claude/rules/core/*.md` |
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

- `content/`（articles / styles / references / retrospectives）是你的创作资产，纳入版本管理
- `framework/config/` 也纳入版本管理（栏目骨架、brief 默认值可改）
- `runtime/` 为运行时中间产物，可清空；`.claude/` 和 `framework/tools/` 为框架文件，升级命令覆盖
- 个性化风格存储在 `content/styles/{profile}/style-profile.md`，升级不会覆盖
