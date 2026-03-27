# InkFlow — 通用 LLM 辅助内容创作工作流框架

## 项目名称

| 中文名 | 英文名 | 记忆点 |
|--------|--------|--------|
| 墨流 | InkFlow | 墨水流动 → 写作流水线，ink 暗示手写质感而非 AI 味 |

---

## 一、设计哲学

### 核心矛盾

LLM 辅助写作的核心矛盾不是"AI 能不能写"，而是**"AI 做错了用户能不能发现"**。

- 信息收集和结构化：AI 做得好，错误容易发现 → AI 主导
- 观点判断和行文风格：AI 做得一般，错误难以发现 → 用户主导

### 五条原则

1. **交接协议原则**：每次交给用户的不是 yes/no 问题，而是有具体内容可判断的产出物
2. **上下文隔离原则**：每个阶段使用独立 subagent，避免调研噪音污染写作上下文
3. **记忆升级原则**：工作记忆（agent 自动积累）→ 正式规则（用户手动晋升）
4. **契约驱动原则**：每个 agent 有明确的输入/输出契约和完成标准，脚本可校验
5. **声明式流水线原则**：pipeline 通过 YAML 清单定义，框架不绑定具体领域

### 通用化定位

InkFlow 是一个**通用的 LLM 辅助内容创作工作流框架**，公众号文章写作是其**参考实现**。框架核心只理解 pipeline manifest schema，不理解具体创作领域。其他场景（技术文档、代码评审报告、翻译、教程）只需新建 pipeline manifest + 领域 skill 包即可。

---

## 二、技术路线

**选型：Claude Code 原生方案**（subagent + skill + slash command + hook + memory）

选择理由：

- Subagent 天然提供上下文隔离 —— 每个 agent 独立上下文窗口
- Agent memory（v2.1.33+）原生支持持久化学习
- 零外部依赖，一个 git clone + 配置 `.claude/` 目录就能运行
- Slash command 提供用户友好的交互入口

**架构增强**（相对于纯原生方案）：

| 增强项 | 实现方式 | 作用 |
|--------|----------|------|
| 声明式 Pipeline | `.claude/pipelines/*.yaml` | 解耦流水线定义与实现 |
| 显式状态管理 | `pipeline-state.json` | 崩溃恢复、前置校验、可观测性基础 |
| 脚本预检验 | `contract-validator.sh` | 零 token 成本的输出校验 |
| 结构化运行日志 | `retro/runs/*.log.md` | 人类可读的运行追踪 |

---

## 三、Pipeline Manifest — 声明式流水线定义

### 3.1 Manifest Schema

每个 pipeline 通过 YAML 清单定义，存放在 `.claude/pipelines/` 目录：

```yaml
# .claude/pipelines/article-writing.yaml
name: article-writing
description: 公众号文章写作 pipeline

stages:
  - name: brief
    type: user_input              # 用户填写，非 agent 执行
    command: /brief

  - name: research
    agent: researcher
    command: /research
    skip_if: "brief.skip_research == true"   # 观点类文章可跳过调研

  - name: outline
    agent: outliner
    command: /outline
    checkpoint: true              # 用户审核点
    requires: [brief]

  - name: draft
    agent: writer
    command: /draft
    requires: [outline]

  - name: figures
    agent: illustrator
    command: /figures
    skip_if: "brief.no_figures == true"      # 条件跳过
    requires: [draft]

  - name: refine                  # 合并原 /review + /polish
    agent: editor
    command: /refine
    checkpoint: true
    requires: [draft]

  - name: publish
    command: /publish
    checkpoint: true

skills:
  global: [fact-check]
  stages:
    draft: [anti-ai-style, style-reference]
    publish: [wechat-format]
```

### 3.2 Manifest 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | Y | 阶段唯一标识 |
| `type` | N | `user_input`（用户手动完成）或默认 `agent`（agent 执行） |
| `agent` | N | 对应 `.claude/agents/` 下的 agent 名 |
| `command` | Y | 对应的 slash command |
| `checkpoint` | N | `true` 表示该阶段后暂停等待用户审核 |
| `skip_if` | N | 跳过条件，基于 brief frontmatter 的 key == value 匹配 |
| `requires` | N | 前置依赖阶段列表，编排器校验其 status 为 completed/skipped |

### 3.3 条件跳过机制

编排器 `/run` 在推进到每个阶段前：

1. 解析 `skip_if` 表达式（简单的 key == value 匹配，不引入表达式引擎）
2. 从 `briefs/{topic}.md` frontmatter 中读取对应字段
3. 条件成立 → 将该阶段标记为 `skipped`，写入 state，跳到下一阶段
4. 条件不成立或无 `skip_if` → 正常执行

Brief frontmatter 示例：

```yaml
---
topic: "Agent 执行3小时任务不炸上下文的三层策略"
skip_research: false
no_figures: true
---
```

---

## 四、显式状态管理

### 4.1 State 文件

在项目根目录维护 `pipeline-state.json`，所有 slash command 读写此文件：

```json
{
  "pipeline": "article-writing",
  "run_id": "2026-03-27-agent-strategies",
  "created_at": "2026-03-27T10:00:00",
  "current_stage": "draft",
  "stages": {
    "brief":    { "status": "completed", "artifacts": ["briefs/agent-strategies.md"] },
    "research": { "status": "completed", "artifacts": ["research/memo.md"] },
    "outline":  { "status": "completed", "checkpoint_approved": true },
    "draft":    { "status": "in_progress", "started_at": "2026-03-27T10:20:00" },
    "figures":  { "status": "skipped", "reason": "brief.no_figures == true" },
    "refine":   { "status": "pending" },
    "publish":  { "status": "pending" }
  },
  "token_usage": {
    "research": { "input": 12000, "output": 3000 },
    "outline":  { "input": 8000, "output": 2000 }
  }
}
```

### 4.2 Stage 状态流转

```
pending → in_progress → completed
                      → failed → (retry) → in_progress
                      → needs_human
pending → skipped (skip_if 条件满足)
completed → in_progress (/rerun 重跑)
```

### 4.3 作用

- **崩溃恢复**：重启后读取状态，从断点继续（对标 LangGraph 的 durable execution）
- **前置校验**：每个 command 启动时检查 `requires` 依赖阶段是否 completed/skipped
- **可观测性基础**：错误处理、日志、retro 都依赖此文件
- **条件跳过**：`skipped` 状态记录跳过原因

---

## 五、编排与执行

### 5.1 编排器 `/run` 命令

读取 pipeline manifest + state，自动推进到下一阶段：

1. 读 `pipeline-state.json` 找到当前阶段
2. 若当前阶段有 `skip_if` 且条件满足 → 标记 `skipped`，推进
3. 若当前阶段是 checkpoint → 提示用户审核，等待确认
4. 若当前阶段是 agent 阶段 → 调度对应 slash command
5. Agent 完成 → 运行 L2 校验 → 更新 state
6. 推进到下一阶段或停在下一个 checkpoint

**不替代**单独执行命令 — 用户仍可 `/draft` 单独运行某阶段用于调试。

### 5.2 阶段重跑 `/rerun <stage>`

支持单独重跑任意已完成或失败的阶段：

```bash
/rerun draft              # 重跑 draft 阶段
/rerun research --force   # 强制重跑（忽略已 completed 状态）
```

执行逻辑：

1. 读 `pipeline-state.json`，定位目标阶段
2. 校验 `requires` 依赖是否满足
3. 将目标阶段 status 重置为 `in_progress`
4. 调度对应 agent
5. **不影响后续阶段状态** — 后续阶段保持原状，用户决定是否需要级联重跑

重跑时在 run log 中标记 `(rerun)` 以便追踪。

---

## 六、Pipeline 总览

```
┌───────────────────────────────────────────────────────────┐
│              InkFlow Pipeline (通用化)                      │
│                                                           │
│  pipeline.yaml ──→ pipeline-state.json ──→ run.log.md    │
│  (声明式定义)       (显式状态)              (可观测性)     │
│                                                           │
│  /run (编排器) 或 单独执行各阶段命令                       │
│                                                           │
│  Stage 1: /brief ──→ 用户输入                             │
│  Stage 2: /research ──→ researcher  [contract] [validate] │
│           [skip_if: brief.skip_research]                  │
│  Stage 3: /outline ──→ outliner [contract] ★ Checkpoint   │
│  Stage 4: /draft ──→ writer [contract] [validate]         │
│  Stage 5: /figures ──→ illustrator [contract]             │
│           [skip_if: brief.no_figures]                     │
│  Stage 6: /refine ──→ editor [contract] ★ Checkpoint      │
│  Stage 7: /publish ──→ 导出 ★ Checkpoint                  │
│                                                           │
│  写后学习:                                                │
│  /feedback ──→ diff + 分类确认 → 更新 memory              │
│  /retro ──→ 3 指标 + 晋升建议                             │
│                                                           │
│  /rerun <stage> ──→ 单独重跑任意阶段                      │
│                                                           │
│  [contract] = 输入/输出契约 + exit criteria                │
│  [validate] = L1-L4 四层错误处理（L2 含脚本预检验）       │
└───────────────────────────────────────────────────────────┘
```

7 个阶段（含 2 个可条件跳过），3 个用户检查点，2 个写后学习步骤。

---

## 七、项目目录结构

```
inkflow/
├── CLAUDE.md                              # 项目全局规则
│
├── .claude/
│   ├── pipelines/                         # 声明式流水线定义
│   │   └── article-writing.yaml           # 公众号写作 pipeline（参考实现）
│   │
│   ├── agents/                            # Subagent 定义（RCCF 结构 + 契约）
│   │   ├── _template.md                   # 新 agent 模板
│   │   ├── researcher.md
│   │   ├── outliner.md
│   │   ├── writer.md
│   │   ├── illustrator.md
│   │   ├── editor.md
│   │   └── style-analyzer.md
│   │
│   ├── commands/                          # Slash command
│   │   ├── run.md                         # 编排器
│   │   ├── rerun.md                       # 阶段重跑
│   │   ├── brief.md
│   │   ├── research.md
│   │   ├── outline.md
│   │   ├── draft.md
│   │   ├── figures.md
│   │   ├── refine.md                      # 合并原 review + polish
│   │   ├── publish.md
│   │   ├── analyze-style.md
│   │   ├── feedback.md
│   │   ├── retro.md
│   │   └── memory-compact.md
│   │
│   ├── validators/                        # 输出校验引擎
│   │   └── contract-validator.sh          # 通用校验脚本（数据驱动，不硬编码规则）
│   │
│   ├── skills/
│   │   ├── core/                          # 通用 skill — 随框架发布
│   │   │   ├── fact-check/SKILL.md
│   │   │   └── de-ai-polish/SKILL.md
│   │   └── domains/
│   │       └── wechat-article/            # 领域 skill 包 — 按需引入
│   │           ├── anti-ai-style/SKILL.md
│   │           ├── wechat-format/SKILL.md
│   │           └── style-reference/SKILL.md
│   │
│   └── agent-memory/                      # 持久化工作记忆
│       ├── writer/MEMORY.md
│       ├── outliner/MEMORY.md
│       ├── researcher/MEMORY.md
│       └── editor/MEMORY.md
│
├── pipeline-state.json                    # 显式 pipeline 状态（运行时生成）
│
├── styles/                                # 风格参考系统
│   ├── exemplar-01.md
│   ├── exemplar-02.md
│   ├── exemplar-03.md
│   └── style-profile.md
│
├── briefs/                                # 写作指令卡
├── research/                              # 调研备忘录
├── outlines/                              # 大纲
├── drafts/                                # 各 section 草稿
├── figures/                               # SVG / Mermaid 配图
├── output/                                # 最终 Markdown 成品
└── retro/                                 # 复盘 + 运行日志
    └── runs/                              # 结构化运行日志
```

---

## 八、Agent 设计

### 8.1 统一提示词结构（RCCF）

所有 agent `.md` 文件统一为 **Role + Context + Constraints + Format + Exit Criteria** 结构：

```markdown
---
name: {agent-name}
description: {一行描述}
tools: {工具列表}
model: {sonnet|opus}
memory: project
validation_rules:
  required_sections: [...]
  word_count: { min: N, max: N }
  required_patterns: [...]
  forbidden_patterns: [...]
---

## Role
你是一个专注于 [具体职责] 的 [角色名]。

## Context
你在 InkFlow pipeline 的 [阶段名] 阶段运行。
启动前需读取以下文件: [列表]

## Constraints
- [硬约束 1]
- [硬约束 2]
- 禁止: [显式禁令]

## Format
输出必须遵循以下结构:
[带占位符的模板]

## Input Contract
- [前置文件和条件]

## Output Contract
- [必须产出的文件和内容结构]

## Exit Criteria
完成条件:
- [具体可验证的标准 1]
- [具体可验证的标准 2]
```

### 8.2 Agent 无状态化

Slash command 负责"组装上下文"，agent 只负责"生成输出"：

```
Slash Command 职责:
  1. 读 pipeline-state.json 获取当前状态
  2. 读前置阶段的输出产物
  3. 读相关 memory 和 skill 文件
  4. 组装完整 prompt → 调用 agent
  5. 运行 contract-validator.sh 校验输出
  6. 更新 pipeline-state.json

Agent 职责:
  接收完整输入 → 按 RCCF 结构执行 → 输出符合 contract 的结果
```

Agent 可独立测试，不依赖 pipeline 上下文。

### 8.3 六个 Agent 详细设计

#### researcher — 调研 agent

```yaml
---
name: researcher
description: 根据写作 brief 进行针对性调研，收集事实、代码片段和对比材料。
tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
model: sonnet
memory: project
validation_rules:
  required_sections: ["关键事实", "代码片段", "对比表格", "不确定项"]
  word_count: { min: 500, max: 5000 }
  required_patterns: ["\\[来源\\]\\(http"]
  forbidden_patterns: ["TODO", "待补充"]
---
```

**Role**：信息猎手，按 brief 中的调研清单逐项搜索。

**Output Contract**：
- 创建 `research/{topic}-memo.md`，包含：关键事实列表（每条带来源 URL）、代码片段（带出处）、对比表格、不确定项标注
- 所有产出写入 `research/` 目录

**Exit Criteria**：
- brief 中每个 research_question 至少有一条发现，或被显式标记为"未解决"
- 不确定项不超过总发现数的 30%

**记忆内容**：信息源可靠性评级、曾经出错的事实记录、用户偏好的调研深度

#### outliner — 大纲 agent

```yaml
---
name: outliner
description: 基于调研备忘录生成结构化大纲，每个 section 包含论点、预估字数、关键细节和不确定项。
tools: Read, Write, Edit, Glob
model: opus
memory: project
validation_rules:
  required_sections: ["论点", "关键细节", "预估字数"]
  word_count: { min: 300, max: 2000 }
  forbidden_patterns: ["TODO"]
---
```

**Role**：结构设计师，从调研素材中提炼有判断力的论点框架。

**Constraints**：
- 论点不能"正确但无聊"——需要体现对读者痛点的判断
- 读取 styles/style-profile.md 确定开头切入方式和结尾收束方式

**Exit Criteria**：
- 每个 section 有明确的论点陈述（非描述性标题）
- 总预估字数与 brief 目标字数偏差 ≤ 20%

**记忆内容**：用户调整过的大纲模式、section 数量偏好、不确定项的处理倾向

#### writer — 写作 agent

```yaml
---
name: writer
description: 按大纲逐 section 生成文章正文，每次只写一个 section。
tools: Read, Write, Edit, Glob
model: opus
memory: project
skills: [anti-ai-style]
validation_rules:
  word_count: { min: 200, max: 3000 }
  forbidden_patterns: ["值得注意的是", "显而易见", "毋庸置疑", "不难发现", "综上所述", "接下来我们来看"]
---
```

**Role**：执笔者，在风格约束下逐 section 产出正文。

**Constraints**：
- 每个 section 的 prompt 注入 anti-ai-style skill 规则 + styles/style-profile.md 风格规则
- 接收前一个 section 的最后两段保持衔接
- 每个 section 选 1 篇主题最相关的参考文章作为 few-shot 示例
- 严格控制字数在大纲预估的 ±20% 范围内

**Exit Criteria**：
- 字数在大纲预估 ±20% 内
- 无 anti-ai-style 禁用词汇/句式
- 每个 section 至少一处代码引用或具体数字

**记忆内容**：用户偏好的句式、被反复删除的写法模式（禁用清单）、字数偏好

#### illustrator — 配图 agent

```yaml
---
name: illustrator
description: 根据文章内容生成配图，包括架构图（SVG/Mermaid）、对比表格和概念示意图。
tools: Read, Write, Bash
model: sonnet
validation_rules:
  required_patterns: ["```mermaid|<svg|```"]
---
```

**Role**：视觉表达者，将复杂概念转化为图表。

**Constraints**：
- 架构图 / 流程图：用 SVG 或 Mermaid
- 对比表格：Markdown 表格，直接嵌入正文
- 不需要持久化记忆——每篇文章的配图需求不同

**注意**：此阶段默认可选，通过 brief frontmatter `no_figures: true` 跳过。

#### editor — 审校 agent（含润色）

```yaml
---
name: editor
description: 对文章进行独立审校和去 AI 味润色。检查事实准确性、论证完整性、AI 味、风格一致性。
tools: Read, Write, Grep, Glob, WebSearch, WebFetch
model: opus
memory: project
skills: [fact-check, de-ai-polish]
validation_rules:
  required_sections: ["审校报告", "润色结果"]
  forbidden_patterns: ["TODO", "待确认"]
---
```

**Role**：独立审校员 + 润色师（合并原 editor + de-ai-polish）。

**Constraints**：
- 必须在独立 subagent 中运行，避免"自己审自己"
- 五维审核：事实准确性、论证完整性、AI 味检测、风格偏离检测、被动句/过渡句/长句清理
- 读取 styles/style-profile.md 对比风格规则
- 逐条输出问题、位置和修改建议

**Exit Criteria**：
- 每个事实引用已验证来源或标记为"待用户确认"
- 输出包含审校报告和润色后全文

**记忆内容**：反复出现的审核问题模式、风格偏离的高发区域

#### style-analyzer — 风格分析 agent

```yaml
---
name: style-analyzer
description: 分析参考文章，提取结构化的风格 DNA。
tools: Read, Write, Glob, Grep
model: opus
validation_rules:
  required_sections: ["句式偏好", "段落结构", "词汇特征", "修辞手法", "结构特征", "反面清单"]
---
```

**Role**：风格提取器，从参考文章中归纳可执行的写作规则。

**Output Contract**：输出 `styles/style-profile.md`，六个维度各 2-3 条可执行规则。

**Constraints**：
- "口语化"不够具体，"用'说白了'代替'换言之'"才是可执行的
- 无需持久化记忆——每次分析基于当前语料库重新提取

---

## 九、四层错误处理

### 9.1 总览

| 层级 | 机制 | 说明 | Token 成本 |
|------|------|------|------------|
| L1 重试 | 每个 command 包裹重试逻辑 | 瞬态错误（rate limit、网络），默认最多 2 次 | 0 |
| L2 输出校验 | **脚本预检验** + 可选 LLM 语义校验 | 结构化检查 + 质量检查 | 脚本: 0 / LLM: 低 |
| L3 降级 | `fallback_model` 字段 | Opus 反复失败时降级到 Sonnet 重试 | 降低 |
| L4 人工介入 | 标记阶段为 `needs_human` | 所有自动恢复失败 → 暂停 pipeline | 0 |

### 9.2 L2 详细设计：脚本预检验 + 数据驱动校验规则

**设计原则**：校验逻辑与校验规则分离。脚本是通用的校验引擎，规则从 agent `.md` 的 frontmatter 中动态加载，**不硬编码**。

#### Step 1 — Agent frontmatter 中声明校验规则

每个 agent `.md` 的 `validation_rules` 字段声明可脚本检查的规则：

```yaml
validation_rules:
  required_sections:          # 必须存在的 Markdown 标题
    - "关键事实"
    - "代码片段"
  word_count:
    min: 500
    max: 5000
  required_patterns:          # 必须匹配的正则
    - "\\[来源\\]\\(http"
  forbidden_patterns:         # 禁止出现的模式
    - "TODO"
    - "待补充"
```

#### Step 2 — 通用校验引擎 `contract-validator.sh`

```bash
#!/bin/bash
# contract-validator.sh <agent-name> <output-file>
# 从 .claude/agents/<agent-name>.md 的 frontmatter 动态读取 validation_rules
# 对 <output-file> 执行校验，输出 JSON 格式结果

# 1. 解析 agent .md frontmatter 中的 validation_rules
# 2. 检查 required_sections — grep Markdown 标题是否存在
# 3. 检查 word_count — wc -w 统计字数
# 4. 检查 required_patterns — grep -E 匹配
# 5. 检查 forbidden_patterns — grep -E 反向匹配
# 6. 输出: { "passed": true/false, "violations": [...] }
```

**扩展性保证**：
- 新增 agent 只需在 `.md` 中添加 `validation_rules` — 无需改脚本
- 新增校验类型只需在脚本中添加一个 handler 函数
- 领域特定规则可在 domain skill 中提供额外 overlay
- 禁用某项检查：设为空数组 `[]`

#### Step 3 — 校验链路

```
Agent 输出 → 脚本预检验（0 token） → 通过? ─Yes→ [可选] LLM 语义校验 → 更新 state
                                       │
                                       No → 记录 violation → L1 重试或 L4 人工介入
```

**LLM 语义校验**（可选）：仅在 agent 声明了 `semantic_checks` 时执行，使用 Haiku 模型降低成本：

```yaml
semantic_checks:
  - "每个论点必须有代码或数据支撑"
  - "不确定项不超过总发现数的 30%"
```

### 9.3 错误记录

校验结果写入 `pipeline-state.json`：

```json
{
  "stage": "draft",
  "status": "failed",
  "error": {
    "type": "contract_violation",
    "source": "script",
    "violations": [
      { "rule": "word_count", "expected": "max 2400", "actual": "4200" },
      { "rule": "required_section", "missing": "对比表格" }
    ],
    "recoverable": true,
    "retry_count": 1
  }
}
```

---

## 十、Skill 设计

### 10.1 Skill 分层

| 层级 | 目录 | 说明 | 随框架发布 |
|------|------|------|-----------|
| 核心 | `.claude/skills/core/` | 通用于所有内容创作 | Y |
| 领域 | `.claude/skills/domains/{领域}/` | 特定领域 | N |

Pipeline manifest 通过 skill 名引用，框架按 `core/ → domains/{当前领域}/` 顺序解析。

### 10.2 Skill 类型

| 类型 | 说明 | 例子 | 接口 |
|------|------|------|------|
| Rule Skill | 静态规则集，注入 agent prompt | anti-ai-style, fact-check | 纯 Markdown |
| Transform Skill | 接收输入、产出输出的转换逻辑 | de-ai-polish, wechat-format | 有 input/output contract |
| Context Skill | 组装上下文注入 agent | style-reference | 有 load 描述 |

### 10.3 核心 Skill（2 个）

#### fact-check — 事实核查清单

检查项：
1. 文中引用的代码路径、类名、参数值是否与源码一致
2. 版本号、发布日期等时效性信息是否过期
3. 每个论点是否有代码/数据支撑，还是在空谈
4. 读者视角测试：读完能带走的不是"了解了 X"，而是一个可迁移的设计判断

#### de-ai-polish — 去 AI 味润色

操作规则：
- 所有被动句改成主动句（"数据被存储在..." → "系统把数据写入..."）
- 删除所有起承转合的过渡句（"接下来我们来看..." → 直接开始下一节）
- 句子超过 40 字拆成两句
- 检查每段第一句：删掉后段落仍成立则删掉

### 10.4 领域 Skill — 公众号写作包（3 个）

#### anti-ai-style — 反 AI 味写作规则

禁用清单：
- 开头禁止定义概念（"X 是一个..."开头直接删掉重写）
- 禁止三段式排比（"通过 A 实现了 X，通过 B 保证了 Y，通过 C 达成了 Z"）
- 禁止词汇："值得注意的是"、"显而易见"、"毋庸置疑"、"不难发现"、"综上所述"
- 禁止"接下来我们来看..."类过渡句
- 禁止代码示例后的"可以看到..."

正面规则：
- 每个 section 至少一处代码引用或具体数字
- 对比用"X 不是 A，而是 B"代替"X 采用了 B 方案"
- 句子超过 40 字必须拆成两句
- 能删掉不影响论证的句子就删掉

#### wechat-format — 公众号排版规则

- Markdown 输出适配 Markdown Nice 等排版工具
- 图片路径转换为相对路径或 base64 内联
- 标题层级限制到 H2-H4（公众号不渲染 H1）
- 代码块指定语言高亮
- 自动生成摘要（120 字以内）和封面图建议

#### style-reference — 风格参考注入

- 每次写作前读取 styles/style-profile.md 中的结构化规则
- 从 styles/ 目录选 1 篇与当前 section 主题最接近的参考文章作为 few-shot
- 规则始终注入（保一致性），示例只选最相关一篇（省 context）

---

## 十一、风格参考系统

### 11.1 风格语料库

在 `styles/` 目录存放 3-5 篇"就是这个味道"的参考文章。数量不需要多——few-shot 的边际效果在 3-5 个样本后趋于饱和。关键是选得准。

### 11.2 风格 DNA 提取

通过 `/analyze-style` 命令，style-analyzer agent 分析参考文章，提取六个维度的结构化特征：

| 维度 | 提取内容 | 输出格式 |
|------|----------|----------|
| 句式偏好 | 平均句长、长短句节奏、主动/被动/反问 | 2-3 条可执行规则 |
| 段落结构 | 每段句数、论点先行/铺垫先行、过渡方式 | 模式描述 + 示例 |
| 词汇特征 | 口语化程度、对话感、术语处理、高频连接词 | 用/避用词汇表 |
| 修辞手法 | 思想实验、类比、反讽、代码引用风格 | 手法清单 + 频率 |
| 结构特征 | 开头切入、结尾收束、信息密度曲线 | 结构模板 |
| 反面清单 | 参考文章中没有出现的写法 | 禁用模式列表 |

输出存入 `styles/style-profile.md`，作为 writer agent 每次调用的约束注入。

### 11.3 风格一致性验证

editor agent 在审校阶段增加风格偏离检测：
- 逐段对比文章与 style-profile 中的规则
- 对偏离严重的段落给出具体修改建议

---

## 十二、可观测性

### 12.1 结构化运行日志

每次 pipeline 运行写入 `retro/runs/{run_id}.log.md`（Markdown 格式，人类可读）：

```markdown
## Run: 2026-03-27-agent-strategies

### Stage: research (sonnet)
- 开始: 10:15:00 | 结束: 10:18:42 | 耗时: 3m42s
- 输入: briefs/agent-strategies.md
- 输出: research/memo.md
- Token: ~15K input, ~4K output
- 校验: passed（脚本预检验）
- 状态: completed

### Stage: figures (sonnet)
- 状态: skipped (brief.no_figures == true)

### Stage: draft (opus) (rerun)
- 开始: 10:30:00 | 结束: 10:38:00 | 耗时: 8m00s
- 校验: failed → retry 1 → passed
- 错误: contract_violation (word_count 4200 > max 2400)
- 状态: completed
```

每个 slash command 执行结束时追加一条记录即可，无需日志框架。

### 12.2 Agent 决策追踪

Agent 在输出中附加 `## Decision Log` 节，记录关键判断：

```markdown
## Decision Log
- 选择"问题切入"开头而非"定义切入" — 因 style-profile.md 规则 S3 禁止定义开头
- Section 3 字数设为 800（超出 brief 目标 600）— 因对比表格需要更多篇幅
- 标记"97M MCP 月下载量"为不确定项 — 来源为博客非官方文档
```

### 12.3 Token 预算追踪

`pipeline-state.json` 中的 `token_usage` 字段按阶段记录 token 消耗。每个 slash command 完成后记录近似 token 数。编排器在预算超阈值时警告用户。

---

## 十三、自学习迭代系统

### 13.1 两级记忆

| 层级 | 位置 | 管理方式 | 说明 |
|------|------|----------|------|
| 工作记忆 | `agent-memory/{agent}/MEMORY.md` | `/feedback` 自动追加 | agent 学到的所有经验 |
| 正式规则 | skill `.md` 文件 | **用户手动晋升** | 验证过的规则 |

`/retro` 输出晋升建议："以下记忆项已连续有效 — 建议升级为正式规则"，但**不自动执行**。用户保持对规则体系的完全控制。

### 13.2 反馈捕获 `/feedback`（两阶段）

**Step 1 — 确定性 diff**（零 LLM 成本）：

对 `drafts/full-draft.md`（AI 初稿）与 `output/final.md`（用户终审版本）做文本 diff，输出结构化修改报告：
- 新增段落
- 删除段落
- 修改段落（before/after）
- 净字数变化

**Step 2 — LLM 辅助分类 + 用户确认**：

对 diff 进行分类建议：
- 事实错误修正 → 建议更新 researcher 记忆
- 风格调整 → 建议更新 writer 记忆
- 结构调整 → 建议更新 outliner 记忆
- 用户新增 → 记录用户偏好的内容类型
- 删除冗余 → 建议新增到禁用清单

**用户确认后**才写入对应 agent memory。

### 13.3 各 Agent 记忆内容设计

| Agent | 记忆什么 | 不记什么 |
|-------|----------|----------|
| writer | 用户偏好句式、被删模式禁用清单、字数偏好 | 具体文章的内容细节 |
| outliner | 大纲结构偏好、section 数量、不确定项处理 | 具体主题的调研结论 |
| researcher | 信息源可靠性、历史事实错误、调研深度偏好 | 已过期的技术版本信息 |
| editor | 反复出现的审核问题、风格偏离高发区 | 单次偶发的拼写错误 |

### 13.4 复盘 `/retro`（三个可量化指标）

| 指标 | 计算方式 | 数据来源 | 目标趋势 |
|------|----------|----------|----------|
| 编辑率 | 用户修改占 AI 草稿的比例 | diff（确定性计算） | 逐篇下降 |
| 阶段失败次数 | 需要重试或人工介入的阶段数 | run log | 逐篇下降 |
| 用户新增量 | 用户添加的不在 AI 草稿中的内容 | diff（确定性计算） | 保持 10-20% |

复盘报告存入 `retro/` 目录，跨文章追踪趋势。

### 13.5 记忆防腐化

1. **记忆分层**：MEMORY.md 只放规则摘要（索引），详细记录放子文件，按需读取
2. **定期压缩**：每 5 篇文章后执行 `/memory-compact`，合并重复、删除矛盾项
3. **用户晋升**：`/retro` 建议晋升 → 用户确认 → 记忆升级为 skill 规则 → 从 MEMORY.md 中移除

---

## 十四、三个检查点的交互设计

### Checkpoint 1：大纲审核（/outline 执行后）

**用户收到的产出物**：
- `outlines/` 目录下的结构化大纲文件
- 每个 section 标注了论点、关键细节、预估字数
- 不确定项高亮标注

**用户做三件事**：
1. 确认或修改每个 section 的论点方向
2. 决定不确定项：继续查 / 直接删
3. 调整结构：合并、拆分、调换 section

**完成后**：用户编辑 outline 文件，执行 `/run` 继续或 `/draft` 单独执行

### Checkpoint 2：用户介入写作（/draft 执行后）

**用户收到的产出物**：
- `drafts/full-draft.md` — 合并后的全文草稿
- `figures/` 目录下的配图文件（如未跳过）

**用户做三件事**：
1. 重写开头（全文最重要的 200 字）
2. 通读调整调性——把过于书面的改口语化，把过于顺滑的改粗糙
3. 砍内容——所有"补充说明"段落，判断是否真的需要

**完成后**：用户编辑完草稿，执行 `/run` 继续或 `/refine` 单独执行

### Checkpoint 3：用户终审（/refine 执行后）

**用户收到的产出物**：
- `output/` 目录下的审校 + 润色后全文

**用户做三件事**：
1. 大声朗读全文，读起来卡顿的地方就是需要改的地方
2. 在 1-2 处加入个人经验、看法、或小故事（LLM 做不到的部分）
3. 确认标题（好标题是精确的问题，不是宏大的概念）

**完成后**：执行 `/publish` 导出，然后执行 `/feedback` 和 `/retro` 完成学习闭环

---

## 十五、模型分配策略

| Agent | 模型 | 理由 | 降级模型 |
|-------|------|------|----------|
| researcher | Sonnet | 信息收集和结构化不需要最强模型，省 token | — |
| outliner | Opus | 论点质量是文章骨架，不能省 | Sonnet |
| writer | Opus | 行文质量是核心竞争力 | Sonnet |
| illustrator | Sonnet | 配图生成用 Sonnet 够用 | — |
| editor | Opus | 审校需要强判断力，发现隐蔽的问题 | Sonnet |
| style-analyzer | Opus | 风格提取需要细腻的语感 | Sonnet |
| L2 语义校验 | Haiku | 仅做 checklist 比对，最低成本 | — |

---

## 十六、外部工具衔接

### MCP Server 扩展点

在 pipeline manifest 中按阶段声明 MCP 依赖，缺失时优雅降级：

```yaml
stages:
  - name: research
    agent: researcher
    mcp_servers: [github, notion]    # 可选
```

| 场景 | MCP Server |
|------|------------|
| 调研 GitHub 仓库源码 | GitHub MCP |
| 搜索 Notion 中的已有素材 | Notion MCP |
| 搜索 Google Docs 中的历史文章 | Google Drive MCP |
| 发送写作进度通知 | Slack MCP |

### Hook 自动化

| 事件 | Hook 行为 |
|------|-----------|
| Stop（阶段完成） | 追加记录到 `retro/runs/{run_id}.log.md` |
| PostToolUse（文件写入） | 对 Markdown 文件自动运行格式化 |
| SubagentStop（agent 完成） | 运行 `contract-validator.sh` 校验输出 |

### 导出链路

最终 Markdown → Markdown Nice / mdnice.com → 公众号编辑器粘贴

或：Markdown → pandoc → HTML → 公众号编辑器

---

## 十七、扩展性

### 17.1 创建新 Pipeline

只需新建 `.claude/pipelines/{name}.yaml`，定义阶段、agent、checkpoint。无需修改框架。

### 17.2 创建新 Agent

1. 复制 `.claude/agents/_template.md`
2. 填写 RCCF 各节 + validation_rules
3. 创建对应 `.claude/commands/{command}.md`
4. 在 pipeline manifest 中引用

### 17.3 创建领域 Skill 包

在 `.claude/skills/domains/{领域}/` 下创建 skill 目录：

```
.claude/skills/domains/tech-docs/
  ├── accuracy-standard/SKILL.md    # 技术文档精确性标准
  └── doc-format/SKILL.md           # 文档排版规则
```

在 pipeline manifest 中引用即可。

---

## 十八、快速启动流程

```bash
# 1. 克隆项目
git clone <repo> inkflow && cd inkflow

# 2. 放入参考文章
cp your-best-articles/*.md styles/

# 3. 提取风格 DNA
# 在 Claude Code 中执行：
/analyze-style

# 4. 填写写作指令卡
/brief "Agent 执行3小时任务不炸上下文的三层策略"

# 5. 自动执行 pipeline（编排器模式）
/run
# 编排器自动推进，在 Checkpoint 暂停等待用户审核
# 条件跳过的阶段自动标记 skipped

# 或：手动逐阶段执行
/research
/outline          # → Checkpoint 1：审核大纲
/draft            # → Checkpoint 2：重写开头 + 调调性
/refine           # → Checkpoint 3：终审
/publish          # → 导出

# 6. 重跑某阶段（如需要）
/rerun draft      # 重跑 draft 阶段

# 7. 写后学习（关键！）
/feedback         # → 两阶段：diff + 用户确认分类 → 更新 agent 记忆
/retro            # → 3 指标记分卡 + 记忆晋升建议
```

---

## 十九、飞轮效应

```
第 1 篇：系统按默认规则写作，用户大量修改
         ↓ /feedback 捕获修改（用户确认分类）→ agent 工作记忆更新
第 2 篇：系统应用了第 1 篇的学习，修改量减少
         ↓ /retro 验证改进 → 建议部分记忆晋升为 skill（用户决定）
第 3 篇：系统有了正式规则 + 更精准的记忆
         ↓ 用户修改集中在"加个人元素"而非"改 AI 味"
第 N 篇：用户只需要做真正有价值的事 ——
         定论点、选调性、加个人故事、终审
```

系统的目标不是"让 AI 写出完美文章"，而是**把用户的精力集中到只有人才能做好的 10% 上**——论点判断、调性把控、个人经验。其余 90% 的调研、结构化、初稿、配图、排版，由系统越做越好。

---

## 附录 A：设计参考

本设计参考了以下框架和最佳实践：

| 参考 | 采纳的设计思想 |
|------|---------------|
| LangGraph | 显式状态管理、durable execution、checkpointing |
| OpenAI Swarm/Agents SDK | 无状态 agent + 显式状态传递 |
| CrewAI | YAML 驱动的声明式流水线定义 |
| SmolAgents (HuggingFace) | 最小化抽象、轻量级核心 |
| DSPy | 程序化校验（将校验逻辑从 prompt 中剥离） |
| RCCF Framework | Role + Context + Constraints + Format 提示词结构 |
| Anthropic Agent Patterns | Human-in-the-loop、交接协议、上下文隔离 |
| 业界共识 | 四层错误处理、Two-phase actions、MCP 集成 |
