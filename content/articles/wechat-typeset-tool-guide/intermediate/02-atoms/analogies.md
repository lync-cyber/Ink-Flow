---
id: analogy-01
type: analogy
weight: supporting
platforms: []
source_section: 主题系统（Theme Persona）
length_chars: 86
---
日常概念：同一个人穿正装上班、穿运动服健身、穿汉服参加文化节——服装不同，但都是同一个人的气质延伸。
专业概念：wechat-typeset 的"主题人格"——财经稿用 `business-finance`、技术教程用 `tech-geek`、生活随笔用 `life-aesthetic`，每套主题有独立色板和排版语言，而不是换一件颜色不同的同款衬衫。

---
id: analogy-02
type: analogy
weight: supporting
platforms: []
source_section: 技术实现：渲染管线
length_chars: 70
---
日常概念：把一封手写信扫描成 PDF——扫描后格式固定，不再依赖原始纸张的排版环境。
专业概念：`juice.inlineContent()` 的 CSS 内联化——把 `<style>` 里的样式规则"烫印"进每个元素的 `style=""` 属性，让微信无论怎么剥离 class，样式都随元素走。

---
id: analogy-03
type: analogy
weight: optional
platforms: []
source_section: 平台约束的编码方式
length_chars: 74
---
日常概念：建筑施工前的"验线"——把地基边界用石灰划出来，后续施工不能越过这条线，而不是建完了再拆违章部分。
专业概念：wechat-typeset 的构造期校验（`ThemeAuthoringError`）——主题创作时就对 `font-family` / `position` / `float` 等禁用属性抛错，不等到运行时才发现粘贴后塌版。
