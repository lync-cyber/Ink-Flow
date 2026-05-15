# 调研备忘录：wechat-typeset — 一个为 AI/LLM 打造的微信公众号排版工具

## 关键事实

- 项目版本 **0.2.0**（2026-05），MIT 开源，作者 lync-cyber。Node >= 24 要求。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/package.json) (2026-05)
- **技术栈**：Vue 3 · TypeScript · Vite · markdown-it 14 · markdown-it-container 4 · CodeMirror 6（含 autocomplete + lint）· juice（CSS 内联化）· turndown。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/package.json) (2026-05)
- **纯浏览器，无后端**：草稿落 `localStorage`，分享链接把正文+主题打包成 URL hash（base64url），收方打开即以只读草稿载入，无服务器存储。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/README.md) (2026-05)
- **在线编辑器**：`https://lync-cyber.github.io/wechat-typeset`（GitHub Pages），同时支持 jsDelivr CDN 镜像、Cloudflare Pages、Netlify 一键部署。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/README.md) (2026-05)
- **本地运行**：`npm ci && npm run dev` → 浏览器 `http://127.0.0.1:5173` 进完整编辑器；`npm run preview` 默认端口 7788（`vite preview --host 127.0.0.1 --port 7788`）。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/package.json) (2026-05)
- **主题（persona）数量 11 套**：default / tech-geek（极客夜行）/ tech-explainer（文档白昼）/ life-aesthetic（慢生活）/ business-finance（硬核财经）/ data-brief（数据简报）/ literary-humanism（人文札记）/ industry-observer（行业观察）/ people-story（人物特稿）/ academic-frontier（学术前沿）/ editorial-mook（编辑刊）。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json) (2026-05)
- **容器总数**：base 包 24 个容器 + data-brief 扩展包 13 个专属容器，合计约 37 个容器节点（含嵌套子容器 pros/cons/bar/toc-item/kpi-item）。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json) (2026-05)
- **capabilities.json schemaVersion**：当前 `"2.3"`，生成于 2026-05-14，含 `selfUri`（jsDelivr CDN 无鉴权 CORS 友好）和 `versionedSelfUri` 两个订阅地址。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json) (2026-05)
- **公开 API 表面 12 个符号**：`render` / `createPersona` / `validatePersona` / `listPersonas` / `getPersona` / `getPersonaSummary` / `getSchema` / `getSupportedSignatureContainers` / `getVariantIds` / `getContainerVocabulary` / `getContainerSpec` / `getVariantsForContainer`。设计原则：Node-safe、无副作用、窄表面。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/src/public/index.ts) (2026-05)
- **skill 包分 4 个子 skill**：`wechat-typeset`（路由入口）/ `wechat-typeset-annotate-markdown`（写作改写）/ `wechat-typeset-author-persona`（主题设计）/ `wechat-typeset-export-richtext`（渲染导出）。有清晰的"哪种需求走哪条主线"决策树。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/wechat-typeset/SKILL.md) (2026-05)
- **variant 类目 8 类**：admonition 18 种 / quote 5 种（含 tilted-sticker）/ compare 4 种 / steps 3 种 / divider 5 种 / sectionTitle 2 种 / codeBlock 2 种 / note 3 种。LLM 调用 `getVariantIds()` 获取白名单，禁止凭记忆写（常见幻觉：`glow / modern / flat`）。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/_shared/references/hard-rules.md) (2026-05)
- **微信平台限制对抗**（WxPatch 自动处理 8 项）：删 `<style>/<script>/<noscript>/<link>/<meta>`，删 inline `font-family`，删所有 `id` 属性和 `position:` 样式，SVG 内 `url("x")` → `url(x)`（去引号），`#fff/#ffffff` → `#fefefe`（SVG 不透明修复），`display:flex` 降级 `display:block`（带 `data-wx-keep-flex` 标记的保留），列表外包 `<section>` 保住外边距。全部 juice 内联后执行，幂等。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/_shared/references/hard-rules.md) (2026-05)
- **写作契约三层**：基础契约（所有主题都渲染）/ 扩展包（`data-brief` 刊物化容器）/ 自定义扩展（fork 方私有容器）。契约保护范围外的手写 HTML 自行承担塌版风险。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/docs/contract/README.md) (2026-05)
- **doocs/md 已内置 AI 助手**：集成 DeepSeek/OpenAI/通义千问等多家模型，同时支持一键同步发布到知乎/微博/Bilibili/掘金/CSDN 等 10+ 平台。[来源](https://github.com/doocs/md) (2025)
- **秀米（xiumi）/ 135editor 不原生支持 Markdown**：两者是富文本/盒子式拖拽编辑器，对 Markdown 工作流不友好，面向运营人员而非技术写作者。[来源](https://xiumi.us/) (2025) [不确定]

---

## 代码片段

### 1. 完整 `:::` 容器嵌套示例（技术文章骨架）

```markdown
::: intro
用三行 Markdown 写完，粘进公众号就是成品。这是 wechat-typeset 给作者的承诺。
:::

::: abstract 摘要
本文演示 wechat-typeset 的核心工作流：Markdown → 容器标注 → 主题渲染 → 富文本粘贴。
:::

::: tip 环境
Node >= 24，`npm ci && npm run dev`，浏览器打开 `127.0.0.1:5173`。
:::

:::: compare
::: pros 这个方案的优点
- 写作与排版解耦
- 主题切换不需改稿
- AI 可直接生成合规 Markdown
:::
::: cons 当前限制
- 仅适配微信公众号（zhihu/xhs 为占位状态）
- 需要浏览器剪贴板权限
:::
::::

::: quote-card
排版不该是创作的最后一公里苦力活。
:::

::: footer-cta 觉得有用？ cta=关注 href=https://mp.weixin.qq.com/s/xxx
每周更新，技术与写作交叉地带。
:::
```

> 出处：[容器语法文档](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/docs/contract/base.md) + [capabilities.json](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json)

---

### 2. capabilities.json 关键字段截选（≤30 行）

```json
{
  "schemaVersion": "2.3",
  "tool": { "name": "wechat-typeset", "version": "0.2.0" },
  "generatedAt": "2026-05-14T09:47:32.775Z",
  "contract": {
    "fenceOuter": "::::",
    "fenceInner": ":::",
    "attrSyntax": "key=value — 写在 open 行 name 之后；不接受 {key=\"...\"} JSX 风格",
    "variantKey": "variant"
  },
  "hardRules": {
    "minFontSize": 14,
    "minStrokeWidth": 1,
    "forbidFontFamily": true,
    "forbidClass": true,
    "forbidStyleTag": true,
    "forbidPosition": true,
    "forbidMediaQueries": true
  },
  "selfUri": "https://cdn.jsdelivr.net/gh/lync-cyber/wechat-typeset@main/dist/api/capabilities.json",
  "versionedSelfUri": "https://cdn.jsdelivr.net/gh/lync-cyber/wechat-typeset@v0.2.0/dist/api/capabilities.json",
  "platforms": [
    { "id": "wechat", "name": "微信公众号", "status": "stable" },
    { "id": "zhihu", "status": "placeholder" },
    { "id": "xhs", "status": "placeholder" }
  ]
}
```

> 出处：[dist/api/capabilities.json](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json)

---

### 3. 公开 API 调用示例（LLM 集成入口）

```typescript
import {
  render,
  listPersonas,
  getContainerVocabulary,
  getVariantIds,
  validatePersona,
} from 'wechat-typeset' // src/public/index.ts

// 1. 让 LLM 知道有哪些主题可选
const personas = listPersonas()
// → [{ id: 'tech-geek', name: '极客夜行', audience: '技术布道...', ... }, ...]

// 2. 让 LLM 知道合法容器（fence 名 + 用途 + attrs），不靠记忆
const vocab = getContainerVocabulary()
// → [{ id: 'tip', fenceLength: 3, description: 'tip：小贴士...', example: '::: tip ...' }, ...]

// 3. 让 LLM 知道 variant 白名单，不幻觉
const variants = getVariantIds()
// → { admonition: ['accent-bar', 'pill-tag', ...], quote: ['classic', ...], ... }

// 4. 渲染（md → html，juice 内联 + wxPatch 全部自动处理）
const { html } = render({ md: contractMarkdown, persona: 'tech-geek' })
```

> 出处：[src/public/index.ts](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/src/public/index.ts)

---

### 4. LLM Agent 使用 skill 生成合规 Markdown 的伪 prompt 示例

```
System prompt（约 30 行示意）：

你是一个公众号排版助手，使用 wechat-typeset 写作契约。

写作规则：
1. 文首第一段用 ::: intro ... ::: 包裹。
2. 步骤型有序列表用 ::: steps ... ::: 转写。
3. 警告/注意事项用 ::: warning ... ::: 或 ::: danger ... ::: 。
4. 金句型引用用 ::: quote-card ... ::: 。
5. 对比场景用 :::: compare / ::: pros / ::: cons / :::: 四层结构。
6. 文末用 ::: footer-cta ... ::: 收束。
7. 容器 variant 只取以下白名单（getVariantIds() 真源）：
   admonition: accent-bar | pill-tag | ticket-notch | card-shadow | ...
   quote: classic | magazine-dropcap | column-rule | frame-brackets
   steps: number-circle | ribbon-chain | timeline-dot
8. 不要写 class= / style= / font-family —— WxPatch 会剥离，等于白写。
9. 容器名必须 kebab-case（quote-card，不是 quoteCard）。
10. compare 外层 :::: 四冒号，内层 ::: 三冒号。

参考词汇表：（调用 getContainerVocabulary() 动态注入，此处省略）
可用主题：（调用 listPersonas() 动态注入，此处省略）

用户输入：{plain_markdown}
任务：按上述规则改写为契约 Markdown，不改动文意，只插入容器标记。
```

> 出处：[skills/wechat-typeset-annotate-markdown/SKILL.md](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/wechat-typeset-annotate-markdown/SKILL.md)

---

### 5. WxPatch SVG 硬约束示例（源码注释原文）

```
微信平台约束（均由 WxPatch / validatePersona 自动执行）：

- SVG 内所有 id 属性 → 删（多份同名 SVG 粘贴后 id 冲突）
- SVG 内 url("x") → url(x)（带引号在部分客户端不识别）
- fill="#fff" / "#ffffff" → "#fefefe"（SVG 光栅化器把纯白当透明）
- <style> 标签 → 删（微信编辑器全部剥离，CSS 必须 juice 内联）
- display:flex + gap → display:block（Android 客户端 gap 不支持）
- font-family 任何声明 → 删（客户端字体覆盖 + juice 合并导致错位）
- SVG motif text.fontSize 必须 ≥ 14px（移动端光栅化最小清晰字号）
- SVG motif strokeWidth 必须 ≥ 1px（亚像素在光栅化后直接消失）
```

> 出处：[skills/_shared/references/hard-rules.md](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/_shared/references/hard-rules.md)

---

## 对比表格

| 维度 | Markdown Nice（mdnice） | doocs/md | 秀米 / 135editor | **wechat-typeset** |
|---|---|---|---|---|
| **Markdown 支持** | 有，核心功能，GFM 兼容 | 有，GFM + 数学公式 + 任务列表 | **无**，富文本/盒子拖拽编辑，不支持 Markdown 输入 | 有，markdown-it 14，GFM + 扩展行内语法 5 种 |
| **主题切换** | 有，支持自定义 CSS 主题；社区主题库 | 有，多套预设主题 + 自定义 CSS | 有（秀米：模板市场；135：样式库），但与 Markdown 工作流不衔接 | 有，11 套内置 persona，每套含完整色板律+字距律+SVG motif，切换不改稿 |
| **`:::` 容器支持** | **无**，基于 markdown-it 但未实现 fence 容器扩展 | **无**，仅 GFM + 数学公式 | **无** | **有**，37 个容器节点（base 24 + data-brief 扩展 13），含嵌套结构 |
| **AI / LLM 输入友好** | **无**专门设计；AI 生成的普通 Markdown 可粘贴渲染，但容器语义层缺失 | **有** AI 助手功能（集成 DeepSeek/OpenAI 等），但是面向"AI 辅助写作"而非"AI 直接产物投递就绪" | **无**，需要人工在 GUI 中操作拖拽 | **设计核心**：capabilities.json + 公开 TypeScript API + 4 个子 skill（路由/改写/主题/渲染），LLM 可调用 `getContainerVocabulary()` + `getVariantIds()` 直接生成合规 Markdown |
| **LLM skill / schema 暴露** | **无** | **无** | **无** | **有**：`dist/api/capabilities.json`（jsDelivr CDN 无鉴权）+ `src/public/index.ts`（12 个符号）+ 4 个 SKILL.md + JSON Schema（draft-07 PersonaSpec）+ `getSchema()` 运行时读取 |
| **部署方式** | 在线 SaaS（editor.mdnice.com），无本地部署 | 在线 + npm + Docker 私有化部署 | 在线 SaaS，无本地部署 | 纯静态文件：GitHub Pages / jsDelivr CDN / Cloudflare Pages / Netlify / `npm run dev` 本地，无服务端 |
| **是否开源** | 是（GitHub: mdnice/markdown-nice）[时效注意] 最近活跃度较低 | 是（GitHub: doocs/md），活跃维护 | **否**，商业产品 | 是（GitHub: lync-cyber/wechat-typeset），MIT |
| **微信约束处理** | 由工具处理，但策略偏向"一套蓝色主题套所有题材" | 由工具处理 | 由工具处理，但依赖 GUI 操作 | WxPatch 管线 8 项自动修复，严格分离"写作者可见"与"平台约束处理" |

---

## AI / LLM 集成钩子汇总

这是文章主线，单独列出：

### 1. capabilities.json（机器可读全集）

- **用途**：外部工具链（LLM agent / MCP server / CI）订阅当前支持的主题、容器、variant、硬约束
- **订阅地址**：`https://cdn.jsdelivr.net/gh/lync-cyber/wechat-typeset@main/dist/api/capabilities.json`（追主分支，jsDelivr 12h 缓存）；钉版本用 `@v0.2.0`
- **关键字段**：`schemaVersion / personas / containers / inlineExtensions / hardRules / variants / platforms / selfUri / versionedSelfUri`
- **向后兼容承诺**：minor 版本只增字段；移除项先经一个 minor 窗口的 `deprecations[]` 登记

### 2. 公共 TypeScript API（src/public/index.ts，12 个符号）

- `render(input)` — md → html，自动 juice 内联 + wxPatch
- `listPersonas()` — 所有内置 persona 摘要（id/name/description/audience/palette/variants/signatureContainers）
- `getContainerVocabulary()` — 全容器词汇表（fence 名/用途/attrs/example），LLM 直接查不靠记忆
- `getVariantIds()` — variant 合法 id 白名单（8 类），防止 LLM 幻觉出 `glow/modern/flat`
- `getSchema()` — PersonaSpec JSON Schema（draft-07），用于 LLM 结构化输出约束
- `validatePersona(spec)` — 校验 LLM 生成的主题 spec，返回 errors/warnings 便于重试

### 3. 4 个 SKILL.md（Claude Code / 其他 Agent 直接挂载）

- `skills/wechat-typeset/SKILL.md` — 意图路由入口（不做实际工作，5 秒内分发到子 skill）
- `skills/wechat-typeset-annotate-markdown/SKILL.md` — 写作改写主线（4 个脚本 + 对照表）
- `skills/wechat-typeset-author-persona/SKILL.md` — 主题/Persona 创作（PersonaSpec → validatePersona 循环）
- `skills/wechat-typeset-export-richtext/SKILL.md` — 渲染导出（lint → render → copy/粘贴）

### 4. CLI 脚本接口（tsx 直接运行）

```bash
# annotate-markdown 子 skill 的 4 个脚本
tsx skills/wechat-typeset-annotate-markdown/scripts/recommend-persona.ts --title X --summary Y --topic Z
tsx skills/wechat-typeset-annotate-markdown/scripts/annotate-md.ts --input md --persona id --out patches.json
tsx skills/wechat-typeset-annotate-markdown/scripts/lint-contract.ts output.md
tsx skills/wechat-typeset-annotate-markdown/scripts/show-snippet.ts <container-name> --variant <id>

# export-richtext 子 skill 的脚本
tsx skills/wechat-typeset-export-richtext/scripts/render-html.ts --input md --persona id --output html
tsx skills/wechat-typeset-export-richtext/scripts/render-gallery.ts --input md --personas all --output gallery.html
tsx skills/wechat-typeset-export-richtext/scripts/copy-richtext.ts --input md --persona id
```

### 5. PersonaSpec JSON Schema

- 路径：`dist/schema/persona-spec.schema.json`（由 `npm run gen:schema` 生成）
- 用于：LLM 做结构化输出时的约束（`getSchema()` 运行时读取）
- 硬约束：11 键色板（hex 3-8 位）/ 四态 status / fontSize≥14 / strokeWidth≥1 / variant id 白名单

---

## 容器分类速查

### base 包（任意主题都渲染）

| 类别 | 容器名 | 用途简述 |
|---|---|---|
| 结构 | `intro` / `cover` / `author` / `section-title` | 文首引子 / 封面卡 / 作者栏 / 章节大标题 |
| 提示（admonition） | `tip` / `warning` / `info` / `danger` / `note` | 五态：正向/注意/中性/危险/补注，共享 18 种 variant |
| 内容 | `quote-card` / `highlight` / `compare`（+`pros`/`cons`）/ `steps` | 金句卡 / 高亮段 / 双列对比 / 步骤卡 |
| 导航 | `divider` / `footer-cta` / `recommend` | 装饰分隔线 / 文末 CTA / 推荐阅读 |
| 媒体 | `qrcode` / `mpvoice` / `mpvideo` | 内置 QR 生成（SVG）/ 语音占位 / 视频占位 |
| 签名 | `abstract` / `key-number` / `see-also` / `free` | 摘要块 / 大数字 / 延伸阅读 / 兜底容器 |

### data-brief 扩展包（刊物化主题签名）

`masthead` / `section-tag` / `toc`（+`toc-item`）/ `kpi-dashboard`（+`kpi-item`）/ `bar-chart`（+`bar`）/ `qa-block` / `footnotes` / `refs` / `cta-bar` / `qr-follow` / `editor-note` / `methodology` / `colophon`

---

## 不确定项

- [不确定] **GitHub stars 数量**：搜索结果未返回 wechat-typeset 仓库的 stars 数。项目 README 无明确统计数据。建议在文章发布前直接访问 `https://github.com/lync-cyber/wechat-typeset` 实时查看。原因：这是一个相对新的项目（v0.2.0），公开 stars 数可能在文章写作与发布之间发生变化。
- [不确定] **mdnice 最近活跃度**：搜索结果显示 GitHub 主要 issue 集中在早期，近期活跃情况不明。判断建议：以 GitHub commits 页面实时时间戳为准，不要写死"活跃/停更"结论。原因：无法从搜索结果确认 2025-2026 期间的 commit 频率。
- [不确定] **`editorial-mook`（编辑刊）主题是否在 capabilities.json 的 personas 字段里**：通读 capabilities.json 的 personas 数组，只有 11 个条目（default 到 editorial-mook），与 README 主题表格的 11 行一致，不确定是否还有处于实验阶段的未注册主题。建议以 `listPersonas()` 运行时返回值为准。
- [不确定] **`tilted-sticker`（quote variant）的渲染效果**：hard-rules.md 的 variant 白名单中列有 `tilted-sticker` 作为 quote 的第五种 variant，但 capabilities.json 的 `quote-card` 容器定义里只列了 4 种（classic / magazine-dropcap / column-rule / frame-brackets）。两处数据有一处误差，需以源码 `VARIANT_IDS` 常量为权威依据。

---

## 竞品分析

| 竞品文章（搜索结果中的内容角度） | 现有角度 | 缺口（wechat-typeset 可以填补的） |
|---|---|---|
| mdnice 介绍文（主要讲"让排版变 Nice"，卖点是主题美观+图床） | 美观体验，偏运营视角 | 没讲 AI/LLM 集成；没讲容器语义层；没讲"写作与排版解耦"的工程设计 |
| doocs/md 介绍（讲多图床+AI 助手+多平台同步） | 功能罗列，强调"AI 辅助写作" | 其 AI 是写作辅助（生成内容），wechat-typeset 的 AI 是"消费合规 Markdown 直接产出富文本"——定位完全不同，尚无文章讲清这个差异 |
| 秀米/135 对比类文章（讲哪个更漂亮/操作更顺手） | 视觉效果、操作体验对比 | 完全没有 Markdown 工作流视角；没有 LLM 产物投递视角 |
| "公众号排版工具汇总"类文章 | 工具清单型 | 没有深入讲设计哲学；没有讲容器协议与 AI agent 的接口 |

---

## SEO 关键词

本 brief 标记 `skip_seo: true`，跳过此节。
