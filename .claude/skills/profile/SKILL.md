---
name: profile
description: >
  Profile 全生命周期 — extract（从目标 / 样本 / 网络反推新 Profile）/
  use（绑定工作区）/ overlay（单篇局部覆盖）/ stack（临时组合）/ show / list / unuse。
  触发词："提取 profile / 学这几篇 / 对标"（→ extract）；
  "切换 profile / 本次用 X / overlay / stack"（→ use 系列）。
argument-hint: "[extract|use|overlay|stack|show|list|unuse] [模式或 id] [...]"
allowed-tools: Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Agent, AskUserQuestion, Bash
---

# Profile 管理

统一入口。Claude 按用户消息中的关键词路由到 § 1 extract 或 § 2 use 子系列；不明则 ask_user 选模式。

## 子命令路由表

| 命令 | 作用 | 详细 reference |
|---|---|---|
| `extract goal` | 从写作目标描述推导初始 Profile | `references/extract-goal.md` |
| `extract sample <refs...>` | 从 1-5 篇样本反推 Profile | `references/extract-sample.md` |
| `extract discover <主题>` | WebSearch 检索候选 + 用户勾选 + 反推 | `references/extract-discover.md` |
| `use <id>` | 全量绑定（写 lock + resolver） | `references/use-full.md` |
| `overlay <id>@<stage>` | 单篇某阶段局部覆盖 | `references/use-overlay.md` |
| `stack <A>+<B>+...` | 临时虚拟组合 | `references/use-stack.md` |
| `show` | 打印当前 lock | `python framework/tools/inject_profile.py show` |
| `list` | 列出所有可用 Profile pack | `glob profiles/*/profile.yaml` |
| `unuse` | 清空 activeProfile | `python framework/tools/inject_profile.py unuse` |

## § 1 · extract（提取新 Profile）

### 模式判定

若命令未显式指定模式：

```
AskUserQuestion:
  question: "你打算从哪种素材提取 profile？"
  options:
    - "goal — 只有写作目标描述（没有样本，也不需要搜）"
    - "sample — 我已经有 1-5 篇参考文章 / URL"
    - "discover — 让 Claude 帮我从网络上搜候选，再人工勾选"
```

判定后 Read 对应 `references/extract-{mode}.md` 执行。

每个 slot 的提取 prompt 在 `references/prompt-{principles|voice|typesetting|constraints}.md`（基础版）和 `references/prompt-*-mine.md`（增量版，已有 base profile 时叠加）中。

### 产物契约

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

### extract 全局约束

- **进入 Plan Mode**：先在 Plan Mode 输出四份草稿供用户评审，通过后才真正落盘
- **不自动覆盖**：如果 `profiles/{id}/` 已存在 → 中止并提示用户改 id 或显式 `--force`
- **落盘后必校验**：`python framework/tools/validate_profile.py profiles/{id}` 报错则回滚
- **落盘后建议装配**：提示用户 `/profile use {id}`
- **URL 抓取失败不阻塞**：sample / discover 模式 URL 抓取失败时优雅降级到"粘贴正文"交互
- **缓存**：`content/references/articles/` 已有相同 URL（按 frontmatter `source_url` 匹配）→ 询问是否复用
- **discover 必须用户勾选**：WebSearch 检索的候选文章不允许自动入选，必须经 AskUserQuestion 由用户显式确认才进入提取流程，保证 provenance 可审计

## § 2 · use / overlay / stack（装配 Profile）

所有装配子命令最终都走 `framework/tools/inject_profile.py` CLI：

```bash
python framework/tools/inject_profile.py set-active <id>
python framework/tools/inject_profile.py unuse
python framework/tools/inject_profile.py show
python framework/tools/inject_profile.py slot-dump --stage drafting --agent writer
python framework/tools/inject_profile.py overlay --slug <slug> --add <id> --stages drafting polishing
```

### use / overlay / stack 全局约束

- `use` 命令必须先跑 `validate_profile.py`：不通过 → 中止并打印错误
- `overlay` 只对当前写作 `{slug}` 生效；离开该文章后不影响全局 lock
- `stack` 是临时虚拟 lock，终端重启即失效
- 切换 profile 不会删除上一个绑定的 `runtime/profile-resolved/*` 内容 → resolver 会 overwrite

## 依赖

- `framework/contracts/profile-protocol.md` + `profile.schema.json` — 协议与 schema
- `framework/tools/inject_profile.py` — 装配 CLI
- `framework/tools/profile_resolver.py` — 合成产物
- `framework/tools/validate_profile.py` — 落盘后 / use 前校验
- `requests` + `beautifulsoup4`（仅 extract sample/discover 模式抓微信 URL 时；首次需 `pip install`）
