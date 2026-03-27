---
name: opening-hooks
type: context
description: 公众号文章开头策略库，按 brief.opening_style 选择注入，优化"黄金 3 秒"开头。
domain: wechat-article
version: 1.0.0
context_source: "briefs/{topic}.md"
context_selector: "按 brief.opening_style 选择对应策略段注入"
---

## 开头策略

### pain_point（痛点切入）
- **框架**: SCQA — 场景(Situation) → 冲突(Complication) → 问题(Question) → 答案预告(Answer)
- **模式**: "你是不是也遇到过 {痛点}？上周我 {具体场景}，结果 {后果}。"
- **要点**: 用第二人称"你"建立共鸣，用具体场景代替抽象描述
- **适用**: 技术教程、问题解决类文章

### story（故事切入）
- **框架**: 先事件，后道理，3 句话进入主题
- **模式**: "{时间}，我在 {场景} 做 {事}，{转折}。"
- **要点**: 不要超过 3 句话铺垫，快速进入转折点
- **适用**: 经验分享、踩坑总结类文章

### contrast（对比切入）
- **框架**: 数据/认知反差制造张力
- **模式**: "大多数人以为 {常识}，但实际上 {反常识}。"
- **要点**: 反差要足够大但不夸张失真，最好有数据支撑
- **适用**: 深度分析、观点类文章

### question（提问切入）
- **框架**: 直接抛出读者关心的问题
- **模式**: "{核心问题}？这个问题我研究了 {时间}，答案比你想的 {方向}。"
- **要点**: 问题要具体（"如何做 X"优于"X 是什么"），预告答案制造好奇
- **适用**: 技术选型、方案对比类文章

### blunt（直给切入）
- **框架**: 不铺垫，直接给结论
- **模式**: "结论先说: {核心观点}。以下是 {N} 个理由。"
- **要点**: 适合对读者来说结论本身就有冲击力的话题
- **适用**: 快评、观点输出类文章

## 选择逻辑

1. 读取 `briefs/{topic}.md` 的 `opening_style` 字段
2. 若为 "auto" 或空:
   - content_type == "opinion" → blunt
   - content_type == "tutorial" → pain_point
   - content_type == "deep_dive" → contrast
   - content_type == "quick_take" → question
3. 将选定策略注入 writer agent 的第一个 section 上下文
