# InkFlow — 通用 LLM 辅助内容创作工作流框架

## 项目简介

InkFlow（墨流）是基于 Claude Code 原生能力（subagent + skill + hook + memory）的通用 LLM 辅助内容创作工作流框架。公众号文章写作是其参考实现，框架核心只理解 pipeline manifest schema，不绑定具体领域。

当前版本: 见 `VERSION` 文件

## 设计哲学（五条原则）

1. **交接协议原则** — 每次交给用户的是有具体内容可判断的产出物，不是 yes/no 问题
2. **上下文隔离原则** — 每个阶段使用独立 subagent，避免调研噪音污染写作上下文
3. **记忆升级原则** — 工作记忆（agent 自动积累）→ 正式规则（用户手动晋升）
4. **契约驱动原则** — 每个 agent 有明确的输入/输出契约和完成标准，脚本可校验
5. **声明式流水线原则** — pipeline 通过 YAML 清单定义，框架不绑定具体领域

## 目录结构

```
.claude/
  ├── pipelines/            # 声明式流水线定义（YAML）
  ├── agents/               # Subagent 定义（RCCF 结构 + 契约）
  ├── skills/
  │   ├── inkflow/          # 主编排 skill（pipeline 驱动）
  │   │   ├── SKILL.md
  │   │   ├── scripts/      # contract-validator.sh, pipeline-state.sh
  │   │   └── references/   # brief-template.md, checkpoint-prompts.md
  │   ├── style-analyzer/   # 风格分析 skill
  │   ├── feedback-loop/    # 反馈闭环 skill（feedback + retro + ops + compact）
  │   ├── de-ai-polish/     # 去 AI 味润色 skill
  │   └── domains/          # 领域 skill 包（按需引入）
  │       └── wechat-article/
  ├── rules/                # 声明式约束规则
  │   ├── core/             # 跨领域通用规则
  │   └── domains/          # 领域特有规则
  └── agent-memory/         # 持久化工作记忆

articles/                   # 内容产物（按文章分组）
  └── {slug}/
      ├── brief.md          # 写作指令卡
      ├── research.md       # 调研备忘录
      ├── outline.md        # 结构化大纲
      ├── drafts/           # 分节草稿 + 合并稿
      ├── figures/          # SVG / Mermaid 配图
      ├── output/           # 最终成品（多格式导出）
      └── retro.md          # 本文复盘
styles/                     # 风格参考文章（共享，按 style_profile 分目录）
  └── {profile}/
retro/runs/                 # 跨文章运行日志
articles-index.yaml         # 文章索引（pipeline 自动维护）
.pipeline-states/           # 按文章隔离的 pipeline 状态
```

## Agent 设计约定（RCCF 结构）

所有 agent `.md` 文件统一为 **Role + Context + Constraints + Format + Exit Criteria** 结构：

```yaml
---
name: {agent-name}
description: {一行描述}
tools: {工具列表}
model: {sonnet|opus}
memory: {project|none}
skills: [{skill-name}]           # 有操作逻辑的能力
rules: [{rule-name}]             # 声明式约束（见 .claude/rules/）
validation_rules:
  required_sections: [...]
  optional_sections: [...]       # 条件可选输出
  word_count: { min: N, max: N }
  required_patterns: [...]
  forbidden_patterns: [...]
  forbidden_patterns_from_skills: [...]  # 从 skill 动态加载
  platform_checks: [...]         # 平台特有校验
---
```

Agent 无状态化：编排 skill 负责"组装上下文"，agent 只负责"生成输出"。

## Skill 体系

### 编排 Skill

| Skill | 触发方式 | 说明 |
|-------|---------|------|
| `inkflow` | `/inkflow` 或自然语言 | 主编排器 — pipeline 驱动，checkpoint 交互 |
| `style-analyzer` | 自然语言（"分析风格"） | 提取七维度风格 DNA |
| `feedback-loop` | 自然语言（"给反馈"、"复盘"） | 反馈 + 复盘 + 运营 + 记忆压缩 |

### 领域 Skill

| Skill | 类型 | 说明 |
|-------|------|------|
| `de-ai-polish` | Transform | 去 AI 味润色 |
| `anti-ai-style` | Rule | 禁用词汇/句式 |
| `writing-strategy` | Context | 正向写作指导 |
| `opening-hooks` | Context | 5 种开头策略 |
| `style-reference` | Context | 风格 DNA + 范文注入 |
| `wechat-format` | Transform | 多格式导出 |

### Rule 与 Skill 的区分

| 维度 | Rule（.claude/rules/） | Skill（.claude/skills/） |
|------|----------------------|------------------------|
| 本质 | 纯声明式约束 | 有逻辑的能力 |
| 内容 | 条目化的规则清单 | 操作步骤/选择逻辑/转换规则 |
| 注入方式 | 作为 Constraints 追加到 agent prompt | 按 type 不同注入 |

## Pipeline 使用

```bash
# 编排器 — 自动推进 pipeline，在 checkpoint 暂停，使用 AskUserQuestion 交互
/inkflow

# 也可通过自然语言触发
"写一篇关于 React Hooks 的文章"
"继续 pipeline"
"重跑 draft 阶段"

# 风格分析（首次使用前）
"分析我的写作风格"

# 写后学习
"给反馈"          # → feedback-loop skill
"复盘"            # → feedback-loop skill
```

## 四层错误处理

| 层级 | 机制 | Token 成本 |
|------|------|------------|
| L1 | 重试（默认最多 2 次） | 0 |
| L2 | contract-validator.sh 脚本预检验 + 可选 LLM 语义校验 | 脚本: 0 / LLM: 低 |
| L3 | 模型降级（Opus → Sonnet） | 降低 |
| L4 | AskUserQuestion 结构化选择，暂停 pipeline | 0 |

## 微信公众号运营参数速查

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| 文章长度 | 800-2000 字 | 完成率最优区间 |
| 段落长度 | ≤ 3 行（移动端） | 减少阅读压力 |
| 正文字号 | 15px | 行业标准 |
| 行高 | 1.75-2.0 | 舒适阅读 |
| 字间距 | 1-2px | 移动端可读性 |
| 图文比 | 每 3-5 段 1 个视觉元素 | 打破文字墙 |
| 封面尺寸 | 900×500px（头条）/ 900×383px（次条） | 平台规范 |
| 内图宽度 | 640px | 最佳适配 |
| H 标签 | H2-H4 only | H1 被标题占用 |
| 摘要长度 | ≤ 120 字 | 公众号截断限制 |
