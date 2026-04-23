# orchestrator / state-writer 模块

> state 写回唯一事实来源。`stages.md` / `fanout.md` / `recovery.md` / `checkpoints.md` / `brief.md` / `lifecycle.md` 必须调用本模块，不允许自造写回逻辑。

## 写回时机

以下每一事件发生后**立即** Read→Update→Write，不允许批量合并或延迟：

| 事件 | 调用点 | 必须更新字段 |
|------|--------|-------------|
| subagent 开始执行（Agent tool call 前） | stages.md Step 5 · fanout.md § SPAWN | `status=in_progress`, `started_at` |
| subagent return（Agent tool call 后，无论成功失败） | stages.md Step 6 · fanout.md § COLLECT | `status`, `completed_at`, `artifacts`, `duration_seconds` |
| validation 失败进入 L2/L3 | recovery.md | `retries += 1`, `violations[]` |
| checkpoint 用户决议 | checkpoints.md | `checkpoints.{id}.{decision, modifications}` |
| 跳过阶段（skip_if 命中） | stages.md Step 1 | `status=skipped`, `skip_reason` |
| brief 初始化 | brief.md Step 4 | 按 inkflow.yaml.stages 生成全部 stage 骨架 |
| CP3 approved / 发布后 skill | lifecycle.md | `lifecycle.{published_at, metrics.dN, benchmark_done, retro_done}` |

## 标准写回算法

```
PROC update_state(stage_name, patch: dict, platform: str | None = None):
  1. path = runtime/pipeline-states/{slug}.json
  2. state = Read(path) 解析 JSON
  3. IF platform is None:
       target = state.stages[stage_name]
     ELSE:
       target = state.stages[stage_name].platforms[platform]
  4. target.update(patch)  # 浅合并
  5. 若 stage 含 per_platform 子状态 → 重算 overall_status:
       all completed → all_completed
       有 failed → failed
       其余 → partial
  6. Write(path, JSON.stringify(state, indent=2))
  7. 返回更新后的 target 块
```

## 必填字段

### 非 per_platform 阶段（brief / research / atoms）

```json
{
  "status": "pending | in_progress | completed | failed | skipped",
  "started_at": "ISO8601 或 null",
  "completed_at": "ISO8601 或 null",
  "artifacts": ["展开的绝对路径列表"],
  "duration_seconds": 数字 | null,
  "retries": 0,
  "violations": [],
  "skip_reason": "string"
}
```

### per_platform 阶段（outline / draft / figures / audit / polish / publish）

```json
{
  "per_platform": true,
  "overall_status": "all_completed | partial | failed",
  "platforms": {
    "{platform}": {
      "status": "...",
      "started_at": "...",
      "completed_at": "...",
      "artifacts": [...],
      "duration_seconds": ...,
      "retries": 0,
      "violations": []
    }
  }
}
```

## Validation 协议（公共）

subagent return 后必须按顺序做两件事，不允许合并或延迟：

```
PROC validate_stage_output(stage_name, platform: str | None = None):
  1. update_state(stage_name, {
       status: completed_or_failed_by_agent,
       completed_at: now(),
       artifacts: [展开的产物路径],
       duration_seconds: now() - started_at,
     }, platform=platform)

  2. 从 stage.validation 逐项检查（required_sections / word_count / required_patterns
     / forbidden_patterns / required_frontmatter_per_atom / section_tolerance / ...）
     - 0 违规 → 维持 completed
     - >0 违规 → update_state(stage_name, {status:failed, violations:[...]}, platform=platform)
                 → 转 recovery.md 的 L2

  3. 返回 {status, violations[]}（由调用方决定是否继续 fanout 汇总 / 阶段切换）
```

stages.md Step 6 与 fanout.md § COLLECT **一律**调用本 PROC，不允许自造重复逻辑。
fanout 的 `overall_status` 重算在单平台 validate_stage_output 都完成后执行（见 § 标准写回算法 步骤 5）。

## 对齐断言

resume 与 dry-run 前必须运行：

```
PROC assert_state_artifact_alignment(slug):
  FOR each stage in inkflow.yaml.stages:
    IF stage.per_platform:
      FOR each platform in state.stages[stage.name].platforms:
        sub = state.stages[stage.name].platforms[platform]
        artifact_path = expand(stage.output, {slug, platform})
        IF sub.status == "completed" AND NOT exists(artifact_path):
          报 error: "state completed but artifact missing: {path}"
        IF sub.status == "pending" AND exists(artifact_path):
          报 warning: "artifact exists but state pending: {path}"
    ELSE:
      ... 同上，不展开 platform 维度
  未知 stage（不在 inkflow.yaml.stages 中）→ 静默忽略 + warning
```

- resume 命中 error → 该阶段重置为 pending，AskUserQuestion 决策是否重跑
- dry-run 命中 error/warning → 列出，不修复

## 调用索引

| 调用方 | 位置 |
|--------|------|
| `stages.md` | Step 1 · Step 5 · Step 6 · Step 7 |
| `fanout.md` | § APPLICABILITY FILTER · § SPAWN · § COLLECT · § CHECKPOINT |
| `recovery.md` | L2/L3 前后 · Rerun 重置时 · 中断恢复检测时 |
| `checkpoints.md` | CP1/CP2/CP3 每次决议 |
| `brief.md` | Step 4 初始化 |
| `lifecycle.md` | CP3 approved · 各发布后 skill 回写 |
