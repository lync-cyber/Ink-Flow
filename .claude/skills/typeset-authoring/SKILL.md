---
name: typeset-authoring
description: >
  wechat-typeset 排版方案设计的**手动入口**（pipeline 自动跑时由 orchestrator 分派
  typesetter agent）。触发词："给这篇排版"、"排版方案"、"挑 persona"、"选签名容器"、
  "typeset {slug}"、"换个排版风格"。
  本 skill 是 thin shell——采集参数 + 调 typesetter agent。容器 / persona / 变体
  的权威知识在 sibling repo wechat-typeset 的 SKILL 里，本 skill 不做离线副本。
argument-hint: "[文章 slug]"
allowed-tools: Read, Write, Glob, Grep, AskUserQuestion, Bash, Task
---

# Typeset Authoring（thin shell）

## 边界

本 skill 做两件事、只做两件事：

1. **参数采集**：确认用户给了 slug（或让用户选），read brief + outline 猜初始 persona。
2. **调度 typesetter agent**：把参数一次性交给 `Task(subagent_type=typesetter)`，
   由 agent 走完 ① health → ⑦ validate 全流程。

所有容器名 / persona id / 变体 id / 硬约束 → 由 typesetter agent 从 adapter 读出，
**不在本 skill 里写死**。如果用户问"有哪些 persona"、"这个容器能用哪些 variant"，
答案一律：

```bash
python framework/tools/_adapters/cli.py capabilities --cache
python framework/tools/_adapters/cli.py docs   # 再 Read 返回的 SKILL 路径
```

## 流程

### 1. 入口判定

- 必须：slug（对应 `content/articles/{slug}/`）。用户没给 → AskUserQuestion 让其选
  已有 article。
- 存在性检查：`content/articles/{slug}/export/08-wechat-publish.md` 必须存在；
  否则提示用户先跑完 publish 阶段。

### 2. 前置自检

在分派 agent 前跑一次：

```bash
python framework/tools/_adapters/cli.py health
```

- ok=false → 展示 reason，提示用户 `cd ../wechat-typeset && npm ci && npm run build`，
  流程中止，不调 agent。
- ok=true → 进入第 3 步。

### 3. 分派 typesetter agent

```
Task(
  subagent_type="typesetter",
  description="给 {slug} 做 wechat-typeset 排版",
  prompt="""
    slug: {slug}
    入口: typeset-authoring skill（手动触发）
    走完 ①health → ②capabilities → ③docs → ④PLAN（强制 AskUserQuestion）→
    ⑤ANNOTATE → ⑥conform → ⑦validate 全流程。
    产物落到 .claude/agents/typesetter.md 约定的三个文件，不写 render.html。
  """
)
```

agent 结束后 Read meta.json，给用户一份简短摘要（persona / 签名 / validate 结果）
和下一步操作指引：

```
排版方案已落盘：
  - intermediate/09-typeset-plan.md
  - export/08-typeset/wechat/annotated.md
  - export/08-typeset/wechat/meta.json

下一步：
  cd ../wechat-typeset && ./launcher.bat   # Windows，或 ./launcher.command (mac)
  浏览器打开 http://127.0.0.1:7788
  粘贴 annotated.md → 左侧选 persona={persona} → 点"一键复制" → 贴到公众号后台
```

### 4. 用户要重排

用户说"换 persona"、"换 variant"时：

- 直接再调 typesetter agent，传入"重排"语境；agent 自己会读现有 plan、问用户想改哪里、
  重跑一遍 ④–⑦ 步。
- **不要**在本 skill 里直接改 annotated.md——那是 agent 的产物合约。

## 不做的事

- **不维护容器/persona/variant 字典副本**（删了 references/）
- **不直接写 annotated.md**——永远走 typesetter agent
- **不绕过 health 检查**——sibling repo 没 build 就不往下走

## 相关资源

| 何时查 | 文件 |
|---|---|
| 本 skill 产物路径与自检清单 | `.claude/agents/typesetter.md`（agent 定义） |
| 容器语法 / persona 清单 / 硬约束 | `python framework/tools/_adapters/cli.py docs` 返回的 sibling 路径 |
| v2 契约 | `framework/contracts/wechat-typeset-v2.schema.json` |
| 微信平台硬阈值 | `.claude/rules/data/platform-limits.yaml` |
