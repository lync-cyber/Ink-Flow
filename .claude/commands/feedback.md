---
description: 两阶段反馈捕获 — 确定性 diff + LLM 辅助分类 + 用户确认 → 更新 agent 记忆
---

## 执行逻辑

### Step 1 — 确定性 Diff（零 LLM 成本）

对 AI 初稿与用户终审版本做文本 diff:

- **AI 初稿**: `drafts/{topic}-full-draft.md`
- **用户终审版**: `output/{topic}-final.md`

输出结构化修改报告:
```markdown
## 修改报告

### 统计
- 新增段落: {N}
- 删除段落: {N}
- 修改段落: {N}
- 净字数变化: {+/-N}

### 新增内容
{列出用户新增的段落}

### 删除内容
{列出被删除的段落}

### 修改内容
| # | 位置 | 修改前 | 修改后 |
|---|------|--------|--------|
```

### Step 2 — LLM 辅助分类 + 用户确认

对每条 diff 进行分类建议:

| 分类 | 说明 | 更新目标 |
|------|------|----------|
| 事实错误修正 | AI 写错了事实 | researcher memory |
| 风格调整 | 用户改了语气/用词 | writer memory |
| 结构调整 | 用户调整了段落/section 结构 | outliner memory |
| 用户新增 | 用户添加了 AI 无法产出的内容 | 记录用户偏好的内容类型 |
| 删除冗余 | 用户删除了不需要的内容 | 新增到禁用清单 |

**展示分类建议给用户**:
```
以下是我对修改的分类建议，请确认或修改:

1. [风格调整] "值得注意的是" → "说白了" (Section 2)
   → 建议更新 writer memory: 禁用"值得注意的是"
   确认? (y/n/修改)

2. [用户新增] 新增个人经验段落 (Section 3)
   → 记录: 用户偏好在技术对比后加入个人踩坑经验
   确认? (y/n/修改)
```

### Step 3 — 写入 Agent Memory

用户确认后，将分类结果写入对应的 agent memory:
- `researcher/MEMORY.md` ← 事实错误修正
- `writer/MEMORY.md` ← 风格调整 + 删除冗余
- `outliner/MEMORY.md` ← 结构调整
- `editor/MEMORY.md` ← 反复出现的审核遗漏

**重要**: 只有用户确认的项才写入 memory。未确认的项不处理。

### 输出
- 反馈报告: `retro/{run_id}-feedback.md`
- 更新的 memory 文件列表
- 提示: "反馈已记录。建议继续执行 /retro 查看整体趋势。"
