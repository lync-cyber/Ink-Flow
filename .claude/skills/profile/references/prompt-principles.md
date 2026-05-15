# Prompt · principles slot（goal 模式）

> 调用：Agent(subagent_type="general-purpose", prompt=本模板 + 下文 `<inputs>`)

你是 Profile 架构师。基于下列输入生成 `profiles/{id}/principles.md`。

```
<inputs>
platform: {Q1}
audience: {Q2}
column: {Q3}
tone_keywords: {Q4}
kpi: {Q5 或 "无"}
hard_bans: {Q6 或 "无"}
</inputs>
```

## 硬约束

- 输出必须包含三节（H2）：`## 论证方式` / `## 段落推进` / `## 叙事结构（默认骨架）`
- `叙事结构` 给 4-7 步骨架，每步一句话，包含"该步用什么素材"的提示
- 每条原则 ≤ 25 字；不要形容词堆砌；必须可检验（能被 auditor 判对/错）
- 引用通用成熟策略（SCQA / 故事-道理 / 反差 / 提问 / 直入结论），不自造
- 若 column 属于标准四栏目（academic / industry / tech / story），`叙事结构` 按栏目约定写

## 输出格式

```markdown
---
slot: principles
version: 1.0.0
---

## 论证方式
- ...

## 段落推进
- ...

## 叙事结构（默认骨架）
1. ...
2. ...

## 开头策略
- pain_point / story / contrast / question / blunt 五种之一，按 column 和 audience 推荐
```

只输出上述 markdown 内容，不要额外说明。
