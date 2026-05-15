---
slug: wechat-typeset-ai-friendly
platform: wechat
column: tech
auditor: auditor-agent
audited_at: 2026-05-15
audit_target: content/articles/wechat-typeset-ai-friendly/intermediate/04a-draft/wechat/merged-draft.md
---

# 审校报告: wechat-typeset · wechat

## 审校报告

**总体判断**：核心论证扎实，事实数字与 research memo 完全对齐；wechat 容器协议（W1-W4）全部合规，签名容器单文唯一；金句"AI 写完不算完，让 AI 把活儿做到底。"位置正确、强度达标；全文风格统一，无明显 AI 味套话。**关键阻断项是 fig-01.svg / fig-02.svg 的 SVG 硬约束违规（font-size < 14、root marker id 属性）**，以及 2 处段落超 120 字符、frontmatter 缺 column 字段——这些必须在 polish 阶段或 illustrator 重画前修复。文章其余部分（句式/事实/论证/传播性）质量良好。**建议进 polish**。

**严重性计数**：
- 高（high）：**7** 项 — SVG 硬约束（5 项，跨两张图）+ frontmatter 缺字段（1 项）+ 段落超 120 字（2 项）
- 中（medium）：**8** 项 — 句子超 40 字（部分集中段）+ 第三人称表述 + 行内代码描述需澄清的 lint 误报背景
- 低（low）：**5** 项 — 措辞优化 / 代码块语言标注 / 表格行长 / 个别冗余表达

**进 polish 建议**：是。SVG 必须 illustrator 重画或 polisher 替换字号；段落拆分由 polisher 处理；frontmatter 字段补全。

> **lint 报告说明**：`lint.py` 报 12 errors / 53 warnings，但其中 6 项 F2 / 1 项 F1 是**误报**（原因：lint 把行内代码 `` `<style>` `` 和代码块内文本中的 `<script>` `<style>` 当作真实 HTML 标签匹配）。P7「字数 6895 超过硬上限 4320」也是误报（lint 把代码块和 frontmatter 全部计入字数）；按实际正文统计 ~2444 字（CJK 2086 + ASCII 词 358），落在 target 2200-3600 区间内。这些误报不计入审校结论的"高严重性"。

---

## 事实准确性

| 序号 | 位置 | 问题描述 | 严重性 | 修改建议 |
|---|---|---|---|---|
| F-01 | L86 / L289 | 端口号 `127.0.0.1:5173`，与 research memo 一致（dev 模式 5173）；preview 默认 7788 不影响本文叙事。事实正确。 | — | 无需修改 |
| F-02 | L126-141 | capabilities.json 字段截选 `schemaVersion: "2.3"`、`tool.version: "0.2.0"`、`selfUri` 与 memo 完全一致 | — | 无需修改；发布前可再次抓一次 jsDelivr 内容确认 |
| F-03 | L21 / L54 / L73 / L173 | 4 个核心数字（11 persona / 37 容器 / 12 API / 4 skill）全篇统一，与 memo 锁定值一致 | — | 无需修改 |
| F-04 | L70 / L265 / L267-274 | "8 项 WxPatch 自动修复"展开列出，逐条与 memo 的 hard-rules.md 比对吻合（删 style/script/noscript/link/meta、删 font-family、删 id、删 position、SVG url 去引号、#fff→#fefefe、display:flex 降级、列表外包 section） | — | 无需修改 |
| F-05 | L162-171 | 公开 API 调用示例代码（render/listPersonas/getContainerVocabulary/getVariantIds），变量名拼写、import 路径 `'wechat-typeset'` 均与 memo 的 `src/public/index.ts` 一致 | — | 无需修改 |
| F-06 | L178-182 | 4 个 SKILL 名称（wechat-typeset 路由 / annotate-markdown / author-persona / export-richtext）正确 | — | 无需修改 |
| F-07 | L86 | `Node >= 24` 与 memo 一致 | — | 无需修改 |
| F-08 | L222 表格 | "11 套内置 persona，切换不改稿" — 与 memo capabilities.json 11 个 personas 一致 | — | 无需修改 |
| F-09 | L223 表格 | "37 个" 容器 — 与 memo（base 24 + data-brief 13）合计一致 | — | 无需修改 |
| F-10 | L287 | 在线 demo URL `https://lync-cyber.github.io/wechat-typeset` — 与 memo 一致 | — | 无需修改；发布前快速访问验证不死链 |
| F-11 | L296 | footer-cta `href=https://github.com/lync-cyber/wechat-typeset` — 仓库链接正确（memo 中虽以公众号链接为例，但 outline 明确 CTA = follow / Star 仓库，链接选择合理） | — | 无需修改 |

**事实准确性结论**：所有可核查的数字、路径、版本号、URL、API 符号名均与 research memo 一致；无事实错误。

---

## 论证完整性

| 序号 | 位置 | 问题描述 | 严重性 | 修改建议 |
|---|---|---|---|---|
| A-01 | L29-44（Section 2 两层困境） | 论点"既有工具只解决第一层困境"有 case 支撑（L40），但**缺少具体证据**：哪个工具如何解决第一层、又如何把第二层"内部处理掉"？读者会疑惑"内部处理掉为什么不好"。建议在 L40 后加一句"这些工具把微信坑变成了 GUI 操作选项，AI 接不进来"，与 Section 5 形成呼应。 | 中 | polisher 补 1 句"why 内部处理对 AI 不利"，约 30 字 |
| A-02 | L52-77（Section 3 三层解耦） | 论点"三层独立演化"陈述清晰，但"独立"的证据偏弱——只举了"换主题不改稿"。可补一句迭代案例："过去半年 WxPatch 改过 3 次，用户从来感知不到。"（USER_FILL 也可放这里） | 中 | polisher 可酌情补具体迭代次数或留 USER_FILL |
| A-03 | L188-209（Section 4 钩子 4 prompt 骨架） | "白名单 + 校验是反幻觉的真正姿势"为强论点，但仅靠一段 prompt 骨架支撑略单薄。outline 提到"具体的 fence 错误率从 X 降到 Y" 类数据更好，此处缺数据。 | 中 | polisher 可考虑追加 USER_FILL 或砍掉一句空泛表述（"不是事后用 lint 抓错"已暗示，不必两句重复） |
| A-04 | L116（Section 4 开头） | "LLM 的本性是补完" — 论断式表达；后接 `quoteCard / variant=glow / variant=modern` 三个反例支撑充分。✅ | — | 无需修改 |
| A-05 | L40-44 | "我想要的不是'工具替我干'，是'AI 替我干'" 这一对比清晰，论证递进自然 | — | 无需修改 |
| A-06 | L247-249（Section 5 收束） | "doocs/md 的 AI 集成方向跟我差了 180 度" 的论断，前文（L242-244 cons 块）有充分对比支撑，论证闭环 | — | 无需修改 |
| A-07 | L265-278（Section 6 避坑） | 三个坑各有 evidence-data 支撑（variant 不存在 / 微信剥离行为 / fence 层级），自动修复 vs 语义错误的边界论证清晰 | — | 无需修改 |
| A-08 | L17 / L106 / L211 | 三处 USER_FILL 都在论点需要个人经验/数字时插入，位置合理 | — | 发布前由作者填充，polisher 不需要处理 |

**论证完整性结论**：主论点链条完整；3 处可补强但非阻断。

---

## AI 味检测

| 序号 | 位置 | 原文片段 | 问题类型 | 修改建议（方向，不动手） |
|---|---|---|---|---|
| K-01 | — | 全文扫描 `值得注意的是 / 综上所述 / 不难发现 / 通过以上 / 由此可见 / 接下来我们来看 / 可以看到 / 需要注意的是 / 希望本文对你有所帮助` 等 27 个禁用短语 | **无命中** | ✅ |
| K-02 | — | 扫描"首先 / 其次 / 最后"三段排比 | **无命中**（"最后"出现 3 次但都是单点表达，非排比结构） | ✅ |
| K-03 | — | 扫描"换言之 / 笔者 / 您"等被替换词 | **无命中** | ✅ |
| K-04 | L13 | "写作工具这几年没少进步。" — 略带口语化总结性陈述，但作为开篇过渡可接受 | 低 | 保留；与下文形成节奏 |
| K-05 | L162 | 代码块前文 "12 个公开符号。AI 不需要把容器名'背'在 prompt 里" — 表达自然，无 AI 味 | — | 无需修改 |
| K-06 | L209 | "这才是'反幻觉'的真正姿势。" — 短句加判断，符合 voice.md 短句节奏；非 AI 味 | — | 无需修改 |
| K-07 | L294 | "写作与排版彻底解耦。AI 写完不算完，让 AI 把活儿做到底。" — 收束有力，非空话 | — | 无需修改 |
| K-08 | L60 / L70 / L76 | "**第一层是内容层** / **第二层是表达层** / **第三层是约束层**" — 严格意义不算"首先/其次/最后"排比，但结构相似度高，**有一定 AI 三段味** | 低 | polisher 可保留（设计骨架确实是三层，强行改反而损失结构）；如需调整可把后两个粗体改为"第二层 / 第三层"普通行文起手 |

**AI 味检测结论**：禁用词清零；唯一可商榷的是 L60/L70/L76 的"第一层/第二层/第三层"结构相似，但因主题就是"三层解耦"，保留更符合论点；非阻断。

---

## 风格偏离

| 序号 | 位置 | 偏离的规则 | 严重性 | 修改建议 |
|---|---|---|---|---|
| V-01 | L10 / L13 / L19 / L42 / L53 / L106 | 第一人称"我"贯穿全文，第二人称"你"用于钩子（"你是不是也遇到过"虽未直接出现，但 USER_FILL 钩子留给作者补） | — | ✅ 符合 voice.md "我/你"人称要求 |
| V-02 | — | 全文未出现"笔者" / "您" / "换言之" / "需要注意的是" | — | ✅ 符合 |
| V-03 | L19 | "目标只有一句话：让 AI 写完文章直接得到能粘的富文本，作者只剩选主题和发文。" — 主语切换"作者"略书面化，前后是"我"。建议统一为"我只剩选主题和发文"或"你只剩选主题和发文"。 | 中 | polisher 把"作者"替换为"我"或"你" |
| V-04 | L13-15 / L29-31 | 段首句具体场景化（"打开公众号后台对着满屏纯文本叹气"），符合 principles.md 段首信息增量原则 | — | ✅ |
| V-05 | L67 | "外加一套保底的 default。换主题不改稿。" — 短句节奏，符合 voice.md "短句制造节奏"偏好 | — | ✅ |
| V-06 | L122 / L173 | 数字密度高，"无鉴权、CORS 友好、12 小时缓存" / "PersonaSpec 校验、签名容器查询、单容器规约获取" — 实用直接，符合 tech 栏目 tone | — | ✅ |
| V-07 | L207-209 | "这才是'反幻觉'的真正姿势。不是事后用 lint 抓错，是事前就只给它合法选项。" — 强观点句、短句、有立场，符合 tech 栏目"实用直接像给同事讲经验" | — | ✅ |
| V-08 | L21 | "AI 写完就是终稿。" — 立场强、不软化，符合 voice "表达有立场不做正确废话" | — | ✅ |
| V-09 | 全文 | 无煽情；无"希望对你有所帮助"类结尾；CTA 自然导向 GitHub Star | — | ✅ |
| V-10 | 全文强调使用 | `**粗体**` 多处（L54/L60/L70/L96 等），但**未发现单段超过 2 处粗体**的违规 | — | ✅ 符合 emphasis.perParagraphMax=2 |

**风格偏离结论**：整体风格统一、符合 voice.md + tech 栏目 tone；仅 1 处人称切换可调（V-03）。

---

## 句式问题

| 序号 | 位置 | 原句（节选） | 问题类型 | 严重性 | 修改建议 |
|---|---|---|---|---|---|
| S-01 | L21（段落） | "wechat-typeset 跑在浏览器里...AI 写完就是终稿。" | **段落 124 字 > 120 上限** | 高 | polisher 按句号拆 2 段：第 1 段"跑在浏览器里，没有后端，draft 自动存 localStorage。"；第 2 段"11 套主题，37 个容器，公开 12 个 TypeScript 符号，4 个能挂到 Claude Code 的子 skill。AI 写完就是终稿。" |
| S-02 | L54（段落） | "**第一层是内容层**。AI 只写 GFM 加 `:::` 容器扩展。容器节点目前 37 个，覆盖公众号常见的所有视觉位：`intro`...`footer-cta`。AI 不需要懂颜色和字号，只需要知道'这段是引言、那段是金句'。" | **段落 185 字 >> 120 上限**（含 11 个容器名清单） | 高 | polisher 拆为：(a)"**第一层是内容层**。AI 只写 GFM 加 `:::` 容器扩展。" (b) 把容器清单单独成段或改 `(writer:list)` (c)"AI 不需要懂颜色和字号..." |
| S-03 | L21 / L31 / L36 / L54 / L116 / L122 / L207 / L287 / L289 / L291 / L296 等 47 处 | 多处句子 > 40 字（含表格行、代码块内、container open 行） | C2 句子超长 | 中 | polisher 重点处理**正文叙述句**（L31 / L116 / L122 / L207 等 ~15 处真实问题），其余 30+ 处是表格 / `:::` 起始行 / FIGURE 占位符 / 代码注释，是 lint 误报无需处理 |
| S-04 | L31 | "模型写出来的是干净的 GFM markdown，没有'哪段该做引言、哪段该做金句卡、哪段是步骤'的视觉语义。粘进任何编辑器都得重新挑样式。" | 句 1 53 字偏长 | 中 | polisher 可在"GFM markdown，"处断："模型写出来的是干净的 GFM markdown。没有'哪段该做引言...'的视觉语义。" |
| S-05 | L116 | "给它一个'容器名'提示，它会自信地写出 `quoteCard`、`variant=glow`、`variant=modern`——这些都不存在。" | 句 71 字偏长 | 中 | polisher 可在"自信地写出"前断："给它一个'容器名'提示，它会自信地补完。`quoteCard`、`variant=glow`、`variant=modern`——这些都不存在。" |
| S-06 | L207 | "关键在第 7 行隐含的那条：**词汇表是运行时注入的，不是写死在 prompt 里**。capabilities.json 改一次，所有挂这个 prompt 的 Agent 自动跟着升级，不需要重新调教。" | 两句各 43 / 57 字 | 中 | polisher 可拆"capabilities.json 改一次。所有挂这个 prompt 的 Agent 自动跟着升级，不需要重新调教。" |
| S-07 | L287 | "**30 秒**：打开在线 demo `https://...`，粘 markdown，切 tech-geek 和 literary-humanism 两套主题，肉眼对比差异。" | 119 字（在 steps 内单条） | 低 | polisher 可拆两句：（1）"打开在线 demo..."；（2）"粘 markdown，切两套主题对比差异。" |
| S-08 | L289 | "**5 分钟**：本地跑 `npm ci && npm run dev`，浏览器 `127.0.0.1:5173`，粘自己的稿子，选主题，点复制富文本，粘进公众号后台。" | 83 字（步骤罗列） | 低 | polisher 可考虑拆短，或保留（"步骤罗列"形式在 steps 容器内可接受） |
| S-09 | L36 GFM Alert | "微信编辑器会把这些东西直接清掉：`<style>` 标签、`<script>` 标签、所有 `class="..."`、所有 `id="..."`、`position:` 类样式。font-family 大多数客户端也会无视。" | 句 91 字 | 中 | polisher 可拆为："微信编辑器会把这些东西直接清掉：" + 列表（用 `-` 列 5 项），或仅在 `<script>` 标签处断为两句 |
| S-10 | L267 | `- 删 \`<style>\` / \`<script>\` / \`<noscript>\` / \`<link>\` / \`<meta>\`` | 列表项 63 字 | 低 | 保留（合并 5 个删除项进单条可读性更好，反而拆开累赘） |
| S-11 | 全文 | "因此 / 所以 / 但是" 在 splitAt 触发处的检查 | **无明显未拆分点** | — | ✅ |
| S-12 | L13 段首句 | "写作工具这几年没少进步。" | 删掉首句段落是否仍成立？删后 L14 仍读得通但缺少节奏铺垫 | 低 | 保留 |

**句式问题结论**：2 处段落超 120 字（**高严重性**，必须 polisher 拆段）；十余处真实句子超 40 字（中），其余 30+ 处是表格/代码块/容器标记被 lint 误判。

---

## 容器合法性（W1-W4 + signature 唯一性）

| 序号 | 规则 | 位置 | 问题描述 | 严重性 |
|---|---|---|---|---|
| W-01 | W1 容器 id 白名单 | 全文 8 处真实 `:::` 容器（intro/quote-card/tip×2/key-number/compare/warning/steps/footer-cta） | 全部命中 typesetting.containers.whitelist（25 个白名单） | ✅ |
| W-02 | W2 variant 白名单 | L23 `variant=classic` / L56 `variant=accent-bar` / L184 `variant=pill-tag` / L234 `variant=column-card` / L257 `variant=accent-bar` / L286 `variant=number-circle` | 全部命中 typesetting.containers.variants 白名单（quote-card.classic / admonition.accent-bar / admonition.pill-tag / compare.column-card / steps.number-circle 均在册） | ✅ |
| W-03 | W3 pros/cons 必须嵌在 :::: compare 内 | L234-245 `:::: compare variant=column-card / ::: pros ... / ::: cons ... / ::::` | 嵌套结构正确，pros / cons 在 compare 内 | ✅ |
| W-04 | W4 冒号配对外严内宽 | L234 `::::`（4）/ L235 `:::` pros（3）/ L240 `:::` cons（3）/ L245 `::::` 闭合 | 外四内三正确闭合；L89-97 代码块内示例也正确（演示用） | ✅ |
| W-05 | signature 容器全文唯一（intro / footer-cta / quote-card / tip / compare / steps / key-number） | intro: 1（L9-11）/ quote-card: 1（L23-25，L99-101 在代码块内不计）/ tip: **2**（L56-58 + L184-186）/ compare: 1（L234-245，L89-97 在代码块内不计）/ steps: 1 / key-number: 1 / footer-cta: 1 | tip 容器出现 2 次。检查 `typesetting.containers.signature` 数组：tip 在 signature 列表内。但 `containers.perArticleLimit` 字段仅声明 `signature-total: 1` —— 含义模糊（是"signature 全集合计 ≤ 1"还是"每个 signature 容器各自 ≤ 1"？）。按字面解释"signature-total: 1" 是**全篇所有 signature 容器加起来仅 1 个**，则本文 8 个 signature 容器都违规；这显然与实际写作惯例矛盾，**推测此规则是误声明或被宽松解释**。**建议作 warning 标注待 polisher / 配置维护人核对**，不阻断 | 中 |

**容器合法性结论**：W1-W4 全部合规；W-05 涉及 Profile 配置语义不清，按宽松解释通过，标记 warning 由 polisher 在 polish 阶段确认。

---

## 传播性评估

| 维度 | 评分(1-5) | 说明 | 改进建议 |
|---|---|---|---|
| 标题转发欲 | 4 | "wechat-typeset：一个为 AI 而生的微信公众号排版工具" — 信息清晰，"为 AI 而生"是定位词、有钩子；长度 27 字（含工具名）偏长，但本地词不重 | polisher 可考虑缩短为"wechat-typeset · 为 AI 而生的公众号排版工具"或留原句 |
| 开头钩子强度 | 5 | L10 intro 容器 "我用 Claude 写完一篇技术文章，最后那一公里却要花一小时手动搬版。后来我做了 wechat-typeset，把这一小时压回三分钟。" — 数字反差强（一小时 vs 三分钟）、第一人称、痛点+解决方案双钩；pain_point 开头策略落地优秀 | ✅ |
| 金句存在性 / 位置 | 5 | L24 quote-card "AI 写完不算完，让 AI 把活儿做到底。" — 11 字 ≤ 20 字门槛 / 强观点 / 可独立传播 / 位于全文 L24（全文 L7-298，前 1/3 边界 L104） | ✅ 完美 |
| 金句密度 | 4 | 主金句 1 个；次级强观点："AI 写完就是终稿"（L21）/"自动修复是底网，不是降落伞"（L278）/"这才是'反幻觉'的真正姿势"（L209）/"两种都对，看你想让 AI 干哪一段活"（L249）— 全文 4-5 处可截图金句 | ✅ |
| KPI 锚点：completionRate 0.35 | 4 | 文章 ~2444 字（适中），有 3 张图（svg×2 + md×1）、4 处代码块、7 处 `:::` 容器卡片，视觉断点充足，预估读者能读完 | polisher 拆段后阅读节奏会更顺，预估完成率达标 |
| KPI 锚点：bookmarkRate 0.08 | 5 | "三档接入路径"（L286-292）/ 容器协议 demo 完整代码（L80-102）/ 公开 API 完整签名（L162-171）/ 8 项 WxPatch 列表（L267-274）—— 多处工具型干货可收藏 | ✅ |
| 互动钩子 | 3 | 全文有 3 处 USER_FILL，但作者未填充时正文里无显式的"你试试看 / 评论区告诉我"问句。tech 栏目 voice 规则建议加"试完了来评论区说说效果？" | polisher 可在 L294 收束句后或 footer-cta 中加 1 句互动问句 |
| 总体传播性 | 4.5/5 | 标题 + 钩子 + 金句 + 干货 4 维都达标；少 1 个明显互动钩子 | — |

**传播性评估结论**：4.5/5；整体传播性强；唯一建议是补 1 句互动问句到收束段。

---

## SVG 硬约束（Profile typesetting.svg + wechatSpecific）

| 序号 | 文件 | 行号 | 问题描述 | 严重性 | 修改建议 |
|---|---|---|---|---|---|
| SVG-01 | fig-01.svg | L26, L36, L46, L56, L66 | 节点 caption 文字 `font-size="13"`（5 处），**低于 minFontSize=14** | 高 | illustrator 把所有 `font-size="13"` 改为 `font-size="14"`（节点底部副标签：Claude / GPT、37 容器节点、11 套主题、style 合并、平台合规） |
| SVG-02 | fig-01.svg | L32 | 中间节点 "md-it 14" `font-size="13"` | 高 | 升为 14 |
| SVG-03 | fig-01.svg | L71, L76, L81, L86, L95, L100, L103 | 箭头标签 / 底部说明 / 圆框底栏 `font-size="12"`（7 处），**低于 minFontSize=14** | 高 | illustrator 把所有 12 改为 14；箭头标签如果改 14 会重叠，需要重排版面 |
| SVG-04 | fig-01.svg | L5 | `<marker id="arr" ...>` — `wechatSpecific.forbidIdAttribute: true` 全局禁止 id 属性 | 高 | illustrator 需替换为不依赖 marker id 的箭头（如直接用 `<polygon>` 三角箭头串接），或确认 marker 元素是否在 forbidIdAttribute 的豁免清单内 |
| SVG-05 | fig-02.svg | L5 | `<marker id="arr2" ...>` — 同上 | 高 | 同 SVG-04 |
| SVG-06 | fig-02.svg | L37, L49, L61, L73, L86, L87, L92, L93, L98, L99, L104, L105, L108 | 副标题 / 层副文字 / 右侧标注 / 底部说明大量 `font-size="13"` 与 `font-size="12"` | 高 | illustrator 全部 ≥ 14；副标题"system prompt 注入白名单 + 词汇表 + 硬约束"等关键描述文字必须升级 |
| SVG-07 | fig-01.svg / fig-02.svg | — | font-family `"Microsoft YaHei","PingFang SC",sans-serif` 与 Profile `svg.fontStack` 完全一致 | ✅ | — |
| SVG-08 | fig-01.svg / fig-02.svg | — | 无 `<style>` / `<script>` / `<a>` 子标签 | ✅ | — |
| SVG-09 | fig-01.svg / fig-02.svg | — | 无纯白 `#fff` / `#ffffff`；所有"白"用 `#fefefe` | ✅ | — |
| SVG-10 | fig-01.svg / fig-02.svg | — | stroke-width ≥ 1（最小 1.5） | ✅ | — |
| SVG-11 | fig-01.svg / fig-02.svg | — | viewBox 宽度 640，符合 `imageWidth: 640` | ✅ | — |
| SVG-12 | fig-01.svg / fig-02.svg | — | url(#arr) / url(#arr2) 无引号（合规） | ✅ | — |
| SVG-13 | figure-index.md | L36 | 自检报告写 "无 id 属性（marker 定义 id="arr2" 为 defs 内部引用，不是元素 id） — 合规" — **此判断与 Profile 字面规则冲突**：`wechatSpecific.forbidIdAttribute: true` 不区分 defs 内外 | 中 | polisher 需确认（i）是否 Profile 规则有意豁免 defs/marker id？（ii）若无豁免则按规则修复 figure-index 自检 + 重画 SVG |

**SVG 硬约束结论**：**两张 SVG 都存在多处 font-size < 14 + marker id 属性违规**。这是发布前的硬阻断，必须由 illustrator 重画或 polisher 推回 illustrator 阶段处理。figure-index.md 自检漏判。

---

## 元数据与其他结构问题

| 序号 | 位置 | 问题 | 严重性 | 修改建议 |
|---|---|---|---|---|
| M-01 | L1-5 frontmatter | 缺少必填字段 `column` — `constraints.metadata.required` 含 title / tags，但 outline 已声明 column: tech；frontmatter 应补 | 高 | polisher 在 frontmatter 加 `column: tech` |
| M-02 | L1-5 | `tags: [微信公众号, 排版工具, AI, LLM, 开源]` — 5 个标签，落在 `tagsRange: [3, 5]` 内 | ✅ | — |
| M-03 | L192-205 | 一处 prompt 骨架代码块**未标语言**（fenced block ` ``` ` 后无语言标识） | 中 | polisher 给 L192 的 ```` ``` ```` 加 `text` 或 `markdown` 标识 |
| M-04 | L17 / L106 / L211 | 三处 USER_FILL 占位符 | — | 发布前由作者填充，polisher 不处理；publisher 阶段会强制清理 |
| M-05 | L228 | `<!-- FIGURE: fig-03 image-prompt ... -->` 占位 — fig-03 为 image-prompt（pending-user）状态，publisher 需提示作者上传截图后才能发布 | — | 标记给 publisher，不阻断 polish |
| M-06 | L50 / L112 / L228 | 三处 `<!-- FIGURE: ... -->` 注释 — publisher 阶段会替换为实际 `![caption](url)`；polish 阶段保留 | — | 无需修改 |

---

## 标题合规

| 序号 | 规则 | 原标题 | 问题 | 严重性 | 修改建议 |
|---|---|---|---|---|---|
| T-01 | 长度 ≤ 15 中文字 | "wechat-typeset：一个为 AI 而生的微信公众号排版工具" | 中文字数 16 字（"一个为 AI 而生的微信公众号排版工具"），加上工具名共 27 字符 — **长度临界**：纯中文部分 15 字（"一个为 AI 而生的微信公众号排版工具"实际中文 14 字 + AI 缩写）；标题党规则下勉强可接受，但**偏长** | warning | polisher 可考虑短句版"wechat-typeset · 让 AI 写完就是终稿"或保留原标题（信息密度高、定位词明确） |
| T-02 | 必有观点/信息增量 | "为 AI 而生" 是定位观点，"wechat-typeset" 是工具名，"微信公众号排版工具"是定语 — 有信息增量 | — | ✅ |
| T-03 | 无标题党模式 | 无震惊体 / 无绝对化承诺 / 无情绪绑架 / 无数字暴力 | — | ✅ |

---

## 审校统计

- 事实问题：**0** 个错误（11 项核查全部通过）
- AI 味问题：**0** 个禁用词命中（1 项 L60/L70/L76 三层结构相似性属 K-08 低风险，非违规）
- 风格偏离：**1** 项可调（V-03 人称切换）
- 句式问题：**2** 项段落超 120 字（高，S-01/S-02）+ ~10 项正文句子超 40 字（中）+ 30+ 项表格/容器/代码块误报（无需处理）
- 容器合法性违规：**0** 项（W1-W4 全合规；W-05 中等不确定项待确认）
- 标题合规违规：**0** 个 error（1 个 warning：长度临界）
- SVG 硬约束违规：**6** 类问题，涉及 fig-01.svg 全部 5 类 + fig-02.svg 6 类 + figure-index.md 1 处自检错判
- Frontmatter / 结构：**1** 项缺 column 字段（高）+ **1** 项代码块未标语言（中）
- 传播性评分：**4.5 / 5**
- **高严重性总数**：**7**（SVG×5 类 + frontmatter×1 + 段落超长×2，其中 SVG 部分按 fig-01 单算 1 + fig-02 单算 1 + marker id×1 合并）
- **中严重性总数**：**8**
- **低严重性总数**：**5**

**进 polish 建议**：✅ 是。polisher 需处理：
1. L21 / L54 段落拆分（**必须**）
2. frontmatter 补 column 字段（**必须**）
3. L192 代码块加语言标识
4. L19 / V-03 人称统一
5. 约 10 处正文句子拆短
6. 收束段加 1 句互动问句

**polish 后还需 illustrator 介入**：fig-01.svg / fig-02.svg 必须重画或修补 font-size 至 ≥ 14、移除 marker id（或确认豁免）。**SVG 修复在 illustrator 工序，不在 polisher 工序，polisher 仅在审校报告中标记**。
