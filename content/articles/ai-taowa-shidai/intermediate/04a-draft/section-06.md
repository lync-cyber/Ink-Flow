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
