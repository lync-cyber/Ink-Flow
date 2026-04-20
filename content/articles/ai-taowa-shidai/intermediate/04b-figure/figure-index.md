# 配图索引: AI 套娃时代：我们正在用 AI 构建 AI

| ID | 文件 | 所属 Section | 类型 | 节点数 | Caption |
|----|------|-------------|------|--------|---------|
| fig-01 | fig-01.md | Section 02 ／ 套娃的三层结构 | mermaid flowchart | 8 | 图 1：AI 套娃的三层递归结构 — 体验层 / 运行时层 / 数据层 |

## 插入位置说明

- **fig-01** 置于 Section 02 金句 blockquote 之后、正文第二段之前，作为"三层定义"的视觉锚点。
  writer 在 merged-draft.md 对应位置插入：

  ```
  > 图 1：AI 套娃的三层递归结构 — 体验层 / 运行时层 / 数据层

  [插入 fig-01.md 的 mermaid 块]
  ```

## 尺寸估计

- mermaid flowchart TD，三层 subgraph，8 节点
- 渲染为 SVG 后预计高度 ~420px，宽度自适应 640px
- mmdc 渲染后经 svg-sanitize.py 清洗（去 id / style / script / a）可直接嵌入微信排版产物
