---
name: inkflow-profile-protocol
apiVersion: inkflow.profile/v1
schemaVersion: "1.0"
description: Profile 插件层协议 — Ink-Flow 通用内核与创作设定之间的唯一契约。
consumers:
  - framework/tools/profile_resolver.py
  - framework/tools/inject_profile.py
  - .claude/skills/profile/SKILL.md
  - .claude/agents/writer/AGENT.md
  - .claude/agents/auditor/AGENT.md
  - .claude/agents/polisher/AGENT.md
  - .claude/agents/outliner/AGENT.md
  - .claude/agents/publisher/AGENT.md
related:
  - framework/contracts/profile.schema.json   # manifest JSON Schema
  - framework/contracts/writing-kernel.md     # 通用写作元契约（平台无关）
---

> Profile 层是 Ink-Flow 的"创作设定插件层"。通用内核只暴露**槽位**，Profile 提供**槽位填料**，orchestrator 按阶段挑料注入 subagent。
> 本文件是协议原件；`profile.schema.json` 是其机器可读投影，二者冲突以本文件为准。

## 目录

- [0 · 名词表](#0--名词表)
- [1 · Profile Pack 目录](#1--profile-pack-目录)
- [2 · profile.yaml Manifest](#2--profileyaml-manifest)
- [3 · Slot 字段规格](#3--slot-字段规格)
  - [字段归属分层约定](#字段归属分层约定)
- [4 · 合成（Resolver）算法](#4--合成resolver算法)
- [5 · 绑定（Lock）](#5--绑定lock)
- [6 · 注入（Inject）](#6--注入inject)
- [7 · Agent 消费约定](#7--agent-消费约定)
- [8 · Extractor 产物契约](#8--extractor-产物契约)
- [9 · 升级规则](#9--升级规则)
- [10 · 非目标](#10--非目标)

---

## 0 · 名词表

| 术语 | 含义 |
|---|---|
| **Kernel** | 通用写作内核（agents / skills / rules/core）——平台无关、品牌无关、不可变 |
| **Profile Pack** | 一个目录 `profiles/{id}/`，自包含 manifest + 四类 slot |
| **Slot** | 四类可插拔插件之一：`principles` / `voice` / `typesetting` / `constraints` |
| **Extends** | Profile 可继承另一个 Profile 的 slot 字段（类似 Docker FROM） |
| **Resolver** | `framework/tools/profile_resolver.py`，展开 extends 图 + 合成 slot 输出 |
| **Resolved snapshot** | 合成结果写入 `runtime/profile-resolved/`，agent 只读此处 |
| **Lock** | `runtime/profile-lock.yaml`，记录当前工作区绑定了哪个 Profile + 解析到的版本集 |
| **Overlay** | 单次 pipeline 运行临时叠加的 Profile（写在 `.profile/overlay.yaml`） |

---

## 1 · Profile Pack 目录

一个 Profile 是一个自包含目录。优先级递增：

```
~/.inkflow/profiles/{id}/                  # 全局默认（跨工作区）
profiles/{id}/                             # 工作区级（checked in）
content/articles/{slug}/.profile/          # 单篇临时覆盖
```

合法目录结构：

```
profiles/<id>/
  profile.yaml            # manifest（必需）
  principles.md           # slot 文件（可选；缺省从 extends 继承或使用 kernel 默认）
  voice.md
  typesetting.yaml
  constraints.yaml
  examples/               # 可选：few-shot 素材
    good-*.md
    bad-*.md
  overrides/              # 可选：subagent 系统提示片段覆盖
    <agent-name>.system.md
```

---

## 2 · `profile.yaml` Manifest

```yaml
apiVersion: inkflow.profile/v1             # 协议版本
id: <kebab-case-id>                        # 必填；全局唯一
version: 1.0.0                             # semver
title: 人类可读标题
author: email-or-handle
description: |
  自然语言描述。

# === 继承 ===
extends:                                   # 可选；解析时按顺序合并，后者覆盖前者
  - base-generic-chinese@^1.0.0
  - platform-wechat@~0.2.0

# === 适用域（信息性；orchestrator 校验与提示用）===
appliesTo:
  platforms: []                            # 空 = 任意平台
  columns: []                              # 空 = 任意栏目
  contentTypes: []                         # 空 = 任意类型

# === 插件绑定 ===
slots:
  principles:
    file: principles.md
    kind: markdown                         # markdown | yaml
  voice:
    file: voice.md
    kind: markdown
  typesetting:
    file: typesetting.yaml
    kind: yaml
  constraints:
    file: constraints.yaml
    kind: yaml
  # 未声明的 slot 从 extends 链中继承

# === 阶段 → slot 路由（决定"哪个阶段向 subagent 注入哪些 slot"）===
routing:
  planning:  [principles, constraints]     # outliner / researcher
  drafting:  [voice, principles, examples] # writer / illustrator
  polishing: [typesetting, constraints, voice]
  auditing:  [principles, voice, typesetting, constraints]

# === 示例挂载（drafting 阶段可注入 few-shot）===
examples:
  goodRefs: []                             # 相对 profile 目录的路径
  badRefs: []
  maxShots: 2

# === 兼容性 ===
compatibility:
  inkflowKernel: ">=2.0.0,<3.0.0"
  typeset:
    wechat-typeset: ">=0.2.0,<0.3.0"       # 按需

# === 溯源（Extractor 自动填写）===
provenance:
  extractedBy: manual | goal | sample
  samples: []                              # sample 模式：[{path, sha256}]
  goal: null                               # goal 模式：存原始 goal 描述
```

---

## 3 · Slot 字段规格

### 3.1 `principles.md`（markdown）

结构自由，但 Extractor / Resolver 遵守约定：

```markdown
---
slot: principles
version: 1.0.0
---

## 论证方式
- 条目 1（≤25 字 · 可检验）
- 条目 2

## 叙事结构（默认骨架）
1. 步骤 1
2. 步骤 2

## 段落推进
- 条目 1
```

合并策略：同名 `##` 小节按**列表条目 union + dedup**；非列表正文按**后者覆盖**。

### 3.2 `voice.md`（markdown）

```markdown
---
slot: voice
version: 1.0.0
---

## 人称与语气
- 人称: ...
- 温度: ...

## 用词风格
preferred:
  - ...
avoided:
  - ...

## 句式偏好
- ...

## 金句位
- ...
```

合并策略同 3.1。

### 3.3 `typesetting.yaml`（yaml · 机器可读）

```yaml
slot: typesetting
version: 1.0.0
schemaVersion: "1.0"

heading:
  allowed: [1, 2, 3, 4]
  h1Uniqueness: true
  numberedH2:
    enabled: false
    format: "{NN} ／ {title}"

paragraph:
  maxChars: 120
  noFirstLineIndent: true

sentence:
  maxChars: 40
  splitAt: [但是, 因此, 所以]

emphasis:
  perParagraphMax: 2
  allowed: [bold, italic, mark, emphasis-dot]

separators:
  betweenSections: "---"

containers:                                # 可选；平台特有
  whitelist: []
  perArticleLimit: {}
  signatureTotal: 1

inlineExtensions:
  allowed: []

emoji:
  policy: forbidden                        # forbidden | sparing | free
  exceptions: []

imageWidth: 640

reference:
  platformContract: framework/contracts/writing-kernel.md
```

合并策略：深度合并；**列表默认 union + dedup**；用 `$replace: true` 指令可强制覆盖：

```yaml
containers:
  whitelist:
    $replace: true
    value: [intro, tip, quote-card]
```

### 字段归属分层约定

| 字段 | 主要归属层 | 说明 |
|---|---|---|
| `typesetting.*`（段落 / 容器 / CSS / SVG / 行内扩展） | **platform** 层 | 由平台契约决定，不被品牌覆盖 |
| `constraints.length.*`（字数区间） | **栏目 / 品牌** 层 | 每家作者字数风格不同；平台层不碰 |
| `constraints.forbidden.*`（禁用词） | **base** + **品牌** 层 | 通用 AI 味词在 base；个人避讳追加在品牌 |
| `constraints.columns.*` / `constraints.columnPlatforms.*` | **品牌** 层 | 栏目骨架 + 栏目×平台矩阵 |
| `voice.*` / `principles.*` | **base** + **品牌** 层 | base 给普适项；品牌覆盖栏目专属 |

base / platform / 品牌三层的职责不重叠；避免同字段多层重复声明。

### 3.4 `constraints.yaml`（yaml · 机器可读）

```yaml
slot: constraints
version: 1.0.0

forbidden:
  phrases: []                              # 硬禁词（lint error）
  patterns:                                # 正则 + 位置限定
    - regex: "^(综上|总的来说)"
      at: paragraph_start
      reason: 结尾套话

required:
  perArticle: []                           # [{id, rule}]
  perSection: []

compliance:
  absoluteTerms: forbid | warn | allow     # "第一"、"最佳"等
  claimsNeedSource: true

length:
  target: 2800
  min: 2200
  max: 3600
  hardFactor: 1.2

metadata:
  required: [title, tags, tldr]
  tagsRange: [3, 5]
```

合并策略同 3.3。

---

## 4 · 合成（Resolver）算法

```
输入: profile_id (默认读 runtime/profile-lock.yaml.activeProfile)
1. 展开 extends 依赖图（拓扑排序，拒绝循环）
2. 按拓扑顺序依次加载每个 Profile Pack 的 slots
3. 对每个 slot 按层合并：
   - markdown 类型：顺序拼接 + 同名小节列表 union-dedup
   - yaml 类型：深度合并；list 默认 union-dedup；$replace 指令强制覆盖
4. 写出合成结果到 runtime/profile-resolved/:
   - principles.md
   - voice.md
   - typesetting.yaml
   - constraints.yaml
   - manifest.json  (每字段来源追溯)
5. 写/校 runtime/profile-lock.yaml
```

**冲突处理**：同层 profile 的同字段冲突 → 报错；跨层（extends 链）冲突 → 后者胜。

**失败语义（严格）**：
- `runtime/profile-resolved/` 目录缺失 → agent / lint / resolver 全部 error 中止（无 active Profile 绑定）
- 单个 slot 文件缺失 → resolver 在 compose 时跳过该层的该 slot，由 extends 链其他层提供；若链上无任何层提供该 slot → 合成产物写入"空骨架"占位文件
- slot 内字段缺失 → agent 按 `framework/contracts/writing-kernel.md § 6 字段未声明时的读值约定` 理解

kernel 不是 fallback 兜底；它只是"未声明时读值约定"的说明。真正保证所有字段都有值的是 `base-generic-chinese` Profile（任一合法 Profile 都应 extends 它）。

---

## 5 · 绑定（Lock）

`runtime/profile-lock.yaml`：

```yaml
apiVersion: inkflow.profile/v1
activeProfile: lync-wechat-tech            # 工作区当前绑定
resolved:                                  # resolver 执行后写入
  - { id: base-generic-chinese, version: 1.0.0, path: profiles/base-generic-chinese }
  - { id: platform-wechat,       version: 0.2.0, path: profiles/platform-wechat }
  - { id: lync-wechat-tech,      version: 1.0.0, path: profiles/lync-wechat-tech }
resolvedAt: 2026-04-24T10:00:00+08:00
lockfileVersion: 1
```

---

## 6 · 注入（Inject）

三种模式，由 `profile` skill § 2 负责：

| 模式 | 作用域 | 实现 |
|---|---|---|
| **full** (`/profile use <id>`) | 整个工作区持久生效 | 写 lock + CLAUDE.md marker block + 触发 resolver |
| **overlay** (`/profile overlay <id>@<stage>`) | 单篇文章某些阶段 | 写 `content/articles/{slug}/.profile/overlay.yaml`；orchestrator 在 fanout 时消费 |
| **stack** (`/profile stack A+B+C`) | 临时虚拟组合 | 构造内存 lock，不落盘物理 Profile |

---

## 7 · Agent 消费约定

Agent frontmatter 用 `profileSlots` 字段声明自身需要哪些 slot（**required / optional**）。
Agent 正文**只**从 `runtime/profile-resolved/` Read —— 不得直接 Read `profiles/{id}/*`，
也不得 Read 任何已废弃的栏目 / 平台规则文件。

```yaml
# 例：.claude/agents/writer/AGENT.md
profileSlots:
  required: [principles, voice, typesetting]
  optional: [examples, constraints]
```

Orchestrator 在 `Agent` 调用 prompt 里附带阶段切片：

```
<profile_context stage="drafting">
  ... resolved slot 子集 ...
</profile_context>
```

具体切片集合由 `profile.yaml.routing.<stage>` 决定。

---

## 8 · Extractor 产物契约

两种模式（goal / sample）最终产物一致：`profiles/<new-id>/` 目录 + 可被 resolver 成功加载。

| 字段 | goal 模式 | sample 模式 |
|---|---|---|
| `provenance.extractedBy` | `goal` | `sample` |
| `provenance.goal` | 原始目标描述（object） | null |
| `provenance.samples` | 空 | `[{path, sha256}]` |

Extractor 必须进入 **Plan Mode**，让用户确认后才落盘；落盘后必须跑 `scripts/validate_profile.py` 通过。

---

## 9 · 升级规则

| 变更类型 | 动作 |
|---|---|
| slot 字段 minor 增删 | Profile.version minor bump；`extends` 兼容 |
| Profile schema breaking | `apiVersion` bump；resolver 多版本兼容一段时间 |
| Kernel 升级导致某字段语义变化 | 新增 kernel 默认；Profile 可声明 `compatibility.inkflowKernel` 做守门 |

---

## 10 · 非目标

- Profile 不承载**内容本身**（素材、atoms、正文 draft 不放这里）
- Profile 不替代 `brief`（brief 是"这一篇"的意图；Profile 是"我这个人/栏目一般怎么写"的常态）
- Profile 不做运行时代码生成；只做静态合成
