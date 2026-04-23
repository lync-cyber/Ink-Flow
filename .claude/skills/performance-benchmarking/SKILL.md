---
name: performance-benchmarking
description: >
  效果分析 — 对照各栏目 KPI 基准，做多维度交叉分析并提炼可操作建议。
  触发条件："数据分析"、"KPI"、"表现怎么样"、"哪篇效果好"。
  当用户想了解文章表现、对比不同文章效果、优化运营策略时，应触发此 skill。
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# 运营效果分析

对历史运营数据做交叉分析，找出规律并更新运营记忆。

## 前置条件

需要 `content/retrospectives/ops-metrics.csv` 存在且包含 3+ 篇数据。若不满足：
- 文件不存在 → 提示用户先通过 metrics-tracking 录入数据
- 数据不足 3 篇 → 提示还需 {3-N} 篇才能做有效分析

## 数据读取

1. `content/retrospectives/ops-metrics.csv` — 逐行读取运营指标（slug, column, content_type, opening_style, publish_time, completion_rate, bookmark_rate, share_rate, open_rate, comments 等）
2. `framework/config/columns.yaml` — 各栏目的 kpi_targets 作为基准线
3. `content/articles/*/intermediate/01-brief.md` — 补充元数据（如 cta_type、target_length）

## 分析维度

### 1. 栏目达标率

逐栏目、逐指标对标 kpi_targets：

| 状态 | 条件 |
|------|------|
| 达标 | 实际值 >= 目标值 |
| 接近 | 实际值 >= 目标值 * 0.8 |
| 未达标 | 实际值 < 目标值 * 0.8 |

输出每个栏目的达标看板。

### 2. 交叉分析（当数据量 >= 5 篇时）

| 维度 | 分析内容 |
|------|---------|
| 栏目 x 开头策略 | 哪种 opening_style 在哪个栏目表现最好 |
| 栏目 x 发布时间 | 实际 best_time 与推荐 best_time 的偏差对指标的影响 |
| 栏目 x 内容类型 | deep_dive vs quick_take vs tutorial 的表现差异 |
| CTA 类型 x 互动率 | 不同 cta_type 对分享/评论的影响 |

### 3. Top/Bottom 对比

列出表现最好和最差的文章各 2 篇，分析差异因素。

### 4. 可操作建议

基于分析提炼 3-5 条建议，格式：
- **发现**: {具体数据支撑的发现}
- **建议**: {可执行的改进动作}
- **预期效果**: {改进后的目标值}

## 记忆更新

连续 3+ 篇验证的规律通过 Claude Code 原生 memory 系统持久化：

| 规律类型 | 记忆分类 |
|---------|---------|
| 时间偏好 | project memory |
| 标题模式 | project memory |
| 开头效果 | project memory |
| 系列规律 | project memory |

写入前用 AskUserQuestion 确认：

```
AskUserQuestion:
  question: "以下规律已跨 3+ 篇验证，是否写入运营记忆？"（附规律列表）
  options:
    - "全部写入" — 保存到 Claude Code memory
    - "部分写入" — 选择性保存
    - "暂不写入" — 仅保存报告
```

## 输出

- 分析报告写入 `content/retrospectives/performance-report.md`
- 确认的规律保存到 Claude Code memory

## Lifecycle 写回

完成后对所参与分析的每个 slug，将 `runtime/pipeline-states/{slug}.json` 的 `lifecycle.benchmark_done = true`。契约见 `.claude/agents/orchestrator/lifecycle.md`。

结尾询问：

```
AskUserQuestion:
  question: "分析完成。需要执行哪个后续操作？"
  options:
    - "运行创作复盘" — 引导触发 creation-reviewing
    - "基于分析调整排期" — 引导触发 content-planning
    - "返回" — 结束
```
