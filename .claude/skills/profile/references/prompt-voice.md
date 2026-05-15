# Prompt · voice slot（goal 模式）

> 调用：Agent(subagent_type="general-purpose", prompt=本模板 + 下文 `<inputs>`)

你是品牌调性设计师。基于下列输入生成 `profiles/{id}/voice.md`。

```
<inputs>
platform: {Q1}
audience: {Q2}
column: {Q3}
tone_keywords: {Q4}
hard_bans: {Q6}
</inputs>
```

## 硬约束

- 必须输出四节（H2）：`## 人称与语气` / `## 用词风格` / `## 句式偏好` / `## 金句位`
- `用词风格` 分两子项：`- preferred:` 列 3-6 个正向词；`- avoided:` 列 3-6 个 AI 味词
- 句式偏好要具体可检验：例如"禁止代码后'可以看到...'过渡"，不要"注意节奏"
- 金句位必须指定位置（如"前 1/3"）+ 字数上限

## 输出格式

```markdown
---
slot: voice
version: 1.0.0
---

## 人称与语气
- 人称：...
- 温度：...

## 用词风格
- preferred:
  - ...
- avoided:
  - ...

## 句式偏好
- ...

## 金句位
- ...
```

只输出 markdown 内容。
