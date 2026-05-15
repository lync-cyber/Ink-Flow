---
id: evidence-data-01
type: evidence-data
weight: primary
platforms: [wechat]
source_section: 关键事实
length_chars: 72
---

内置主题（persona）11 套：default / tech-geek（极客夜行）/ tech-explainer（文档白昼）/ life-aesthetic（慢生活）/ business-finance（硬核财经）/ data-brief（数据简报）/ literary-humanism（人文札记）/ industry-observer（行业观察）/ people-story（人物特稿）/ academic-frontier（学术前沿）/ editorial-mook（编辑刊）。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json) (2026-05)

---
id: evidence-data-02
type: evidence-data
weight: primary
platforms: [wechat]
source_section: 关键事实
length_chars: 60
---

容器节点总计约 37 个：base 包 24 个 + data-brief 扩展包 13 个专属容器（含嵌套子容器 pros/cons/bar/toc-item/kpi-item）。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json) (2026-05)

---
id: evidence-data-03
type: evidence-data
weight: primary
platforms: [wechat]
source_section: 关键事实
length_chars: 54
---

公开 TypeScript API 12 个符号：`render` / `createPersona` / `validatePersona` / `listPersonas` / `getPersona` / `getPersonaSummary` / `getSchema` / `getSupportedSignatureContainers` / `getVariantIds` / `getContainerVocabulary` / `getContainerSpec` / `getVariantsForContainer`。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/src/public/index.ts) (2026-05)

---
id: evidence-data-04
type: evidence-data
weight: supporting
platforms: [wechat]
source_section: 关键事实
length_chars: 58
---

skill 包分 4 个子 skill：路由入口 / 写作改写（annotate-markdown）/ 主题设计（author-persona）/ 渲染导出（export-richtext）。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/wechat-typeset/SKILL.md) (2026-05)

---
id: evidence-data-05
type: evidence-data
weight: supporting
platforms: [wechat]
source_section: 关键事实
length_chars: 56
---

WxPatch 自动执行 8 项修复：删 `<style>/<script>/<noscript>/<link>/<meta>`，删 inline `font-family`，删所有 `id` 属性和 `position:` 样式，SVG 内 `url("x")` → `url(x)`，`#fff/#ffffff` → `#fefefe`，`display:flex` 降级 `display:block`，列表外包 `<section>`。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/_shared/references/hard-rules.md) (2026-05)

---
id: evidence-data-06
type: evidence-data
weight: supporting
platforms: [wechat]
source_section: 关键事实
length_chars: 52
---

variant 分 8 类：admonition 18 种 / quote 5 种（含 tilted-sticker）/ compare 4 种 / steps 3 种 / divider 5 种 / sectionTitle 2 种 / codeBlock 2 种 / note 3 种。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/_shared/references/hard-rules.md) (2026-05)

---
id: evidence-data-07
type: evidence-data
weight: supporting
platforms: [wechat]
source_section: AI / LLM 集成钩子汇总
length_chars: 66
---

capabilities.json schemaVersion 当前 `"2.3"`，生成于 2026-05-14；jsDelivr CDN 订阅地址 `https://cdn.jsdelivr.net/gh/lync-cyber/wechat-typeset@main/dist/api/capabilities.json`，12h 缓存，无鉴权，CORS 友好。向后兼容承诺：minor 版本只增字段，移除项先经 `deprecations[]` 登记。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json) (2026-05)

---
id: evidence-data-08
type: evidence-data
weight: optional
platforms: [wechat]
source_section: 代码片段
length_chars: 50
---

SVG 硬约束：`minFontSize: 14`（移动端光栅化最小清晰字号），`minStrokeWidth: 1`（亚像素光栅化后消失），`forbidFontFamily: true`，`forbidClass: true`，`forbidStyleTag: true`，`forbidPosition: true`，`forbidMediaQueries: true`。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json) (2026-05)
