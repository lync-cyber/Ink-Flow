---
name: inkflow
description: >
  InkFlow 内容创作编排器。写文章、创建 brief、继续 pipeline、重跑阶段，均由此 skill 处理。
  触发条件：用户说"写一篇文章"、"开始写作"、"继续 pipeline"、"/inkflow"、"重跑 draft"，
  或直接给出主题（如"写一篇关于 React Hooks 的文章"），都应触发此 skill。
---

# InkFlow 编排器

你是 InkFlow pipeline 的编排器，负责管理内容创作的全生命周期。你运行在主会话上下文中，可以直接与用户交互。

## 1. 初始化

读取以下配置文件，建立运行环境：

1. `.inkflow.yaml` — 项目配置（model_allocation、exports、defaults、domains）
2. `.claude/pipelines/article-writing.yaml` — pipeline 定义（stages、skills/rules 调度、context_files）
3. 判断用户意图：
   - **新建文章**：用户提供了主题 → 进入 Brief 创建
   - **继续 pipeline**：扫描 `.pipeline-states/` 找到有未完成阶段的 state → 继续
   - **重跑阶段**：用户说"重跑 {stage}" → 进入 Rerun 流程
   - **预览 pipeline**：用户说"预览"、"dry-run"、"检查配置" → 进入 Dry-Run 模式
   - **无明确意图**：用 AskUserQuestion 询问

```
AskUserQuestion:
  question: "你想做什么？"
  options:
    - "新建文章" — 从 brief 开始创建新内容
    - "继续未完成的文章" — 恢复之前暂停的 pipeline
    - "重跑某个阶段" — 重新执行已完成的阶段
    - "预览 pipeline" — 检查配置和依赖（不消耗 token）
```

## 2. Brief 创建

当需要新建文章时，通过 AskUserQuestion 分步采集参数。若用户已提供主题，跳过第一步。

**Step 1**: 确认主题（若用户未直接提供）
**Step 2**: 采集内容参数

```
AskUserQuestion (最多 4 个问题并发):
  Q1: "文章类型？" → [深度解析, 快速观点, 教程, 观点评论]
  Q2: "目标读者？" → [技术初学者, 技术中级, 技术高级, 通用读者]
  Q3: "开头风格？" → [痛点切入, 故事开头, 对比反差, 设问, 开门见山, 自动选择]
  Q4: "需要跳过哪些阶段？" → multiSelect: [跳过调研, 不生成配图, 跳过 SEO]
```

**Step 3**: 生成 brief 文件
- 自动生成 slug（中文 pinyin 或英文 kebab-case）
- 读取 `.inkflow.yaml` 的 `defaults` 填充未指定字段
- Brief frontmatter 模板见 `references/brief-template.md`
- 写入 `articles/{slug}/brief.md`
- 创建 `articles/{slug}/` 目录结构

**Step 4**: 确认

```
AskUserQuestion:
  question: "Brief 已生成，请确认"（展示 frontmatter 摘要）
  options:
    - "确认并开始 pipeline"
    - "修改参数" — 重新回答参数问题
    - "手动编辑文件" — 打开 brief 文件让用户编辑
```

初始化 `.pipeline-states/{slug}.json`，标记 brief 阶段为 completed。

## 3. 阶段执行通用算法

从 pipeline YAML 读取 stages 列表，对当前阶段执行：

```
FOR each stage from current_stage to end:

  1. SKIP CHECK
     - 读取 stage.skip_if 条件
     - 从 articles/{slug}/brief.md frontmatter 取值
     - 条件成立 → 标记 skipped，记录 reason，NEXT

  2. DEPENDENCY CHECK
     - 读取 stage.requires
     - 所有依赖 completed 或 skipped → 继续
     - 否则 → 报错

  3. PARALLEL CHECK
     - 若 stage.parallel_with 存在
     - 同时 dispatch 当前阶段和并行阶段的 Agent 调用

  4. CONTEXT ASSEMBLY
     - 读取 stage.context_files（从 pipeline YAML）
     - 替换 {slug} 和 {style_profile} 变量
     - 文件存在则读取，标记为 skipped 的阶段产物跳过
     - 读取对应 agent-memory/{agent}/MEMORY.md

  5. SKILL/RULE INJECTION
     - 从 pipeline YAML 的 skills.stages.{stage} + skills.global 读取 skill 列表
     - 从 pipeline YAML 的 rules.stages.{stage} + rules.global 读取 rule 列表
     - 按 skill 的 condition 字段判断是否注入

  6. SPAWN AGENT
     - 使用 Agent tool 调用 .claude/agents/{agent}.md
     - 传入组装好的上下文 + skill/rule 内容
     - 等待完成

  7. VALIDATE
     - 运行 .claude/skills/inkflow/scripts/contract-validator.sh
     - 通过 → 标记 completed
     - 失败 → 进入错误处理

  8. CHECKPOINT（若 stage.checkpoint == true）
     - 展示产出物摘要
     - 读取 references/checkpoint-prompts.md 获取审核要点
     - 用 AskUserQuestion 请求用户审核
     - 用户确认 → 标记 checkpoint_approved: true
     - 用户要求修改 → 根据选择回退或暂停

  9. STATE UPDATE
     - 更新 .pipeline-states/{slug}.json
     - 追加运行日志到 retro/runs/{run_id}.log.md
```

## 4. Draft 分节循环

Draft 阶段有特殊处理，按 outline 的 section 逐一调用 writer agent：

```
FOR each section in outline:
  - 读取 section 的 depends_on_previous 字段（默认 true）
  - depends_on_previous == false → 可与前序 section 并行
  - 否则 → 等待前序完成，读取其最后两段作为衔接
  - section_index == 0 → 额外注入 opening-hooks skill
  - 调用 writer agent → 输出到 articles/{slug}/drafts/section-{N}.md
  - 校验 section（字数 ±20%、无 forbidden_patterns）

所有 section 完成后合并为 articles/{slug}/drafts/full.md
```

## 5. Refine 子步骤

Refine 阶段按 pipeline YAML 的 sub_agents 顺序执行：

```
1. audit: 调用 editor-audit agent
   - 输出 → articles/{slug}/output/audit.md
   - 更新 sub_steps.audit = completed

2. polish: 调用 editor-polish agent
   - 输入包含 audit 报告
   - 输出 → articles/{slug}/output/final.md
   - 更新 sub_steps.polish = completed
```

## 6. Checkpoint 交互

3 个检查点使用 AskUserQuestion 结构化交互。具体文案和审核要点见 `references/checkpoint-prompts.md`。

**Checkpoint 1（大纲审核）**:
```
AskUserQuestion:
  question: "大纲已生成，请审核"（附大纲摘要 + 审核要点）
  options:
    - "通过，继续写作"
    - "修改特定 section" — 暂停等待用户编辑
    - "重新组织结构" — 重跑 outline 阶段
    - "返回调研阶段" — 重跑 research
```

**Checkpoint 2（终审）**:
```
AskUserQuestion:
  question: "审校和润色已完成"（附审校报告摘要 + 审核要点）
  options:
    - "通过，准备发布"
    - "处理审校问题后重新润色" — 重跑 refine.polish
    - "我需要手动编辑" — 暂停等待用户编辑 output/final.md
    - "返回重写" — 重跑 draft
```

**Checkpoint 3（发布确认）**:
```
AskUserQuestion:
  question: "导出文件已生成"（附文件列表 + 运营元数据摘要）
  options:
    - "确认发布"
    - "调整运营元数据" — 让用户修改
    - "更换导出格式" — 选择不同的 export format
    - "暂不发布" — 标记 completed 但不执行发布
```

## 7. Publish 阶段

Publish 不调用 agent，而是执行 skill 驱动的导出：

1. 从 pipeline YAML 的 skills.stages.publish 加载 wechat-format skill
2. 应用排版规则（inline style、标题层级、代码块）
3. 生成运营元数据（摘要、标签、SEO 标题变体、CTA 文案）
4. 按 .inkflow.yaml 的 exports 配置导出多格式到 articles/{slug}/output/
5. 进入 Checkpoint 3

## 8. 四层错误处理

```
当阶段执行失败时：

L1 重试: 瞬态错误（rate limit、网络）→ 自动重试，最多 2 次
L2 校验失败: contract-validator 报告 violation → 记录 → 重试 1 次
L3 模型降级: 按 .inkflow.yaml 的 model_allocation，Opus 失败 → 降级到 Sonnet
L4 人工介入:
  AskUserQuestion:
    question: "阶段 {stage} 执行失败"（附错误详情）
    options:
      - "重试当前阶段"
      - "跳过此阶段"
      - "降级模型重试"
      - "我来手动处理" — 标记 needs_human，暂停 pipeline
```

## 9. Rerun 支持

当检测到用户想重跑某阶段时：

1. 解析目标阶段名称
2. 确认重跑意图（AskUserQuestion）
3. 重置该阶段及其后续阶段的状态为 pending
4. 从该阶段重新开始执行通用算法

## 10. Pipeline 完成

所有阶段 completed 或 skipped 后：

**10.1 记忆压缩检查**

在展示完成选项前，扫描 `.claude/agent-memory/` 下所有 `MEMORY.md` 文件：
- 统计每个文件中的规则条目数（以 `- ` 开头的行）
- 若任何文件超过 30 条，在完成消息中附加提醒：
  `"{agent} 的工作记忆已有 {N} 条规则（阈值 30），建议运行记忆压缩。"`

**10.2 完成选项**

```
AskUserQuestion:
  question: "Pipeline 已完成！接下来做什么？"（若有记忆压缩提醒，附在问题描述中）
  options:
    - "运行反馈闭环" — 提示触发 feedback-loop skill
    - "分析写作风格" — 提示触发 style-analyzer skill（首次使用推荐）
    - "开始新文章" — 重新进入 Brief 创建
    - "结束" — 退出
```

## 11. Dry-Run 模式（Pipeline 预览）

当用户选择"预览 pipeline"或说"dry-run"时执行。**不 spawn 任何 agent，零 token 消耗**。

**流程**：

1. 确定目标：
   - 若有指定 slug → 读取该文章的 brief 和 state
   - 若无 → 用 AskUserQuestion 请用户选择（已有文章列表或"使用默认配置预览"）

2. 读取 pipeline YAML，逐 stage 检查：

```
FOR each stage in pipeline:

  a. SKIP 条件评估
     - 读取 stage.skip_if
     - 从 brief frontmatter 取值（若有 brief）
     - 输出: "跳过" 或 "执行"，附原因

  b. 依赖状态检查
     - 读取 stage.requires
     - 从 .pipeline-states/{slug}.json 检查依赖状态（若有 state）
     - 输出: "依赖满足" 或 "依赖未满足: {stage} 状态为 {status}"

  c. 上下文文件检查
     - 读取 stage.context_files
     - 替换 {slug} 和 {style_profile} 变量
     - 用 Glob 检查每个文件是否存在
     - 输出: "✓ 存在" 或 "✗ 缺失"

  d. Skill/Rule 可用性检查
     - 从 pipeline YAML 读取 stage 对应的 skills 和 rules
     - 用 Glob 检查每个 skill/rule 文件是否存在
     - 输出: "✓ 可用" 或 "✗ 未找到: {path}"

  e. Agent 可用性检查
     - 检查 .claude/agents/{agent}.md 是否存在
     - 读取 agent 的 model 字段，与 .inkflow.yaml 的 model_allocation 交叉验证
     - 输出: "✓ {agent} (model: {model})" 或 "✗ agent 文件不存在"
```

3. 输出汇总表：

```markdown
## Pipeline 预览: {pipeline_name}

| Stage | 状态 | Agent | Model | 上下文文件 | Skills | Rules |
|-------|------|-------|-------|-----------|--------|-------|
| brief | ✓ completed | (user) | - | - | - | - |
| research | → 跳过 (skip_research=true) | researcher | sonnet | brief.md ✓ | - | - |
| outline | → 待执行 | outliner | opus | brief.md ✓, research.md ✗ | - | wechat-platform |
| ... | | | | | | |

### 问题清单
- ⚠ outline: context_file `articles/{slug}/research.md` 不存在（research 被跳过，正常）
- ✗ draft: skill `anti-ai-style` 未找到（检查 .claude/skills/domains/ 目录）

### 配置摘要
- 领域: wechat-article
- 导出格式: wechat_md, plain_md, html, summary
- 检查点: outline (Checkpoint 1), refine (Checkpoint 2), publish (Checkpoint 3)
```

4. 用 AskUserQuestion 提供后续操作：

```
AskUserQuestion:
  question: "预览完成。要执行 pipeline 还是修复问题？"
  options:
    - "开始执行 pipeline" — 进入正常执行流程
    - "返回" — 退出预览
```
