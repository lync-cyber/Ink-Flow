---
slug: wechat-typeset-ai-friendly
platform: wechat
column: tech
polisher: polisher-agent
polished_at: 2026-05-15
polish_source: content/articles/wechat-typeset-ai-friendly/intermediate/04a-draft/wechat/merged-draft.md
audit_source: content/articles/wechat-typeset-ai-friendly/review/05-audit/wechat.md
polish_target: content/articles/wechat-typeset-ai-friendly/export/07-final/wechat.md
---

# 润色记录: wechat-typeset · wechat

## 润色结果

终稿位于 `export/07-final/wechat.md`，本文件仅保留变更溯源与摘要。

- 总字数（CJK + ASCII 词）：**2475**（落在 target 2200-3600 内）
- 全文段落 ≤ 120 字：✅
- 全文句子 ≤ 40 字（核心叙述句）：✅；剩余 7 处 41-53 字为并列短描述（数字罗列 / 工具对比），按 voice 节奏保留
- 全文无禁用词（27 个全清单扫描）：✅
- 金句"AI 写完不算完，让 AI 把活儿做到底。"位置：L20（前 1/3 内）：✅
- compare 容器外四内三：✅
- frontmatter 含 title / tags / tldr / column：✅

---

## 变更溯源表

| 序号 | audit_ref | 位置 | 原文 | 改后 | 类型 | 处理方式 | 备注 |
|---|---|---|---|---|---|---|---|
| 1 | M-01 | frontmatter | （缺 column 字段） | `column: tech` | 补字段 | 采纳 | 必须项；与 outline 声明一致 |
| 2 | S-01 | L21 段落（124 字 > 120） | "wechat-typeset 跑在浏览器里...11 套主题，37 个容器，公开 12 个 TypeScript 符号，4 个能挂到 Claude Code 的子 skill。AI 写完就是终稿。" | 拆为两段：段 1 "wechat-typeset 跑在浏览器里，没有后端，draft 自动存 localStorage。"；段 2 "11 套主题，37 个容器，公开 12 个 TypeScript 符号，4 个能挂到 Claude Code 的子 skill。AI 写完就是终稿。" | 拆段 | 采纳 | 必须项；按 audit 建议执行 |
| 3 | S-02 | L54 段落（185 字 > 120） | "**第一层是内容层**。AI 只写 GFM 加 `:::` 容器扩展。容器节点目前 37 个，覆盖公众号常见的所有视觉位：`intro`、`abstract`...`footer-cta`。AI 不需要懂颜色和字号，只需要知道'这段是引言、那段是金句'。" | 拆为三段：段 1 "**第一层是内容层**。AI 只写 GFM 加 `:::` 容器扩展。"；段 2 把容器清单改为按类分组的 5 条 bullet 列表（引言与封面 / 提示与警告 / 金句与对比 / 步骤与数字 / 收束）；段 3 "AI 不需要懂颜色和字号..." | 拆段 + 加列表 | 采纳并调整 | 必须项；audit 建议列 4-6 个，我按用途分组为 5 类共 11 个，可读性更高 |
| 4 | M-03 | L192 代码块 | 三反引号后无语言标识 | 改为 ` ```text ` | 补字段 | 采纳 | 标 `text` 而非 `markdown`，因为内容是自然语言 prompt 而非 markdown |
| 5 | V-03 | L19 | "作者只剩选主题和发文" | "我只剩选主题和发文" | 改词 | 采纳 | 统一第一人称；同时 frontmatter tldr 中 "作者只剩选主题和发文" 一并改为 "我只剩选主题和发文" |
| 6 | A-01 | Section 2 末段（L40 后） | 缺"既有工具把微信坑变成 GUI 操作选项，AI 接不进来"的呼应句 | 在 "第二层的微信坑只是被工具'内部处理掉了'，没有暴露给 AI。" 后单独成段加 "这些工具把微信坑变成了 GUI 操作选项，AI 接不进来。" | 补段 | 采纳 | 与 Section 5 cons "doocs/md 的 AI 帮人写内容，写完还是人手动套主题" 形成呼应 |
| 7 | S-04 | L31 | "模型写出来的是干净的 GFM markdown，没有'...'的视觉语义。粘进任何编辑器都得重新挑样式。" | "模型写出来的是干净的 GFM markdown。没有'哪段该做引言、哪段该做金句卡、哪段是步骤'的视觉语义，粘进任何编辑器都得重新挑样式。" | 拆段（句号位置） | 采纳并调整 | 按 audit 建议在 "GFM markdown，" 处断句 |
| 8 | S-05 | L116 | "给它一个'容器名'提示，它会自信地写出 `quoteCard`、`variant=glow`、`variant=modern`——这些都不存在。" | "给它一个'容器名'提示，它会自信地补完，`quoteCard`、`variant=glow`、`variant=modern`——这些都不存在。" | 改词 | 采纳并调整 | 把"写出"改为"补完"呼应前句"LLM 的本性是补完"，并把超长句的喘息位提前 |
| 9 | S-06 | L207 | "**词汇表是运行时注入的，不是写死在 prompt 里**。capabilities.json 改一次，所有挂这个 prompt 的 Agent 自动跟着升级，不需要重新调教。" | "**词汇表是运行时注入的，不是写死在 prompt 里**。capabilities.json 改一次。所有挂这个 prompt 的 Agent 自动跟着升级，不需要重新调教。" | 拆段 | 采纳 | 在 "capabilities.json 改一次。" 后断句 |
| 10 | S-09 | L36 GFM Alert（91 字单句） | "微信编辑器会把这些东西直接清掉：`<style>` 标签、`<script>` 标签、所有 `class="..."`、所有 `id="..."`、`position:` 类样式。font-family 大多数客户端也会无视。" | 改为 alert 内换行结构：第一行 "微信编辑器会把这些东西直接清掉："；空行；第二行接续 "`<style>` 标签、`<script>` 标签、所有 `class="..."`、所有 `id="..."`、`position:` 类样式。font-family 大多数客户端也会无视。" | 拆段 | 采纳并调整 | 保留在 alert 内（不外移成普通列表，避免视觉断裂），通过空行让长句喘气 |
| 11 | S-07 | L287 steps 第 1 条（119 字） | "**30 秒**：打开在线 demo `https://...`，粘 markdown，切 tech-geek 和 literary-humanism 两套主题，肉眼对比差异。" | "**30 秒**：打开在线 demo `https://lync-cyber.github.io/wechat-typeset`。粘 markdown，切两套主题对比差异。" | 拆段 | 采纳 | 步骤动作简化；移除冗余的 persona 名称（前文 Section 3 已交代过两套调性） |
| 12 | S-08 | L289 steps 第 2 条 | "**5 分钟**：本地跑 `npm ci && npm run dev`，浏览器 `127.0.0.1:5173`，粘自己的稿子，选主题，点复制富文本，粘进公众号后台。" | "**5 分钟**：本地跑 `npm ci && npm run dev`，浏览器开 `127.0.0.1:5173`。粘稿子、选主题、点复制富文本，粘进公众号后台。" | 拆段 | 采纳并调整 | 在 "5173。" 后断；动作清单用 顿号 + 逗号 节奏 |
| 13 | 互动钩子 | footer-cta（L296） | "仓库在 GitHub，MIT 协议。觉得有用就点个 star，写技术与写作交叉地带的内容。" | "仓库在 GitHub，MIT 协议。觉得有用就点个 star。试完了来评论区说说效果？哪个主题最对你胃口？" | 改词 + 加句 | 采纳 | 按 tech 栏目 voice "试完了来评论区说说效果？" 互动钩子；删掉了"写技术与写作交叉地带的内容"这句定位描述（已被 footer-cta `cta=关注` 隐含表达） |
| 14 | 长句精简 | L76（三层独立演化段） | "新加一个 persona 不影响容器协议，新加一个容器不影响主题，微信明天改了渲染规则就只动 WxPatch。" | "新加 persona 不动容器协议，新加容器不动主题。微信明天改了渲染规则就只动 WxPatch。" | 改词 + 拆段 | 采纳 | 把 52 字长句拆为两句；删冗余"一个"使节奏更紧 |
| 15 | 长句精简 | L177（SKILL 段开头） | "可以直接挂到 Claude Code 上下文里，每个 skill 都是独立的 Markdown 文件加几行调用脚本：" | "可以直接挂到 Claude Code 上下文里。每个 skill 是一个独立的 Markdown 文件加几行脚本：" | 拆段 | 采纳 | 51 字→27+18，节奏更顺 |
| 16 | 长句精简 | L173（剩 8 个符号段） | "剩下 8 个符号管 PersonaSpec 校验、签名容器查询、单容器规约获取，做主题工具链时按需调。所有 API 都有 TypeScript 类型，IDE 里直接补全，不用查文档。" | "剩下 8 个符号管 PersonaSpec 校验、签名容器查询、单容器规约获取。做主题工具链时按需调。所有 API 都有 TypeScript 类型，IDE 里直接补全。" | 拆段 + 删冗余 | 采纳 | 删掉"不用查文档"重复（前句"IDE 里直接补全"已隐含） |
| 17 | A-02 | Section 3 三层独立演化论证 | audit 建议补"过去半年 WxPatch 改过 3 次" | 不改 | — | 拒绝 | 该数据需要作者本人核实迭代次数；现有 USER_FILL 钩子（L106）位置在 Section 3 末，由作者发布前自填，比 polisher 凭空补数字更合适 |
| 18 | A-03 | Section 4 钩子 4 收束 | audit 建议砍掉"不是事后用 lint 抓错"重复表述 | 把 "这才是'反幻觉'的真正姿势。不是事后用 lint 抓错，是事前就只给它合法选项。" 改为 "这才是'反幻觉'的真正姿势。事前就只给它合法选项，比事后拿 lint 抓错更有用。" | 合并段 + 改词 | 采纳并调整 | 合并两短句为一句对比；保留 lint 这个反例提高对比张力；从 2 句 27+17 → 1 句 35 字 |
| 19 | K-08 | L60/L70/L76 "第一层/第二层/第三层" | 三段排比相似度高 | 保留 | — | 拒绝 | audit 自己也说"主题就是三层解耦，保留更符合论点"；强改反而损失结构 |
| 20 | T-01 | 标题长度临界 | "wechat-typeset：一个为 AI 而生的微信公众号排版工具"（27 字符） | 保留 | — | 拒绝 | warning 级；标题信息密度高，"为 AI 而生"是核心定位词，删字会损失钩子；audit 自己标记为 warning 可保留 |
| 21 | SVG-01~SVG-13 | fig-01.svg / fig-02.svg | font-size < 14、marker id 属性、figure-index.md 自检错判 | 不动（polisher 工序不处理 SVG） | — | 标记给-illustrator | 已平行派发；polisher 不动 SVG 文件，仅在本表登记；publisher 阶段须确认 illustrator 重画完成才能发布 |
| 22 | M-04 | L17 / L106 / L211 | USER_FILL 占位符 ×3 | 全部保留 | — | 不处理 | 按合同发布前由作者填，polisher 不动；publisher 阶段会强制清理（或确认作者已填） |
| 23 | M-05 / M-06 | L50 / L112 / L228 | FIGURE 占位注释 ×3 | 全部保留 | — | 不处理 | publisher 阶段替换为 `![caption](url)`；polish 阶段保持原样 |
| 24 | W-05 | tip 容器全文 2 次（L56 + L184） | signature `perArticleLimit: signature-total: 1` 语义模糊 | 保留 | — | 拒绝 | audit 自己也判断"宽松解释通过 / 配置语义不清"；tip 是高频 admonition，分别用于"语法说明"和"variant 取值说明"两个独立语境，保留 2 次更符合实际写作；如配置端硬约束则后续由配置维护人调整 |

---

## 润色变更摘要

**做了什么**：

- 修复了 audit 全部 4 项必须级 issue（M-01 frontmatter / S-01 + S-02 段落超长 / M-03 代码块语言 / V-03 人称切换）。
- 拆短了 8 处正文长句（S-04 / S-05 / S-06 / S-07 / S-08 / S-09 + L76 + L177 / L173 两处低 audit_ref 未列但 ≤40 自检要求）。
- Section 2 末补一句 "这些工具把微信坑变成了 GUI 操作选项，AI 接不进来"（A-01），与 Section 5 cons 形成首尾呼应。
- footer-cta 收束加 1 句 tech 栏目互动钩子（"试完了来评论区说说效果？哪个主题最对你胃口？"），删掉重复的定位描述。
- 钩子 4 收束段把两短句合并为一句对比（A-03 调整版），保留 lint 反例提高论点张力。

**没做什么**：

- 不动 SVG 文件（SVG-01~SVG-13）：交 illustrator 重画处理，本表记录待办。
- 不动 USER_FILL ×3 占位符：发布前由作者补充。
- 不动 FIGURE ×3 占位注释：publisher 阶段替换。
- 不动标题（T-01 warning 临界）：信息密度优先。
- 不动 K-08 三层结构相似性：主题决定，保留更合理。
- 不补 A-02 的"WxPatch 半年改 3 次"具体数字：需作者核实，留 USER_FILL 钩子。
- 剩 7 处 41-53 字长句不再硬拆：并列短描述节奏需要，硬拆会损失 voice。

**自检结果**：

- 总字数 2475，落在 length.target 2800 ±20%（min 2200 / max 3600）区间 ✅
- 段落全部 ≤120 字 ✅
- 核心叙述句 ≤40 字 ✅；剩余 7 处长句为并列罗列结构，按 voice 节奏保留
- 27 个禁用短语 0 命中 ✅
- frontmatter 含 title / tags / tldr / column 四字段 ✅
- 金句 "AI 写完不算完，让 AI 把活儿做到底。" 在 L20，全文 1/3 位置 ✅
- compare 容器外四内三 ✅
- W1-W4 容器合规 ✅
- 第一人称 / 第二人称统一（tldr + 正文）✅
