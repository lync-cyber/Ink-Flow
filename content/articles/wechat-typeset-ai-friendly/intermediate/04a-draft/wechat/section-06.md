## 三个常见的坑

我自己踩过的坑里，下面这三个出镜率最高。

::: warning variant=accent-bar
**坑 1**：LLM 自信地写出 `variant=glow` / `modern` / `flat`，结果一个都不存在。白名单只有 8 类共约 40 个 id，必须 prompt 注入。

**坑 2**：手写 `<style>` 或 `class="..."` 或 `font-family`，进微信全部消失。所有样式只能走 juice 内联。

**坑 3**：`compare` 容器写错 fence 层级，外层用了三冒号。直接渲染失败，无救。外四内三，缺一不可。
:::

WxPatch 在渲染管线最后跑一遍，能自动救场 8 项机械错误：

- 删 `<style>` / `<script>` / `<noscript>` / `<link>` / `<meta>`
- 删 inline `font-family`
- 删所有 `id` 属性
- 删 `position:` 类样式
- SVG 内 `url("x")` 去引号
- `#fff` / `#ffffff` 替换为 `#fefefe`（微信光栅化把纯白当透明）
- `display:flex` 降级 `display:block`（Android 客户端兼容）
- 列表外包 `<section>`

但救得了的都是机械错误。语义错误救不了：容器嵌套层级写反、variant 名拼错、`pros` 写在 `compare` 外面。这些只能在 prompt 那一层把白名单注进去，事前拦住。

自动修复是底网，不是降落伞。
