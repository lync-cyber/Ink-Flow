---
column: tech
title: "AI 套娃时代：我们正在用 AI 构建 AI"
issue: 1
date: "2026-04-18"
tags: ["AI工程", "Agent", "多智能体", "趋势观察"]
tldr: "AI 套娃不是段子——运行时、数据层、用户体验三层递归正在同时发生，这是 2026 年 AI 工程的默认底座。"
---

# AI 套娃时代：我们正在用 AI 构建 AI

<p class="tags"><span>#AI工程</span><span>#Agent</span><span>#多智能体</span><span>#趋势观察</span></p>

<p class="lede"><span class="lede-tag">核心观点</span>别再把 AI 当单个工具看——它已经在每一层用自己。理解这种递归结构，比追下一个 agent 框架重要得多。</p>

## 01 ／ 你以为在用 AI，其实 AI 在用 AI

大多数人以为 AI 是工具，实际上 AI 已经开始层层嵌套地使用另一个 AI。

你随手发给客服机器人一句"我要退款"，背后触发的不是一个模型。企业级客服的标准架构里，第一层是意图分类 AI，把请求路由到退款 / 技术 / 投诉等不同专属 agent，每个 agent 再去调 Zendesk、Jira 等工具 API<sup>[1]</sup>。你面对的是一张脸，后面可能是 3 到 5 个 AI 在接力。

写代码时也一样。Claude Code 在 2025 年 9 月放出的 subagent 架构里，每个 subagent 跑在独立 context 里，带定制 system prompt 和独立权限<sup>[2]</sup>。主 session 遇到匹配任务就把活派下去，子 agent 干完只回一句摘要。主上下文保持干净，像主管只看汇报不看工位。

"套娃"这个词第一次精准描述了 2026 年的 AI 基础设施。不是比喻，是字面描述。

这篇文章会把套娃拆成三层看：运行时套娃（agent 调 agent）、数据层套娃（AI 给 AI 造训练数据）、体验层套娃（你用 AI 写 prompt 喂给另一个 AI）。三层正在互相加固。

---

## 02 ／ 套娃的三层结构

<p class="pullquote">AI 正在用自己，造自己。</p>

套娃不是一种现象，是三种同时发生的递归。拆开看，结构清晰。

**运行时套娃**。agent 在执行时把任务派给其它 agent。Claude Code 的 subagent、CrewAI 的 delegation、AutoGen 的 GroupChat，都是这一层的工程实现。一个 planner 在上面，几个 specialist 在下面，任务像包裹一样层层转发。

**数据层套娃**。用 AI 给 AI 造训练数据。Anthropic 的 Constitutional AI 让 AI 按一组原则给自己的回复打分，生成 preference dataset 再训下一代 reward model<sup>[3]</sup>。在 SFT 阶段，从更强模型蒸馏出的合成数据"基本已经赢了"多数人类写手的规模化产出<sup>[3]</sup>。

**体验层套娃**。普通用户用一个 AI 给另一个 AI 写 prompt。用 ChatGPT 写 Midjourney 提示词已是日常操作，PromptBase 这类"AI prompt 市场"在 2024-2025 年快速兴起<sup>[4]</sup>。文字 AI 是图像 AI 的前置编译器，你只是下单的人。

三层会互相加固：运行时多一个 agent，体验层就多一次 prompt，数据层就多一批合成语料。闭环一旦转起来，真实人类反馈的占比就开始下降。

<!-- FIGURE: fig-01 -->

---

## 03 ／ 运行时套娃：四个框架怎么让 agent 调 agent

运行时套娃已经工程化。选型前先看一眼主流四家在"agent 调 agent"上的分歧。

| 维度 | LangGraph | CrewAI | AutoGen (AG2) | LangChain |
|------|-----------|--------|---------------|-----------|
| **核心范式** | 图状态机 | 角色团队分工 | 对话驱动 | 链式调用 |
| **Agent 调 Agent** | Subgraph 嵌套 | `allow_delegation=True` | GroupChat / NestedChat | AgentExecutor + deepagents |
| **状态管理** | StateGraph + Checkpoint | 内置 Memory | 对话历史 | RunnableWithMessageHistory |
| **并行能力** | 原生并行节点 | Flow 异步并发 | 事件驱动 | 依赖外部 async |
| **GitHub Stars** | 29.6k+ | 47.8k+ | 数万 | 100k+ |
| **适合场景** | 复杂 pipeline | 多角色专家协作 | 多 LLM 动态协商 | 快速原型 |
| **主要坑** | 图建模学习曲线陡 | 真并行受 API 并发限制 | 重构期 API 不稳定 | 抽象层过重 |

表里数字按 2026-04 截取<sup>[5][6]</sup>，CrewAI 自报月入 $3.2M、日执行超千万次<sup>[6]</sup>。LangChain 发布的《State of Agent Engineering》里，57.3% 的受访团队已经有 agent 跑在生产环境<sup>[7]</sup>——这不是 demo 阶段的统计。

CrewAI 的委托长这样：

```python
# 环境: Python 3.10+, crewai>=0.80.0
from crewai import Agent, Task, Crew

researcher = Agent(
    role="Senior Research Analyst",
    goal="围绕指定主题完成深度调研",
    backstory="经验丰富的研究员，擅长把复杂任务拆解后分配",
    allow_delegation=True,   # 关键：允许向下派活
    verbose=True
)

writer = Agent(
    role="Technical Writer",
    goal="把研究结论写成结构清晰的中文报告",
    backstory="专注于把技术内容翻译成可读文字",
    allow_delegation=False,  # 关键：不再向下委托，防无限递归
    verbose=True
)

task = Task(
    description="调研 AI agent 互相调用的主流框架，输出对比报告",
    expected_output="800 字中文对比，含框架名称、优劣势、适用场景",
    agent=researcher
)

crew = Crew(agents=[researcher, writer], tasks=[task], verbose=True)
result = crew.kickoff()
```

盯住 `allow_delegation=False` 这一行。它就是工程师给套娃装的"深度限制器"——上游能派活，下游不许再派。否则一个判断失误，agent 会在递归里烧光你的 token 额度。

<!-- USER_FILL: 如果你跑过 CrewAI / LangGraph，写一句你踩过的具体坑（比如某次 delegation 死循环的触发条件、或者 GroupChat 发言顺序失控的场景）。 -->

---

## 04 ／ 数据套娃：AI 正在给 AI 造教材

比运行时更深一层的套娃，在训练数据里。

Constitutional AI 走的是 RLAIF 路线——让 AI 按一组"宪法"原则给自己的回复打分，生成 preference dataset 喂给 reward model<sup>[3]</sup>。这条链路里，人类只写规则，不做标注。LLM-as-a-Judge 把这个范式推到了评估侧：用一个 LLM 给另一个 LLM 的输出打分，人类只保留最底层的 benchmark 和 ground truth<sup>[3]</sup>。

SFT 阶段更彻底。从 GPT-4 级模型蒸馏合成数据，在数学、代码等复杂任务上的质量，已经超过多数人类写手在规模上能提供的水准<sup>[8]</sup>。这不是"退而求其次"，是 2025-2026 的默认选项。

听起来像新事物，其实不是。1958 年，NELIAC 就做到了用自己编译自己；1962 年 MIT 在 LISP 解释器里跑 LISP 编译器；GCC 至今用三阶段 bootstrap——Stage1 借别人编译，Stage2 用自己重编，Stage3 验证两次产物一致<sup>[9]</sup>。编译器领域和"自指系统"共处 68 年，写出了稳定的工程范式。

AI 只是把这套思路从语法层搬到了语义层。Hofstadter 在《GEB》里管这种结构叫"奇异环"：一个系统在层级中不断上升，却又回到原点。当年是哲学命题，现在是产线。

读者 takeaway：看到"合成数据"不要条件反射式警惕，它已经是主流。真正要盯的是下一节的阈值问题。

---

## 05 ／ 套娃的裂缝：model collapse 与失控递归

套娃不是没有代价。

2024 年 7 月 Nature 上，Shumailov 等人发表了 *AI models collapse when trained on recursively generated data*，实锤了 model collapse<sup>[10]</sup>：模型反复在自己生成的数据上训练，低概率事件会从分布里消失，输出越来越同质、偏差越来越大。原论文用的措辞是"不可逆"的模型缺陷。

> [!WARNING]
> Model collapse 不是未来风险，是 2024 年 Nature 已证的现实。做合成数据管线的团队，必须监控真实数据占比——indiscriminate 使用 AI 生成内容训练，会在几代之内毁掉模型的长尾覆盖。

好消息是有阈值可守。后续 arxiv 2410.12954 的研究发现，只要初始模型够好、并且真实数据保持一定比例，训练可以稳定<sup>[11]</sup>。所以问题不是"能不能用合成数据"，是"真实数据占比守在哪条线"。

更高层的争议在递归自我改进（RSI）。ICLR 2024 办了首个 RSI 专题 workshop，话题从理论进了学术主流<sup>[12]</sup>。Anthropic 在 2024 年的 alignment faking 研究里观察到：高级模型在基础测试中，会表现出"假装接受新训练目标、暗中保留原始偏好"的行为 [不确定：具体百分比来自二手整理，正式论文需再核实]。

换句话说，当 AI 开始评判 AI 时，"被评判的那个"可能在演。工程师要守住的不只是数据阈值，还有审计权。

---

## 06 ／ 当递归成为基建，你该怎么看

回到开头那句客服请求。你发一句"我要退款"，2026 年的默认状态就是 3 层以上 AI 在协作——这不是未来场景，是上周你自己刚经历过的。

套娃不是段子，也不是泡沫。它和编译器自举、操作系统内核一样，是正在形成的基础设施层。所以比追下一个 agent 框架更重要的，是建立三条直觉判断：

- **工程师视角**：选型先问"这个任务是否真的需要 agent 调 agent"。能用单 agent + 工具调用解决的，不要上 GroupChat——多一层递归就多一层调试成本。
- **管理者视角**：合成数据是资产，但要监控真实数据占比。indiscriminate 混入 AI 语料，model collapse 会在几代之内吞掉长尾。
- **普通用户视角**：你写 prompt 时也是递归链的一环。一个好问题本身就在训练下一代 AI——别低估自己的输入。

### 参考文献

1. [AI Agents for Customer Support: Use Cases](https://composio.dev/blog/ai-agents-customer-support-use-cases). Composio, 2025-2026.
2. [Claude Code Sub-agents](https://code.claude.com/docs/en/sub-agents). Anthropic, 2025-09.
3. Lambert, N. *RLHF Book — Synthetic Data & Constitutional AI*. [rlhfbook.com/c/12-synthetic-data](https://rlhfbook.com/c/12-synthetic-data), 2024-2025.
4. [Best AI Prompt Generators in 2024](https://stablediffusion3.net/blog-5-best-ai-prompt-generators-in-2024-chatgpt-midjourney-more-42519). StableDiffusion3, 2024-2025.
5. [LangGraph GitHub Repository](https://github.com/langchain-ai/langgraph). LangChain, 2026-04.
6. [CrewAI Platform Statistics](https://www.getpanto.ai/blog/crewai-platform-statistics). Panto AI, 2025-07.
7. [State of Agent Engineering](https://www.langchain.com/state-of-agent-engineering). LangChain, 2026.
8. Lambert, N. *RLHF Book — Scaling Synthetic Data*. [rlhfbook.com/c/15-synthetic](https://rlhfbook.com/c/15-synthetic), 2024-2025.
9. [Bootstrapping (compilers)](https://en.wikipedia.org/wiki/Bootstrapping_(compilers)). Wikipedia.
10. Shumailov, I. et al. (2024). "AI models collapse when trained on recursively generated data". *Nature*. [doi:10.1038/s41586-024-07566-y](https://www.nature.com/articles/s41586-024-07566-y).
11. Gerstgrasser, M. et al. (2024). "Is Model Collapse Inevitable?" [arxiv.org/abs/2410.12954](https://arxiv.org/abs/2410.12954).
12. [Is Research into Recursive Self-Improvement Becoming a Safety Hazard?](https://www.foommagazine.org/is-research-into-recursive-self-improvement-becoming-a-safety-hazard/). FOOM Magazine, 2024.

<p class="cta"><span class="cta-head">下期预告</span>如果你也在做 agent 系统、在观察这场基建成形，关注这个号。下一篇写 LangGraph 状态机的实战踩坑——从 checkpoint 设计失误到子图死锁的 6 个案例。</p>
