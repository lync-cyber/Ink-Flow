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

---

## 公众号排版的两层困境

第一层困境在 AI 这端。模型写出来的是干净的 GFM markdown，没有"哪段该做引言、哪段该做金句卡、哪段是步骤"的视觉语义。粘进任何编辑器都得重新挑样式。

第二层困境在微信这端。公众号编辑器对 HTML 极度敌意，手写 CSS 进去几乎全军覆没。

> [!CAUTION]
> 微信编辑器会把这些东西直接清掉：`<style>` 标签、`<script>` 标签、所有 `class="..."`、所有 `id="..."`、`position:` 类样式。font-family 大多数客户端也会无视。
>
> 你在 markdown 里写的所有"漂亮 CSS"，进了后台基本等于白写。

绝大多数排版工具只解决了第一层。它们让人挑模板、套样式、调颜色——本质上还是人在干活，AI 只是写文的那一段。第二层的微信坑只是被工具"内部处理掉了"，没有暴露给 AI。

我想要的不是"工具替我干"，是"AI 替我干"。差别在于，工具替我干意味着我得操作 GUI；AI 替我干意味着我只看终稿。这中间缺一个能让 LLM 直接产出合规富文本的接口层。

那个接口层就是 wechat-typeset。

---

## 三层解耦：容器 / persona / WxPatch

<!-- FIGURE: fig-01 svg-flow AI markdown → 容器渲染 → persona 应用 → WxPatch → 富文本 -->

我把整个系统拆成三层。每层只管自己那点事，互不污染。

**第一层是内容层**。AI 只写 GFM 加 `:::` 容器扩展。容器节点目前 37 个，覆盖公众号常见的所有视觉位：`intro`、`abstract`、`tip`、`warning`、`quote-card`、`compare`、`steps`、`key-number`、`footer-cta`。AI 不需要懂颜色和字号，只需要知道"这段是引言、那段是金句"。

::: tip variant=accent-bar
`:::` 容器是块级语义标签。三个冒号开头加容器名是开标签，单独三个冒号是闭标签。它是 markdown 的扩展语法，不是 HTML。
:::

**第二层是表达层**。同一份契约 markdown 能被 11 套 persona 切换渲染，分三个调性：

- 技术向：极客夜行、文档白昼
- 财经数据向：硬核财经、数据简报、行业观察
- 人文叙事向：慢生活、人文札记、人物特稿、学术前沿、编辑刊

外加一套保底的 default。换主题不改稿。这一层归 CSS 内联管，正文一个字都不动。

**第三层是约束层**。微信的那些坑——剥 `<style>`、删 `class`、拒 `position`、SVG 纯白要替换——全部由 WxPatch 在渲染管线里自动跑完。

8 项硬修复，作者完全感知不到。微信改一次渲染规则，我改 WxPatch 一处，所有用户跟着升级。

::: key-number
**11** persona · **37** 容器 · **12** 公开 API · **4** 个子 skill
:::

三层各自独立演化。新加一个 persona 不影响容器协议，新加一个容器不影响主题，微信明天改了渲染规则就只动 WxPatch。

一份契约 markdown 长这样：

```markdown
::: intro
用三行 Markdown 写完，粘进公众号就是成品。
:::

::: tip 环境
Node >= 24，`npm ci && npm run dev`，浏览器打开 `127.0.0.1:5173`。
:::

:::: compare
::: pros 优点
- 写作与排版解耦
- 主题切换不需改稿
:::
::: cons 当前限制
- 仅适配微信公众号
:::
::::

::: quote-card
排版不该是创作的最后一公里苦力活。
:::
```

注意 `compare` 那一对。外层是四个冒号 `::::`，内层 `pros` / `cons` 是三个。fence 外严内宽，这样解析器才能识别嵌套。

<!-- USER_FILL: 设计这三层解耦时最纠结的取舍是什么？比如为什么不让作者直接写 HTML、或者为什么不做服务端渲染 -->

---

## 让 AI 把活儿做到底 · LLM 集成全景

<!-- FIGURE: fig-02 svg-chart capabilities.json / 公开 API / SKILL.md / system prompt 四层 AI 接口栈 -->

让 LLM 不靠记忆写排版，是这个工具最难的部分。

LLM 的本性是补完。给它一个"容器名"提示，它会自信地写出 `quoteCard`、`variant=glow`、`variant=modern`——这些都不存在。光靠提示词约束远远不够，必须给它一个**机器可读、运行时校验**的接口层。

我做了四个钩子。

### 钩子 1：capabilities.json

一个静态 JSON 文件，挂在 jsDelivr CDN 上，无鉴权、CORS 友好、12 小时缓存。任何 AI Agent 都能直接拉，不需要登录、不需要 token、不依赖任何运行时。

```json
{
  "schemaVersion": "2.3",
  "tool": { "name": "wechat-typeset", "version": "0.2.0" },
  "contract": {
    "fenceOuter": "::::",
    "fenceInner": ":::",
    "attrSyntax": "key=value 写在 open 行 name 之后",
    "variantKey": "variant"
  },
  "hardRules": {
    "minFontSize": 14,
    "forbidFontFamily": true,
    "forbidClass": true,
    "forbidStyleTag": true
  },
  "selfUri": "https://cdn.jsdelivr.net/gh/lync-cyber/wechat-typeset@main/dist/api/capabilities.json"
}
```

当前 schemaVersion 是 2.3。版本承诺很简单：minor 版本只增字段，删字段必须先经 `deprecations[]` 公告一轮。

Agent 订阅这个文件就能知道：合法 fence 长什么样、有哪些硬规则、工具版本号是多少。一份清单解决一整套上下文。

### 钩子 2：公开 TypeScript API

12 个公开符号。AI 不需要把容器名"背"在 prompt 里，调一次 API 就能拿全。

```typescript
import {
  render,
  listPersonas,
  getContainerVocabulary,
  getVariantIds,
} from 'wechat-typeset'

// 主题清单
const personas = listPersonas()

// 容器词汇表（fence 名 + 用途 + 示例）
const vocab = getContainerVocabulary()

// variant 白名单（admonition/quote/compare/steps...）
const variants = getVariantIds()

// 一键渲染
const { html } = render({ md, persona: 'tech-geek' })
```

剩下 8 个符号管 PersonaSpec 校验、签名容器查询、单容器规约获取，做主题工具链时按需调。所有 API 都有 TypeScript 类型，IDE 里直接补全，不用查文档。

### 钩子 3：4 个 SKILL.md 子 skill

可以直接挂到 Claude Code 上下文里，每个 skill 都是独立的 Markdown 文件加几行调用脚本：

- **wechat-typeset**——路由入口，根据任务类型分发到下面三个
- **annotate-markdown**——把普通 markdown 注解成契约，自动加 `:::` 容器
- **author-persona**——设计自定义主题，`validatePersona()` 兜底
- **export-richtext**——渲染导出富文本，输出可直接粘贴的 HTML

::: tip variant=pill-tag
variant 名只能从 `getVariantIds()` 取，不能凭记忆。 LLM 训练数据里没有它，凭空补出来的全是幻觉。
:::

### 钩子 4：system prompt 骨架

AI 真正写文章时挂的 prompt 大概这样（删了一半，留主干）：

```
你是公众号排版助手，使用 wechat-typeset 写作契约。

规则：
1. 文首第一段用 ::: intro ::: 包裹。
2. 警告用 ::: warning 或 ::: danger 。
3. 金句用 ::: quote-card 。
4. compare 外层 :::: 四冒号，内层 ::: 三冒号。
5. 不要写 class= / style= / font-family。
6. variant 只取 getVariantIds() 返回的白名单。

参考词汇表：（调用 getContainerVocabulary 动态注入）
可用主题：（调用 listPersonas 动态注入）
```

关键在第 7 行隐含的那条：**词汇表是运行时注入的，不是写死在 prompt 里**。capabilities.json 改一次，所有挂这个 prompt 的 Agent 自动跟着升级，不需要重新调教。

这才是"反幻觉"的真正姿势。不是事后用 lint 抓错，是事前就只给它合法选项。

<!-- USER_FILL: 自己用 AI 写文章接入这套接口后，单篇排版从多久压到多久？给一个具体的对比 —— 比如以前 1 小时，现在 5 分钟 -->

---

## 跟 mdnice / doocs/md / 秀米的差异在哪

先把对比表摆这儿：

| 维度 | Markdown Nice | doocs/md | 秀米 / 135 | wechat-typeset |
|---|---|---|---|---|
| Markdown 支持 | GFM | GFM + 公式 | 无，富文本拖拽 | GFM + 5 种行内扩展 |
| 主题切换 | 自定义 CSS | 多套预设 + 自定义 | 模板市场 | 11 套内置 persona，切换不改稿 |
| `:::` 容器 | 无 | 无 | 无 | 37 个 |
| AI 友好接口 | 无 | 有 AI 助手，但定位辅助写作 | 无 | capabilities.json + 12 API + 4 skill |
| LLM 可读 schema | 无 | 无 | 无 | CDN 无鉴权拉取 |
| 开源 | 是 | 是 | 否 | MIT，纯静态 |

<!-- FIGURE: fig-03 image-prompt 同一段 markdown 在 tech-geek 与 literary-humanism 两主题下并排截图 -->

不贬低别家。mdnice 主题美观，doocs/md 多平台同步做得很全，秀米的视觉模板库非常厚实。这些工具都解决了真问题。

但定位真的不同。换个角度看就明白了：

:::: compare variant=column-card
::: pros wechat-typeset 的读者是 AI
- 接口面向 LLM，capabilities.json 给机器读
- AI 输出即终稿，作者不进编辑器
- 容器协议是写作契约，不是 GUI 配置
:::
::: cons 其他工具的读者是人
- mdnice / doocs/md 主要是给人挑样式
- doocs/md 的 AI 帮人**写内容**，写完还是人手动套主题
- 秀米的盒子拖拽链路里 AI 接不进来
:::
::::

doocs/md 的 AI 集成方向跟我差了 180 度。它的 AI 是帮人多写几个字，写完仍然要打开它的 GUI 选样式、套模板。wechat-typeset 的 AI 是消费契约直接出富文本，那个 GUI 步骤被去掉了。

两种都对，看你想让 AI 干哪一段活。

---

## 三个常见的坑

我自己踩过的坑里，下面这三个出镜率最高。

::: warning variant=accent-bar
**坑 1**：LLM 自信地写出 `variant=glow` / `modern` / `flat`，结果一个都不存在。白名单只有 8 类共约 40 个 id，必须 prompt 注入。

**坑 2**：手写 `<style>` 或 `class="..."` 或 `font-family`，进微信全部消失。所有样式只能走 juice 内联。

**坑 3**：`compare` 容器写错 fence 层级，外层用了三冒号。直接渲染失败，无救。外四内三，缺一不可。
:::

WxPatch 在渲染管线最后跑一遍，能自动救场 8 项机械错误：

- 删 `<style>` / `<script>` / `<noscript>` / `<link>` / `<meta>`
- 删 inline `font-family`
- 删所有 `id` 属性
- 删 `position:` 类样式
- SVG 内 `url("x")` 去引号
- `#fff` / `#ffffff` 替换为 `#fefefe`（微信光栅化把纯白当透明）
- `display:flex` 降级 `display:block`（Android 客户端兼容）
- 列表外包 `<section>`

但救得了的都是机械错误。语义错误救不了：容器嵌套层级写反、variant 名拼错、`pros` 写在 `compare` 外面。这些只能在 prompt 那一层把白名单注进去，事前拦住。

自动修复是底网，不是降落伞。

---

## 三档接入路径

按你能给的时间预算选一档：

::: steps variant=number-circle
**30 秒**：打开在线 demo `https://lync-cyber.github.io/wechat-typeset`，粘 markdown，切 tech-geek 和 literary-humanism 两套主题，肉眼对比差异。

**5 分钟**：本地跑 `npm ci && npm run dev`，浏览器 `127.0.0.1:5173`，粘自己的稿子，选主题，点复制富文本，粘进公众号后台。draft 自动存 localStorage。

**30 分钟**：在 Claude Code 里挂 4 个 SKILL.md，让 AI 全程生成契约 markdown 加导出富文本，作者只看终稿。
:::

写作与排版彻底解耦。AI 写完不算完，让 AI 把活儿做到底。

::: footer-cta cta=关注 href=https://github.com/lync-cyber/wechat-typeset
仓库在 GitHub，MIT 协议。觉得有用就点个 star，写技术与写作交叉地带的内容。
:::
