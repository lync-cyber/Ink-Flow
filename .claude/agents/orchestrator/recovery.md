# orchestrator / recovery 模块

## 四层错误处理

| 层级 | 触发 | 策略 | token 成本 |
|---|---|---|---|
| **L1** | 瞬时错误（rate limit, timeout） | 自动重试 ≤2 次 | 0 |
| **L2** | 校验违规（validation failed） | 调 state-writer 写 `{retries+=1, violations:[...]}`，然后重跑 1 次，把 violation 注入 agent Context 段 | 低 |
| **L3** | L2 失败且当前模型为 Opus | 调 state-writer 写 retries+=1，降级到 Sonnet 重跑 1 次 | 中 |
| **L4** | L3 失败 | `AskUserQuestion`（重试 / 跳过 / 手动修复）；用户决议后写 state | 人工 |

详情：`.claude/skills/pipeline-orchestrating/references/error-handling.md`

## 中断恢复

详情：`.claude/skills/pipeline-orchestrating/references/interrupt-recovery.md`

### 启动恢复检查

1. 扫描 `runtime/pipeline-states/*.json`，找 `status != completed` 的最新记录
2. 调 `state-writer.md § 对齐断言` 的 `assert_state_artifact_alignment(slug)`
3. error（state completed 但产物缺失）→ 该阶段重置为 pending，告知用户
4. warning（产物存在但 state pending）→ AskUserQuestion 问是否把 state 修正为 completed
5. `in_progress` 且 `started_at` >30min → stale lock → 问用户（重跑/跳过/取消）

### Section 级恢复（仅 draft）

state.draft.sections 数组中，从第一个非 completed 的 section 继续。
已 completed 的 section-{NN}.md 文件不在则重跑该 section。

## Rerun

支持两种粒度：**全量重跑**（影响所有 per-platform 平台）与 **per-platform 重跑**（只影响指定平台）。

```
用户输入解析：
  "重跑 {stage}"            → 全量重跑
  "重跑 {stage}.{platform}"  → per-platform 重跑（需 stage.per_platform == true）
  "重跑 {stage} --platform {p}"  → 等价写法

算法：

1. 读 state，找到 {stage} 在 inkflow.yaml 的定义
2. IF stage.per_platform == true 且用户给了 {platform}：
     a. 校验 {platform} ∈ brief.target_platforms；否则报错退出
     b. 找出"同平台后继链"：
        - 从 {stage} 起，逐 stage 向后扫
        - 若后继 stage.per_platform == true → 只算该平台子状态
        - 若后继 stage.per_platform == false：
          · run_if 与 {platform} 相关时纳入
          · 否则跳过
     c. AskUserQuestion: "重跑 {stage}.{platform}（独立隔离），影响平台内后继 [outline.{p}, draft.{p}, ...]。
        其他平台（{others}）不受影响。确认？"
     d. 确认 → 调 state-writer update_state(stage_i, {status:pending}, platform=p)
            清除该平台的 output 文件（路径含 {platform}）
            stage_i.overall_status 由 state-writer 自动重算

3. ELSE（全量重跑或非 per_platform stage）：
     a. AskUserQuestion: "重跑 {stage} 会重置所有后继 [...]。确认？"
     b. 确认 → 调 state-writer 将全部后继置 pending；清除全部对应 output；重跑
```

## Dry-Run

```
用户: "预览 / dry-run / 检查配置"
不消耗 token：
  1. 读 framework/config/inkflow.yaml，验证 stages 定义无循环
  2. 检查 agent frontmatter 中 model_allocation 与配置一致
  3. 检查 artifact-layout.yaml 所有路径模板可解析
  4. 调 state-writer.md § 对齐断言 PROC assert_state_artifact_alignment(slug)
     列出 error/warning，不修复
  5. 列出将按顺序执行的 agent 和预计产物路径
  6. 列出 skip_if 命中情况
```

详情：`.claude/skills/pipeline-orchestrating/references/rerun-and-dryrun.md`
