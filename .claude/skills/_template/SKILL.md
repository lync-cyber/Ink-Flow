---
# ============================================================
# InkFlow skill 统一契约模板
# 复制本目录到 .claude/skills/{your-skill-name}/ 后按 TODO 填空
# ============================================================
#
# name 必须 kebab-case，与目录名一致
# description 是触发的关键——遵循 anthropic-skills/skill-creator 的"pushy"原则：
#   1. 一句话功能定位
#   2. 列举具体触发词（用户实际可能说的话）
#   3. 应触发的场景描述
name: _template
description: >
  Skill 脚手架模板 — 复制本目录到 .claude/skills/{your-skill-name}/，
  按 TODO 填空后即可作为新 skill。本身不参与触发，不可调用。
argument-hint: "(template only - do not invoke)"
allowed-tools: Read

# 模板自身不暴露给 LLM / 用户
user-invocable: false
disable-model-invocation: true
---

# {Skill 标题}

## 边界

> 本节明确 skill 做什么、不做什么。新 skill 必填，删除则审校不通过。

本 skill 做以下事：

1. **{动作1}**：{一句话描述}
2. **{动作2}**：{一句话描述}

不做以下事（防止职责膨胀）：

- ❌ {不做的事1，及为什么由谁做}
- ❌ {不做的事2}

## 入口判定

> 检查执行的前置条件；不满足则提示用户先做 X，**不**强行往下走。

- 必须：{参数1}（用户没给则 AskUserQuestion）
- 必须：{文件路径}存在；缺失 → 提示用户先跑 {上游 skill/阶段}
- 可选：{加分参数}

## 流程

按"采集 → 处理 → 产物 → 退出"四段式：

### 1. 数据采集

```
- 读 {文件1}
- 读 {文件2}
- AskUserQuestion: {交互问题}（仅缺失时问）
```

### 2. 处理

```
- 调 {agent} via Task                       # 推荐：thin shell skill
  或
- 调 {脚本} via Bash                        # 推荐：确定性逻辑
```

### 3. 产物

落盘到约定路径：

| 产物 | 路径 |
|---|---|
| {产物1} | `content/articles/{slug}/{path}` |
| {产物2} | `runtime/{path}` |

### 4. 退出

- 给用户一份简短摘要（≤5 行）
- 列下一步操作指引（命令 + 路径）

## 不做的事

> 必填。明确"绝不在本 skill 里做"的事，防止后续 PR 越位。

- **不**维护任何外部 SSOT 的离线副本（容器名 / persona / 阈值）
- **不**绕过 health/lint/validate 检查
- **不**直接修改其他 skill / agent 的产物（永远走对应的 owner agent）

## 相关资源

| 何时查 | 文件 |
|---|---|
| 本 skill 的产物路径与契约 | `.claude/agents/{owner-agent}/AGENT.md` |
| 配置/规则 SSOT | `framework/config/{...}.yaml` 或 Profile 合成产物 `runtime/profile-resolved/{...}.yaml` |
| 上游/下游 skill | `.claude/skills/{...}/SKILL.md` |
