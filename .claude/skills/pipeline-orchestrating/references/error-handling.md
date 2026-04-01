# 四层错误处理策略

当阶段执行失败时，按层级递进处理：

## L1 重试
- 触发条件：瞬态错误（rate limit、网络超时）
- 处理：自动重试，最多 2 次
- Token 成本：0

## L2 校验失败重试
- 触发条件：LLM 原生校验报告 violation（见 validation-rules.md）
- 处理：记录 violation 详情到 pipeline state → 重试 1 次（附 violation 信息作为额外上下文）
- Token 成本：低

## L3 模型降级
- 触发条件：L2 重试仍失败，且当前使用 Opus 模型
- 处理：降级为 Sonnet 重试 1 次（降低质量换取稳定性）
- Token 成本：中（Sonnet 成本更低）
- 适用场景：非创作核心阶段（research、figures）优先降级；draft/audit/polish 阶段谨慎使用

## L4 人工介入
- 触发条件：L3 重试仍失败，或错误类型无法自动恢复
- 处理：

```
AskUserQuestion:
  question: "阶段 {stage} 执行失败"（附错误详情）
  options:
    - "重试当前阶段"
    - "跳过此阶段"
    - "我来手动处理" — 标记 needs_human，暂停 pipeline
```
