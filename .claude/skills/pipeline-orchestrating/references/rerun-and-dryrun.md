# Rerun 支持 & Dry-Run 模式

## Rerun 支持

当检测到用户想重跑某阶段时：

1. 解析目标阶段名称
2. 确认重跑意图（AskUserQuestion）
3. 重置该阶段及其后续阶段的状态为 pending
4. 从该阶段重新开始执行通用算法

## Dry-Run 模式（Pipeline 预览）

当用户选择"预览 pipeline"或说"dry-run"时执行。**不 spawn 任何 agent，零 token 消耗**。

1. 确定目标：若有指定 slug → 读取该文章的 brief 和 state；若无 → 用 AskUserQuestion 请用户选择
2. 从 `config/inkflow.yaml` 的 stages 列表逐 stage 检查：SKIP 条件、依赖状态、上下文文件、Rule 可用性、Agent 可用性
3. 输出汇总表（stage、状态、agent、model、上下文文件、rules）
4. 用 AskUserQuestion 提供后续操作
