> 继承 `platform-base` 通用移动端约束，以下为微信公众号特有补充。

## 排版约束（微信特有）

- 仅使用 inline style（公众号不支持 `<style>` 块和 class）
- 正文字号: 15px，行高: 1.75-2.0，字间距: 1px
- 段落间距: 15-20px margin

## SVG 约束（微信特有）

- 禁止 id 属性（公众号编辑器会冲突）
- 禁止 `<style>`、`<script>`、`<a>` 标签
- background url() 值不加引号

## CSS 安全（微信特有）

完整的 CSS 禁用/可用属性列表定义在 `tools/markdown-lint/lint-config.yaml` 的 `css_safety` 段（单一事实来源）。

概要：
- 可用: font-size, color, font-weight, letter-spacing, margin, padding, line-height, text-align, border-radius, box-shadow, opacity, border
- 慎用（iOS/Android 不一致）: transform, linear-gradient
- 禁用: 见 lint-config.yaml（position, @media, @keyframes, :hover, :active, float 等）
