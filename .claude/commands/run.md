---
description: 编排器 — 自动推进 pipeline，在 checkpoint 暂停等待用户审核
---

## 执行逻辑

你是 InkFlow pipeline 的编排器。执行以下流程:

### 1. 初始化
- 读取 `.claude/pipelines/article-writing.yaml` 获取 pipeline 定义
- 读取 `pipeline-state.json`（不存在则创建）
- 确定当前阶段（找到第一个 status 为 pending 或 in_progress 的阶段）

### 2. 逐阶段推进

对当前阶段执行以下判断:

#### 2.1 条件跳过
- 若阶段有 `skip_if` 条件
- 从 `briefs/{topic}.md` frontmatter 读取对应字段
- 条件成立 → 将该阶段标记为 `skipped`，记录 reason，推进到下一阶段

#### 2.2 用户输入阶段
- 若阶段 `type: user_input` → 提示用户完成该步骤
- 等待用户确认完成后标记为 `completed`

#### 2.3 Agent 阶段
- 检查 `requires` 依赖阶段是否全部 completed 或 skipped
- 若有 `parallel_with` → 同时调度多个阶段的 slash command
- 将阶段标记为 `in_progress`，记录 started_at
- 调用对应的 slash command（如 /research、/draft）
- Agent 完成后:
  - 运行 `.claude/validators/contract-validator.sh` 校验输出
  - 校验通过 → 标记 completed
  - 校验失败 → 进入错误处理流程

#### 2.4 检查点
- 若阶段有 `checkpoint: true` → 暂停 pipeline
- 向用户展示该阶段的产出物和审核要点
- 等待用户确认后标记 `checkpoint_approved: true`，继续推进

### 3. 四层错误处理

当阶段执行失败时:
- **L1 重试**: 瞬态错误（rate limit、网络），自动重试最多 2 次
- **L2 校验失败**: contract-validator.sh 报告 violation → 记录 violation → 重试一次
- **L3 模型降级**: Opus 反复失败 → 降级到 Sonnet 重试
- **L4 人工介入**: 所有自动恢复失败 → 标记阶段为 `needs_human`，暂停 pipeline，告知用户

### 4. 状态管理

更新 `pipeline-state.json`:
```json
{
  "pipeline": "article-writing",
  "run_id": "{date}-{topic-slug}",
  "created_at": "{ISO timestamp}",
  "current_stage": "{stage-name}",
  "stages": {
    "{stage}": {
      "status": "pending|in_progress|completed|failed|skipped|needs_human",
      "started_at": "{ISO timestamp}",
      "completed_at": "{ISO timestamp}",
      "artifacts": ["{file-paths}"],
      "checkpoint_approved": true,
      "sub_steps": {
        "{sub_step}": "pending|in_progress|completed"
      },
      "error": {
        "type": "{error_type}",
        "violations": [],
        "retry_count": 0
      }
    }
  },
  "token_usage": {
    "{stage}": { "input": 0, "output": 0 }
  }
}
```

### 5. 运行日志

每个阶段完成后追加记录到 `retro/runs/{run_id}.log.md`。

### 6. 子步骤追踪

对声明了 `sub_steps` 的阶段（如 refine），在 pipeline-state.json 中追踪子步骤状态:
```json
"refine": {
  "status": "in_progress",
  "sub_steps": {
    "audit": "completed",
    "polish": "in_progress"
  }
}
```

### 7. 完成

所有阶段 completed 或 skipped → pipeline 完成。提示用户执行 `/feedback` 和 `/retro` 完成学习闭环。
