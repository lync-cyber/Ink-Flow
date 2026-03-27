# InkFlow — 通用 LLM 辅助内容创作工作流框架

## 项目简介

InkFlow（墨流）是基于 Claude Code 原生能力（subagent + skill + slash command + hook + memory）的通用 LLM 辅助内容创作工作流框架。公众号文章写作是其参考实现，框架核心只理解 pipeline manifest schema，不绑定具体领域。

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
  ├── commands/             # Slash command（.md）
  ├── validators/           # 输出校验引擎（contract-validator.sh）
  ├── rules/                # 声明式约束规则（Rule 文件）
  │   ├── core/             # 跨领域通用规则
  │   └── domains/          # 领域特有规则
  ├── skills/
  │   ├── core/             # 通用 skill（随框架发布）
  │   └── domains/          # 领域 skill 包（按需引入）
  └── agent-memory/         # 持久化工作记忆

briefs/                     # 写作指令卡（frontmatter + 正文）
research/                   # 调研备忘录
outlines/                   # 结构化大纲
drafts/                     # 各 section 草稿
figures/                    # SVG / Mermaid 配图
styles/                     # 风格参考文章（按 style_profile 分目录）
  └── {profile}/            # 如 default/，含 style-profile.md + exemplar-*.md
output/                     # 最终成品（多格式导出）
retro/                      # 复盘 + 运行日志
  └── runs/                 # 结构化运行日志
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

Agent 无状态化：Slash command 负责"组装上下文"，agent 只负责"生成输出"。

## Rule 与 Skill 的区分

| 维度 | Rule（.claude/rules/） | Skill（.claude/skills/） |
|------|----------------------|------------------------|
| 本质 | 纯声明式约束 | 有逻辑的能力 |
| 内容 | 条目化的规则清单 | 操作步骤/选择逻辑/转换规则 |
| 注入方式 | 作为 Constraints 追加到 agent prompt | 按 type 不同注入（rule/transform/context） |
| 继承 | 支持 extends 单层继承 | 不支持 |
| 举例 | platform-base（段落长度、图片宽度） | de-ai-polish（被动→主动转换步骤） |

Rule 文件统一 frontmatter：name, description, domain, version, inject_at, inject_mode, extends（可选）。

## Skill 类型与标准化接口

| 类型 | 说明 | 接口 |
|------|------|------|
| Transform | 接收输入、产出输出的转换逻辑 | input, output, transform_order, inject_at |
| Context | 组装上下文注入 agent | context_source, context_selector |

所有 skill 统一 frontmatter：name, type, description, domain, version + 类型特定字段。

## Pipeline 使用

```bash
# 编排器模式 — 自动推进，在 checkpoint 暂停
/run

# 单阶段执行（调试用）
/brief → /research → /outline → /draft → /figures → /refine → /publish

# 重跑某阶段
/rerun <stage> [--force]

# 风格分析（首次使用前执行）
/analyze-style

# 写后学习
/feedback          # diff + 分类确认 → 更新 memory
/feedback-ops      # 运营数据录入 → 趋势分析
/retro             # 3 指标记分卡 + 记忆晋升建议
/memory-compact    # 记忆压缩（每 5 篇后）
```

## 四层错误处理

| 层级 | 机制 | Token 成本 |
|------|------|------------|
| L1 | 重试（默认最多 2 次） | 0 |
| L2 | contract-validator.sh 脚本预检验 + 可选 LLM 语义校验 | 脚本: 0 / LLM: 低 |
| L3 | 模型降级（Opus → Sonnet） | 降低 |
| L4 | 标记 needs_human，暂停 pipeline | 0 |

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
