---
name: wechat-format
type: transform
description: 微信公众号排版规则，包含 CSS 安全属性白名单、SVG 约束和移动端适配。
domain: wechat-article
version: 1.0.0
input: "{refined_article}"
output: "{formatted_output}"
transform_order: 1
---

## 排版规则

### 基础排版
- 仅使用 inline style（公众号不支持 `<style>` 块和 class）
- 正文字号: 15px
- 行高: 1.75-2.0
- 字间距: 1px
- 段落间距: 15-20px margin
- 禁止首行缩进（移动端显示错位）
- 颜色方案: 从 brief 或项目配置读取品牌色（默认 2-3 色）

### 标题层级
- H2 用作主分节标题
- H3 用作子分节标题
- H4 偶尔使用
- 禁止 H1（由文章标题占用）
- 禁止 H5+（无样式意义）

### 代码与图片
- 代码块必须指定语言高亮
- 图片宽度限制 640px
- 图片必须上传至微信素材库（外链会失效）

## CSS 安全属性白名单

### 可用属性
font-size, color, font-weight, letter-spacing, margin, padding,
line-height, text-align, border-radius, box-shadow, opacity, border

### 慎用属性（iOS/Android 渲染可能不一致）
transform, linear-gradient

### 禁用属性（会逃逸容器或不支持）
position, @media, @keyframes, :hover, :active, float

## SVG 约束

- 禁止 id 属性（公众号编辑器会冲突）
- 禁止 `<style>` 标签
- 禁止 `<script>` 标签
- 禁止 `<a>` 标签
- background url() 值不加引号
- 宽度不超过 640px

## 导出格式

### Markdown Nice 适配（默认）
- 输出标准 Markdown，适配 Markdown Nice 排版工具
- 图片路径转换为相对路径或 base64 内联

### HTML 导出（可选）
- 所有样式内联到 HTML 元素
- 不使用外部 CSS 文件
- 不使用 class 属性
