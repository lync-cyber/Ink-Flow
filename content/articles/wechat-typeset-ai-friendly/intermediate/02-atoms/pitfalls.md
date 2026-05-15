---
id: pitfall-01
type: pitfall
weight: primary
platforms: [wechat]
source_section: 关键事实
length_chars: 112
---

**现象**：LLM 幻觉出不存在的 variant，如 `variant=glow`、`variant=modern`、`variant=flat`。

**原因**：LLM 依赖训练记忆推断 variant 名，而实际白名单只有 8 类共约 40 个合法 id。

**最小修复**：在 system prompt 中注入 `getVariantIds()` 的返回值作为白名单，并明确声明"variant 只取此列表，不自行推断"。

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/_shared/references/hard-rules.md) (2026-05)

---
id: pitfall-02
type: pitfall
weight: primary
platforms: [wechat]
source_section: 关键事实
length_chars: 100
---

**现象**：手写 `<style>` 标签、`class="..."` 属性、`font-family` 声明，在微信编辑器内全部消失。

**原因**：微信编辑器会剥离 `<style>`/`<script>` 及 class 属性；WxPatch 也会在渲染管线内删除 font-family（防止客户端字体覆盖导致错位）。

**最小修复**：所有样式必须通过 juice 内联由主题 CSS 注入；不要在 markdown 正文中写任何裸 HTML 样式声明。

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/_shared/references/hard-rules.md) (2026-05)

---
id: pitfall-03
type: pitfall
weight: primary
platforms: [wechat]
source_section: 代码片段
length_chars: 96
---

**现象**：`compare` 容器渲染失败，`pros`/`cons` 内容溢出或结构塌陷。

**原因**：`compare` 外层必须用四冒号 `::::` 包裹，内层 `pros`/`cons` 用三冒号 `:::`；fence 层级写错（如外层也用三冒号）导致解析器无法识别嵌套关系。

**最小修复**：
```markdown
:::: compare
::: pros 优点
...
:::
::: cons 缺点
...
:::
::::
```
外四内三，缺一不可。

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/docs/contract/base.md) (2026-05)

---
id: pitfall-04
type: pitfall
weight: supporting
platforms: [wechat]
source_section: 关键事实
length_chars: 88
---

**现象**：SVG 内使用 `fill="#ffffff"` 或 `fill="#fff"`，在微信客户端渲染后背景透明或消失。

**原因**：微信 SVG 光栅化器把纯白（`#fff`/`#ffffff`）当透明处理。

**最小修复**：WxPatch 会自动将 `#fff`/`#ffffff` 替换为 `#fefefe`；不需要手动处理，但要避免在自定义主题里硬编码 `#ffffff` 关键背景色，否则 WxPatch 可能误替换。

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/_shared/references/hard-rules.md) (2026-05)

---
id: pitfall-05
type: pitfall
weight: optional
platforms: [wechat]
source_section: 关键事实
length_chars: 82
---

**现象**：`display:flex` + `gap` 布局在 Android 微信客户端渲染异常，子元素不换行或间距丢失。

**原因**：部分 Android 客户端 WebView 不支持 `gap` 属性。

**最小修复**：WxPatch 自动将 `display:flex` 降级为 `display:block`；若主题设计者确认某容器必须保留 flex，需在该元素上加 `data-wx-keep-flex` 标记（WxPatch 检测到此标记后跳过降级）。

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/_shared/references/hard-rules.md) (2026-05)
