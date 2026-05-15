---
name: metrics-tracking
description: >
  运营数据录入 — 把文章发布后的阅读 / 分享 / 评论数据写入 lifecycle.metrics（D+0 / D+1 / D+7 节点）。
  **仅录入**，分析归 performance-benchmarking。触发词："录入数据"、"运营数据"、"阅读量多少"。
argument-hint: "[文章 slug]"
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
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

- 追加到 `content/retrospectives/ops-metrics.csv`（不存在则创建含表头）
- CSV 字段: slug, column, content_type, opening_style, publish_time, completion_rate, bookmark_rate, share_rate, open_rate, comments
- 从 `content/articles/{slug}/intermediate/01-brief.md` 补充元数据
- 从 `runtime/profile-resolved/constraints.yaml` 的 `columns.{col}.kpiTargets` 读取栏目 KPI 做基础对标

## Lifecycle 写回

按入口选择 `dN`（用户首次录入 → d0；D+1 录入 → d1；D+7 录入 → d7），写回 `runtime/pipeline-states/{slug}.json` 的 `lifecycle.metrics.dN`：

```json
{ "recorded_at": "2026-04-23T22:00:00Z", "data": { ...本次录入的全部字段 } }
```

契约见 `.claude/agents/orchestrator/lifecycle.md`。

## 基础对标

录入后立即输出单篇对标结果：

| 指标 | 实际值 | 目标值 | 状态 |
|------|--------|--------|------|
| ... | ... | ... | 达标/接近/未达标 |

## 交叉分析引导

录入完成后检查 `content/retrospectives/ops-metrics.csv` 的数据行数：
- >= 3 篇数据 → 提示：

```
AskUserQuestion:
  question: "已累积 {N} 篇运营数据，是否运行跨文章交叉分析？"
  options:
    - "运行效果分析" — 引导触发 performance-benchmarking skill
    - "稍后再分析" — 结束当前流程
```

- < 3 篇 → 提示还需 {3-N} 篇数据才能做有效交叉分析
