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
