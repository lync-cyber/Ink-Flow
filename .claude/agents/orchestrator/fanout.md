# orchestrator / fanout 模块

> `per_platform: true` 阶段的派发与收敛算法。主文件 `orchestrator.md` 的主循环遇到这类 stage 时按下文处理。

## 何时触发

当 `framework/config/inkflow.yaml` 中当前 stage 定义含 `per_platform: true` 时走本模块；否则走 `stages.md` 的单播算法。

受影响阶段（当前为 6 个）：`outline` / `draft` / `figures` / `audit` / `polish` / `publish`。

## 输入

- `brief.target_platforms`：非空数组，至少 1 个，元素 ∈ `framework/config/artifact-layout.yaml` 的 `platforms` 枚举
- 当前 stage 定义（含 `output`、`validation`、`parallel` 字段）
- `columns.{content_column}.platforms_config` 子文件（按需加载）

## 派发算法

```
1. LOAD PLATFORMS
   platforms = brief.target_platforms
   column    = brief.content_column
   读 columns.yaml → 取 columns.{column}.platforms_config 指针
   读该子文件 → 得到 platforms.{p} 对每个 p 的配置

2. APPLICABILITY FILTER
   FOR each p in platforms:
     cfg = platforms.{p}
     若 cfg 不存在 → 报错（栏目未配置该平台），终止
     若 cfg.applicable == "conditional":
       按 cfg.applicable_if 表达式求值（读 brief frontmatter）
       false → 从本次 fan-out 剔除 p，日志记录 "skipped: reason=<表达式不满足>"
   effective_platforms = 剩余

3. SPAWN
   若 stage.parallel == true:
     FOR each p in effective_platforms:
       state.stage.{p}.status = in_progress, started_at = now
     并行 Agent 调用 N 次（每次把 {platform}=p 注入 subagent 环境）
   否则串行逐个调用（极少用）

4. COLLECT
   等所有 subagent 结束：
     对每个 p：读取该平台产物路径（从 artifact-layout 展开 {platform}→p）
     执行 stage.validation（按平台执行，必要时调 lint.py --platform p）
     结果汇总到 state.stage.{p}.{status, violations, duration_seconds}

5. CHECKPOINT（若 stage.checkpoint == true）
   汇总所有平台的产物路径与 lint 结果 → 一次性向用户展示
   用户一次审核 N 份产物，允许"仅重跑某一平台"（见 recovery.md § Platform-Rerun）
```

## 失败隔离

- 某平台 agent 失败 → **不影响其他平台继续**；状态机独立
- 单平台进 L2 recovery（validation 违规）→ 仅重跑该平台
- 多平台同时失败 → 用 `AskUserQuestion` 列出全部失败列表，由用户选择（全部重跑 / 仅选部分 / 放弃该平台）

## 状态存储

`runtime/pipeline-states/{slug}.json` 扩展 schema：

```json
{
  "stages": {
    "outline": {
      "per_platform": true,
      "platforms": {
        "wechat":      {"status":"completed","output":"...","duration_seconds":42},
        "xiaohongshu": {"status":"completed","output":"...","duration_seconds":38},
        "zhihu":       {"status":"failed","violations":[...],"retries":1},
        "juejin":      {"status":"skipped","reason":"applicable_if 不满足"}
      },
      "overall_status": "partial"     // all_completed | partial | failed
    }
  }
}
```

`overall_status`：
- `all_completed` — 所有 effective_platforms 状态 = completed
- `partial` — 部分 completed、部分 skipped，0 failed
- `failed` — 存在至少 1 个 failed

## 依赖对齐

下一阶段（同 per_platform）判断 requires 时，按**同平台**对齐：
- `draft.wechat` 的 requires 是 `outline.wechat`，不是 `outline` 总体
- `draft.zhihu` 的 requires 是 `outline.zhihu`
- **跨平台依赖禁止**：不允许 `publish.juejin` 依赖 `polish.wechat`

## 并发度上限

默认无上限（Agent tool 本身限流）。若需限流，在 `framework/config/inkflow.yaml` stage 定义中加 `max_parallel: N` 字段。

## 特殊阶段

- `typeset`：**不**走本模块。仅 wechat 触发（通过 stage.run_if），其他平台不需要排版
- `atoms`：**不**走本模块。平台无关的共用产物
```
