---
name: platform-base
description: 通用移动端内容平台排版约束基类（段落长度、图片限制、标题层级等）。
domain: core
version: 1.0.0
inject_at: [outline, draft, figures, refine, publish]
inject_mode: always
---

## 排版约束

- 段落不超过 3 行（移动端屏幕高度限制）
- 禁止首行缩进（移动端显示错位）

## 标题层级

- H2 作为主分节标题
- H3 作为子分节标题
- H4 偶尔使用
- 禁止 H1（由文章标题占用）和 H5+

## 图片

- 图片宽度限制 640px（移动端最大适配宽度）
- 每张图表附带一行说明文字
