# Profile Schema 参考

`profile.yaml` 是 Profile 包的 manifest 文件，描述继承关系、适用域和 slot 路由。本文档列出所有字段及其含义。

完整协议规范见 [framework/contracts/profile-protocol.md](../../framework/contracts/profile-protocol.md)。

## 目录

- [profile.yaml 顶层字段](#profileyaml-顶层字段)
- [slot 文件格式](#slot-文件格式)
- [合并策略速查](#合并策略速查)
- [字段归属分层约定](#字段归属分层约定)

---

## profile.yaml 顶层字段

```yaml
apiVersion: inkflow.profile/v1    # 必填，协议版本
id: my-brand                      # 必填，kebab-case，全局唯一
version: 1.0.0                    # 必填，semver
title: 我的品牌 Profile           # 人类可读标题
author: handle-or-email           # 作者
description: |
  自然语言描述。
```

### extends（继承链）

```yaml
extends:
  - base-generic-chinese@^1.0.0   # 通用中文基座（建议所有 Profile 都继承）
  - platform-wechat@~0.2.0        # 微信平台契约
```

- 按顺序合并，后者覆盖前者
- 支持 semver 范围（`^` / `~` / `>=`）
- 循环依赖时 resolver 报错中止

### appliesTo（适用域，信息性字段）

```yaml
appliesTo:
  platforms: [wechat, juejin]     # 空 = 任意平台
  columns: [tech, academic]       # 空 = 任意栏目
  contentTypes: [deep_dive]       # 空 = 任意类型
```

orchestrator 用此字段做校验和提示，不强制拦截。

### slots（插件绑定）

```yaml
slots:
  principles:
    file: principles.md
    kind: markdown
  voice:
    file: voice.md
    kind: markdown
  typesetting:
    file: typesetting.yaml
    kind: yaml
  constraints:
    file: constraints.yaml
    kind: yaml
```

未声明的 slot 从 extends 链中继承；继承链上也无此 slot 则写入空骨架占位文件。

### routing（阶段 → slot 路由）

```yaml
routing:
  planning:  [principles, constraints]       # outliner / researcher 阶段
  drafting:  [voice, principles, examples]   # writer / illustrator 阶段
  polishing: [typesetting, constraints, voice]
  auditing:  [principles, voice, typesetting, constraints]
```

决定"哪个阶段向 subagent 注入哪些 slot"。

### compatibility（兼容性声明）

```yaml
compatibility:
  inkflowKernel: ">=2.0.0,<3.0.0"
  typeset:
    wechat-typeset: ">=0.2.0,<0.3.0"
```

---

## slot 文件格式

### principles.md

```markdown
---
slot: principles
version: 1.0.0
---

## 论证方式
- 条目（≤25 字，可检验）

## 叙事结构
1. 步骤 1
2. 步骤 2

## 段落推进
- 条目
```

**合并策略**：同名 `##` 小节按列表条目 union + dedup；非列表正文后者覆盖。

### voice.md

```markdown
---
slot: voice
version: 1.0.0
---

## 人称与语气
## 用词风格
## 句式偏好
## 金句位
```

合并策略同 principles.md。

### typesetting.yaml（主要字段）

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `heading.allowed` | list | 允许的标题层级 | `[2,3,4]` |
| `heading.h1Uniqueness` | bool | H1 全篇唯一 | `true` |
| `heading.numberedH2.enabled` | bool | H2 添加编号前缀 | `false` |
| `paragraph.maxChars` | int | 段落最大字数 | `300` |
| `sentence.maxChars` | int | 句子最大字数 | `40` |
| `emphasis.perParagraphMax` | int | 每段最多强调次数 | `2` |
| `containers.whitelist` | list | 允许的 `:::` 容器 id | `[]`（禁用） |
| `inlineExtensions.allowed` | list | 允许的行内扩展 | `[]` |
| `emoji.policy` | enum | `forbidden\|sparing\|free` | `sparing` |

**列表合并**：默认 union + dedup；用 `$replace: true` 强制覆盖：

```yaml
containers:
  whitelist:
    $replace: true
    value: [intro, tip, quote-card]
```

### constraints.yaml（主要字段）

| 字段 | 说明 |
|------|------|
| `forbidden.phrases` | 硬禁词列表（lint error） |
| `forbidden.patterns` | 正则 + 位置限定 |
| `required.perArticle` | 全文必须满足的规则 |
| `required.perSection` | 每节必须满足的规则 |
| `length.target` | 目标字数 |
| `length.min / max` | 字数区间 |
| `length.hardFactor` | 超出 max * hardFactor 时 lint error |
| `columns.*` | 栏目定义（name / personality / kpiTargets 等） |
| `columnPlatforms.*.*` | 栏目 × 平台矩阵（骨架 / tone / lengthLimit） |

---

## 合并策略速查

| slot 类型 | 同层冲突 | 跨层（extends）冲突 |
|----------|---------|-------------------|
| markdown | 同名小节列表 union-dedup | 后者（extends 靠后）胜 |
| yaml | 深度合并，list union-dedup | 后者胜；`$replace: true` 强制覆盖 |

---

## 字段归属分层约定

| 字段 | 主要归属层 |
|------|-----------|
| `typesetting.*`（容器 / CSS / SVG / 行内扩展） | platform 层 |
| `constraints.length.*`（字数区间） | 品牌层 |
| `constraints.forbidden.*`（禁用词） | base + 品牌层 |
| `constraints.columns.*`（栏目骨架） | 品牌层 |
| `voice.*` / `principles.*` | base + 品牌层 |

三层职责不重叠，避免同字段在多层重复声明。
