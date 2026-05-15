# 中断恢复策略

Pipeline 可能因以下原因中断：Claude Code 会话超时、网络断连、用户手动终止、上下文窗口溢出。本文档描述恢复机制。

## 状态语义

| status | 含义 | 恢复动作 |
|--------|------|----------|
| `pending` | 未开始 | 正常执行 |
| `in_progress` | 已开始但未完成 | 检查 stale lock（见下） |
| `completed` | 已完成且通过校验 | 跳过（但需验证产出物完整性） |
| `skipped` | 因 skip_if 跳过 | 跳过 |
| `failed` | 执行失败 | 重新执行 |

## Stale Lock 检测

当阶段 status 为 `in_progress` 时：

1. 读取 `started_at` 时间戳
2. 若距当前时间 > 30 分钟 → 判定为上次崩溃残留（stale lock）
3. 用 AskUserQuestion 询问用户：重新执行 / 跳过 / 取消
4. 若 < 30 分钟 → 可能有另一个 pipeline 正在运行，报错提示用户确认

## 产出物完整性校验

Resume 时对每个标记为 `completed` 的依赖阶段执行：

1. 确认输出文件存在（按约定路径）
2. 确认文件非空（字符数 > 0）
3. 若文件缺失或为空 → 重置该阶段为 `pending`，通知用户

约定路径映射（per-platform 阶段按 `brief.target_platforms` 展开 `{platform}`）：
- brief → `content/articles/{slug}/intermediate/01-brief.md`
- research → `content/articles/{slug}/intermediate/02-research-memo.md`
- atoms → `content/articles/{slug}/intermediate/02-atoms/index.md` + 9 类 `{type}.md`
- outline（per_platform）→ `content/articles/{slug}/intermediate/03-outline/{platform}.md`
- draft（per_platform）→ `content/articles/{slug}/intermediate/04a-draft/{platform}/merged-draft.md`
- figures（per_platform）→ `content/articles/{slug}/intermediate/04b-figure/{platform}/figure-index.md`
- audit（per_platform）→ `content/articles/{slug}/review/05-audit/{platform}.md`
- polish（per_platform）→ `content/articles/{slug}/review/06-polish/{platform}.md` + `content/articles/{slug}/export/07-final/{platform}.md`
- publish（per_platform）→ `content/articles/{slug}/export/08-{platform}-publish.md`（wechat 含 ::: 容器）

注：per_platform 阶段的完整性校验逐平台执行——若某一个 `{platform}` 产物缺失，只重置该平台状态，不影响同阶段其他平台（对齐 `orchestrator/fanout.md` § 失败隔离）。
**权威来源是 `framework/config/artifact-layout.yaml` 的 `paths.*`**，恢复逻辑应直接从该文件读路径模板，不要在本文档里硬编码。

## Draft 阶段恢复（整平台粒度）

writer 现在是**单次调用产出当前平台全部 section + merged-draft.md**，不再按 section 拆分调用。
因此 draft 恢复以整平台为单位，不再支持 single-section rerun。

### 状态结构

```json
"draft": {
  "per_platform": true,
  "status": "in_progress",
  "started_at": "2026-04-01T10:30:00Z",
  "platforms": {
    "wechat": {
      "status": "in_progress",
      "started_at": "2026-04-01T10:45:00Z"
    },
    "zhihu": {
      "status": "completed",
      "artifact": "intermediate/04a-draft/zhihu/merged-draft.md"
    }
  }
}
```

旧 state 中可能残留的 `sections[]` 字段在 resume 时由 state-writer 兼容忽略；不会迁移、不会触发错误。

### 恢复流程

1. 对每个 `{platform}` 并行检查：
   - `status == completed` 且 `merged-draft.md` 存在且 section-{NN}.md 数与 outline 一致 → 跳过
   - 任一条件不满足 → 重置 `state.draft.{platform}` 为 pending，整平台重跑 writer
2. 某平台失败不影响其他平台的恢复进度。
3. 用户若只想重写其中某一节，可手动修改对应 `section-{NN}.md`；这种局部修改会在 polish 阶段被拾起整体调和。

## 常见中断场景

| 场景 | 表现 | 恢复方式 |
|------|------|----------|
| 上下文窗口溢出 | 编排器停止响应 | 重新触发 pipeline-orchestrating，自动 resume |
| 网络断连 | subagent 无输出 | 阶段停留在 in_progress，resume 时检测 stale lock |
| 用户手动终止 | Ctrl+C | 阶段可能为 in_progress 或 pending |
| subagent 超时 | Agent tool 报错 | 进入 L1 错误处理（自动重试） |
| 校验失败循环 | 反复重试超限 | 进入 L4（AskUserQuestion 人工介入） |
