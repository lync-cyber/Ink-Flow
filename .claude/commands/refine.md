---
description: 执行审校+润色阶段 — 调用 editor agent 进行五维审核和去 AI 味润色（Checkpoint 2）
---

## 执行逻辑

### 1. 前置检查
- 读取 `.pipeline-states/{slug}.json`
- 确认 draft 阶段 status 为 completed
- 读取相关文件确认存在

### 2. 调用 Editor-Audit Agent（子步骤 1: 五维审校）
- 更新 `.pipeline-states/{slug}.json`: refine.sub_steps.audit = "in_progress"
- 组装上下文:
  - `drafts/{topic}-full-draft.md` — 完整草稿
  - `figures/{topic}-figures.md` — 配图（如有）
  - `research/{topic}-memo.md` — 调研备忘录（用于事实核查）
  - `styles/{style_profile}/style-profile.md` — 风格 DNA（style_profile 从 brief 获取，默认 "default"）
- 使用 `.claude/agents/editor-audit.md` 定义的 editor-audit subagent
- 输出: `output/{topic}-audit-report.md`
- 更新: refine.sub_steps.audit = "completed"

### 3. 调用 Editor-Polish Agent（子步骤 2: 去 AI 味润色）
- 更新 `.pipeline-states/{slug}.json`: refine.sub_steps.polish = "in_progress"
- 组装上下文:
  - `drafts/{topic}-full-draft.md` — 完整草稿
  - `output/{topic}-audit-report.md` — 审校报告（来自 editor-audit）
  - `styles/{style_profile}/style-profile.md` — 风格 DNA
- 使用 `.claude/agents/editor-polish.md` 定义的 editor-polish subagent
- 输出: `output/{topic}-final.md`
- 更新: refine.sub_steps.polish = "completed"

### 4. 校验输出
- 运行 contract-validator.sh 校验
- 检查: 审校报告和润色结果 section 存在
- 检查: 平台兼容性（CSS 安全、标题层级、图片宽度）
- 校验失败 → L1 重试

### 5. 更新状态
- 输出文件:
  - `output/{topic}-final.md` — 润色后全文
  - `output/{topic}-audit-report.md` — 审校报告
- 更新 `.pipeline-states/{slug}.json`:
  - refine.status: "completed"
  - refine.artifacts: ["output/{topic}-final.md", "output/{topic}-audit-report.md"]
- 追加运行日志

### 6. Checkpoint 2 — 用户终审

向用户展示审校报告摘要和润色后文章，提示审核要点:

```
★ Checkpoint 2: 用户终审

审校报告摘要:
- 事实问题: {N} 个（高: {N}, 中: {N}, 低: {N}）
- AI 味问题: {N} 处
- 风格偏离: {N} 处
- 句式清理: {N} 处

请审核 output/{topic}-final.md，重点关注:

1. 大声朗读全文
   - 读起来卡顿的地方就是需要改的地方

2. 在 1-2 处加入个人经验、看法、或小故事
   - 查找 <!-- USER_FILL --> 标记位置
   - LLM 做不到的部分，是你的核心价值

3. 确认标题
   - 好标题是精确的问题，不是宏大的概念

编辑完成后，执行 /run 继续或 /publish 直接发布。
```

等待用户确认后标记 `checkpoint_approved: true`。
