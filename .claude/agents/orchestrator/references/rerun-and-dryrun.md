# Rerun 支持 & Dry-Run 模式

## Rerun 支持

支持两种粒度：

### 1. 全量重跑

```
"重跑 {stage}"
  → 解析 stage → AskUserQuestion 确认（列出全部后继） → 全部 status=pending → 清 output → 重跑
```

### 2. Per-platform 重跑

```
"重跑 {stage}.{platform}" 或 "重跑 {stage} --platform {p}"
  → 校验 stage.per_platform == true 且 {p} ∈ brief.target_platforms
  → 找"同平台后继链"：
       - 后继 stage 也是 per_platform → 只重置该平台子状态
       - 后继 stage 非 per_platform 且 run_if 与 {p} 相关 → 纳入
       - 否则跳过
  → AskUserQuestion 强调"其他平台不受影响"
  → 重置 state.stages.{si}.platforms.{p}.status=pending；清当平台 output；重跑
  → 该 stage.overall_status 重新计算（其他平台 completed → partial）
```

权威算法见 `.claude/agents/orchestrator/recovery.md` § Rerun。

## Dry-Run 模式（Pipeline 预览）

当用户选择"预览 pipeline"或说"dry-run"时执行。**不 spawn 任何 agent，零 token 消耗**。

1. 确定目标：若有指定 slug → 读取该文章的 brief 和 state；若无 → 用 AskUserQuestion 请用户选择
2. 从 `framework/config/inkflow.yaml` 的 stages 列表逐 stage 检查：SKIP 条件、依赖状态、上下文文件、Rule 可用性、Agent 可用性
3. 输出汇总表（stage、状态、agent、model、上下文文件、rules）
4. 用 AskUserQuestion 提供后续操作
