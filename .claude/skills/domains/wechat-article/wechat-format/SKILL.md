---
name: wechat-format
type: transform
description: 微信公众号导出格式转换，适配 Markdown Nice 和公众号编辑器。
domain: wechat-article
version: 1.0.0
inject_at: [publish]
input: "{refined_article}"
output: "{formatted_output}"
transform_order: 1
---

> 排版约束、CSS 安全、SVG 约束和标题层级见 platform-base 和 wechat-platform rules。以下为导出格式转换专用规则。

## 代码与图片

- 代码块必须指定语言高亮
- 图片必须上传至微信素材库（外链会失效）
- 颜色方案: 从 brief 或项目配置读取品牌色（默认 2-3 色）

## 导出格式

### Markdown Nice 适配（默认）
- 输出标准 Markdown，适配 Markdown Nice 排版工具
- 图片路径转换为相对路径或 base64 内联

### HTML 导出（可选）
- 所有样式内联到 HTML 元素
- 不使用外部 CSS 文件
- 不使用 class 属性
