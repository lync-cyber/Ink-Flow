---
description: 压缩 agent 记忆 — 合并重复项、删除矛盾项、维护索引，建议每 5 篇文章后执行
---

## 执行逻辑

### 1. 扫描所有 Agent Memory

读取以下文件:
- `.claude/agent-memory/writer/MEMORY.md`
- `.claude/agent-memory/outliner/MEMORY.md`
- `.claude/agent-memory/researcher/MEMORY.md`
- `.claude/agent-memory/editor/MEMORY.md`
- `.claude/agent-memory/ops/MEMORY.md`

### 2. 检测问题

#### 2.1 重复项
- 语义相似的规则（如"禁用'值得注意的是'"和"不使用'值得注意的是'"）
- 合并为一条，保留更精确的表述

#### 2.2 矛盾项
- 互相冲突的规则（如"多用短句"和"避免句子过短"）
- 标记矛盾并提交用户裁决

#### 2.3 已晋升项
- 标记为"已晋升到 skill"的记忆项
- 确认对应 skill 文件中已包含该规则后，从 MEMORY.md 中移除

#### 2.4 过时项
- 超过 10 篇文章未被触发的规则
- 标记为候选删除项，提交用户确认

### 3. 输出压缩报告

```markdown
## 记忆压缩报告

### writer/MEMORY.md
- 压缩前: {N} 条规则
- 合并重复: {N} 组
- 矛盾项: {N} 组（需用户裁决）
- 已晋升: {N} 条（可移除）
- 过时候选: {N} 条
- 压缩后: {N} 条规则

### outliner/MEMORY.md
...

### 需要用户裁决的矛盾项:
1. writer: "{规则A}" vs "{规则B}" — 保留哪个?
2. ...
```

### 4. 执行压缩

用户确认后:
- 合并重复项
- 按用户裁决处理矛盾项
- 移除已晋升项
- 移除用户确认的过时项
- 更新各 MEMORY.md 文件

### 5. 建议执行频率
- 每 5 篇文章后执行一次
- 或当 MEMORY.md 超过 50 条规则时执行
