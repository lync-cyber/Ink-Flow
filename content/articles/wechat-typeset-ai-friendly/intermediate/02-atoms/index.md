# Atoms Index · wechat-typeset-ai-friendly

## 平台白名单（从 Profile constraints.columnPlatforms 读取，仅供参考）

| platform | atom_selection |
|---|---|
| wechat | claims, evidence-data, evidence-code, cases, pitfalls, comparison, actions |

**未启用（不在 target_platforms=[wechat] 的任一 atomSelection 中）**：analogies，quotes

## 原子清单

| id | type | weight | platforms | length_chars | 摘要 |
|---|---|---|---|---|---|
| claim-01 | claim | primary | [wechat] | 46 | 写作与排版解耦，AI 直接产出"投递就绪"富文本 |
| claim-02 | claim | supporting | [wechat] | 44 | LLM 通过 capabilities.json + 公开 API 查白名单，不靠记忆 |
| claim-03 | claim | supporting | [wechat] | 38 | 11 套 persona × 37 个容器，切主题不改稿 |
| claim-04 | claim | supporting | [wechat] | 40 | WxPatch 8 项修复自动执行，隔离内容与平台约束 |
| claim-05 | claim | optional | [wechat] | 42 | doocs/md 是 AI 辅助写作；wechat-typeset 是 AI 消费产物直接渲染 |
| evidence-data-01 | evidence-data | primary | [wechat] | 72 | 11 套内置主题名称清单 |
| evidence-data-02 | evidence-data | primary | [wechat] | 60 | 容器节点总计约 37 个（base 24 + data-brief 13） |
| evidence-data-03 | evidence-data | primary | [wechat] | 54 | 公开 TypeScript API 12 个符号清单 |
| evidence-data-04 | evidence-data | supporting | [wechat] | 58 | skill 包 4 个子 skill 名称与职责 |
| evidence-data-05 | evidence-data | supporting | [wechat] | 56 | WxPatch 8 项自动修复详细列表 |
| evidence-data-06 | evidence-data | supporting | [wechat] | 52 | variant 8 类及每类数量 |
| evidence-data-07 | evidence-data | supporting | [wechat] | 66 | capabilities.json schemaVersion 2.3，jsDelivr CDN 12h 缓存地址 |
| evidence-data-08 | evidence-data | optional | [wechat] | 50 | SVG 硬约束数值（minFontSize 14 / minStrokeWidth 1 等） |
| evidence-code-01 | evidence-code | primary | [wechat] | 380 | ::: 容器完整嵌套 demo（intro/abstract/tip/compare/quote-card/footer-cta） |
| evidence-code-02 | evidence-code | primary | [wechat] | 330 | capabilities.json 核心字段截选（schemaVersion / hardRules / selfUri） |
| evidence-code-03 | evidence-code | primary | [wechat] | 360 | TypeScript 公开 API 调用示例（listPersonas/getContainerVocabulary/getVariantIds/render） |
| evidence-code-04 | evidence-code | supporting | [wechat] | 420 | LLM Agent system prompt 骨架（约 30 行） |
| evidence-code-05 | evidence-code | supporting | [wechat] | 280 | annotate-markdown 子 skill CLI 脚本调用示例 |
| case-01 | case | primary | [wechat] | 118 | AI 写完文章手动搬运排版的痛点场景 |
| case-02 | case | supporting | [wechat] | 102 | doocs/md "AI 辅助写作" vs wechat-typeset "AI 消费产物"定位差异 |
| case-03 | case | supporting | [wechat] | 96 | 同一 markdown 在 tech-geek 与 literary-humanism 主题下的视觉差异 |
| case-04 | case | optional | [wechat] | 84 | 本地运行全流程（npm run dev → 粘贴 → 选主题 → 复制 → 公众号） |
| pitfall-01 | pitfall | primary | [wechat] | 112 | LLM 幻觉出不存在的 variant（glow/modern/flat）→ 必须查 getVariantIds() |
| pitfall-02 | pitfall | primary | [wechat] | 100 | 手写 `<style>` / `class=` / font-family 会被 WxPatch 剥离，等于白写 |
| pitfall-03 | pitfall | primary | [wechat] | 96 | compare 必须外四内三 fence，写错层级直接渲染失败 |
| pitfall-04 | pitfall | supporting | [wechat] | 88 | SVG fill="#ffffff" 在微信渲染为透明，WxPatch 自动改为 #fefefe |
| pitfall-05 | pitfall | optional | [wechat] | 82 | display:flex + gap 在 Android 客户端不支持，需 data-wx-keep-flex 保留 |
| comparison-01 | comparison | primary | [wechat] | 560 | 四款工具横向对比（Markdown Nice / doocs/md / 秀米 / wechat-typeset，8 维度） |
| comparison-02 | comparison | supporting | [wechat] | 200 | AI 集成定位对比（doocs/md 辅助写作 vs wechat-typeset 直接产出，5 维度） |
| action-01 | action | primary | [wechat] | 78 | 30 秒：看 GitHub README + 在线 demo，对比两套主题渲染差异 |
| action-02 | action | primary | [wechat] | 72 | 5 分钟：本地跑 npm ci && npm run dev，全链路体验 |
| action-03 | action | primary | [wechat] | 90 | 30 分钟：挂载 4 个 SKILL.md，让 AI 全程生成契约 markdown + 富文本 |
| action-04 | action | supporting | [wechat] | 88 | AI Agent 开发者：订阅 capabilities.json，集成写作白名单 + 幻觉防控 |
| action-05 | action | optional | [wechat] | 76 | 主题创作者：fork 仓库，用 PersonaSpec schema 自定义主题 |

**合计：34 条原子**（claims 5 + evidence-data 8 + evidence-code 5 + cases 4 + pitfalls 5 + comparison 2 + actions 5）

## 原子覆盖检查

- **wechat（tech 栏目）**：命中 7 类必选原子 ✓
  - claims: primary ≥1（claim-01，weight: primary）✓
  - evidence-data: ≥1（evidence-data-01 到 08，8 条）✓
  - evidence-code: ≥1（evidence-code-01 到 05，5 条）✓
  - cases: ≥1（case-01 到 04，4 条）✓
  - pitfalls: ≥1（pitfall-01 到 05，5 条）✓
  - comparison: ≥1（comparison-01 到 02，2 条）✓
  - actions: ≥1（action-01 到 05，5 条）✓

## 最小产量自检

- `min_primary_claims: 1` → claim-01（weight: primary）✓
- `evidence-data + evidence-code + cases 合计 ≥3` → 8 + 5 + 4 = 17 条 ✓
- 全局 `forbidden_patterns: ["TODO", "待补充"]` → 未出现 ✓
