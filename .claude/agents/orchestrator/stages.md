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
     追加 content/retrospectives/runs/{run_id}.log.md。
```

## Draft 分节循环（writer 专用 · 每平台内部）

fanout.md 已把当前 stage 按 {platform} 分派给 writer。writer 在该平台内部仍按 section 逐段写：

```
INIT:
  - 读 content/articles/{slug}/intermediate/03-outline/{platform}.md，计算 section 总数
  - state.draft.{platform}.sections = [{index:1,status:pending},...]

FOR each section:
  - completed 且文件存在 → SKIP
  - 读 section.depends_on_previous（默认 true）
  - false → 可与前序并行；true → 等前序完成，读其最后两段作为衔接
  - status=in_progress，started_at
  - 调用 writer（writer 读 columns.{column}.platforms_config 子文件，
    加载 platforms.{platform} 的 skeleton/tone/length_limit；
    首 section 再读 opening_strategies 对应策略）
  - 输出 → content/articles/{slug}/intermediate/04a-draft/{platform}/section-{NN}.md
  - 校验（字数 ±20%、无 forbidden_patterns、无 platform tone 违规）
  - status=completed

所有 section 完成 → 合并为 04a-draft/{platform}/merged-draft.md
```

## Audit + Polish 子步骤（per-platform）

每个平台独立完成 audit→polish 闭环：

```
FOR each platform in brief.target_platforms:
  auditor  → review/05-audit/{platform}.md（只审不改）
  polisher → review/06-polish/{platform}.md + export/07-final/{platform}.md
```

`auditor` 读 `columns.{column}.platforms.{platform}.tone.rules` + `kpi_targets` 做平台专属审校。

## Publish 子步骤（per-platform）

```
FOR each platform in brief.target_platforms:
  1. publisher 被 fanout.md 派发，接受 {platform} 变量
  2. 执行：lint --platform {platform} → 语法标准化 → 多格式导出
     - wechat 分支：保留 ::: 容器 + 5 行内扩展；lint W1-W4 守门
     - 其他平台：剥 ::: 容器，降级为纯 GFM
  3. 输出 → export/08-{platform}-publish.md
  4. 若 platform == wechat：生成 teaser（export/08-teaser-120chars.md 仅产 1 次）
所有平台完成 → 进入 CP3（发布确认）
  - wechat 交付：提示用户在本地 wechat-typeset 编辑器粘贴、挑主题、一键复制
  - 其他平台：直接是最终投递产物
```

## 校验规则参考

7 种验证类型详见 `.claude/skills/pipeline-orchestrating/references/validation-rules.md`。
