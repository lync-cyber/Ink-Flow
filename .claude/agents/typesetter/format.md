# typesetter / format 模块

> plan.md + meta.json 的字段契约；ANNOTATE 完成后 Read 本文件填模板。

## 09-typeset-plan.md

```markdown
---
slug: {slug}
adapter: wechat-typeset
adapter_version: {tool_version}      # 必须是 SemVer；unknown 禁用
contract_version: "2.0"
persona: {persona_id}                 # 必须在 capabilities.personas
signature:                            # 可为空对象
  container: tip
  variant: terminal
variant_overrides:                    # 0..N 个
  - container: quote-card
    variant: classic
  - container: compare
    variant: ledger
generated_at: {ISO date}
---

# {文章标题} · 排版方案

## Persona 选型

| 来源 | persona id | 理由（对方 reasons 或自由匹配说明） | 历史：同栏目此前用过几次 |
|---|---|---|---|
| 栏目推荐（columns.yaml primary）| tech-explainer | 教程向首选 | 2 |
| 栏目推荐（alternate） | tech-geek | 底层随笔向 | 0 |
| 自由匹配补充（若栏目无推荐） | default | — | — |

**最终**：选 {id}，理由一句 context-specific 的话。若选项与栏目 primary 不一致，
必须说明"为什么这一篇反转"。

## 签名元素（唯一）

- 容器: {id}，变体: {id}，落在正文第几段 / 哪一句
- 撞车检查：同栏目历史文章是否用过同一组合

## 改写点索引

| # | publish 行号 | 原骨架 | annotated 改写 |
|---|------------|-------|---------------|
| 1 | 12–18       | `> "一句金句"` | 包 `::: quote-card` … `:::` |
| 2 | 50–51       | `> [!TIP]` | 改 `::: tip variant=terminal` … `:::` |
| ... |

## 自检

- [x] conform ok=true
- [x] validate ok=true（issues: []）
- [x] 全文字数与 publish 相等（除容器行）
- [x] 所有图片 src 为 http(s) 或 data:
```

## meta.json（严格字段）

```json
{
  "adapter": "wechat-typeset",
  "adapter_version": "0.1.0",
  "contract_version": "2.0",
  "persona": "tech-explainer",
  "signature": { "container": "tip", "variant": "terminal" },
  "variant_overrides": [
    { "container": "quote-card", "variant": "classic" }
  ],
  "conform": { "ok": true, "violations": [] },
  "validate": { "ok": true, "wordCount": 1234, "readingTime": 5, "issues": [] },
  "generated_at": "2026-04-21T00:00:00Z"
}
```

`adapter_version` 不允许字面值 `unknown`；为空或非 SemVer 则本 agent 应报 CP3 failed。
