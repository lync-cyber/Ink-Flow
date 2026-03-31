---
name: metrics-tracking
description: >
  数据追踪 — 录入文章发布后的运营数据，与历史数据做基础对比。
  触发条件："运营数据"、"录入数据"、"/metrics"、"阅读量多少"。
---

# 运营数据追踪

录入文章发布后的运营数据，与栏目 KPI 基准做基础对比。

## 数据采集

用 AskUserQuestion 确认目标文章后采集数据（支持留空）：

```
AskUserQuestion (multiSelect questions):
  Q1: "阅读完成率？" → 自由输入
  Q2: "分享率？" → 自由输入
  Q3: "评论数？" → 自由输入
  Q4: "新增关注数？" → 自由输入
```

## 记录与分析

- 追加到 `retro/ops-metrics.csv`（不存在则创建含表头）
- CSV 字段: slug, column, content_type, opening_style, publish_time, completion_rate, bookmark_rate, share_rate, open_rate, comments
- 从 `articles/{slug}/brief.md` 补充元数据（content_type、opening_style 等）
- 从 `styles/default/columns.yaml` 读取栏目 kpi_targets 做基础对标

## 基础对标

录入后立即输出单篇对标结果：

| 指标 | 实际值 | 目标值 | 状态 |
|------|--------|--------|------|
| ... | ... | ... | 达标/接近/未达标 |

## 交叉分析引导

录入完成后检查 `retro/ops-metrics.csv` 的数据行数：
- >= 3 篇数据 → 提示：

```
AskUserQuestion:
  question: "已累积 {N} 篇运营数据，是否运行跨文章交叉分析？"
  options:
    - "运行效果分析" — 引导触发 performance-benchmarking skill
    - "稍后再分析" — 结束当前流程
```

- < 3 篇 → 提示还需 {3-N} 篇数据才能做有效交叉分析
