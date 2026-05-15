---
slug: wechat-typeset-ai-friendly
platform: wechat
column: tech
opening_style: pain_point
cta_type: follow
target_length: 2800
length_min: 2200
length_max: 3600
---

# 大纲: wechat-typeset · wechat

## 总览

- 平台: wechat
- 栏目: tech
- 目标字数: 2800（区间 2200-3600，硬上限 3600）
- Section 数: 7
- 开头策略: pain_point（用"AI 写完文章手动搬运排版"的具体场景切入）
- CTA 类型: follow（文末 footer-cta 容器，引导关注公众号 / Star 仓库）
- KPI: completionRate 0.35 / bookmarkRate 0.08（来自 constraints.columns.tech.kpiTargets）
- 整体节奏: 痛点切入 → 一句话定位 → 设计哲学 → AI 集成深度展开（占 ~50%）→ 横向对比 → 避坑 → 行动清单。前半段引私人叙事钩子，中段密度最高（含 3 段代码 + 1 张架构图），后半段收束节奏放缓。
- 写作视角: 第一人称（我是作者本人），技术细节配大白话翻译。
- 金句位: section 1 末尾或 section 2 首段（前 1/3），候选"AI 写完不算完，让 AI 自己把活儿做到底。"

## 原子引用索引

| section | atom_ids | 字数预算 | 备注 |
|---------|----------|----------|------|
| 1 | atom: claim-01, case-01, evidence-data-01 | 350 | 痛点开场 + 一句话定位 + intro 容器 + 金句 |
| 2 | atom: case-01, pitfall-02, claim-04 | 350 | 问题定义：手动搬运 + 微信平台限制双重困境 |
| 3 | atom: claim-03, evidence-data-01, evidence-data-02, evidence-code-01 | 500 | 三层解耦设计 + 容器协议 demo |
| 4 | atom: claim-02, evidence-data-03, evidence-data-04, evidence-data-07, evidence-code-02, evidence-code-03, evidence-code-04, action-04 | 800 | AI/LLM 集成全景（核心节，占 ~28%） |
| 5 | atom: comparison-01, claim-05, case-02 | 350 | 横向对比 + 与 doocs/md 的定位差异 |
| 6 | atom: pitfall-01, pitfall-02, pitfall-03, evidence-data-05 | 250 | 三个 primary 坑 + WxPatch 自动救场 |
| 7 | atom: action-01, action-02, action-03, claim-01 | 200 | 三档行动清单 + footer-cta |

**字数合计**: 2800（与 target 完全对齐；预留 ±10% 缓冲落在 2520-3080，硬上限 3600）

## 视觉签名

### 容器集合（全部在 typesetting.containers.whitelist 内）

- `intro` — section 1 文首引子（signature 容器，全文唯一）
- `quote-card` — section 1 或 2 金句卡（variant=classic）
- `tip` — section 3 容器协议简介 / section 6 避坑要点
- `warning` — section 6 微信平台硬约束警告
- `compare` + `pros` + `cons` — section 5 横向对比（pros/cons 必须嵌套在 :::: compare 内）
- `steps` — section 7 三档行动清单（variant=number-circle）
- `key-number` — section 4 关键数字（11 套主题 / 37 容器 / 12 API 符号 / 4 skill）
- `footer-cta` — section 7 末尾关注引导（signature 容器，全文唯一）

### candidates（按重要度排序）

1. **(illustrator:svg-flow)** — section 3 顶部："AI 内容生产 → wechat-typeset 排版 → 公众号"端到端流程图。rationale: 抽象工作流不画图读者无法构建心智模型，文字描述至少要 200 字才能表达清楚同样信息。
2. **(illustrator:svg-chart)** — section 3 中段："persona × container × variant"三层模型示意。rationale: 三个互相正交的概念用文字描述容易混淆，svg 立体分层一眼可读。
3. **(illustrator:image-prompt)** — section 5 可选：同一 markdown 在 2 个主题下的并列截图（tech-geek vs literary-humanism）。rationale: 视觉差异本身就是论点的一部分，文字无法替代；标 image-prompt 由作者本地截屏后替换。

### variant 白名单引用（全部在 typesetting.containers.variants 内）

- admonition（tip/warning）: accent-bar | pill-tag | card-shadow
- quote-card: classic
- compare: column-card
- steps: number-circle
- divider: rule（若需要）
- section-title: bordered（若需要）

## Section 1: 那次手动搬版后我开始写这个工具

- 论点: 公众号排版的最后一公里长期卡在"AI 写完之后人工搬运"上，这一步不该由人做
- 引用的 atoms: atom: claim-01, case-01, evidence-data-01
- 关键细节:
  - 第一人称切入：写完 markdown 后手动调样式的具体场景（USER_FILL：哪次手动排版被搞崩了？）
  - 一句话定位：wechat-typeset 是"AI 直接生产投递就绪富文本"的本地工具
  - 11 套主题、纯浏览器、无后端三个钩子（不展开，留到 section 3）
  - 文末挂金句卡（quote-card 容器）："AI 写完不算完，让 AI 自己把活儿做到底。"
- 预估字数: 350
- 视觉断点:
  - `(writer:container:intro)` — 文首三行引子
  - `(writer:container:quote-card)` — 金句卡（variant=classic，签名容器之一，全文唯一）
- 时效敏感项: 无
- opening_style: pain_point
- USER_FILL: `<!-- USER_FILL: 哪次手动搬版让你下定决心做这个工具？写一个具体的崩溃瞬间 -->`

---

## Section 2: 公众号排版的两层困境

- 论点: 第一层是 AI 写完后人手搬运，第二层是微信生态对 HTML 的剥离地狱——大多数工具只解决了第一层
- 引用的 atoms: atom: case-01, pitfall-02, claim-04
- 关键细节:
  - 第一层困境: AI 生成的 markdown 没有"视觉语义层"，进编辑器就要重新选样式
  - 第二层困境: 微信编辑器剥离 `<style>` / `<script>` / class / id / position / font-family（5+ 项），手写 CSS 等于白写
  - 既有工具的妥协: 要么让作者人工选样式（mdnice），要么让 AI 帮你写更多内容但仍然要手动套主题（doocs/md）
  - 真正缺位的是"AI 直接产生平台合规富文本"这一步
  - 这里第一次出现"WxPatch"概念，留待 section 4/6 展开
- 预估字数: 350
- 视觉断点:
  - 文中嵌一个 `(writer:alert)` GFM Alert（CAUTION 类型）列举微信剥离的 5 项 CSS 特性
- 时效敏感项: [发布前刷新] 微信编辑器的 HTML 处理规则可能变化，发布前快速验证 WxPatch 列表是否仍然有效

---

## Section 3: 三层解耦 · 容器 / persona / WxPatch

- 论点: 把"内容语义" / "视觉表达" / "平台约束"拆成三层，每层都可以独立演化——这是 wechat-typeset 的设计骨架
- 引用的 atoms: atom: claim-03, evidence-data-01, evidence-data-02, evidence-code-01
- 关键细节:
  - 第一层（内容层）: AI 只写 GFM + `:::` 容器扩展，约 37 个容器节点覆盖公众号常见排版场景（intro / cover / tip / quote-card / compare / steps / footer-cta 等）
  - 第二层（表达层）: 11 套 persona（极客夜行 / 文档白昼 / 慢生活 / 硬核财经 / 数据简报 / 人文札记 / 行业观察 / 人物特稿 / 学术前沿 / 编辑刊 / default），切主题不改稿
  - 第三层（约束层）: WxPatch 8 项自动修复，作者完全感知不到
  - demo 代码块: 一段完整的 `:::` 容器嵌套示例（evidence-code-01，~15 行）
  - key-number 容器突出"11 / 37 / 12 / 4"四个数字
- 预估字数: 500
- 视觉断点:
  - `(illustrator:svg-flow)` — "AI markdown → 容器渲染 → persona 应用 → WxPatch → 富文本" 端到端流程图（owner: illustrator）
  - `(writer:container:tip)` — "什么是 `:::` 容器" 一句话解释（variant=accent-bar）
  - markdown 代码块嵌入 evidence-code-01（标语言 `markdown`）
  - `(writer:container:key-number)` — 高亮数字组合（可选，看是否影响节奏）
- 时效敏感项: [可能过时] 11 套主题、37 容器的数字基于 v0.2.0 capabilities.json；版本迭代后需刷新
- USER_FILL: `<!-- USER_FILL: 设计这三层解耦时最纠结的取舍是什么？比如为什么不让作者直接写 HTML？ -->`

---

## Section 4: 让 AI 把活儿做到底 · LLM 集成全景

- 论点: 让 LLM 不靠记忆写排版的关键是给它一个"机器可读、运行时校验、可幻觉防控"的接口——这就是 capabilities.json + 公开 API + skill 包做的事
- 引用的 atoms: atom: claim-02, evidence-data-03, evidence-data-04, evidence-data-07, evidence-code-02, evidence-code-03, evidence-code-04, action-04
- 关键细节:
  - 钩子 1: capabilities.json（schemaVersion 2.3，jsDelivr CDN 无鉴权 12h 缓存），字段截选示例（evidence-code-02）
  - 钩子 2: 公开 TypeScript API 12 个符号（render / listPersonas / getContainerVocabulary / getVariantIds / getSchema / validatePersona ...），调用示例（evidence-code-03）
  - 钩子 3: 4 个 skill（路由 / annotate-markdown / author-persona / export-richtext），决策树+SKILL.md 直接挂载到 Claude Code
  - 钩子 4: LLM Agent system prompt 骨架（evidence-code-04，~30 行示例）—— 关键是"调用 getContainerVocabulary 注入词汇表，不靠记忆"
  - 钩子 5: 给 AI Agent 开发者的具体接入方式（action-04：订阅 capabilities.json 集成写作白名单 + 幻觉防控）
  - 强调 "白名单 + 校验" 是反幻觉的核心机制，不是事后 lint 而是事前注入
- 预估字数: 800（占全文 ~28%，与 brief 要求的"约 50% 篇幅讲 AI/LLM"略有缺口，但配合 section 3 的容器协议 demo，AI 相关篇幅合计约 1300 字 = 46%，达到 brief 要求）
- 视觉断点:
  - `(illustrator:svg-chart)` — "capabilities.json / API / skill / system prompt"四层 AI 接口栈示意图（owner: illustrator）
  - typescript 代码块嵌入 evidence-code-03（render + listPersonas + getContainerVocabulary + getVariantIds）
  - json 代码块嵌入 evidence-code-02（capabilities.json schemaVersion + hardRules + selfUri）
  - 文本块或代码块嵌入 evidence-code-04 的 LLM prompt 骨架（30 行内）
  - `(writer:container:tip)` — 一句话提醒"variant 名只能从 getVariantIds() 取，不能凭记忆"（variant=pill-tag）
- 时效敏感项: [发布前刷新] schemaVersion 2.3 / 12 个 API 符号 / 4 个 skill 名称——任一变更需同步刷新
- USER_FILL: `<!-- USER_FILL: 自己用 AI 写文章接入这套接口后，单篇排版从多久压到多久？给一个具体的对比 -->`

---

## Section 5: 跟 mdnice / doocs/md / 秀米的差异在哪

- 论点: 同样是公众号排版工具，wechat-typeset 跟另外三家不是"功能多寡"的差别，而是"读者是谁"的差别——前三个的读者是人，它的读者是 AI
- 引用的 atoms: atom: comparison-01, claim-05, case-02
- 关键细节:
  - 横向对比四款工具（Markdown Nice / doocs/md / 秀米/135 / wechat-typeset）8 维度（comparison-01 完整表）
  - 重点强调 wechat-typeset 与 doocs/md 的定位差异: doocs/md 是 AI 辅助"写作者"（帮你写更多内容），wechat-typeset 是 AI 直接产出"投递就绪富文本"（不再有"写作者"这一步）
  - 不贬低别家工具——mdnice 主题美观、doocs/md 多平台同步——只是定位不同
  - 用 `:::: compare / ::: pros / ::: cons / ::::` 嵌套容器呈现关键分歧（外四内三 fence）
- 预估字数: 350
- 视觉断点:
  - `(writer:table)` — 4 款工具 × 8 维度横向对比表（兜底；信息密度太高用容器卡片表达不下，所以选普通 markdown 表格）
  - `(writer:container:compare)` — 在表格之外另开一对 pros/cons 强化"AI 视角"的定位差异（variant=column-card）
  - `(illustrator:image-prompt)` — 可选：同一 markdown 在 tech-geek 与 literary-humanism 两个主题下并排截图（owner: illustrator，由作者本地截屏替换）
- 时效敏感项: [发布前刷新] mdnice / doocs/md 的功能在持续演进，对比表中的"AI 支持" / "容器支持"等字段需在发布前 7 天内复核

---

## Section 6: 三个常见的坑（WxPatch 救得了哪些救不了哪些）

- 论点: 即便有自动修复，AI 写错三种东西仍然会渲染失败——这三类必须由 prompt 层防控，不能指望事后修复
- 引用的 atoms: atom: pitfall-01, pitfall-02, pitfall-03, evidence-data-05
- 关键细节:
  - 坑 1: LLM 幻觉出不存在的 variant（glow / modern / flat）—— 必须调 getVariantIds() 拉白名单注入 prompt
  - 坑 2: 手写 `<style>` / `class=` / font-family —— WxPatch 会全部剥离，等于白写
  - 坑 3: compare 写错 fence 层级（外层 ::: 而非 ::::）—— 直接渲染失败，无救
  - 简要列举 WxPatch 8 项自动救场（evidence-data-05）：删 style/script、font-family、id、position；SVG url 去引号、纯白改 #fefefe；display:flex 降级；列表外包 section
  - 自动修复的边界: 语义错误（容器嵌套层级 / variant 名）救不了，只能事前防
- 预估字数: 250
- 视觉断点:
  - `(writer:container:warning)` — 三个 primary 坑列在一个 warning 容器内（variant=accent-bar 或 card-shadow）
  - `(writer:list)` — WxPatch 8 项无序列表（嵌在 warning 内或紧随其后）
- 时效敏感项: [可能过时] WxPatch 8 项随版本可能扩展或简化；evidence-data-05 锁定 v0.2.0 状态

---

## Section 7: 从 30 秒到 30 分钟 · 三档接入路径

- 论点: 不管你只是想看看效果还是想接到 AI Agent 里，都有一条对应时间预算的路径
- 引用的 atoms: atom: action-01, action-02, action-03, claim-01
- 关键细节:
  - 30 秒: 打开 GitHub Pages 在线 demo，切 2 套主题感受差异（action-01）
  - 5 分钟: 本地 `npm ci && npm run dev`，粘自己的 markdown 全链路体验（action-02）
  - 30 分钟: 挂载 4 个 SKILL.md 到 Claude Code，让 AI 全程生成契约 markdown + 富文本（action-03）
  - 关注公众号 / Star 仓库的 footer-cta
  - 用 claim-01 收束：写作与排版彻底解耦，AI 写完不算完——让 AI 把活儿做到底
- 预估字数: 200
- 视觉断点:
  - `(writer:container:steps)` — 三档时间预算用 steps 容器（variant=number-circle）
  - `(writer:container:footer-cta)` — 文末关注引导（signature 容器，全文唯一）
- 时效敏感项: [发布前刷新] 公众号二维码 / GitHub 仓库链接（确保不死链）

---

## 不确定项

- [发布前刷新] 微信编辑器 HTML 处理规则: WxPatch 的 8 项剥离列表需在发布前快速验证一遍（section 2/6 引用）
- [发布前刷新] schemaVersion / API 符号数 / skill 数: section 4 多处引用 v0.2.0 的具体数字，发布前确认 capabilities.json 仍是 2.3 且 12 个 API 符号未变
- [发布前刷新] 横向对比表: section 5 的 mdnice / doocs/md 功能字段（特别是"AI 支持"列）在持续演进，需 7 天内复核
- [可能过时] 11 套 persona / 37 容器: section 3 引用的数字基于 v0.2.0，若发布前版本更新需同步
- [继承自 02-research-memo] GitHub stars 数未取得: 文中不写 stars 数字
- [继承自 02-research-memo] tilted-sticker variant 数据不一致: hard-rules.md 列 5 种 quote variant，capabilities.json 列 4 种——本文不引用 tilted-sticker
- atom 缺失: 无（7 类必选原子全部命中，34 条原子覆盖充足）
- 篇幅校验: AI 集成主题（section 3 后半 + section 4 + section 6）合计约 800 + 500×0.4 + 250 = 1250 字，占 2800 的 ~45%，逼近 brief 要求的"约 50%"——若 writer 阶段觉得不足，可在 section 4 增加 evidence-code-04 的 prompt 完整版（~100 字）
