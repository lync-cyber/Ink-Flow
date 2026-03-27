---
description: 重跑任意已完成或失败的 pipeline 阶段
---

## 用法

```
/rerun <stage-name> [--force]
```

## 执行逻辑

1. **参数解析**
   - `stage-name`: 必填，要重跑的阶段名（如 draft、research、refine）
   - `--force`: 可选，忽略已 completed 状态强制重跑

2. **状态检查**
   - 读取 `pipeline-state.json`
   - 确认目标阶段存在于 pipeline 定义中
   - 若阶段 status 为 completed 且未指定 --force → 提示用户确认
   - 若阶段 status 为 pending → 提示使用 /run 而非 /rerun

3. **依赖校验**
   - 检查目标阶段的 `requires` 依赖是否全部 completed 或 skipped
   - 依赖不满足 → 拒绝重跑并说明原因

4. **重置执行**
   - 将目标阶段 status 重置为 `in_progress`
   - 调度对应 slash command
   - 运行 contract-validator.sh 校验
   - 更新 pipeline-state.json

5. **日志标记**
   - 在 `retro/runs/{run_id}.log.md` 中标记 `(rerun)` 以便追踪

6. **后续阶段**
   - 不自动影响后续阶段状态
   - 后续阶段保持原状，由用户决定是否需要级联重跑
   - 提示用户: "draft 已重跑完成。后续阶段 (refine, publish) 保持原状态，如需更新请执行 /rerun <stage>"
