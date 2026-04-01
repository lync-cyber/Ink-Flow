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

所有 SVG 使用栏目色板，不得自行选色：

| 组件 | 主色 | 次色 | 说明 |
|------|------|------|------|
| 对比表/卡 | accent / textSecondary | — | 两列各取一色 |
| 数据图 | accent（主）| textSecondary（对比）| — |
| 流程图/架构图 | accent（主路径）| textTertiary（次要节点）| — |

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

### 核心原则：内容驱动，非模板驱动

视觉组件的使用取决于**文章内容是否需要**，而非栏目模板强制要求。没有任何组件是"必备"的——如果文章内容不需要对比、不需要流程图、不需要总结卡片，就不要生硬插入。

### 约束

- 每篇文章最多 **2-3 个**视觉组件（SVG/Mermaid），避免卡片堆砌
- 每个组件必须传递正文无法替代的信息增量（纯装饰性组件禁止）
- 相同类型组件不重复使用（如不出现两个对比表）

### 可用组件工具箱

以下为 outliner 和 illustrator 的可选工具，**按需选取**：

| 组件 | 格式 | 适用场景 | 不适用场景 |
|------|------|---------|-----------|
| 对比表 | Markdown 表格 / SVG | 有 2+ 方案需并排比较时 | 只有一个方案，或差异可用一句话说清 |
| 流程图 | Mermaid / SVG | 多步骤有分支/判断的流程 | 线性步骤用 :::steps 即可 |
| 数据图 | SVG | 有 3+ 数据点需要趋势/对比可视化 | 只有 1-2 个数字，正文内嵌即可 |
| 架构图 | Mermaid / SVG | 多模块交互关系 | 组件少于 3 个 |

### :::block 原生组件（writer 使用，无需 SVG）

| 组件 | 适用场景 | 不适用场景 |
|------|---------|-----------|
| :::card | key-value 环境信息、文末总结要点 | 内容超过 5 行（考虑用表格） |
| :::note | 重要提示、常见误区澄清 | 超过 3 行（太长则融入正文） |
| :::steps | 线性操作步骤 | 有分支判断（用流程图） |
| :::timeline | 事件时间线 | 只有 2 个时间点（用正文） |
| Markdown 表格 | 简单对比（≤5 行） | 需要视觉强调的核心对比（用 SVG） |

### 文末总结

文末总结**不是必须的**。当文章结尾自然收束、核心观点已清晰时，不需要额外的总结卡片。如果 outliner 判断需要总结要点，可选择：
- **:::card** — 3 条以内的简短要点（writer 生成）
- **正文段落** — 一段话收束全文
- **:::cta** — 直接以行动引导结尾

---

## 注入说明

- **outline 阶段**: 注入可用组件工具箱 + 限额规则 + 栏目色板摘要 + 断点归属判断原则
- **figures 阶段**: 注入 SVG 组件配色 + 封面模板参数
- **draft 阶段**: writer 按大纲断点使用 :::block 原生组件
- **publish 阶段**: 注入栏目色板摘要（供格式导出时参考）

### HTML 排版

HTML 排版由 typesetter 程序化完成，不在 LLM pipeline 内执行。typesetter 从 `columns.yaml` 读取栏目色板并自动应用。
