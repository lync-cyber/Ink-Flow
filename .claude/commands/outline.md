---
description: 执行大纲阶段 — 调用 outliner agent 生成结构化大纲（Checkpoint 1）
---

## 执行逻辑

### 1. 前置检查
- 读取 `.pipeline-states/{slug}.json`，确认 brief 阶段 status 为 completed
- 若 research 未跳过，确认 research 阶段 status 为 completed
- 读取 `briefs/{topic}.md` 获取参数

### 2. 组装上下文
- 读取 `briefs/{topic}.md` 完整内容
- 读取 `research/{topic}-memo.md`（如未跳过 research）
- 读取 `styles/{style_profile}/style-profile.md`（如存在，用于确定开头/结尾风格；style_profile 从 brief 获取，默认 "default"）
- 读取 `.claude/agent-memory/outliner/MEMORY.md`
- 注入移动端结构约束（来自 outliner agent Constraints）

### 3. 调用 Outliner Agent
- 使用 `.claude/agents/outliner.md` 定义的 outliner subagent
- Agent 输出写入 `outlines/{topic}-outline.md`

### 4. 校验输出
- 运行 contract-validator.sh 校验
- 检查: 论点/关键细节/预估字数 section 存在
- 检查: 总预估字数与 brief.target_length 偏差 ≤ 20%
- 检查: section 数在 3-7 之间

### 5. 更新状态
- 更新 `.pipeline-states/{slug}.json`:
  - outline.status: "completed"
  - outline.artifacts: ["outlines/{topic}-outline.md"]
- 追加运行日志

### 6. Checkpoint 1 — 大纲审核

向用户展示大纲，并提示审核要点:

```
★ Checkpoint 1: 大纲审核

请审核 outlines/{topic}-outline.md，重点关注:

1. 确认或修改每个 section 的论点方向
   - 论点是否有判断力（非"正确但无聊"）？
   - 论点排序是否有递进关系？

2. 决定不确定项
   - 继续查？→ 标注后执行 /rerun research
   - 直接删？→ 从大纲中移除

3. 调整结构
   - section 数是否合适（3-7 个）？
   - 是否需要合并、拆分、调换？
   - 视觉断点规划是否合理？

编辑完大纲后，执行 /run 继续或 /draft 单独执行写作。
```

等待用户确认后标记 `checkpoint_approved: true`。
