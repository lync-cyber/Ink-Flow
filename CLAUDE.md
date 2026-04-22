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
| 外部参考材料 | `content/references/` |
| 文章产物 | `content/articles/{slug}/` |
| 运行状态 | `runtime/pipeline-states/{slug}.json` |
| wechat 容器语法手册 | `.claude/agents/_shared/wechat-containers.md`（25 容器 + 5 行内扩展，writer/auditor/polisher/publisher 共享） |
| wechat 容器白名单（lint 消费） | `.claude/rules/domains/wechat-article/containers.yaml` |
| capabilities 缓存（variant 白名单） | `runtime/typeset-capabilities.json`（由 adapter cli capabilities --cache 产出） |
| 排版适配器（与独立 repo 对接） | `framework/tools/_adapters/`（Python · PlatformAdapter 接口；只做 capabilities 对账） |
| 排版契约（两端共识） | `framework/contracts/wechat-typeset-v1.schema.json` |
| 本地排版工具（独立 repo） | https://github.com/lync-cyber/wechat-typeset （约定 clone 到 Ink-Flow 同级目录） |

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
    08-wechat-publish.md   (含 ::: 容器 + 5 行内扩展，粘贴到 wechat-typeset 本地工具)
    08-{zhihu|juejin|xiaohongshu}-publish.md   (纯 GFM，平台直接投递)
    08-teaser-120chars.md  (仅 wechat)
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
@.claude/rules/domains/wechat-article/containers.yaml

## 使用方式

> 以下触发词为自然语言，Claude 识别意图后加载对应 skill 执行。

- **写文章**: 告诉 Claude 主题 → 自动启动 pipeline。writer 在 wechat 分支会直接写 `:::` 容器；其他平台输出纯 GFM。
- **分析风格**: "分析风格"、"提取风格 DNA" → profile 模式，从你的文章提取风格
- **学习进修**: "学习这篇文章"、"参考这个模板" → study 模式，分析外部材料改进规则
- **本地排版**: pipeline 交付后，启动独立 repo [wechat-typeset](https://github.com/lync-cyber/wechat-typeset)（clone 到 Ink-Flow 同级目录）→ `npm run dev` → 浏览器 `127.0.0.1:7788` → 粘贴 `export/08-wechat-publish.md` → 挑主题 → 一键复制富文本 → 粘贴到公众号后台。主题切换由本地编辑器运行时处理，契约承诺 9 套主题间切换不塌版。
- **刷新 capabilities 缓存**: `python framework/tools/_adapters/cli.py capabilities --cache` → 更新 `runtime/typeset-capabilities.json`（variant 白名单），供 lint.py 消费
- **格式校验**: "跑一下 lint"、"检查格式" → 运行 `.claude/skills/quality-linting/scripts/lint.py`（wechat 平台自动做容器 W1-W4 静态校验）
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
- **writer（wechat 分支）直接写 `:::` 容器**：不需要后续 typeset 阶段二次改写
- **auditor**：capability-conformance 静态校验（容器 id / variant / 嵌套配对）合并入此阶段，由 lint.py W1-W4 规则承担
- **publisher**：直接交付 `08-wechat-publish.md`；用户在 wechat-typeset 本地工具挑主题复制

## 文件地图

> 按"你可能想改什么"分层。常改 → 偶改 → 只读。

### 常改（你的内容资产，纳入版本管理）

| 场景 | 文件 |
|------|------|
| 新增/调整栏目业务字段（骨架、tone、KPI） | `framework/config/columns.yaml` |
| 调整默认 brief 字段 / 导出格式 | `framework/config/inkflow.yaml` |
| 微调风格档案 | `content/styles/default/style-profile.md` |
| 新增外部参考文章 | `content/references/articles/` |
| 写作中的单篇文章 | `content/articles/{slug}/` |

### 偶改（规则演进时）

| 场景 | 文件 |
|------|------|
| 新增/删除禁用词 | `.claude/rules/data/forbidden-phrases.yaml` |
| 调整排版/CSS/SVG 阈值 | `.claude/rules/data/platform-limits.yaml` |
| 调整 wechat 容器白名单 | `.claude/rules/domains/wechat-article/containers.yaml`（需与 wechat-typeset 的 `container-syntax.md` 对齐） |
| 修订写作/审核规范 | `.claude/rules/core/*.md` |
| 新增产物路径占位 | `framework/config/artifact-layout.yaml` |
| 调整平台 lint 差异 | `framework/config/platform-lint-rules.yaml` |

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
- **主题 / variant 不由 pipeline 决策**：writer 只负责把 25 容器 + 5 行内扩展写进 wechat 产物；真正的主题切换在 wechat-typeset 本地编辑器运行时完成
