---
name: creation-reviewing
description: >
  创作复盘 — 对比 AI 初稿与用户终审版，分类编辑修改，更新 agent 记忆。
  触发条件："给反馈"、"复盘"、"/creation-review"、"文章发表后"。
compatibility:
  scripts: [.claude/skills/common/pipeline-orchestrating/scripts/diff-extractor.py]
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

## Step 1 — 确定性 Diff

对 AI 初稿与用户终审版本做 diff：

- AI 初稿: `articles/{slug}/drafts/full.md`
- 用户终审: `articles/{slug}/output/final.md`

可使用 `scripts/diff-extractor.py` 生成结构化修改报告：
- 新增段落数、删除段落数、修改段落数、净字数变化
- 逐条列出修改内容

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

- 用户确认的项写入对应 agent 的 `.claude/agent-memory/{agent}/MEMORY.md`
- 输出完整复盘报告到 `articles/{slug}/retro.md`

### 记忆晋升建议

扫描各 agent 的 MEMORY.md，找出连续 N 篇有效的规则，建议升级为正式 skill 规则：

```
AskUserQuestion:
  question: "以下规则连续 {N} 篇有效，是否晋升为正式规则？"
  options:
    - "晋升" — 添加到对应 skill 文件
    - "保持为工作记忆" — 继续观察
    - "删除" — 该规则不再需要
```
