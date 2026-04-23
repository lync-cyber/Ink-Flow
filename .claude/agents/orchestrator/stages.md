# orchestrator / stages 模块

> 本模块处理**单播**阶段（单次 agent 调用即可完成）。
> 若 `stage.per_platform == true` 且 `len(brief.target_platforms) > 1` → 交给 `fanout.md`。
> 若 `stage.per_platform == true` 且 `len(brief.target_platforms) == 1`（单平台快通道）→ 走本模块，`{platform}` 注入为 `brief.target_platforms[0]`，state 依然写到 `stages.{stage}.platforms.{p}` 维持 schema 一致。

## 阶段执行通用算法（单播）

从 `framework/config/inkflow.yaml` 的 stages 列表读取阶段定义；每阶段按顺序执行：

```
FOR each stage from current_stage to end:

  1. SKIP CHECK
     读 stage.skip_if；从 content/articles/{slug}/intermediate/01-brief.md frontmatter 取值。
     条件成立 → 调 state-writer.md PROC update_state(stage, {status:skipped, skip_reason:...})
                 NEXT。

  2. DEPENDENCY CHECK
     读 stage.requires；所有依赖 completed/skipped → 继续，否则报错。

  2.5. ARTIFACT INTEGRITY（仅 resume 时）
     调 state-writer.md § 对齐断言 PROC assert_state_artifact_alignment(slug)
     命中 error → 重置该依赖为 pending，用 AskUserQuestion 通知用户。

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
     调 state-writer.md PROC update_state(stage, {status:in_progress, started_at:now()})
     然后 Agent tool 调用 .claude/agents/{agent}.md（rules 自动注入）。

  6. VALIDATE + STATE UPDATE（subagent return 后立即执行，不允许延迟）
     调 state-writer.md PROC validate_stage_output(stage)（单一事实来源）
     返回 {status, violations[]}；failed → 转 recovery.md L2

  7. CHECKPOINT
     若 stage.checkpoint==true → 跳转 checkpoints.md 对应段
     checkpoints.md 内部调 state-writer 写 state.checkpoints.{CP?}.{decision, modifications}
```

步骤 1/5/6/7 的 state 写回一律经 `state-writer.md` 的 `update_state`，不允许自造 Read/Write。

## 校验规则参考

7 种验证类型详见 orchestrator.md Context 段列出的 validation-rules 参考文件。

per_platform 阶段（outline / draft / figures / audit / polish / publish）的执行细节见 `fanout.md`。
