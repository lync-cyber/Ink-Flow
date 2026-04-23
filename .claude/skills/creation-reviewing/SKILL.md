---
name: creation-reviewing
description: >
  创作复盘 — 对比 AI 初稿与用户终审版，分类编辑修改，提炼可复用规则。
  触发条件："给反馈"、"复盘"、"文章发表后"。
  当用户完成文章编辑想回顾 AI 草稿与终稿差异、改进写作流程时，应触发此 skill。
argument-hint: "[文章 slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# 创作复盘

发布后的创作质量回顾，捕获用户编辑修改并转化为 agent 记忆。

## 入口

用 AskUserQuestion 确认目标文章：

```
AskUserQuestion:
  question: "为哪篇文章做创作复盘？"
  options:
    - 自动检测最近完成的文章
    - 手动指定 slug
```

---

## Step 0 — 平台选择（多平台时必须）

```
IF len(brief.target_platforms) > 1:
  AskUserQuestion:
    question: "对哪个平台做复盘？"
    options: brief.target_platforms + ["批量（逐一复盘）"]
```

## Step 1 — 确定性 Diff（per-platform）

对所选 `{platform}`，对 AI 合并稿与用户终审稿做 diff：

- AI 初稿: `content/articles/{slug}/intermediate/04a-draft/{platform}/merged-draft.md`
- 用户终审: `content/articles/{slug}/export/07-final/{platform}.md`
  （若用户在终审后又改了 publisher 产物，**额外** diff
   `content/articles/{slug}/export/08-{platform}-publish.md`）

用 Read tool 分别读取两个文件，直接对比分析：
- 新增段落数、删除段落数、修改段落数、净字数变化
- 逐条列出修改内容（LLM 语义对比，比机械 diff 更精准）

## Step 2 — LLM 辅助分类 + 用户确认

对每条 diff 提出分类建议：

| 分类 | 说明 | 更新目标 |
|------|------|----------|
| 事实错误修正 | AI 写错了事实 | researcher memory |
| 风格调整 | 用户改了语气/用词 | writer memory |
| 结构调整 | 用户调整了段落/section 结构 | outliner memory |
| 用户新增 | 用户添加了 AI 无法产出的内容 | 记录偏好 |
| 删除冗余 | 用户删除了不需要的内容 | 新增到禁用清单 |

用 AskUserQuestion **批量确认**（非逐条，减少交互轮次）：

```
AskUserQuestion:
  question: "以下是 diff 分类建议，请确认或调整"（附全部分类表格）
  options:
    - "全部确认" — 按建议分类写入记忆
    - "我要调整部分分类" — 用户手动编辑
    - "跳过记忆更新" — 仅生成复盘报告
```

## Step 3 — 生成复盘评分卡

基于 diff 数据计算 3 个核心指标：

| 指标 | 计算方式 | 目标趋势 |
|------|---------|---------|
| 编辑率 | 用户修改占 AI 草稿比例 | 逐篇下降 |
| 阶段失败次数 | 需重试/人工介入的阶段数（从 state JSON 读取） | 逐篇下降 |
| 用户新增量 | 用户新增内容占比 | 保持 10-20% |

## Step 4 — 写入记忆 + 输出报告

- 用户确认的规律通过 Claude Code 原生 memory 系统持久化（feedback / project 类型）
- 输出完整复盘报告到 `content/articles/{slug}/retro.md`
- 写回 `runtime/pipeline-states/{slug}.json` 的 `lifecycle.retro_done = true`（契约见 `.claude/agents/orchestrator/lifecycle.md`）

### 规则晋升建议

当同一类修改连续 N 篇出现时，建议升级为正式 skill 规则：

```
AskUserQuestion:
  question: "以下规则连续 {N} 篇有效，是否晋升为正式规则？"
  options:
    - "晋升" — 添加到对应 skill 文件
    - "保持为记忆" — 继续观察
    - "删除" — 该规则不再需要
```
