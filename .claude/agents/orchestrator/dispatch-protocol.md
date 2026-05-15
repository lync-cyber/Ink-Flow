# orchestrator / dispatch-protocol 模块

> **orchestrator 调度协议**：用户意图识别 → preset 解析 → 主循环推进 → execution_mode 路由 → checkpoint 自动通过 → stop_after 终止。

## 启动协议

1. 读 `framework/config/inkflow.yaml` 建立运行环境（`stages` / `presets` / `model_allocation` / `defaults`）
2. 读 `framework/config/artifact-layout.yaml` 取产物路径模板
3. 识别用户意图，按下表分派：

| 用户意图 | 处理方式 |
|---|---|
| 提供主题 / 新建文章 | → 模块 `brief.md`（采集 brief + preset 选择） |
| "继续"、发现 `runtime/pipeline-states/*.json` 有未完成阶段 | → 本模块 § 主循环（resume） |
| "重跑 {stage}" | → 模块 `recovery.md` § Rerun |
| "预览 / dry-run / 检查配置" | → 模块 `recovery.md` § Dry-Run |
| "排期 / 数据分析 / 发布清单 / 学习材料" | 提示用户触发对应 skill，不进入 pipeline |
| 意图不明 | 调 `ask-user.md` `ask_user`（见下） |

```
ask_user(
  question="你想做什么？",
  options=["新建文章 (full)", "快速写一篇 (quick · ~10min)", "草稿模式 (draft)", "继续未完成的文章", "重跑某个阶段", "预览 pipeline", "学习参考材料"],
)
```

所有 orchestrator 与用户的结构化交互一律经 `ask-user.md` 的 `ask_user`，失败自动降级纯文本询问。

## 主循环

### 初始化

```
读 brief.preset（默认 full）
  → 从 inkflow.yaml.presets[brief.preset].fields 把字段合并到 brief（用户显式字段优先）

读 brief 派生的 4 个调度参数：
  - execution_mode    ∈ {subagent, inline}    ← 决定 stage 由谁执行
  - auto_checkpoints  ⊆ [CP1, CP2, CP3]       ← 哪些 checkpoint 自动通过
  - stop_after        ∈ {null, brief, research, atoms, outline, draft, audit, polish, publish}  ← 推进到该 stage 完成即停
  - target_platforms  ⊆ [wechat, xiaohongshu, zhihu, juejin]
single_platform = len(brief.target_platforms) == 1   # 单平台快通道标记
```

### 主循环

```
FOR each stage from current to end:

    # 1. STOP_AFTER 终止判断
    IF prev_stage == brief.stop_after:
        ask_user("已推进到 {prev_stage} 完成（stop_after 指定终点），是否继续？")
        IF 否：写 state 标记 paused_by_stop_after，退出主循环

    # 2. PER_PLATFORM 派发
    IF stage.per_platform == true:
        IF single_platform:
            → 调用 stages.md 单播算法；{platform} 注入为 brief.target_platforms[0]
              state 仍写到 stages.{stage}.platforms.{p} 维持 schema 一致
        ELSE:
            → 调用 fanout.md（按 brief.target_platforms 并行派发 + 收敛）
    ELSE:
        → 调用 stages.md 的通用算法（单播）

    # 3. CHECKPOINT 处理（含 auto-approve）
    IF stage.checkpoint == true:
        cp_id = mapping_table[stage]   # outline→CP1, polish→CP2, publish→CP3
        IF cp_id ∈ brief.auto_checkpoints:
            写 state.checkpoints.{cp_id} = {decision: auto_approved, reason: "preset={brief.preset}"}
            打印一行提示："[{cp_id}] 自动通过（preset=quick）"
            CONTINUE
        ELSE:
            → 调用 checkpoints.md 对应段（人工审核）

    # 4. 错误处理
    IF 出错:
        → 调用 recovery.md（L1-L4 + 中断恢复 + 单平台重跑）

结束 → 按模块 brief.md § 完成后建议 触发后续 skill
```

## execution_mode 路由

`stages.md` 的 `SPAWN AGENT` 步骤按本字段决策：

| execution_mode | 行为 | 适用场景 |
|---|---|---|
| `subagent`（默认） | 调 `Agent` tool 启动独立 subagent，隔离上下文，main 仅收摘要 | 多平台 / 长文 / 完整流程；输出量大、要避免污染 main context |
| `inline` | **main agent 即 orchestrator 自己执行**对应 agent 的指令 —— Read 该 agent 的 AGENT.md，按其 Constraints / Workflow 在同对话内直接产出文件，不调 Agent tool | 单平台 / 短文 / quick 或 draft preset；用户希望全程可见、随时插话 |

### inline 模式的执行细则

1. **加载 agent 指令**：Read 目标 agent 的 `.claude/agents/{agent}/AGENT.md` + 其 `dependencies.modules` 中列出的所有子模块文件
2. **加载 Profile 切片**：Read 该 agent frontmatter `profileSlots.required` 列出的 `runtime/profile-resolved/*` 文件
3. **加载任务制品**：Read 该 agent `dependencies.artifacts` 中列出的产物
4. **执行 Workflow**：完全按目标 agent 的 `## Workflow` / `## Constraints` 段在同一对话内产出文件（用 Write / Edit）
5. **自检**：对照该 agent 的 `## Exit Criteria` 自检；不通过则修；连续 2 次不通过 → 抛错走 recovery
6. **state 写回**：仍调 `state-writer.md` `update_state`，与 subagent 模式一致
7. **不要在 inline 模式下再调 Agent tool 派发同一 agent**（会绕圈）

### 何时强制 subagent 模式（覆盖 brief.execution_mode）

下列情况即使 `brief.execution_mode == inline`，也必须 fallback 到 subagent：

- 多平台 fanout（`stage.per_platform == true && len(brief.target_platforms) > 1`）—— 并行派发只能用 subagent
- agent frontmatter 标注 `requires_subagent: true`
- main context 已 ≥ 70% 占用（粗略估）—— 避免溢出

打印一行提示："stage={stage} execution_mode 由 inline 降级为 subagent，原因：{reason}"

## auto_checkpoints 协议

| brief.preset | brief.auto_checkpoints | 行为 |
|---|---|---|
| `full` | `[]`（默认） | CP1/CP2/CP3 全部人工审核 |
| `quick` | `[CP1, CP2]` | CP1/CP2 自动通过（state 记录 `decision: auto_approved`），仅 CP3 人工 |
| `draft` | `[]` | 仅 CP1 出现（CP2/CP3 因 stop_after=draft 不会触达） |

**auto_approved 的硬约束**：
- 仅在 stage 自身 validation `passed=true` 时触发；validation 失败必须人工
- 仍需要 lint W1-W4 = 0（publisher 守门），不放水
- state 中明确记录 `decision: auto_approved` 与 `preset` 来源，便于事后复盘

## stop_after 协议

- 用户可在 brief frontmatter 写 `stop_after: <stage_name>` 显式终止
- preset=draft 默认 `stop_after: draft`
- 触达后 orchestrator 调 `ask_user`：选项 = ["完成、退出 pipeline" / "继续推进剩余 stage" / "重跑当前 stage"]
- 退出时 state 写 `paused_by_stop_after: true`，`current_stage: <stage>`，可 resume

## resume 路径

用户说"继续"或新对话进入时：

```
1. Glob runtime/pipeline-states/*.json 找未 completed 的 slug
2. 多个 → ask_user("有 N 篇未完成，继续哪一篇？")
3. 单个 → 直接读，定位 current_stage
4. 重新读 brief frontmatter（preset / execution_mode / auto_checkpoints 都可能被用户编辑过）
5. 跳到主循环 FROM current_stage
```

## 与其他模块的边界

| 模块 | 何时调用 |
|---|---|
| `brief.md` | 启动协议步骤 3 命中"新建文章" |
| `stages.md` | 主循环单播分支 |
| `fanout.md` | 主循环 per_platform 多平台分支 |
| `checkpoints.md` | 主循环 checkpoint 分支（且未命中 auto_checkpoints） |
| `recovery.md` | 主循环错误处理 / "重跑" / "dry-run" |
| `state-writer.md` | 所有 state 写回 |
| `lifecycle.md` | CP3 通过后；运营 skill 调用 |
| `ask-user.md` | 所有结构化交互 |
