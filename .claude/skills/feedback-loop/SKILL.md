---
name: feedback-loop
description: >
  发布后学习闭环。捕获用户编辑反馈、生成复盘报告、录入运营数据、压缩记忆。
  触发条件："给反馈"、"复盘"、"运营数据"、"压缩记忆"、"/feedback"、"文章发表后"。
  当用户提到反馈、复盘、运营数据分析、记忆管理时，应触发此 skill。
---

# 反馈闭环

发布后的学习和改进工具，包含 4 个子模式。

## 入口

用 AskUserQuestion 让用户选择子模式：

```
AskUserQuestion:
  question: "你想执行哪个反馈流程？"
  options:
    - "完整复盘（反馈 + 报告）" — 捕获编辑 diff + 生成 3 指标评分卡
    - "录入运营数据" — 记录阅读、分享、评论等运营指标
    - "压缩记忆" — 合并重复、解决矛盾、清理过期记忆
    - "全部执行" — 按顺序执行所有子模式
```

若用户消息已明确意图（如"给反馈"→ 反馈捕获，"压缩记忆"→ 记忆压缩），可跳过选择直接进入对应子模式。

---

## 子模式 1: 反馈捕获

捕获用户对 AI 产出的编辑修改，分类后写入 agent 记忆。

### Step 1 — 确定性 Diff

对 AI 初稿与用户终审版本做 diff：

- AI 初稿: `articles/{slug}/drafts/full.md`
- 用户终审: `articles/{slug}/output/final.md`

可使用 `scripts/diff-extractor.sh` 生成结构化修改报告：
- 新增段落数、删除段落数、修改段落数、净字数变化
- 逐条列出修改内容

### Step 2 — LLM 辅助分类 + 用户确认

对每条 diff 提出分类建议：

| 分类 | 说明 | 更新目标 |
|------|------|----------|
| 事实错误修正 | AI 写错了事实 | researcher memory |
| 风格调整 | 用户改了语气/用词 | writer memory |
| 结构调整 | 用户调整了段落/section 结构 | outliner memory |
| 用户新增 | 用户添加了 AI 无法产出的内容 | 记录偏好 |
| 删除冗余 | 用户删除了不需要的内容 | 新增到禁用清单 |

用 AskUserQuestion 逐条确认：

```
AskUserQuestion:
  question: "修改分类确认（第 {N} 条）：'{修改摘要}'"
  options:
    - "{建议分类}" — 确认建议的分类
    - "更改分类" — 用户指定其他分类
    - "跳过" — 不记录此条修改
```

### Step 3 — 写入 Agent Memory

仅用户确认的项写入对应 agent 的 `.claude/agent-memory/{agent}/MEMORY.md`。

输出反馈报告到 `articles/{slug}/retro.md`（反馈部分）。

---

## 子模式 2: 复盘报告

生成 3 个可量化指标的评分卡 + 记忆晋升建议。

### 3 个核心指标

| 指标 | 计算方式 | 目标趋势 |
|------|---------|---------|
| 编辑率 | 用户修改占 AI 草稿比例 | 逐篇下降 |
| 阶段失败次数 | 需重试/人工介入的阶段数 | 逐篇下降 |
| 用户新增量 | 用户新增内容占比 | 保持 10-20% |

数据来源：
- diff（确定性计算）
- `retro/runs/{run_id}.log.md` 中的 retry/failed 记录
- `articles-index.yaml` 的历史数据

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

### 跨文章趋势

若有 3+ 篇历史数据，展示趋势对比表。

输出复盘报告到 `articles/{slug}/retro.md`（复盘部分）。

---

## 子模式 3: 运营数据

录入文章发布后的运营数据，与历史数据交叉分析。

### 数据采集

用 AskUserQuestion 采集（支持留空）：

```
AskUserQuestion (multiSelect questions):
  Q1: "阅读完成率？" → 自由输入
  Q2: "分享率？" → 自由输入
  Q3: "评论数？" → 自由输入
  Q4: "新增关注数？" → 自由输入
```

### 记录与分析

- 追加到 `retro/ops-metrics.csv`（不存在则创建含表头）
- 若有 3+ 篇历史数据，按 content_type、opening_style、cta_type 分组对比
- 输出洞察和可操作建议

### 更新运营记忆

若连续 3 篇某维度趋势明确 → AskUserQuestion 建议更新 ops memory。

---

## 子模式 4: 记忆压缩

扫描所有 agent memory，合并重复、解决矛盾、清理过期项。

### 扫描范围

读取以下文件：
- `.claude/agent-memory/writer/MEMORY.md`
- `.claude/agent-memory/outliner/MEMORY.md`
- `.claude/agent-memory/researcher/MEMORY.md`
- `.claude/agent-memory/editor-audit/MEMORY.md`
- `.claude/agent-memory/editor-polish/MEMORY.md`
- `.claude/agent-memory/ops/MEMORY.md`

### 检测问题

| 类型 | 处理方式 |
|------|---------|
| 重复项 | 自动合并，保留更精确的表述 |
| 矛盾项 | AskUserQuestion 让用户裁决 |
| 已晋升项 | 确认 skill 文件包含后移除 |
| 过时项（10+ 篇未触发） | AskUserQuestion 确认是否删除 |

矛盾项裁决：

```
AskUserQuestion:
  question: "发现矛盾规则，请裁决"
  options:
    - "保留 A: '{规则A}'"
    - "保留 B: '{规则B}'"
    - "两条都保留" — 可能适用于不同场景
    - "两条都删除"
```

### 执行压缩

用户确认后批量更新各 MEMORY.md 文件。输出压缩报告（压缩前/后规则数、处理详情）。

### 建议频率

每 5 篇文章后执行一次，或 MEMORY.md 超过 50 条规则时执行。
