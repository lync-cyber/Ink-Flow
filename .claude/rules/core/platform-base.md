## 排版与视觉约束

数值阈值由 `.claude/rules/data/typography-limits.yaml` 定义（单一事实来源）。
本文说明"为什么"，具体阈值读 YAML。

### 段落

- 段落字符数不超过 `paragraph.max_chars`（移动端屏幕高度限制）
- 禁止首行缩进（移动端显示错位）

### 标题

- 仅允许 `headings.allowed` = [2, 3, 4]；H1 由文章标题占用

### 图片

- 宽度限制 `image.max_width`（移动端最大适配宽度）
- 每张图表附带一行说明文字

### SVG 可读性（移动端优先）

SVG 在微信里会被光栅化为 PNG，以 `max-width:100%` 缩放至 ≈375px。
640→375 缩放系数 ≈0.586，字号会等比缩小。具体下限见 `svg:` 段：

- 正文/数据标签 ≥ `svg.min_font_size`（硬下限，lint 报 error）
- 图注/脚注 ≥ `svg.caption_font_size`（warning 可人工放行）
- 主标题 ≥ `svg.title_font_size`；节标题 ≥ `svg.section_font_size`
- 禁止 `font-weight < svg.min_font_weight`（细笔画缩放后糊）
- 单张 SVG 字号种类 ≤ `svg.max_font_variants`
- 统一 `svg.font_stack`，消除不同机器光栅化的字体漂移
- 图表必须"自解释"：去掉正文也能看懂核心信息
