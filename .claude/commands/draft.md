---
description: 执行写作阶段 — 按大纲逐 section 调用 writer agent，合并为完整草稿
---

## 执行逻辑

### 1. 前置检查
- 读取 `.pipeline-states/{slug}.json`
- 确认 outline 阶段 status 为 completed 且 checkpoint_approved 为 true
- 读取 `outlines/{topic}-outline.md` 解析 section 列表

### 2. 逐 Section 写作

对大纲中的每个 section:

#### 2.0 并行判断
- 读取 section 的 `depends_on_previous` 字段（默认 true）
- 若 `depends_on_previous == false`:
  - 可与前序 section 并行执行（使用 Agent tool 的并行调用）
  - 不传入前一 section 的衔接内容
- 若 `depends_on_previous != false`（默认）:
  - 等待前一 section 完成，读取其最后两段

#### 2.1 组装上下文
- 读取 `outlines/{topic}-outline.md` 中当前 section 的定义
- 读取 `styles/{style_profile}/style-profile.md` 风格规则（style_profile 从 brief frontmatter 获取，默认 "default"）
- 加载 skills:
  - `anti-ai-style` — 始终注入
  - `style-reference` — 始终注入（选最相关参考文章的 2-3 段做 few-shot）
  - `opening-hooks` — 仅第一个 section 注入（按 outline 中的 opening_style 选择策略）
- 若不是第一个 section: 读取 `drafts/{topic}-section-{N-1}.md` 最后两段保持衔接
- 读取 `.claude/agent-memory/writer/MEMORY.md`

#### 2.2 调用 Writer Agent
- 使用 `.claude/agents/writer.md` 定义的 writer subagent
- 输出写入 `drafts/{topic}-section-{N}.md`

#### 2.3 校验 Section
- 运行 contract-validator.sh 校验:
  - 字数在大纲预估 ±20% 内
  - 无 forbidden_patterns
- 校验失败 → L1 重试

### 3. 合并草稿
- 所有 section 写完后，按序合并为 `drafts/{topic}-full-draft.md`
- 合并时检查 section 间的衔接是否自然

### 4. 更新状态
- 更新 `.pipeline-states/{slug}.json`:
  - draft.status: "completed"
  - draft.artifacts: ["drafts/{topic}-full-draft.md", "drafts/{topic}-section-*.md"]
- 追加运行日志（每个 section 单独记录耗时和 token）

### 5. 输出提示
- 展示草稿统计（总字数、section 数、各 section 字数）
- 标注 `<!-- USER_FILL -->` 位置，提醒用户补充个人经验
- 提示: "草稿完成。建议阅读 drafts/{topic}-full-draft.md 后执行 /run 继续。"
