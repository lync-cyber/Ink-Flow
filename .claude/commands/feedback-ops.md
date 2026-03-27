---
description: 录入文章发布后的运营数据，与历史数据交叉分析，更新运营记忆
---

## 执行逻辑

### 1. 提示用户输入运营数据

```
请输入文章发布后的运营数据（未知项可留空）:

- 阅读完成率: {百分比}
- 分享率: {百分比}
- 评论数: {数字}
- 新增关注数: {数字}
- 标题点击率 CTR: {百分比，如有 A/B 测试}
```

### 2. 记录数据

追加到 `retro/ops-metrics.csv`:
```csv
run_id, publish_date, topic, content_type, opening_style, read_completion, share_rate, comments, new_followers, ctr
```

若文件不存在则创建（含表头）。

### 3. 历史数据交叉分析

若有 3+ 篇历史数据:

#### 阅读完成率分析
- 按 content_type 分组对比
- 与编辑率（来自 /retro）交叉: 编辑少的文章完成率是否更低？

#### 分享率分析
- 按 opening_style 分组对比: 哪种开头策略分享最多？
- 按 cta_type 分组对比

#### 标题效果分析
- CTR 与标题模式关联（含数字？问句？）

### 4. 输出洞察

写入 `retro/{run_id}-ops.md`:
```markdown
## 运营数据洞察: {topic}

### 本篇数据
- 阅读完成率: {N}%（平均: {N}%）
- 分享率: {N}%（平均: {N}%）

### 趋势发现
- {洞察 1}
- {洞察 2}

### 建议
- {可操作的建议}
```

### 5. 更新运营记忆

若连续 3 篇文章某维度趋势明确:
- 建议更新 `.claude/agent-memory/ops/MEMORY.md`
- 展示建议给用户确认后写入
- 例: "pain_point 开头的文章完成率持续高于 contrast，建议在 ops/MEMORY.md 中记录"
