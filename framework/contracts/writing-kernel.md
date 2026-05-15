---
name: writing-kernel
description: 通用写作元契约 — 平台无关、品牌无关。产出物的最小合法形态。
schemaVersion: "2.0"
consumers:
  - .claude/agents/writer/AGENT.md
  - .claude/agents/outliner/AGENT.md
  - .claude/agents/auditor/AGENT.md
  - .claude/agents/polisher/AGENT.md
  - .claude/agents/publisher/AGENT.md
related:
  - framework/contracts/profile-protocol.md       # 谁来填充 slot
  - runtime/profile-resolved/typesetting.yaml     # 当前生效的排版契约
  - runtime/profile-resolved/constraints.yaml     # 当前生效的约束
  - runtime/profile-resolved/voice.md             # 当前生效的品牌调性
  - runtime/profile-resolved/principles.md        # 当前生效的写作原则
---

> **本契约只定义"任何写作 Profile 都必须遵守的最低线"。栏目特有骨架、品牌专属调性、平台专属容器语法 —— 全部由 Profile 层提供。**
>
> Agent 读本文件获得"通用骨架"；读 `runtime/profile-resolved/*` 获得"本次任务的具体要求"。

---

## 1 · 跨平台 Markdown 基线（所有 Profile 默认允许）

1. 标题 H1/H2/H3/H4（H1 全篇唯一）
2. 段落 / `**加粗**` / `*斜体*` / `~~删除~~` / `` `行内代码` ``
3. 代码块（必标语言）—— 是否允许由 Profile 的 `typesetting.codeBlocks.allowed` 决定
4. 普通引用 `> text`
5. GFM Alerts 5 种（`NOTE` / `TIP` / `IMPORTANT` / `WARNING` / `CAUTION`）
6. 有序 / 无序列表
7. 表格（2-5 行结构化数据）
8. 图片 `![caption](url)` / 链接 `[text](url)`
9. 分割线 `---`
10. `[N]` 上标引用 + 文末 H3 "参考文献"

上述元素不需要 Profile 显式放行。

**扩展元素**（容器语法 `::: name`、行内扩展 `==mark==` `[.着重.]` 等）是**平台/Profile 特性**，
必须在 `runtime/profile-resolved/typesetting.yaml` 中声明才可使用。

---

## 2 · Profile 驱动的形态

当 agent 需要判断"这个写法合不合法"时：

| 问题 | 查哪里 |
|---|---|
| 最大段落字数？ | `typesetting.paragraph.maxChars` |
| H2 是否加编号前缀？ | `typesetting.heading.numberedH2.enabled` |
| 能不能用 `::: xxx` 容器？ | `typesetting.containers.whitelist`（若不存在则禁止） |
| 能不能用 `==高亮==`？ | `typesetting.inlineExtensions.allowed` |
| Emoji 策略？ | `typesetting.emoji.policy` |
| 字数范围？ | `constraints.length.{target,min,max,hardFactor}` |
| 哪些短语 / 正则禁用？ | `constraints.forbidden.{phrases,patterns}` |
| 人称偏好？ | `voice.人称与语气` |
| 金句位？ | `voice.金句位` |
| 叙事结构 / 骨架？ | `principles.叙事结构` |

---

## 3 · 合法写法速查（通用 · 不依赖 Profile）

### 3.1 Section 间分隔
每个 `## {Section}` 之前（除第一个）必须 `---`。

### 3.2 摘要引言
H1 之后可跟一个 blockquote 作摘要。具体策略由 Profile 的 `principles` 决定。

### 3.3 参考文献
需要引用来源的文章必须有文末 H3 "参考文献" + 标准有序列表。即便 HTML 标签被平台剥离，
纯文本仍能读出"标题—来源—日期"。禁止只有链接无说明。

### 3.4 用户填充标记
需要作者补充经验的位置插 `<!-- USER_FILL: {提示} -->`；publisher 前必须全部清理。

### 3.5 视觉断点 owner 标记（outliner → writer/illustrator）

| owner | 含义 |
|---|---|
| `(writer:table)` | Markdown 表格 |
| `(writer:alert)` | GFM Alert |
| `(writer:quote)` | 普通引用 |
| `(writer:list)` | 列表 |
| `(writer:container:<name>)` | **仅当 Profile 的 typesetting.containers.whitelist 允许** |
| `(illustrator:svg-flow|svg-chart|html-table|html-card)` | illustrator 生成 |
| `(illustrator:image-prompt)` | 文生图提示词，用户手动处理 |

### 3.6 Frontmatter（首 section）

```yaml
---
title: "{title}"
tags: [{tags}]
tldr: "{summary}"          # 可选
# Profile 可追加必填字段（constraints.metadata.required）
---
```

---

## 4 · 升级与兼容

- 本 kernel 契约升级时 `schemaVersion` bump
- Profile 可在 `compatibility.inkflowKernel` 声明兼容版本范围
- 若 resolved 产物的某字段在本 kernel 2.0 中已不支持，resolver 报告 warning 但不阻断

---

## 5 · 与 `runtime/profile-resolved/` 的读写契约

- Agent **只读** `runtime/profile-resolved/*`；不得直接 Read 任何 `profiles/{id}/*` 文件
- 合成产物的刷新由 SessionStart hook 或手动 `python framework/tools/profile_resolver.py` 触发
- `runtime/profile-resolved/` 必须存在 —— 缺失 / 空 → agent 或 lint 报 error 中止；先 `/profile use <id>` 绑定
- 字段缺失视作"Profile 未声明该项"，按 § 6 的读值约定处理

---

## 6 · 字段未声明时的读值约定

| 字段 | 读值 |
|---|---|
| `typesetting.heading.allowed` | `[2, 3, 4]` |
| `typesetting.heading.h1Uniqueness` | true |
| `typesetting.paragraph.maxChars` | 300 |
| `typesetting.sentence.maxChars` | 40 |
| `typesetting.emphasis.perParagraphMax` | 2 |
| `typesetting.emoji.policy` | `sparing` |
| `typesetting.containers.whitelist` | `[]`（**禁用容器语法**） |
| `typesetting.inlineExtensions.allowed` | `[]`（仅 GFM 原生） |
| `constraints.length.target` | 2000 |
| `constraints.length.hardFactor` | 1.2 |
| `voice.人称` | 第一人称"我"，读者"你" |

这些约定等价于 base-generic-chinese 基座。任何 Profile 只要声明 extends 了 base-generic-chinese，这些字段就一定已填。
