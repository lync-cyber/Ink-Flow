# orchestrator / lifecycle 模块

> CP3 通过后的发布后状态机。orchestrator 主循环结束后，由用户触发的运营 skill 按本模块约定回写 lifecycle 字段。

## State 字段

`runtime/pipeline-states/{slug}.json` 顶层增加 `lifecycle` 对象：

```json
"lifecycle": {
  "published_at": "2026-04-23T20:00:00Z",
  "platforms": {
    "wechat":      { "url": "https://mp.weixin.qq.com/s/xxx", "published_at": "..." },
    "zhihu":       { "url": "...", "published_at": "..." }
  },
  "metrics": {
    "d0":  { "recorded_at": null, "data": null },
    "d1":  { "recorded_at": null, "data": null },
    "d7":  { "recorded_at": null, "data": null }
  },
  "benchmark_done": false,
  "retro_done": false
}
```

## 状态流转

```
CP3 approved
  → orchestrator 写入 lifecycle.published_at = now
  → 提示用户："请在发布后按 publisher 输出的发布清单录入数据"

D+0 ~ D+1（用户运行 metrics-tracking）
  → metrics-tracking 写 lifecycle.metrics.d0.{recorded_at, data}
  → 若已积累 ≥3 篇数据 → metrics-tracking 提示触发 performance-benchmarking

D+7（用户运行 metrics-tracking 第二次）
  → metrics-tracking 写 lifecycle.metrics.d7
  → 若 lifecycle.benchmark_done == false → 提示运行 performance-benchmarking

performance-benchmarking 完成
  → 写 lifecycle.benchmark_done = true
  → 提示触发 creation-reviewing

creation-reviewing 完成
  → 写 lifecycle.retro_done = true
  → 生命周期闭环
```

## 各 skill 的写回契约

| Skill | 读 | 写回 lifecycle 字段 |
|-------|----|-------------------|
| `metrics-tracking` | brief, lifecycle | `metrics.d0` / `metrics.d1` / `metrics.d7` |
| `performance-benchmarking` | lifecycle.metrics, ops-metrics.csv | `benchmark_done = true` |
| `creation-reviewing` | draft, final, lifecycle | `retro_done = true` |

## Lifecycle 完成条件

`lifecycle.published_at != null` AND `metrics.d7.recorded_at != null` AND `benchmark_done == true` AND `retro_done == true` → 文章生命周期完整闭合，可移入 `content/retrospectives/closed/` 索引。
