---
description: 执行调研阶段 — 调用 researcher agent 收集事实、代码片段和对比材料
---

## 执行逻辑

### 1. 前置检查
- 读取 `pipeline-state.json`，确认 brief 阶段 status 为 completed
- 读取 `briefs/{topic}.md` 获取 topic 和调研参数
- 检查 `skip_research`: 若为 true → 标记 research 为 skipped，提示用户

### 2. 组装上下文
- 读取 `briefs/{topic}.md` 完整内容
- 读取 `.claude/agent-memory/researcher/MEMORY.md`
- 根据 brief 参数确定:
  - 是否需要 SEO 关键词（brief.skip_seo）
  - 是否需要竞品分析（brief.content_type）

### 3. 调用 Researcher Agent
- 使用 `.claude/agents/researcher.md` 定义的 researcher subagent
- 将组装的上下文作为输入
- Agent 输出写入 `research/{topic}-memo.md`

### 4. 校验输出
- 运行 `.claude/validators/contract-validator.sh researcher research/{topic}-memo.md briefs/{topic}.md`
- 校验通过 → 继续
- 校验失败 → L1 重试（最多 2 次）→ 仍失败则标记 failed

### 5. 更新状态
- 更新 pipeline-state.json:
  - research.status: "completed"
  - research.artifacts: ["research/{topic}-memo.md"]
  - token_usage.research: { input: N, output: N }
- 追加运行日志到 `retro/runs/{run_id}.log.md`

### 6. 输出提示
- 展示调研备忘录的摘要（关键事实数、不确定项数）
- 提示: "调研完成。执行 /run 继续 pipeline，或 /outline 直接生成大纲。"
