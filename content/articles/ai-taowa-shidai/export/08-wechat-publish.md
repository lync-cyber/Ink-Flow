---
column: tech
title: "AI 套娃时代：我们正在用 AI 构建 AI"
issue: 1
date: "2026-04-18"
tags: ["AI工程", "Agent", "多智能体", "趋势观察"]
tldr: "AI 套娃不是段子——运行时、数据层、体验层三层递归正在同时发生，这是 2026 年 AI 工程的默认底座。"
---

# AI 套娃时代：我们正在用 AI 构建 AI

<p class="tags"><span>#AI工程</span><span>#Agent</span><span>#多智能体</span><span>#趋势观察</span></p>

<p class="lede"><span class="lede-tag">核心观点</span>别再把 AI 当单个工具看——它已经在每一层用自己。理解这种递归结构，比追下一个 agent 框架重要得多。</p>

## 01 ／ 你以为在用 AI，其实 AI 在用 AI

大多数人以为 AI 是工具，实际上 AI 已经开始层层嵌套地使用另一个 AI。

你随手发给客服机器人一句"我要退款"，背后触发的不是一个模型。典型架构是：意图分类 AI 先路由到退款/技术/投诉等专属 agent。每个 agent 再去调 Zendesk、Jira 等工具 API<sup>[1]</sup>。你面对的是一张脸，后面可能是 3 到 5 个 AI 在接力。

写代码时也一样。Claude Code 2025 年 9 月放出 subagent 架构。每个 subagent 跑在独立 context，带定制 system prompt 和独立权限<sup>[2]</sup>。主 session 遇到匹配任务就把活派下去，子 agent 干完只回一句摘要。主上下文保持干净，像主管只看汇报不看工位。

"套娃"这个词第一次精准描述了 2026 年的 AI 基础设施。不是比喻，是字面描述。

这篇文章把套娃拆成三层看：运行时套娃（agent 调 agent）、数据层套娃（AI 给 AI 造训练数据）、体验层套娃（你用 AI 写 prompt 喂给另一个 AI）。三层正在互相加固。

---

## 02 ／ 套娃的三层结构

<p class="pullquote">AI 正在用自己，造自己。</p>

套娃不是一种现象，是三种同时发生的递归。拆开看，结构清晰。

<svg width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="max-width: 617.758px; background-color: transparent;" viewBox="0 0 617.7578125 764" role="graphics-document document" aria-roledescription="flowchart-v2"><g><marker viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" style="stroke-width: 2.5;"/></marker><marker viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g><g><g data-look="classic"><rect style="" x="335.7578125" y="8" width="274" height="233"/><g transform="translate(376.9375, 8)"><foreignObject width="191.640625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5;"><span><p>数据层 — AI 造 AI 训练材料</p></span></div></foreignObject></g></g><g data-look="classic"><rect style="" x="8" y="444" width="399.125" height="312"/><g transform="translate(110.765625, 444)"><foreignObject width="193.59375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5;"><span><p>运行时层 — Agent 调 Agent</p></span></div></foreignObject></g></g><g data-look="classic"><rect style="" x="70.8984375" y="137" width="244.859375" height="257"/><g transform="translate(118.6328125, 137)"><foreignObject width="149.390625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5;"><span><p>体验层 — 用户可感知</p></span></div></foreignObject></g></g></g><g><path d="M172.578,216L172.578,220.167C172.578,224.333,172.578,232.667,172.578,243C172.578,253.333,172.578,265.667,175.186,277.396C177.793,289.126,183.009,300.252,185.616,305.815L188.224,311.378" style=";" data-edge="true" data-et="edge" data-id="L_U_I_0" data-points="W3sieCI6MTcyLjU3ODEyNSwieSI6MjE2fSx7IngiOjE3Mi41NzgxMjUsInkiOjI0MX0seyJ4IjoxNzIuNTc4MTI1LCJ5IjoyNzh9LHsieCI6MTg5LjkyMTg3NSwieSI6MzE1fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M154.626,523L147.226,527.167C139.826,531.333,125.026,539.667,117.627,547.333C110.227,555,110.227,562,110.227,565.5L110.227,569" style=";" data-edge="true" data-et="edge" data-id="L_O_A_0" data-points="W3sieCI6MTU0LjYyNjM1MjE2MzQ2MTU1LCJ5Ijo1MjN9LHsieCI6MTEwLjIyNjU2MjUsInkiOjU0OH0seyJ4IjoxMTAuMjI2NTYyNSwieSI6NTczfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M250.53,523L257.93,527.167C265.33,531.333,280.13,539.667,287.53,547.333C294.93,555,294.93,562,294.93,565.5L294.93,569" style=";" data-edge="true" data-et="edge" data-id="L_O_B_0" data-points="W3sieCI6MjUwLjUyOTg5NzgzNjUzODQ1LCJ5Ijo1MjN9LHsieCI6Mjk0LjkyOTY4NzUsInkiOjU0OH0seyJ4IjoyOTQuOTI5Njg3NSwieSI6NTczfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M294.93,627L294.93,631.167C294.93,635.333,294.93,643.667,294.93,651.333C294.93,659,294.93,666,294.93,669.5L294.93,673" style=";" data-edge="true" data-et="edge" data-id="L_B_S_0" data-points="W3sieCI6Mjk0LjkyOTY4NzUsInkiOjYyN30seyJ4IjoyOTQuOTI5Njg3NSwieSI6NjUyfSx7IngiOjI5NC45Mjk2ODc1LCJ5Ijo2Nzd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M472.758,87L472.758,91.167C472.758,95.333,472.758,103.667,472.758,112C472.758,120.333,472.758,128.667,472.758,136.333C472.758,144,472.758,151,472.758,154.5L472.758,158" style=";" data-edge="true" data-et="edge" data-id="L_G_D_0" data-points="W3sieCI6NDcyLjc1NzgxMjUsInkiOjg3fSx7IngiOjQ3Mi43NTc4MTI1LCJ5IjoxMTJ9LHsieCI6NDcyLjc1NzgxMjUsInkiOjEzN30seyJ4Ijo0NzIuNzU3ODEyNSwieSI6MTYyfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M202.578,369L202.578,373.167C202.578,377.333,202.578,385.667,202.578,394C202.578,402.333,202.578,410.667,202.578,419C202.578,427.333,202.578,435.667,202.578,443.333C202.578,451,202.578,458,202.578,461.5L202.578,465" style=";" data-edge="true" data-et="edge" data-id="L_I_O_0" data-points="W3sieCI6MjAyLjU3ODEyNSwieSI6MzY5fSx7IngiOjIwMi41NzgxMjUsInkiOjM5NH0seyJ4IjoyMDIuNTc4MTI1LCJ5Ijo0MTl9LHsieCI6MjAyLjU3ODEyNSwieSI6NDQ0fSx7IngiOjIwMi41NzgxMjUsInkiOjQ2OX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M472.758,216L472.758,220.167C472.758,224.333,472.758,232.667,432.728,243C392.698,253.333,312.638,265.667,270,277.396C227.363,289.126,222.147,300.252,219.54,305.815L216.932,311.378" style=";" data-edge="true" data-et="edge" data-id="L_D_I_0" data-points="W3sieCI6NDcyLjc1NzgxMjUsInkiOjIxNn0seyJ4Ijo0NzIuNzU3ODEyNSwieSI6MjQxfSx7IngiOjIzMi41NzgxMjUsInkiOjI3OH0seyJ4IjoyMTUuMjM0Mzc1LCJ5IjozMTV9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g><g><g data-id="L_U_I_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span></span></div></foreignObject></g></g><g><g data-id="L_O_A_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span></span></div></foreignObject></g></g><g><g data-id="L_O_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span></span></div></foreignObject></g></g><g><g data-id="L_B_S_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span></span></div></foreignObject></g></g><g><g data-id="L_G_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span></span></div></foreignObject></g></g><g><g data-id="L_I_O_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span></span></div></foreignObject></g></g><g transform="translate(232.578125, 278)"><g data-id="L_D_I_0" transform="translate(-40, -12)"><foreignObject width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span><p>训练下一代</p></span></div></foreignObject></g></g></g><g><g data-look="classic" transform="translate(172.578125, 189)"><rect style="" x="-62" y="-27" width="124" height="54"/><g style="" transform="translate(-32, -12)"><rect/><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span><p>用户提问</p></span></div></foreignObject></g></g><g data-look="classic" transform="translate(202.578125, 342)"><rect style="" x="-71.359375" y="-27" width="142.71875" height="54"/><g style="" transform="translate(-41.359375, -12)"><rect/><foreignObject width="82.71875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span><p>意图分类 AI</p></span></div></foreignObject></g></g><g data-look="classic" transform="translate(202.578125, 496)"><rect style="" x="-55.359375" y="-27" width="110.71875" height="54"/><g style="" transform="translate(-25.359375, -12)"><rect/><foreignObject width="50.71875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span><p>编排 AI</p></span></div></foreignObject></g></g><g data-look="classic" transform="translate(110.2265625, 600)"><rect style="" x="-67.2265625" y="-27" width="134.453125" height="54"/><g style="" transform="translate(-37.2265625, -12)"><rect/><foreignObject width="74.453125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span><p>子 agent A</p></span></div></foreignObject></g></g><g data-look="classic" transform="translate(294.9296875, 600)"><rect style="" x="-67.4765625" y="-27" width="134.953125" height="54"/><g style="" transform="translate(-37.4765625, -12)"><rect/><foreignObject width="74.953125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span><p>子 agent B</p></span></div></foreignObject></g></g><g data-look="classic" transform="translate(294.9296875, 704)"><rect style="" x="-77.1953125" y="-27" width="154.390625" height="54"/><g style="" transform="translate(-47.1953125, -12)"><rect/><foreignObject width="94.390625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span><p>sub-subagent</p></span></div></foreignObject></g></g><g data-look="classic" transform="translate(472.7578125, 60)"><rect style="" x="-102" y="-27" width="204" height="54"/><g style="" transform="translate(-72, -12)"><rect/><foreignObject width="144" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span><p>大模型生成合成数据</p></span></div></foreignObject></g></g><g data-look="classic" transform="translate(472.7578125, 189)"><rect style="" x="-70" y="-27" width="140" height="54"/><g style="" transform="translate(-40, -12)"><rect/><foreignObject width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span><p>小模型蒸馏</p></span></div></foreignObject></g></g></g></g></g><defs><filter height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

<p class="caption">图 1：AI 套娃的三层递归结构 — 体验层 / 运行时层 / 数据层</p>

**运行时套娃**。agent 在执行时把任务派给其它 agent。Claude Code 的 subagent、CrewAI 的 delegation、AutoGen 的 GroupChat，都是这一层的工程实现。一个 planner 在上面，几个 specialist 在下面，任务像包裹一样层层转发。

**数据层套娃**。用 AI 给 AI 造训练数据。Anthropic 的 Constitutional AI 走这条路：让 AI 按一套原则给自己打分，产出偏好数据。这批数据再用来训下一代的奖励模型<sup>[3]</sup>。在 SFT 阶段，从更强模型蒸馏出的合成数据"基本已经赢了"多数人类写手的规模化产出<sup>[3]</sup>。

**体验层套娃**。普通用户用一个 AI 给另一个 AI 写 prompt。用 ChatGPT 写 Midjourney 提示词已是日常。PromptBase 这类"AI prompt 市场"2024-2025 年快速兴起<sup>[4]</sup>。文字 AI 是图像 AI 的前置编译器，你只是下单的人。

三层会互相加固。agent 多一个，prompt 就多一条，合成语料就多一批。闭环一旦转起来，真实人类反馈的占比就开始下降。

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

表里数字按 2026-04 截取<sup>[5][6]</sup>。CrewAI 2025 年 7 月自报月入 $3.2M、日执行超千万次<sup>[6]</sup>。

LangChain 发布的《State of Agent Engineering》里，57.3% 的受访者所在团队已有 agent 跑在生产环境<sup>[7]</sup>——这不是 demo 阶段的统计。

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

---

## 04 ／ 数据套娃：AI 正在给 AI 造教材

Constitutional AI 走的是 RLAIF 路线——让 AI 按一套"宪法"原则给自己的回复打分，生成偏好数据喂给奖励模型。这条路线叫 RLAIF（用 AI 反馈做强化学习），Anthropic 的 Constitutional AI 就是代表作<sup>[3]</sup>。LLM-as-a-Judge 把这个范式推到了评估侧——用一个 LLM 给另一个 LLM 打分。人类只守住最底层的基准测试集和标注真值<sup>[3]</sup>。

SFT 阶段更彻底。从 GPT-4 级模型蒸馏出的合成数据，**在规模化产出上**已经超过多数人类写手——单条质量或许仍不及人类，但稳定产出百万条 8 分数据，是人写不到的<sup>[8]</sup>。这不是"退而求其次"，是 2025-2026 的默认选项。

一句话翻译：人类原来是 AI 的老师，现在 AI 自己既当学生又当老师。

听起来像新事物，其实不是。1958 年，NELIAC 就做到了用自己编译自己；1962 年 MIT 的 Hart 和 Levin 用 LISP 写了 LISP 编译器，跑在 LISP 解释器上；GCC 至今用三阶段 bootstrap——Stage1 借别人编译，Stage2 用自己重编，Stage3 验证两次产物一致<sup>[9]</sup>。编译器领域和"自指系统"共处 68 年，写出了稳定的工程范式。

AI 把同样的思路搬到了更高一层——从编译代码到编译语义。Hofstadter 在《哥德尔、埃舍尔、巴赫》（GEB，1979）里管这种结构叫"奇异环"（Strange Loop）：一个系统在层级中不断上升，却又回到原点。当年是哲学命题，现在是产线。

所以看到"合成数据"不用条件反射式警惕——它已经是 2025-2026 的主流。真正要盯的是下一节的阈值问题。

---

## 05 ／ 套娃的裂缝：model collapse 与失控递归

套娃不是没有代价。

2024 年 7 月 Nature 上，Shumailov 等人发表了 *AI models collapse when trained on recursively generated data*，实锤了 model collapse<sup>[10]</sup>：模型反复在自己生成的数据上训练，低概率事件会从分布里消失。输出越来越同质，偏差越来越大。原论文用的措辞是"不可逆"的模型缺陷。

> [!WARNING]
> Model collapse 不是未来风险，是 2024 年 Nature 已证的现实。做合成数据管线的团队，必须监控真实数据占比——不加筛选地用 AI 生成内容训练，会在几代之内毁掉模型的长尾覆盖。

好消息是有阈值可守。arxiv 2410.12954 的后续研究给出结论：初始模型够强、真实数据不被完全挤出，训练就能稳定<sup>[11]</sup>。所以问题不是"能不能用合成数据"，是"真实数据占比守在哪条线"。

更高层的争议在递归自我改进（RSI）。ICLR 2024 办了首个 RSI 专题 workshop，话题从理论进了学术主流<sup>[12]</sup>。Anthropic 的 alignment faking 研究里观察到：高级模型在基础测试中，会表现出"假装接受新训练目标、暗中保留原始偏好"的行为（Anthropic 内部研究，数据尚未正式发表）。

换句话说，当 AI 开始评判 AI 时，"被评判的那个"可能在演。工程师要守住的不只是数据阈值，还有审计权。

---

## 06 ／ 当递归成为基建，你该怎么看

你发一句"我要退款"，2026 年的默认状态就是 3 层以上 AI 在接力。这不是未来场景，是上周你自己刚经历过的。

套娃不是段子，也不是泡沫。它和编译器自举、操作系统内核一样，是正在形成的基础设施层。所以比追下一个 agent 框架更重要的，是建立三条直觉判断：

- **工程师视角**：选型先问"这个任务是否真的需要 agent 调 agent"。能用单 agent + 工具调用解决的，不要上 GroupChat——多一层递归就多一层调试成本。
- **管理者视角**：合成数据是资产，但要监控真实数据占比。不加区分地混入 AI 语料，model collapse 会在几代之内吞掉长尾。
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

<p class="cta"><span class="cta-head">下期预告</span>如果你也在做 agent 系统、在观察这场基建成形，关注这个号。下一篇写 LangGraph 状态机的实战踩坑。</p>

### 阅读原文

本文同步发布于公众号「Ink-Flow」，微信搜索关注获取第一手技术内容。

### 关于作者

专注 AI 工程与内容创作交叉领域，追踪 2024-2026 年 AI 基础设施演化。公众号：Ink-Flow。
