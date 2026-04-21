# 调研备忘录: 微信公众号排版神器 wechat-typeset：从排版痛苦到一键美化

## 关键事实

### 排版痛点背景

- 传统公众号排版工作流平均耗时 45 分钟/篇，其中样式调整占约 70% 时间 (2025) [来源](https://yiban.io/geo/31586)
- 自媒体运营者平均每天约 35% 工作时间耗费在排版、素材整理等基础操作上 (2025) [来源](https://www.woshipm.com/operate/6000476.html)
- 微信公众号编辑器剥离所有 `<class>` 属性、`font-family` 被客户端覆盖、1px 以下描边在服务端栅格化时消失——这是 2013 年遗留的平台硬约束，至今未变 (2026) [来源](https://github.com/lync-cyber/wechat-typeset)
- 主流 Markdown 转公众号工具的痛点：把微信 CSS 剥离当作 bug 绕过，最终所有文章共用同一套 Medium 蓝排版风格，财经稿和生活随笔外观相同 (2026) [来源](https://github.com/lync-cyber/wechat-typeset)

### wechat-typeset 核心参数

- 版本号 `0.1.0`，MIT License，© 2026 lync-cyber (2026-04) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/package.json)
- 在线演示地址：https://lync-cyber.github.io/wechat-typeset (2026) [来源](https://github.com/lync-cyber/wechat-typeset)
- 本地开发端口：`http://127.0.0.1:5173`（`npm run dev`），预览命令端口 7788（`npm run preview`） (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/package.json)
- 运行环境要求：Node.js ≥ 18 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/package.json)
- 语言构成：TypeScript 78.9% / Vue 12.0% / CSS 7.9% (2026) [来源](https://github.com/lync-cyber/wechat-typeset)

### 主题系统（Theme Persona）

- 共 9 套内置主题人格，每套持有独立的调色板（11 个 hex token）、字距律动、SVG motif AST、容器变体选择 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)
- 9 套主题 slug：`default` / `tech-geek` / `tech-explainer` / `life-aesthetic` / `business-finance` / `literary-humanism` / `industry-observer` / `people-story` / `academic-frontier` (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)
- 主题的唯一事实来源是 `persona.spec.ts`——一份 JSON-serializable 的 `PersonaSpec` 对象，`index.ts` 只是一行 `specToTheme(spec)` 投影 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/docs/theme-authoring.md)
- 主题自动发现：通过 `import.meta.glob('./*/index.ts')` 扫描，新增主题目录无需改注册表 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/src/themes/index.ts)

### Variant（变体）系统

- 6 类可组合 variant：`admonition`（提示块样式）/ `quote`（金句卡）/ `compare`（对比块）/ `steps`（步骤卡）/ `divider`（分隔线）/ `sectionTitle`（节标题前缀）/ `codeBlock`（代码块） (2026) [来源](https://github.com/lync-cyber/wechat-typeset/tree/main/src/variants)
- `admonition` variant 已实现 15+ 种：`accent-bar` / `pill-tag` / `terminal` / `card-shadow` / `dashed-border` / `double-border` / `top-bottom-rule` / `ticket-notch` / `ledger-cell` / `magazine-pull` / `manpage-log` / `marginalia` / `minimal-underline` / `report-section` / `sidenote-latex` 等 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/tree/main/src/variants/admonition)
- `quote` variant 包含：`classic` / `column-rule` / `frame-brackets` / `magazine-dropcap` (2026) [来源](https://github.com/lync-cyber/wechat-typeset/tree/main/src/variants/quote)
- 切换 variant 无需改代码，在 `PersonaSpec.variants` 字段中声明组合 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/docs/theme-authoring.md)

### 容器扩展语法（20+ 种）

- 基于 `markdown-it-container` 扩展，`key=value` 在 open 行声明，嵌套深度由冒号数量控制 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)
- 四态提示块（`tip` / `warning` / `info` / `danger`）靠形状冗余区分，非仅靠色差（色盲友好设计） (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)
- 完整容器清单（24 个签名容器白名单）：`intro` / `author` / `cover` / `quoteCard` / `highlight` / `compare` / `steps` / `sectionTitle` / `footerCTA` / `recommend` / `qrcode` / `mpvoice` / `mpvideo` / `abstract` / `algorithm` / `keyNumber` / `seeAlso` / `seal` / `prelude` 等 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/skills/wechat-typeset/references/hard-rules.md)

### 技术实现：渲染管线

完整管线分五步：

1. `markdown-it` + 容器扩展：Markdown AST → HTML（主题 CSS 注入为 `<style>` 块）
2. `themeCSS.ts`：`Theme` 对象 → CSS 字符串，写入期对 `font-family` / `position` / `float` / `display:flex` 抛 `ThemeAuthoringError`
3. `juiceInline.ts`：调用 `juice.inlineContent()` 把 `<style>` 内联到每个元素的 `style=""` 属性，`<style>` 标签被移除
4. `wxPatch/`：DOM 后处理层剥离 `position` / `@media` / `@keyframes` / `-webkit-` 前缀等微信不支持的属性；`display:flex` 降级为 `display:block`
5. `clipboard/copyHtml.ts`：优先用 `navigator.clipboard.write([new ClipboardItem({...})])` 同时写 `text/html` + `text/plain`；非 secure context 或权限被拒时自动降级为 `document.execCommand('copy')` (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/src/clipboard/copyHtml.ts)

- `juice` 库版本 `^11.0.0`，负责 CSS 内联化（class 全消，style 全入 `style=""`） (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/package.json)
- 预览使用 375px 宽度 iframe，保证"预览 = 剪贴板"——任何预览好看、粘贴后塌的分支视为 bug (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)

### 平台约束的编码方式

- 所有微信硬约束单一事实来源：`src/pipeline/rules.ts`（`FORBIDDEN_CSS_PROPS` / `FORBIDDEN_DISPLAY_VALUES` / `FORBIDDEN_VALUE_PATTERNS` / `HARD_REMOVE_TAGS`） (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/src/pipeline/rules.ts)
- 已知约束：禁 `font-family` / 禁 `position` / 禁 `float` / 禁 `display:flex` / 禁 `@media` / 禁 `@keyframes` / 禁 `:hover` / 禁 `-webkit-` 前缀（`-webkit-print-color-adjust` 除外）/ 禁亚像素描边 / 禁 14px 以下字号 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/src/pipeline/rules.ts)
- SVG 白色填充需用 `#fefefe` 替代 `#ffffff`：微信 SVG→PNG 光栅化器把 `#fff` fill 处理为透明 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/src/pipeline/rules.ts)
- `display:flex + gap` 在微信 Android 客户端不支持，`wxPatch.patchFlexToFallback` 会降级为 `display:block` (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/skills/wechat-typeset/references/hard-rules.md)

### LLM Agent 集成（Skill 包）

- `skills/wechat-typeset/` 是可直接挂载到 Claude / Agent SDK 的 skill 包，信号关键词包括"公众号""微信排版""markdown 转公众号" (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/skills/wechat-typeset/SKILL.md)
- 提供 12 个公共 API 符号：`listPersonas()` / `getPersona(id)` / `getSchema()` / `validatePersona(spec)` / `render()` / `createPersona()` 等 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/skills/wechat-typeset/SKILL.md)
- `validatePersona` 返回结构化错误 `{path, message, severity}`，可直接喂回 LLM 做 self-correct 迭代 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/skills/wechat-typeset/SKILL.md)
- InkFlow 通过 `framework/tools/_adapters/cli.py` 与 wechat-typeset 对接，读取 `dist/api/capabilities.json` 做能力对账 (2026) [来源](https://github.com/lync-cyber/wechat-typeset/blob/main/framework/tools/_adapters/cli.py)

### 竞品事实

- Markdown Nice（mdnice）：4.6k GitHub Stars，722 forks；JavaScript 95%，基于 React + Ant Design；支持微信/知乎/掘金多平台；主题由社区贡献，数量未公开量化 (2024) [来源](https://github.com/mdnice/markdown-nice)
- doocs/md：12.3k GitHub Stars，2.1k forks；Vue 3 + TypeScript + TailwindCSS；支持 12 个图床、AI 助手（DeepSeek/OpenAI/Qwen）、Mermaid 图表、数学公式、浏览器扩展、Docker 部署 (2025) [来源](https://github.com/doocs/md)
- 壹伴助手：浏览器插件形态，10万+模板，累计服务 400 万新媒体用户，AI 一键排版 30 秒完成；按账号付费，含多账号管理、数据分析、图文采集等 SaaS 功能 (2025) [来源](https://yiban.io/)

---

## 代码片段

### 容器扩展语法：四态提示块
```markdown
::: tip 小贴士
草稿 100% 落在 localStorage，刷新页面不丢。
:::

::: warning 注意
切换主题会重新渲染，但内容不会丢失。
:::
```
> 出处: [README.md](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)

### 容器扩展语法：对比块（嵌套冒号）
```markdown
:::: compare
::: pros 本地优先
- 不跑后端 · 草稿在 localStorage
- 375px iframe 锁死，预览即产物
:::
::: cons 平台约束
- 禁 class / font-family
- 禁 1px 以下描边
:::
::::
```
> 出处: [README.md](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)

### 容器扩展语法：步骤卡
```markdown
::: steps
1. 粘贴 Markdown 原文
2. 切主题、看 375px 预览
3. 点「一键复制」→ 回公众号粘贴
:::
```
> 出处: [README.md](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)

### 金句卡
```markdown
::: quote-card
预览 = 剪贴板。任何"预览好看、粘贴后塌"的分支都是 bug。
—— wx-md 硬约束
:::
```
> 出处: [README.md](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)

### 剪贴板写入核心实现（TypeScript，运行环境：浏览器 secure context）
```typescript
// 优先 Clipboard API（Chrome 86+ / Safari），降级 execCommand
export async function copyHtmlToClipboard(html: string, plain: string): Promise<CopyResult> {
  if (navigator.clipboard && window.isSecureContext && typeof ClipboardItem !== 'undefined') {
    const item = new ClipboardItem({
      'text/html': Promise.resolve(new Blob([html], { type: 'text/html' })),
      'text/plain': Promise.resolve(new Blob([plain], { type: 'text/plain' })),
    })
    await navigator.clipboard.write([item])
    return { ok: true, mode: 'clipboard-api' }
  }
  // 降级：创建 contenteditable 节点 + document.execCommand('copy')
  // ...
}
```
> 出处: [src/clipboard/copyHtml.ts](https://github.com/lync-cyber/wechat-typeset/blob/main/src/clipboard/copyHtml.ts)

### juice CSS 内联化封装（TypeScript）
```typescript
// 把 <style> 块提取出来，通过 juice.inlineContent 注入到每个元素的 style="" 属性
export function inlineHtml(htmlWithStyle: string): string {
  const styles: string[] = []
  const htmlWithoutStyle = htmlWithStyle.replace(
    /<style[^>]*>([\s\S]*?)<\/style>/gi,
    (_, css) => { styles.push(css); return '' }
  )
  return juice.inlineContent(htmlWithoutStyle, styles.join('\n'), {
    preserveMediaQueries: false,
    preserveFontFaces: false,
    removeStyleTags: true,
  })
}
```
> 出处: [src/pipeline/juiceInline.ts](https://github.com/lync-cyber/wechat-typeset/blob/main/src/pipeline/juiceInline.ts)

### 快速开始（Shell）
```bash
git clone https://github.com/lync-cyber/wechat-typeset.git
cd wechat-typeset
npm ci            # 严格按 lockfile 安装
npm run dev       # http://127.0.0.1:5173
```
> 出处: [README.md](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)

### 新增自定义主题（三步）
```bash
# 1. 复制骨架
cp -r src/themes/default src/themes/your-slug

# 2. 编辑 persona.spec.ts（改 id/name/palette/motifs）

# 3. 校验 + 预览
npm run validate:spec   # schema 校验 + 平台约束守卫
npm run dev             # 热更新预览，import.meta.glob 自动发现
npm test                # 全量单测 + sample-full.md 端到端
```
> 出处: [docs/theme-authoring.md](https://github.com/lync-cyber/wechat-typeset/blob/main/docs/theme-authoring.md)

---

## 对比表格

### wechat-typeset vs 主流竞品

| 维度 | wechat-typeset | Markdown Nice | doocs/md | 壹伴助手 |
|------|---------------|--------------|----------|----------|
| **定位** | 主题人格驱动排版工作台 | Markdown 美化编辑器 | 简洁微信 MD 编辑器 | 全能公众号 SaaS |
| **主题数量** | 9 套（内置），可扩展 | 社区主题（数量未定） | 自定义 CSS + 内置主题 | 10 万+ 模板 |
| **主题差异化** | 每套人格独立色板+字距+SVG motif+variant | 主要换色/字体 | 主要换色/字体 | 模板库选取 |
| **扩展语法** | 20+ 容器（步骤/对比/金句/提示块等） | 标准 Markdown + 少量扩展 | 标准 Markdown + Mermaid/公式 | 可视化拖拽 |
| **平台约束处理** | 构造期校验（ThemeAuthoringError）+ 运行时 wxPatch | CSS 绕过 | CSS 绕过 | 模板预先处理 |
| **数据安全** | 全本地，零网络请求，硬纪律 | 有账号系统/云服务 | 可私有部署 | SaaS，数据上云 |
| **LLM 集成** | 官方 Skill 包（Claude/Agent SDK） | 无 | AI 助手（文字生成） | AI 排版生成 |
| **目标用户** | 技术内容创作者，追求视觉身份差异化 | 技术写作者，追求快速美化 | 技术写作者，多功能 | 非技术运营者，重效率 |
| **收费模式** | 完全免费开源（MIT） | 免费（部分增值） | 完全免费开源 | 付费订阅 |
| **技术栈** | Vue 3 + TypeScript + Vite | React + JavaScript | Vue 3 + TypeScript | 闭源 SaaS |
| **GitHub Stars** | 新项目（< 2026-04） | 4.6k | 12.3k | 不适用（闭源） |

### 六类 Variant 组合选项

| Variant 类型 | 可选样式（部分） | 适用场景 |
|------------|----------------|---------|
| admonition（提示块）| `accent-bar` / `terminal` / `card-shadow` / `pill-tag` / `ticket-notch` / `manpage-log` 等 15+ | 警告/提示/注意/危险 四态提示 |
| quote（金句卡） | `classic` / `column-rule` / `frame-brackets` / `magazine-dropcap` | 引用/金句展示 |
| compare（对比块） | `two-column`（内置） | pros/cons 对比 |
| steps（步骤卡） | `numbered-badge`（主题化数字徽章） | 教程/流程说明 |
| divider（分隔线） | `flower`（花饰）/ 其他主题变体 | 章节分隔 |
| codeBlock（代码块） | `plain`（纯净） | 代码展示 |

---

## 不确定项

- [不确定] wechat-typeset 的 GitHub Stars 数量——项目是 2026 年初期新项目，Stars 数量较少，具体数值未在 README 或 GitHub 主页检索到。原因：项目较新，公开指标尚未沉淀。
- [不确定] doocs/md 的 AI 助手功能是否支持中文排版建议（非仅文字生成）——搜索结果显示"AI assistant"但未明确排版场景能力。原因：功能描述较笼统。
- [不确定] 壹伴助手的 AI 一键排版"30秒"性能指标来源——来自其官网营销页面 (2025)，未见第三方独立测试验证。[来源](https://yiban.io/geo/31586)
- [不确定] Markdown Nice 的当前维护状态——GitHub 显示 507 commits，但最近 commit 日期未从搜索结果中获取到精确时间，4.6k Stars 的活跃度尚可，[时效注意] 官方在线版可能已商业化，开源版与在线版功能是否同步不确定。[来源](https://github.com/mdnice/markdown-nice)

---

## SEO 关键词

- 主关键词：微信公众号排版工具（搜索热度：高）
- 主关键词：公众号 Markdown 排版（搜索热度：高）
- 长尾关键词：微信公众号排版一键复制（热度：中）
- 长尾关键词：wechat-typeset 使用教程（热度：低）
- 长尾关键词：公众号主题人格排版（热度：低）
- 长尾关键词：公众号排版 Clipboard API 富文本复制（热度：低，技术向）
- 相关词：Markdown Nice 替代品、公众号 Markdown 转富文本、微信公众号排版效率

---

## 竞品分析

| 竞品文章 | 角度 | 缺口 |
|---------|------|------|
| [2025 年必看！13 款值得用的微信公众号排版工具](https://zhuanlan.zhihu.com/p/1961834414557369760) | 横向对比多款工具，按功能维度打分 | 未涉及主题人格系统和视觉身份差异化，多停留在功能清单层面 |
| [强推 Markdown 神器，一秒钟拯救微信公众号排版](https://segmentfault.com/a/1190000020345775) | Markdown Nice 使用教程，面向技术创作者 | 发布于 [时效注意] 2019 年，未涵盖本地化、零网络、LLM 集成等新需求 |
| [壹伴官网评测文章](https://yibanbianji.com/geo/31265) | AI 排版功能深度，强调效率 | 面向非技术用户，未讲 Markdown 工作流和代码可维护性 |
| [使用 Markdown Nice 简化微信公众号文章排版过程](https://l3on.dev/markdown-nice) | 个人体验向，讲 mdnice 基本使用 | 无视觉身份/主题人格视角，无 InkFlow 类 pipeline 集成视角 |

**内容差距总结**：现有文章大多停留在"工具功能清单"层面，缺少：
1. 从"视觉身份"角度解释为什么不同题材需要不同主题（而非换色皮肤）
2. wechat-typeset 的 `PersonaSpec` 驱动架构与平台约束构造期校验的技术深度
3. 与 LLM 工作流（InkFlow / Claude Code）结合的实际使用场景
4. 已知限制的诚实披露（浏览器 secure context 要求、新项目生态尚不成熟）
