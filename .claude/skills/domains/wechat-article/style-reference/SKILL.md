---
name: style-reference
type: context
description: 风格参考注入，从 style-profile 加载规则 + 从参考文章选最相关 few-shot。
domain: wechat-article
version: 1.0.0
context_source: "styles/{style_profile}/style-profile.md"
context_selector: "按 section 主题选最相关段落"
inject_at: [draft]
---

## 加载规则

### 规则注入（每次写作必加载）
1. 读取 `styles/{style_profile}/style-profile.md` 中的全部结构化规则
2. 将规则作为 writer agent 的 Constraints 注入
3. 规则始终注入，保证跨 section 的风格一致性

### Few-shot 示例注入（每 section 选一篇）
1. 读取 `styles/{style_profile}/` 目录下所有 `exemplar-*.md` 参考文章
2. 分析当前 section 的主题关键词
3. 选择 1 篇主题最接近的参考文章
4. 提取该文章中与当前 section 主题最相关的 2-3 个段落
5. 作为 few-shot 示例注入 writer agent 的 Context

### 注入策略
- 规则始终注入（保一致性）
- 示例只选最相关一篇（省 context）
- 若无参考文章匹配当前主题，仅注入规则不注入示例
- style_profile 从 brief frontmatter 读取，默认为 "default"
