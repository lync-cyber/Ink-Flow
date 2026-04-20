---

## 02 ／ 套娃的三层结构

<p class="pullquote">AI 正在用自己，造自己。</p>

套娃不是一种现象，是三种同时发生的递归。拆开看，结构清晰。

**运行时套娃**。agent 在执行时把任务派给其它 agent。Claude Code 的 subagent、CrewAI 的 delegation、AutoGen 的 GroupChat，都是这一层的工程实现。一个 planner 在上面，几个 specialist 在下面，任务像包裹一样层层转发。

**数据层套娃**。用 AI 给 AI 造训练数据。Anthropic 的 Constitutional AI 让 AI 按一组原则给自己的回复打分，生成 preference dataset 再训下一代 reward model<sup>[3]</sup>。在 SFT 阶段，从更强模型蒸馏出的合成数据"基本已经赢了"多数人类写手的规模化产出<sup>[3]</sup>。

**体验层套娃**。普通用户用一个 AI 给另一个 AI 写 prompt。用 ChatGPT 写 Midjourney 提示词已是日常操作，PromptBase 这类"AI prompt 市场"在 2024-2025 年快速兴起<sup>[4]</sup>。文字 AI 是图像 AI 的前置编译器，你只是下单的人。

三层会互相加固：运行时多一个 agent，体验层就多一次 prompt，数据层就多一批合成语料。闭环一旦转起来，真实人类反馈的占比就开始下降。

<!-- FIGURE: fig-01 -->
