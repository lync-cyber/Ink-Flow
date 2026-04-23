# orchestrator / stages 模块

> 本模块处理**单播**阶段（单次 agent 调用即可完成）。  
> 若 `stage.per_platform == true`，交给 `fanout.md` 处理，不走本模块。

## 阶段执行通用算法（单播）

从 `framework/config/inkflow.yaml` 的 stages 列表读取阶段定义；每阶段按顺序执行：

```
FOR each stage from current_stage to end:

  1. SKIP CHECK
     读 stage.skip_if；从 content/articles/{slug}/intermediate/01-brief.md frontmatter 取值。
     条件成立 → status=skipped，记录 reason，NEXT。

  2. DEPENDENCY CHECK
     读 stage.requires；所有依赖 completed/skipped → 继续，否则报错。

  2.5. ARTIFACT INTEGRITY（仅 resume 时）
     对每个 requires 的 completed 阶段，确认其 output 文件存在且非空。
     缺失 → 重置该依赖为 pending，用 AskUserQuestion 通知用户。

  2.6. STALE LOCK
     若当前 stage status==in_progress：
       started_at 距今 >30min → AskUserQuestion（重跑/跳过/取消）
       <30min → 报错（疑似并发 pipeline）

  3. PARALLEL CHECK
     若 stage.parallel_with 存在，同时 dispatch 当前阶段和并行阶段。

  4. CONTEXT ASSEMBLY（从 artifact-layout 读路径）
     收集已完成前置阶段的 output 文件（01-brief.md 始终包含）。
     Skill/rules 由 agent 自行读取，编排器不拼装。

  5. MARK IN_PROGRESS + SPAWN AGENT
     更新 state：status=in_progress + started_at ISO 时间戳。
     Agent tool 调用 .claude/agents/{agent}.md（rules 自动注入）。

  6. VALIDATE（独立校验，与 agent 上下文隔离）
     从 stage.validation 读取，逐项检查。
     - 0 违规 → status=completed
     - >0 违规 → 进入 recovery.md 的 L2

  7. CHECKPOINT
     若 stage.checkpoint==true → 跳转 checkpoints.md 对应段

  8. STATE UPDATE
     Read → 更新 status/completed_at/artifacts/duration_seconds/retries
     Write 写回 JSON。
```

## 校验规则参考

7 种验证类型详见 orchestrator.md Context 段列出的 validation-rules 参考文件。

per_platform 阶段（outline / draft / figures / audit / polish / publish）的执行细节见 `fanout.md`。
