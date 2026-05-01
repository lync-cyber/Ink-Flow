---
name: profile-extracting
description: >
  从目标描述、样本文章或网络检索结果提取结构化 Profile 插件包（principles / voice / typesetting / constraints）。
  三种触发：
  （1）goal：输入栏目名 / 写作目标描述 → 推导四 slot 初始配置；
  （2）sample：输入 1-5 篇参考文章（本地路径 / content/references/ / 微信公众号 URL）→ 从样本反推风格；
  （3）discover：输入主题 + 风格描述 → WebSearch 检索候选 + 用户勾选 → 从入选样本反推风格。
  触发词："提取 profile"、"生成 profile"、"学这几篇"、"从零起一套风格"、"分析风格"、"提取风格 DNA"、"对标"、"搜几篇范文"、"找参考文章"。
argument-hint: "[goal | sample | discover] [--id=<new-profile-id>] [主题或资料路径...]"
allowed-tools: Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Agent, AskUserQuestion, Bash
---

# Profile Extractor

统一入口，三种模式。按模式 Read 对应 reference 执行；本主文件不展开流程细节。

| 模式 | 输入 | 输出 | 详细流程 |
|---|---|---|---|
| goal     | 栏目名 / 写作目标描述 | `profiles/{id}/` 四 slot 初始配置 | [`references/mode-goal.md`](references/mode-goal.md) |
| sample   | 1-5 篇参考文章 | `profiles/{id}/` 从样本反推的四 slot | [`references/mode-sample.md`](references/mode-sample.md) |
| discover | 主题 + 风格描述 | `profiles/{id}/` 从网络检索 + 用户勾选样本反推的四 slot | [`references/mode-discover.md`](references/mode-discover.md) |

## 模式判定

若命令未显式指定模式：

```
AskUserQuestion:
  question: "你打算从哪种素材提取 profile？"
  options:
    - "goal — 只有写作目标描述（没有样本，也不需要搜）"
    - "sample — 我已经有 1-5 篇参考文章 / URL"
    - "discover — 让 Claude 帮我从网络上搜候选，再人工勾选"
```

判定后 Read 对应 `references/mode-*.md` 执行。

## 产物契约

三种模式最终都产出同一目录结构（详见 `framework/contracts/profile-protocol.md § 2.1`）：

```
profiles/<new-id>/
  profile.yaml        # apiVersion / id / version / extends / slots / routing / provenance
  principles.md       # 论证方式 / 叙事骨架 / 段落推进 / 开头策略
  voice.md            # 人称 / 用词 / 句式 / 金句位
  typesetting.yaml    # 段落 / 句子 / 标题 / 容器 / CSS
  constraints.yaml    # 禁用词 / 字数 / 栏目×平台矩阵
```

`provenance` 字段必填：
- goal 模式：`extractedBy: goal`，`goal: {原始目标描述对象}`
- sample 模式：`extractedBy: sample`，`samples: [{path, sha256}]`
- discover 模式：`extractedBy: discover`，`discoveryPlan: {queries, candidatesFound, candidatesSelected}`，`samples: [{path, sha256, source_url}]`

## 全局约束

- **进入 Plan Mode**：先在 Plan Mode 输出四份草稿供用户评审，通过后才真正落盘
- **不自动覆盖**：如果 `profiles/{id}/` 已存在 → 中止并提示用户改 id 或显式 `--force`
- **落盘后必校验**：`python framework/tools/validate_profile.py profiles/{id}` 报错则回滚
- **落盘后建议装配**：提示用户 `/profile use {id}` 或 `python framework/tools/inject_profile.py set-active {id}`
- **URL 抓取失败不阻塞**：sample / discover 模式 URL 抓取失败时优雅降级到"粘贴正文"交互
- **缓存**：`content/references/articles/` 已有相同 URL（按 frontmatter `source_url` 匹配）→ 询问是否复用
- **discover 必须用户勾选**：WebSearch 检索的候选文章不允许自动入选，必须经 AskUserQuestion 由用户显式确认才进入提取流程，保证 provenance 可审计

## 依赖

- `framework/contracts/profile-protocol.md` + `profile.schema.json` — 协议与 schema
- `framework/tools/validate_profile.py` — 落盘后校验
- `framework/tools/profile_resolver.py` — 校验后可选预解析（dry-run）
- `.claude/skills/profile-extracting/scripts/wechat.py` — 微信 URL 抓取（sample / discover 模式抓正文用）
- `requests`、`beautifulsoup4`（wechat 抓取，首次使用需 `pip install requests beautifulsoup4`）
