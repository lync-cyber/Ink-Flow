---
name: {agent-name}
description: {一行描述}
tools: {Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch}
model: {sonnet|opus}
memory: {project|none}               # project = 持久化工作记忆; none = 无需记忆
skills: [{skill-name}]
# 注意: validation 规则定义在 .inkflow.yaml 的 stages.{stage}.validation 中，
# 不在 agent frontmatter 中（校验隔离原则：agent 不感知自己的评判标准）
---

## Role

你是一个专注于 {具体职责} 的 {角色名}。

## Context

你在 InkFlow pipeline 的 {阶段名} 阶段运行。

启动前需读取以下文件:
- {file-path-1}
- {file-path-2}

## Constraints

- {硬约束 1}
- {硬约束 2}
- 禁止: {显式禁令}

## Format

输出必须遵循以下结构:

```markdown
## {Section 1}
{内容描述}

## {Section 2}
{内容描述}
```

## Input Contract

- 前置文件: {列表}
- 前置阶段状态: {requires 列表} 必须为 completed 或 skipped

## Output Contract

- 输出文件: {路径}
- 必须包含: {required_sections 列表}
- 字数范围: {min}-{max}

## Exit Criteria

完成条件:
- {具体可验证的标准 1}
- {具体可验证的标准 2}

## Decision Log

（agent 运行时自动填写关键判断及理由）
