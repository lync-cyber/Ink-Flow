/**
 * 默认模板集合（4 套主题共用的"容器语法"片段库）
 *
 * 写进 theme.templates 供 UI 模板市场调用。每个模板是一段 Markdown 字符串，
 * 用户点选后由编辑器在光标处插入。模板主题无关（用的都是容器语法），
 * 不同主题会通过 tokens/assets 呈现出不同质感。
 */

export const commonTemplates = {
  cover: `::: cover 本期封面
![封面占位图](https://placehold.co/1200x630?text=Cover)

<!-- 一句话立意：让读者 3 秒内知道这篇在讲什么 -->
:::
`,
  authorBar: `::: author 林墨 role=主笔 / 工程师
写于 2026 · 春

长期观察 AI、内容生产与个人化写作工具。
:::
`,
  footerCTA: `::: footer-cta 觉得有用？ cta=关注我
点个"在看"让更多人读到它。
:::
`,
  recommend: `::: recommend 推荐阅读
- [从零开始的 wx-md](https://example.com/a)
- [主题工程的五个误区](https://example.com/b)
- [LCH 色彩生成手册](https://example.com/c)
:::
`,
  // 注意：外层 compare 用 4 个冒号，内层 pros/cons 用 3 个；否则 markdown-it-container
  // 的同长度 fence 匹配会把内层当兄弟，导致两列退化为上下块。
  compare: `:::: compare

::: pros 方案 A
- 优势一
- 优势二
:::

::: cons 方案 B
- 代价一
- 代价二
:::

::::
`,
  steps: `::: steps 实战流程
### 第一步
一句话描述要做什么。

### 第二步
一句话描述要做什么。

### 第三步
一句话描述要做什么。
:::
`,
  tip: `::: tip 小贴士
一句提醒读者的经验法则。
:::
`,
}
