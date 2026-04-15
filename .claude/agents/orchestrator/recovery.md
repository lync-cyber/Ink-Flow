# orchestrator / recovery 模块

## 四层错误处理

| 层级 | 触发 | 策略 | token 成本 |
|---|---|---|---|
| **L1** | 瞬时错误（rate limit, timeout） | 自动重试 ≤2 次 | 0 |
| **L2** | 校验违规（validation failed） | 记录 violation 上下文 → 重跑 1 次，把 violation 注入 agent Context 段 | 低 |
| **L3** | L2 失败且当前模型为 Opus | 降级到 Sonnet 重跑 1 次 | 中 |
| **L4** | L3 失败 | `AskUserQuestion`（重试 / 跳过 / 手动修复） | 人工 |

详情：`.claude/skills/pipeline-orchestrating/references/error-handling.md`

## 中断恢复

详情：`.claude/skills/pipeline-orchestrating/references/interrupt-recovery.md`

### 启动恢复检查

1. 扫描 `workspace/pipeline-states/*.json`，找 `status != completed` 的最新记录
2. 对每个 completed 前置阶段做 **artifact integrity check**（文件存在且 `size > 0`）
3. 缺失 → 该阶段重置为 pending；告知用户
4. `in_progress` 且 `started_at` >30min → stale lock → 问用户（重跑/跳过/取消）

### Section 级恢复（仅 draft）

state.draft.sections 数组中，从第一个非 completed 的 section 继续。
已 completed 的 section-{NN}.md 文件不在则重跑该 section。

## Rerun

```
用户: "重跑 {stage}"
1. 读 state，找到 {stage} 及其所有后继
2. AskUserQuestion: "重跑 {stage} 会使后续 [outline, draft, ...] 重置。确认？"
3. 确认 → {stage} 及所有后继 status=pending；清除其 output 文件；重跑
```

## Dry-Run

```
用户: "预览 / dry-run / 检查配置"
不消耗 token：
  1. 读 config/inkflow.yaml，验证 stages 定义无循环
  2. 检查 agent frontmatter 中 model_allocation 与配置一致
  3. 检查 artifact-layout.yaml 所有路径模板可解析
  4. 列出将按顺序执行的 agent 和预计产物路径
  5. 列出 skip_if 命中情况
```

详情：`.claude/skills/pipeline-orchestrating/references/rerun-and-dryrun.md`
