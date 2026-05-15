---
title: "wechat-typeset：一个为 AI 而生的微信公众号排版工具"
tags: [微信公众号, 排版工具, AI, LLM, 开源]
tldr: "AI 写完文章不该再让人手动搬运排版。wechat-typeset 把内容生产和主题表达彻底拆开，让 Claude/GPT 直接产出投递就绪的富文本，作者只剩选主题和发文。"
---

# wechat-typeset：一个为 AI 而生的微信公众号排版工具

::: intro
我用 Claude 写完一篇技术文章，最后那一公里却要花一小时手动搬版。后来我做了 wechat-typeset，把这一小时压回三分钟。
:::

写作工具这几年没少进步。Claude、GPT、Cursor 各自都能写出体面的初稿。但每次写完，我还是要打开公众号后台，对着满屏纯文本叹气。

H2 的颜色不对、引用块的边框不够细、金句没法做成单独的卡片。这些事 AI 一个也帮不了我，工具栏上一个个按钮慢慢点。

<!-- USER_FILL: 哪次手动搬版让你下定决心做这个工具？写一个具体的崩溃瞬间 —— 比如某个深夜在公众号后台调到第几遍 H2 颜色不对 -->

那次之后我开始动手。目标只有一句话：让 AI 写完文章直接得到能粘的富文本，作者只剩选主题和发文。

wechat-typeset 跑在浏览器里，没有后端，draft 自动存 localStorage。11 套主题，37 个容器，公开 12 个 TypeScript 符号，4 个能挂到 Claude Code 的子 skill。AI 写完就是终稿。

::: quote-card variant=classic
AI 写完不算完，让 AI 把活儿做到底。
:::
