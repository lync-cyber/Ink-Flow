---
name: visual-theming
description: >
  视觉主题 — 统一色板、组件规范、封面模板。从 columns.yaml 加载栏目色板，
  指导 outliner/illustrator/publish 阶段的视觉输出。
user-invocable: false
disable-model-invocation: true
---

## 品牌视觉系统

### 加载顺序

1. 读取 `brief.content_column` 确定当前栏目
2. 读取 `styles/default/columns.yaml` 的 `columns.{栏目}` 段
3. 从 `colors` 字段解析栏目专属色板
4. 将色板注入为本次生成的颜色变量

---

## 栏目色板解析

根据 `brief.content_column` 从 `columns.yaml` 的 `columns.{栏目}` 节读取：

| 变量 | 来源 | 说明 |
|------|------|------|
| `primary` | `columns.{id}.colors.primary` | 主色（标题装饰、strong 文字） |
| `accent` | `columns.{id}.colors.accent` | 强调色（链接、引用标记） |
| `text` | `columns.{id}.colors.text` | 正文色 |
| `textSecondary` | `columns.{id}.colors.textSecondary` | 辅助文字 |
| `textTertiary` | `columns.{id}.colors.textTertiary` | 极淡文字 |
| `background` | `columns.{id}.colors.background` | 浅底色 |
| `backgroundDeep` | `columns.{id}.colors.backgroundDeep` | 中底色 |
| `border` | `columns.{id}.colors.border` | 边框色 |
| `tagline` | `columns.{id}.tagline` | 栏目 tagline |

色板数据从 `styles/default/columns.yaml` 的 `columns.{栏目}.colors` 段动态读取，不硬编码。

---

## SVG 组件配色（figures 阶段）

| 组件 | 主色 | 次色 | 说明 |
|------|------|------|------|
| 金句卡 | accent | background | 背景用 accent，文字浅色 |
| 误区卡-错误列 | #CC3333（固定红）| — | 错误保持红色 |
| 误区卡-正解列 | primary | — | 正解用主色 |
| 对比卡 | accent / textSecondary | — | 两列各取一色 |
| 数据图 | accent（主）| textSecondary（对比）| — |
| 流程图 | accent（主路径）| textTertiary（次要节点）| — |
| 结论卡 | accent（序号）| background（背景）| — |

---

## 封面图规格

| 类型 | 尺寸 | 用途 |
|------|------|------|
| 头条封面 | 900 × 383px（2.35:1）| 头条文章封面 |
| 次条封面 | 383 × 383px（1:1）| 次条/分享缩略图 |
| 内文配图 | 宽度 ≤ 640px | 正文插图 |

封面背景色从 `columns.yaml → cover_backgrounds.{column}` 读取。

---

## 视觉组件规范

每篇文章最多使用 **2-3 种**不同类型的组件（结论卡不计入限额，每篇必备）。

### 组件类型

| 组件 | 每篇限额 | 格式 | 最适合栏目 |
|------|---------|------|-----------|
| 金句卡 | ≤ 1 | SVG | story |
| 误区卡 | ≤ 1 | 双列 SVG | tech, story |
| 对比卡 | ≤ 1 | 表格 SVG | industry, tech |
| 数据图 | ≤ 2 | Mermaid/SVG | academic, industry |
| 流程图 | ≤ 1 | Mermaid/SVG | tech, academic |
| 结论卡 | 恰好 1（必备，不计限额）| SVG | 所有栏目 |

### 组件内容要求

- **金句卡**: 一句完整判断，≤ 30 字，独立成立
- **误区卡**: 左列 ❌ 误区 2-3 条，右列 ✔ 正解 2-3 条，对应清晰
- **对比卡**: 3-5 个对比维度，有优劣判断或量化差异
- **数据图**: 数据来源标注，坐标轴清晰，有标题
- **流程图**: 节点 ≤ 8 个，箭头方向清晰，关键节点标注
- **结论卡**: 恰好 3 条，每条 ≤ 20 字

### 栏目推荐搭配

| 栏目 | 推荐组合 | 必备 |
|------|---------|------|
| academic | 数据图 + 流程图 | 结论卡 |
| industry | 对比卡 | 结论卡 |
| tech | 误区卡 + 流程图 | 结论卡 |
| story | 金句卡 + 误区卡 | 结论卡 |

---

## 注入说明

- **outline 阶段**: 注入栏目推荐组件搭配 + 限额规则 + 栏目色板摘要
- **figures 阶段**: 注入 SVG 组件配色 + 封面模板参数 + 组件生成规范
- **publish 阶段**: 注入栏目色板摘要（供格式导出时参考）

### HTML 排版

HTML 排版由 typesetter 程序化完成，不在 LLM pipeline 内执行。typesetter 从 `columns.yaml` 读取栏目色板并自动应用。
