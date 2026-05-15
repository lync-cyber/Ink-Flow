# orchestrator / fanout 模块

> `per_platform: true` 且 `len(brief.target_platforms) > 1` 时的多平台派发与收敛算法。
> 单平台（N==1）走 `stages.md` 的单播算法（单平台快通道），不进本模块。

## 何时触发

- stage 定义含 `per_platform: true` 且 `len(brief.target_platforms) > 1` → 本模块
- stage 定义含 `per_platform: true` 且 `len(brief.target_platforms) == 1` → `stages.md`（单平台快通道）
- 不含 `per_platform` → `stages.md` 单播

受影响阶段（当前为 6 个）：`outline` / `draft` / `figures` / `audit` / `polish` / `publish`。

## 输入

- `brief.target_platforms`：非空数组，至少 1 个，元素 ∈ `framework/config/artifact-layout.yaml` 的 `platforms` 枚举
- 当前 stage 定义（含 `output`、`validation`、`parallel` 字段）
- `runtime/profile-resolved/constraints.yaml` 的 `columnPlatforms.{content_column}.{platform}` 段（平台适配）

## 派发算法

```
1. LOAD PLATFORMS
   platforms = brief.target_platforms
   column    = brief.content_column
   读 runtime/profile-resolved/constraints.yaml
   → cp = constraints.columnPlatforms.{column}
   → 得到 cp.{p} 对每个 p 的配置（skeleton / tone / lengthLimit / atomSelection / figureSpec / kpiTargets）

2. APPLICABILITY FILTER
   FOR each p in platforms:
     cfg = cp.{p}
     若 cfg 不存在 → 报错（当前 Profile 未为该栏目声明此平台），终止
   effective_platforms = 剩余

3. SPAWN
   若 stage.parallel == true:
     FOR each p in effective_platforms:
       调 state-writer.md update_state(stage, {status:in_progress, started_at:now()}, platform=p)
     并行 Agent 调用 N 次（每次把 {platform}=p 注入 subagent 环境）
   否则串行逐个调用（极少用）

4. COLLECT
   每个 subagent return 的瞬间立即：
     调 state-writer.md PROC validate_stage_output(stage, platform=p)（单一事实来源）
     failed → 追加 violations[] 并转 recovery.md L2；不阻塞其他平台继续
   所有平台处理完 → state-writer 自动重算 overall_status

5. CHECKPOINT（若 stage.checkpoint == true）
   汇总所有平台的产物路径与 lint 结果 → 一次性向用户展示
   用户决议后由 checkpoints.md 内部调 state-writer 写
   允许"仅重跑某一平台"（见 recovery.md § Platform-Rerun）
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
        "juejin":      {"status":"skipped","reason":"Profile 未声明该栏目-平台组合"}
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

- `atoms`：**不**走本模块。平台无关的共用产物

## Draft：每平台一次调用（writer 自行完成全部 section）

orchestrator 不再按 section 派发 writer。fanout 把 {platform} 注入 writer 后，writer 在自己内部循环写完该平台所有 section，并自行合并 merged-draft.md。

```
FOR each platform in effective_platforms（并行）:
  - 调 state-writer update_state(draft, {status:in_progress, started_at:now()}, platform=p)
  - 调用 writer 一次，注入 {platform}=p
    writer 读 outline/{platform}.md，按 outline 顺序循环生成 section-{NN}.md，
    最后合并 merged-draft.md
  - 校验（aggregate）：
      · section-{NN}.md 个数 == outline 中 section 数
      · merged-draft.md 存在且字数在 columnPlatforms.{column}.{platform}.lengthLimit 软上限内
      · 全文无 forbidden_phrases / forbidden_patterns
  - 通过 → status=completed；不通过 → recovery.md L2（整平台重跑）
```

重跑粒度：

- 单平台失败 → 整个平台重跑 writer（不再支持 single-section rerun，因为 writer 是一次性产出）
- 单 section 想重写 → 用户手动改对应 section-{NN}.md 后 → polisher 阶段拾起
- 若需要"只重写第 3 节"这种细粒度，仍要走整平台 writer 重跑；这是用 token 换工程简洁性的取舍

## Audit + Polish 子步骤

每个平台独立完成 audit→polish 闭环：

```
FOR each platform in brief.target_platforms:
  auditor  → review/05-audit/{platform}.md（只审不改）
  polisher → review/06-polish/{platform}.md + export/07-final/{platform}.md
```

auditor 读 `constraints.columnPlatforms.{column}.{platform}.tone.rules` + `kpiTargets` 做平台专属审校。

## Publish 子步骤

```
FOR each platform in brief.target_platforms:
  1. publisher 接收 {platform} 变量
  2. 执行：lint --platform {platform} → 语法标准化 → 多格式导出
     - wechat：保留 ::: 容器 + 5 行内扩展；lint W1-W4 守门
     - 其他平台：剥 ::: 容器，降级纯 GFM
  3. 输出 → export/08-{platform}-publish.md
  4. wechat 额外产：teaser / plain 等（见 publisher.md 的 Extra Outputs）
所有平台完成 → 进入 CP3
  - wechat 交付：提示本地 wechat-typeset 粘贴、挑主题、一键复制
  - 其他平台：直接是最终投递产物
```
