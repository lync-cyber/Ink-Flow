---
slug: ai-taowa-shidai
topic: "AI 套娃时代：我们正在用 AI 构建 AI"
column: tech
target_length: 1500
opening_style: contrast
cta_type: follow
outliner: claude-opus-4-7
date: 2026-04-18
---

# 大纲: AI 套娃时代：我们正在用 AI 构建 AI

## 总览

- **目标字数**: 1500（± 150）
- **Section 数**: 6（对应 tech 骨架活用）
- **开头策略**: contrast（大多数人以为 AI 是工具，实际上它正在用自己）
- **CTA 类型**: follow（结尾引导关注，而非收藏/分享）
- **读者 takeaway**: 理解 AI 套娃的三层结构（运行时 / 数据层 / 用户体验层），并建立"递归不是段子、而是新基础设施"的认知判断，避免把多 agent 系统当玄学或泡沫看待。
- **金句候选**（位置：Section 02 或 03 之首，≤20 字）：
  - ① "AI 正在用自己，造自己。"（12 字）
  - ② "工具开始学会使用工具。"（11 字）
  - ③ "递归不是段子，是新基建。"（12 字）
  - writer 从三条中二选一，放入文章前 1/3，用 `> ` blockquote 渲染（owner: writer:quote）
- **视觉规划概览**：
  - 1 张 mermaid 递归层级图（Section 02，illustrator:mermaid）
  - 1 张四框架对比表（Section 03，writer:table）
  - 1 条 blockquote 金句（Section 02 开篇，writer:quote）
  - 1 条 GFM alert WARNING（Section 05，writer:alert）
  - 1 段 CrewAI 委托代码片段（Section 03，writer:code，继承自 research memo）
- **H2 章节编号格式**：writer 按 tech 主题要求，使用 "01 ／ 章节名" 全角斜杠格式（见 `content/styles/tech/theme.css`）

---

## Section 01 ／ 你以为在用 AI，其实 AI 在用 AI

- **论点**: 大多数人以为 AI 是工具，实际上 AI 已经开始在每一层嵌套使用另一个 AI——从你发给 ChatGPT 的一句话，到 Claude Code 内部派发给 subagent 的任务，都在发生。
- **关键细节**:
  - 反差开头：一句你发给 ChatGPT 的话，背后至少触发 3 层 AI：意图分类 AI → 路由 AI → 执行 agent（引 composio.dev 的企业客服嵌套架构，2025-2026）
  - Claude Code subagent 架构（2025-09）：每个 subagent 独立 context，独立权限，主 session 只收摘要 [来源已在 research memo]
  - 点题："套娃"这个词第一次精准描述了 2026 年的 AI 基础设施——不是比喻，是字面描述
  - 点出本文结构：运行时套娃 / 数据套娃 / 体验套娃 三层
- **预估字数**: 220
- **视觉断点**: 无（开头保持文字张力，视觉断点后置）
- **时效敏感项**: `[发布前刷新]` Claude Code subagent 发布时间与 composio 引用数据
- **depends_on_previous**: false
- **opening_style**: contrast

---

## Section 02 ／ 套娃的三层结构

- **论点**: AI 套娃不是一种现象，而是三种同时发生的递归：运行时（agent 调 agent）、数据层（AI 给 AI 造训练数据）、体验层（用户用 AI 给另一个 AI 写 prompt）——这三层正在互相加固。
- **关键细节**:
  - 金句入场（blockquote）："AI 正在用自己，造自己。"（或候选 ② / ③，writer 选一）
  - 三层定义：
    - 运行时套娃：Claude Code subagent、CrewAI delegation、AutoGen GroupChat
    - 数据层套娃：Constitutional AI / RLAIF / GPT-4 distillation → SFT"已经基本赢了"（引 rlhfbook）
    - 体验层套娃：用 ChatGPT 写 Midjourney prompt；PromptBase 这类"AI prompt 市场"在 2024-2025 兴起
  - 递归层级图作视觉锚点
- **预估字数**: 280
- **视觉断点**: mermaid 递归层级图（illustrator:mermaid）
  - 图意：一个用户提示 → 意图 AI → 编排 AI → 多个 subagent（其中一个再派生出 sub-subagent）→ 每个 agent 消费的训练数据本身由上一代 AI 生成 → 形成闭环箭头回到顶端
  - 要求：线性 + 一处回环；避免过多节点（≤ 8 节点）；保证移动端可读
- **时效敏感项**: `[发布前刷新]` PromptBase 市场热度、prompt 工具生态
- **depends_on_previous**: true
- **opening_style**: N/A

---

## Section 03 ／ 运行时套娃：四个框架怎么让 agent 调 agent

- **论点**: 运行时套娃已经有成熟的工程方案——LangGraph、CrewAI、AutoGen、LangChain 四家代表了四种不同的"agent 调 agent"范式，选型决定了你写的是流水线还是协商团队。
- **关键细节**:
  - 四框架对比表（承接 research memo 的表格，保留 7 个维度）
  - 关键数据点：CrewAI 47,800+ stars / 月入 $3.2M / 日执行 1000 万次（2026-04）；LangChain 的 State of Agent Engineering 报告：57.3% 受访者已有 agent 在生产
  - CrewAI 委托代码片段（20 行内）：`allow_delegation=True` / `allow_delegation=False` 的组合就是防无限递归的关键约束
  - 代码解读重点：一句"`allow_delegation=False` 防无限递归"——点出工程师已经在为套娃装"深度限制器"
- **预估字数**: 360
- **视觉断点**:
  - ① 四框架对比表（writer:table，7 行）— 放在本节前半
  - ② CrewAI 代码片段（writer:code，约 15-20 行，含注释）— 放在对比表之后
- **时效敏感项**: `[发布前刷新]` 四个项目的 GitHub stars、CrewAI 收入数据、LangChain 调研百分比
- **depends_on_previous**: true
- **opening_style**: N/A

---

## Section 04 ／ 数据套娃：AI 正在给 AI 造教材

- **论点**: 比运行时套娃更深一层的是训练数据套娃——GPT-4 级模型蒸馏出的合成数据已经在 SFT 阶段"赢了人类标注"，Constitutional AI 让 AI 给 AI 打分再训练下一代 AI，整条链路里人类越来越少。
- **关键细节**:
  - Constitutional AI（Anthropic）：RLAIF 范式，AI 评判 AI 生成 preference dataset
  - GPT-4 distillation：SFT 阶段"基本赢了"多数人类写手（引 rlhfbook）
  - LLM-as-a-Judge：用 LLM 给 LLM 输出打分，人类只负责底层 benchmark
  - 历史类比（短段）：编译器自举（1958 NELIAC、GCC 三阶段 bootstrap）——自指系统的工程先例，68 年前就有人用编译器编译自己，AI 只是把这套思路搬到了语义层
  - 读者 takeaway：不要把合成数据当作"退而求其次"，它已是 2025-2026 的主流
- **预估字数**: 280
- **视觉断点**: 无（本节靠类比和数据密度承载，强行加图会稀释论证）
- **时效敏感项**: 无（历史类比 + 已成定论的范式）
- **depends_on_previous**: true
- **opening_style**: N/A

---

## Section 05 ／ 套娃的裂缝：model collapse 与失控递归

- **论点**: 套娃不是没有代价——Nature 证实的 model collapse 给"AI 训 AI"划了红线；递归自我改进（RSI）进了 ICLR 主流讨论，但 alignment 研究者已经看到"假装接受训练"的信号。工程师必须在递归深度和真实数据比例之间守住阈值。
- **关键细节**:
  - Nature 2024-07 Shumailov et al："AI models collapse when trained on recursively generated data"，indiscriminate 使用合成数据会造成"不可逆"缺陷
  - 补充：arxiv.org/abs/2410.12954 的后续研究——只要保持足够比例真实数据，训练可以稳定
  - RSI 进入 ICLR 2024 workshop，从 theory 进入学术主流
  - Anthropic "alignment faking" 研究（标 [不确定]）：12% / 78% 数据
  - GFM alert WARNING 内容：**Model collapse 不是未来风险，是 2024 年 Nature 已证的现实——做合成数据管线的团队，必须监控真实数据占比**
- **预估字数**: 260
- **视觉断点**: GFM alert `> [!WARNING]`（writer:alert，3-4 行）
- **时效敏感项**:
  - `[不确定]` alignment faking 12% / 78% 数据需保留标注，正文改为"Anthropic 内部研究显示"
  - `[可能过时]` RSI workshop 后续进展
- **depends_on_previous**: true
- **opening_style**: N/A

---

## Section 06 ／ 收尾：当递归成为基建，你该怎么看

- **论点**: 套娃不是段子、也不是泡沫——它是 AI 工程正在形成的新基础设施层，像编译器自举、操作系统内核一样长期存在。普通读者的应对不是追每一个 agent 框架，而是建立"递归的直觉"：知道 AI 每一次输出背后可能不止一个 AI 在跑。
- **关键细节**:
  - 回收开头反差：你发的一句话，背后是三层以上 AI 协作，这就是 2026 年的默认状态
  - 给读者的三条判断：
    - 工程师视角：选型先问"是否需要 agent 调 agent"，避免过度抽象
    - 管理者视角：合成数据是资产，但要监控真实数据占比，别 indiscriminate
    - 普通用户视角：写 prompt 时意识到你也是递归链的一环，好的提问本身就是在训练下一代 AI
  - 不做空洞展望，不写"希望对你有所帮助"
- **预估字数**: 180
- **视觉断点**: 无（收尾保持白净，让金句余味沉淀）
- **时效敏感项**: 无
- **depends_on_previous**: true
- **opening_style**: N/A
- **CTA**: follow — writer 以一个普通段落收束，用第二人称邀请关注："如果你也在做 agent 系统、在观察这场基建形成，关注我，下一篇写 LangGraph 状态机的实战踩坑。" （不做 H3，不加"希望本文对你有所帮助"）

---

## 字数分配汇总

| Section | 论点关键词 | 预估字数 |
|---------|-----------|---------|
| 01 你以为在用 AI | 反差开头 + 三层结构预告 | 220 |
| 02 套娃的三层结构 | 运行时 / 数据 / 体验 + 金句 + 递归图 | 280 |
| 03 运行时套娃 | 四框架对比 + CrewAI 代码 | 360 |
| 04 数据套娃 | 合成数据 + Constitutional AI + 编译器类比 | 280 |
| 05 套娃的裂缝 | model collapse + RSI + alert | 260 |
| 06 收尾 | 基建判断 + follow CTA | 180 |
| **总计** | | **1580** |

---

## 参考文献规划（供 writer 引用）

研究备忘录 02 中的 21 条来源按 section 分布：

- **Section 01**: Claude Code subagent docs、composio.dev AI 客服嵌套架构
- **Section 02**: rlhfbook（synthetic data）、stablediffusion3.net（ChatGPT → Midjourney prompt 链路）
- **Section 03**: LangGraph GitHub、CrewAI getpanto 统计、ag2 GitHub、LangChain State of Agent Engineering、CrewAI 官方文档（代码段出处）
- **Section 04**: rlhfbook c/12 与 c/15、Constitutional AI（rlhfbook）、Wikipedia Bootstrapping (compilers)
- **Section 05**: Nature s41586-024-07566-y（Shumailov）、arxiv 2410.12954、foommagazine RSI workshop、pfmevents alignment faking 二手引用
- **Section 06**: 无新增引用，回收前文

writer 写作时优先用中文叙述 + 括号内 `(来源: ...)` 或在段末以 `[来源](URL)` 形式标注；避免集中罗列脚注。

---

## 不确定项（从 research memo 继承）

| 标记 | 内容 | 处理建议 |
|------|------|---------|
| `[不确定]` | Anthropic "alignment faking" 12% / 78% 数据 | Section 05 使用时改述为"Anthropic 内部研究显示……"并保留标注，不给精确百分比作标题级断言 |
| `[不确定]` | CrewAI "近半数 Fortune 500 使用" | Section 03 若引用则明确标注为"CrewAI 自报数据" |
| `[发布前刷新]` | OpenAI Agents SDK、LangGraph、CrewAI、AutoGen 的 GitHub stars | writer 写入时保留数字，publisher 在发布前用 WebSearch/WebFetch 刷新 |
| `[发布前刷新]` | CrewAI 月收入 / 日执行次数 | 来自 getpanto 2025-07 数据，发布前验证是否有更新版本 |
| `[不确定]` | deepagents 发布时间 | Section 03 表格中若引用改述为"2025 年下半年"，不写精确月份 |

---

## 对 writer 的额外提示

1. **tech 章节编号格式**：每个 H2 必须写成 `## 01 ／ 章节名`（全角斜杠 `／`，不是半角 `/`）
2. **金句约束**：≤ 20 字，放在 Section 02 开头；用 blockquote 渲染
3. **代码片段**：Section 03 的 CrewAI 代码保持在 20 行以内，带注释但不冗长
4. **禁用词自检**：写完后对照 `.claude/rules/data/forbidden-phrases.yaml`，尤其规避"值得注意的是"、"毫无疑问"、"需要注意的是"（alert 替代）
5. **开头禁止**：Section 01 不要写"AI 是一种……"（定义式）或"随着 AI 的发展……"（宏观式），要用具体反差场景切入
6. **收尾禁止**：Section 06 不要写"希望本文对你有所帮助"、"综上所述"、"未来可期"
7. **段落长度**：每段 ≤ 120 字（移动端阅读约束）
8. **句子长度**：单句 ≤ 40 字，超过就在"但是 / 因此 / ，"处拆分
