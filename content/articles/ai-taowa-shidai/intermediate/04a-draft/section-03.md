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
