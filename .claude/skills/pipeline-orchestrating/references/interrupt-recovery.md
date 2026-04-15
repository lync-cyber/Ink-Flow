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

约定路径映射：
- brief → `articles/{slug}/brief.md`
- research → `articles/{slug}/research.md`
- outline → `articles/{slug}/outline.md`
- draft → `articles/{slug}/drafts/full.md`
- figures → `articles/{slug}/figures/summary.md`
- audit → `articles/{slug}/output/audit.md`
- polish → `articles/{slug}/output/final.md`

## Draft Section 级恢复

Draft 阶段是最耗时的阶段（多次 writer 调用），支持 section 粒度的恢复：

### 状态结构

```json
"draft": {
  "status": "in_progress",
  "started_at": "2026-04-01T10:30:00Z",
  "sections": [
    { "index": 1, "status": "completed", "artifact": "drafts/section-1.md" },
    { "index": 2, "status": "completed", "artifact": "drafts/section-2.md" },
    { "index": 3, "status": "in_progress", "started_at": "2026-04-01T10:45:00Z" },
    { "index": 4, "status": "pending" },
    { "index": 5, "status": "pending" }
  ]
}
```

### 恢复流程

1. 读取 `draft.sections` 数组
2. 跳过所有 `completed` 的 section（验证文件存在）
3. `in_progress` 的 section → 重新执行（部分写入的文件不可信）
4. `pending` 的 section → 正常执行
5. 全部完成后合并为 `full.md`

## 常见中断场景

| 场景 | 表现 | 恢复方式 |
|------|------|----------|
| 上下文窗口溢出 | 编排器停止响应 | 重新触发 pipeline-orchestrating，自动 resume |
| 网络断连 | subagent 无输出 | 阶段停留在 in_progress，resume 时检测 stale lock |
| 用户手动终止 | Ctrl+C | 阶段可能为 in_progress 或 pending |
| subagent 超时 | Agent tool 报错 | 进入 L1 错误处理（自动重试） |
| 校验失败循环 | 反复重试超限 | 进入 L4（AskUserQuestion 人工介入） |
