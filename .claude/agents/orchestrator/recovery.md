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

1. 扫描 `runtime/pipeline-states/*.json`，找 `status != completed` 的最新记录
2. 对每个 completed 前置阶段做 **artifact integrity check**（文件存在且 `size > 0`）
3. 缺失 → 该阶段重置为 pending；告知用户
4. `in_progress` 且 `started_at` >30min → stale lock → 问用户（重跑/跳过/取消）

### Section 级恢复（仅 draft）

state.draft.sections 数组中，从第一个非 completed 的 section 继续。
已 completed 的 section-{NN}.md 文件不在则重跑该 section。

## Rerun

支持两种粒度：**全量重跑**（影响所有 per-platform 平台）与 **per-platform 重跑**（只影响指定平台）。

```
用户输入解析：
  "重跑 {stage}"            → 全量重跑（旧语义）
  "重跑 {stage}.{platform}"  → per-platform 重跑（新语义，需 stage.per_platform == true）
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
     d. 确认 → 仅重置 state.stages.{stage_i}.platforms.{platform}.status = pending
            清除该平台的 output 文件（路径含 {platform}）
            stage_i.overall_status 重新计算（其他平台 completed → overall = partial）

3. ELSE（全量重跑或非 per_platform stage）：
     a. AskUserQuestion: "重跑 {stage} 会重置所有后继 [...]。确认？"
     b. 确认 → 全部后继 status=pending；清除全部对应 output；重跑

设计动机（C4）：
- per-platform 失败隔离已在 fanout.md:53-57 落地；rerun 也应同等粒度
- 重跑 polish.wechat 不应使 polish.zhihu 也变 pending（双倍 token 浪费）
```

## Dry-Run

```
用户: "预览 / dry-run / 检查配置"
不消耗 token：
  1. 读 framework/config/inkflow.yaml，验证 stages 定义无循环
  2. 检查 agent frontmatter 中 model_allocation 与配置一致
  3. 检查 artifact-layout.yaml 所有路径模板可解析
  4. 列出将按顺序执行的 agent 和预计产物路径
  5. 列出 skip_if 命中情况
```

详情：`.claude/skills/pipeline-orchestrating/references/rerun-and-dryrun.md`
