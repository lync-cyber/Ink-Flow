---
title: "wechat-typeset：一个为 AI 而生的微信公众号排版工具"
tags: [微信公众号, 排版工具, AI, LLM, 开源]
column: tech
tldr: "AI 写完文章不该再让人手动搬运排版。wechat-typeset 把内容生产和主题表达彻底拆开，让 Claude/GPT 直接产出投递就绪的富文本，我只剩选主题和发文。"
original: true
author: "lync 笔记"
publish_date: 2026-05-15
platform: wechat
---

# wechat-typeset：一个为 AI 而生的微信公众号排版工具

::: intro
我用 Claude 写完一篇技术文章，最后那一公里却要花一小时手动搬版。后来我做了 wechat-typeset，把这一小时压回三分钟。
:::

写作工具这几年没少进步。Claude、GPT、Cursor 各自都能写出体面的初稿。但每次写完，我还是要打开公众号后台，对着满屏纯文本叹气。

H2 的颜色不对、引用块的边框不够细、金句没法做成单独的卡片。这些事 AI 一个也帮不了我，工具栏上一个个按钮慢慢点。

最炸的一次是凌晨两点。Claude 帮我写完一篇 4000 字的稿，我在公众号编辑器里调了快一小时还没调完。第 5 次手动给 H2 加蓝色边框，再粘第 3 次代码块，浏览器突然崩了。重开后草稿只剩前 800 字。

那一刻我意识到，问题不在 AI 不够强，是这一公里压根不该让人走。

那次之后我开始动手。目标只有一句话：让 AI 写完文章直接得到能粘的富文本，我只剩选主题和发文。

wechat-typeset 跑在浏览器里，没有后端，draft 自动存 localStorage。

11 套主题，37 个容器，公开 12 个 TypeScript 符号，4 个能挂到 Claude Code 的子 skill。AI 写完就是终稿。

::: quote-card variant=classic
AI 写完不算完，让 AI 把活儿做到底。
:::

---

## 公众号排版的两层困境

第一层困境在 AI 这端。模型写出来的是干净的 GFM markdown。没有"哪段该做引言、哪段该做金句卡、哪段是步骤"的视觉语义，粘进任何编辑器都得重新挑样式。

第二层困境在微信这端。公众号编辑器对 HTML 极度敌意，手写 CSS 进去几乎全军覆没。

> [!CAUTION]
> 微信编辑器会把这些东西直接清掉：
>
> style 标签、script 标签、所有 class 属性、所有 id 属性、position 类样式。font-family 大多数客户端也会无视。

你在 markdown 里写的所有"漂亮 CSS"，进了后台基本等于白写。

绝大多数排版工具只解决了第一层。它们让人挑模板、套样式、调颜色——本质上还是人在干活，AI 只是写文的那一段。第二层的微信坑只是被工具"内部处理掉了"，没有暴露给 AI。

这些工具把微信坑变成了 GUI 操作选项，AI 接不进来。

我想要的不是"工具替我干"，是"AI 替我干"。差别在于，工具替我干意味着我得操作 GUI；AI 替我干意味着我只看终稿。这中间缺一个能让 LLM 直接产出合规富文本的接口层。

那个接口层就是 wechat-typeset。

---

## 三层解耦：容器 / persona / WxPatch

> 图 1：AI 内容生产 → wechat-typeset 排版 → 微信公众号

<svg viewBox="0 0 640 340" xmlns="http://www.w3.org/2000/svg"
     font-family='"Microsoft YaHei","PingFang SC",sans-serif'>

  <!-- 背景 -->
  <rect width="640" height="340" fill="#f4f6f9"/>

  <!-- 顶部副标题 -->
  <text x="320" y="24" font-size="14" font-weight="400" fill="#7f8c8d"
        text-anchor="middle">AI 写完不算完 · 让 AI 把活儿做到底</text>

  <!-- ===== 节点 1: LLM Agent ===== -->
  <rect x="14" y="42" width="104" height="80" rx="6" ry="6"
        fill="#fefefe" stroke="#3498db" stroke-width="2"/>
  <circle cx="66" cy="68" r="14" fill="#3498db"/>
  <text x="66" y="73" font-size="16" font-weight="700" fill="#fefefe"
        text-anchor="middle">AI</text>
  <text x="66" y="96" font-size="15" font-weight="700" fill="#2c3e50"
        text-anchor="middle">LLM Agent</text>
  <text x="66" y="114" font-size="14" fill="#5a6470" text-anchor="middle">Claude / GPT</text>

  <!-- ===== 节点 2: 容器解析 ===== -->
  <rect x="146" y="42" width="104" height="80" rx="6" ry="6"
        fill="#fefefe" stroke="#dde3eb" stroke-width="1.5"/>
  <rect x="156" y="54" width="84" height="26" rx="4" ry="4" fill="#f1c40f"/>
  <text x="198" y="72" font-size="14" font-weight="700" fill="#2c3e50"
        text-anchor="middle">md-it 14</text>
  <text x="198" y="96" font-size="15" font-weight="700" fill="#2c3e50"
        text-anchor="middle">容器解析</text>
  <text x="198" y="114" font-size="14" fill="#5a6470" text-anchor="middle">37 容器节点</text>

  <!-- ===== 节点 3: persona 渲染 ===== -->
  <rect x="278" y="42" width="104" height="80" rx="6" ry="6"
        fill="#fefefe" stroke="#dde3eb" stroke-width="1.5"/>
  <rect x="288" y="54" width="84" height="26" rx="4" ry="4" fill="#9b59b6"/>
  <text x="330" y="72" font-size="14" font-weight="700" fill="#fefefe"
        text-anchor="middle">persona</text>
  <text x="330" y="96" font-size="15" font-weight="700" fill="#2c3e50"
        text-anchor="middle">主题渲染</text>
  <text x="330" y="114" font-size="14" fill="#5a6470" text-anchor="middle">11 套主题</text>

  <!-- ===== 节点 4: juice 内联 ===== -->
  <rect x="410" y="42" width="104" height="80" rx="6" ry="6"
        fill="#fefefe" stroke="#dde3eb" stroke-width="1.5"/>
  <rect x="420" y="54" width="84" height="26" rx="4" ry="4" fill="#27ae60"/>
  <text x="462" y="72" font-size="14" font-weight="700" fill="#fefefe"
        text-anchor="middle">juice</text>
  <text x="462" y="96" font-size="15" font-weight="700" fill="#2c3e50"
        text-anchor="middle">CSS 内联</text>
  <text x="462" y="114" font-size="14" fill="#5a6470" text-anchor="middle">style 合并</text>

  <!-- ===== 节点 5: WxPatch ===== -->
  <rect x="542" y="42" width="84" height="80" rx="6" ry="6"
        fill="#fefefe" stroke="#e74c3c" stroke-width="1.5"/>
  <rect x="552" y="54" width="64" height="26" rx="4" ry="4" fill="#e74c3c"/>
  <text x="584" y="72" font-size="14" font-weight="700" fill="#fefefe"
        text-anchor="middle">WxPatch</text>
  <text x="584" y="96" font-size="15" font-weight="700" fill="#2c3e50"
        text-anchor="middle">8 项修复</text>
  <text x="584" y="114" font-size="14" fill="#5a6470" text-anchor="middle">平台合规</text>

  <!-- ===== 箭头 1→2（polygon 替代 marker）===== -->
  <line x1="118" y1="82" x2="136" y2="82" stroke="#5a6470" stroke-width="1.5"/>
  <polygon points="136,78 144,82 136,86" fill="#5a6470"/>
  <text x="131" y="148" font-size="14" fill="#5a6470" text-anchor="middle">GFM+:::</text>

  <!-- ===== 箭头 2→3（polygon 替代 marker）===== -->
  <line x1="250" y1="82" x2="268" y2="82" stroke="#5a6470" stroke-width="1.5"/>
  <polygon points="268,78 276,82 268,86" fill="#5a6470"/>
  <text x="263" y="148" font-size="14" fill="#5a6470" text-anchor="middle">AST 树</text>

  <!-- ===== 箭头 3→4（polygon 替代 marker）===== -->
  <line x1="382" y1="82" x2="400" y2="82" stroke="#5a6470" stroke-width="1.5"/>
  <polygon points="400,78 408,82 400,86" fill="#5a6470"/>
  <text x="395" y="148" font-size="14" fill="#5a6470" text-anchor="middle">HTML+CSS</text>

  <!-- ===== 箭头 4→5（polygon 替代 marker）===== -->
  <line x1="514" y1="82" x2="532" y2="82" stroke="#5a6470" stroke-width="1.5"/>
  <polygon points="532,78 540,82 532,86" fill="#5a6470"/>
  <text x="527" y="148" font-size="14" fill="#5a6470" text-anchor="middle">内联 style</text>

  <!-- ===== 公众号结果气泡 ===== -->
  <rect x="176" y="172" width="294" height="100" rx="8" ry="8"
        fill="#fefefe" stroke="#3498db" stroke-width="1.5"/>
  <text x="323" y="198" font-size="16" font-weight="700" fill="#2c3e50"
        text-anchor="middle">微信公众号编辑器</text>
  <text x="323" y="220" font-size="14" fill="#5a6470" text-anchor="middle">粘贴富文本 → 即可发文</text>
  <text x="323" y="240" font-size="14" fill="#27ae60" text-anchor="middle">无需任何手动调整</text>
  <text x="323" y="260" font-size="14" fill="#7f8c8d" text-anchor="middle">CSS 安全 · 字体合规 · SVG 可渲染</text>

  <!-- ===== WxPatch → 公众号（polygon 替代 marker）===== -->
  <line x1="584" y1="122" x2="467" y2="169" stroke="#5a6470" stroke-width="1.5"/>
  <polygon points="460,172 465.9,165.3 468.9,172.7" fill="#5a6470"/>
  <text x="534" y="154" font-size="14" fill="#5a6470" text-anchor="middle">合规富文本</text>

  <!-- 底部说明 -->
  <text x="320" y="328" font-size="14" fill="#7f8c8d" text-anchor="middle">wechat-typeset v0.2.0 · 端到端排版管线</text>

</svg>

我把整个系统拆成三层。每层只管自己那点事，互不污染。

**第一层是内容层**。AI 只写 GFM 加 `:::` 容器扩展。

容器节点目前 37 个，覆盖公众号常见的所有视觉位：

- 引言与封面：`intro`、`abstract`、`cover`
- 提示与警告：`tip`、`warning`、`danger`
- 金句与对比：`quote-card`、`compare`、`highlight`
- 步骤与数字：`steps`、`key-number`
- 收束：`footer-cta`

AI 不需要懂颜色和字号，只需要知道"这段是引言、那段是金句"。

::: tip variant=accent-bar
`:::` 容器是块级语义标签。三个冒号开头加容器名是开标签，单独三个冒号是闭标签。它是 markdown 的扩展语法，不是 HTML。
:::

**第二层是表达层**。同一份契约 markdown 能被 11 套 persona 切换渲染，分三个调性：

- 技术向：极客夜行、文档白昼
- 财经数据向：硬核财经、数据简报、行业观察
- 人文叙事向：慢生活、人文札记、人物特稿、学术前沿、编辑刊

外加一套保底的 default。换主题不改稿。这一层归 CSS 内联管，正文一个字都不动。

**第三层是约束层**。微信的那些坑——剥 style 标签、删 class 属性、拒 position 样式、SVG 纯白要替换——全部由 WxPatch 在渲染管线里自动跑完。

8 项硬修复，作者完全感知不到。微信改一次渲染规则，我改 WxPatch 一处，所有用户跟着升级。

::: key-number
**11** persona · **37** 容器 · **12** 公开 API · **4** 个子 skill
:::

三层各自独立演化。新加 persona 不动容器协议，新加容器不动主题。微信明天改了渲染规则就只动 WxPatch。

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

设计时最纠结的是：要不要给作者一个"直接写 HTML"的逃生口。

我犹豫了两周。最后还是决定不给。开口子很容易，关回来很难——一旦允许写 HTML，整个契约的 LLM 友好性就崩了。AI 一看有这条捷径，立刻全篇 HTML 输出，容器协议就成了摆设。

宁可让自己写一个新容器，也不让 AI 走旁门。这是我设计这套契约时反复跟自己讲的一句话。

---

## 让 AI 把活儿做到底 · LLM 集成全景

> 图 2：wechat-typeset 给 LLM 暴露的四层接口栈

<svg viewBox="0 0 640 410" xmlns="http://www.w3.org/2000/svg"
     font-family='"Microsoft YaHei","PingFang SC",sans-serif'>

  <!-- 背景 -->
  <rect width="640" height="410" fill="#f4f6f9"/>

  <!-- 主标题 -->
  <text x="288" y="30" font-size="18" font-weight="700" fill="#2c3e50"
        text-anchor="middle">wechat-typeset · AI 接口栈</text>
  <!-- 副标题 -->
  <text x="288" y="50" font-size="14" font-weight="400" fill="#7f8c8d"
        text-anchor="middle">让 AI 不靠记忆写排版</text>

  <!-- ===== 层 4（顶）：LLM Agent system prompt ===== -->
  <rect x="36" y="62" width="496" height="60" rx="6" ry="6"
        fill="#3498db" stroke="#2980b9" stroke-width="1.5"/>
  <text x="56" y="87" font-size="16" font-weight="700" fill="#fefefe">LLM Agent</text>
  <text x="56" y="108" font-size="14" fill="#d6eaf8">system prompt 注入白名单 + 词汇表 + 硬约束</text>
  <text x="508" y="98" font-size="30" font-weight="700" fill="#fefefe"
        text-anchor="middle" opacity="0.25">4</text>

  <!-- 箭头：层 3 → 层 4（向上，polygon 替代 marker）-->
  <line x1="284" y1="140" x2="284" y2="130" stroke="#5a6470" stroke-width="1.5"/>
  <polygon points="280,130 284,122 288,130" fill="#5a6470"/>

  <!-- ===== 层 3：4 个 SKILL.md ===== -->
  <rect x="36" y="142" width="496" height="60" rx="6" ry="6"
        fill="#9b59b6" stroke="#8e44ad" stroke-width="1.5"/>
  <text x="56" y="167" font-size="16" font-weight="700" fill="#fefefe">4 个 SKILL.md</text>
  <text x="56" y="188" font-size="14" fill="#e8daef">router · annotate-markdown · author-persona · export-richtext</text>
  <text x="508" y="178" font-size="30" font-weight="700" fill="#fefefe"
        text-anchor="middle" opacity="0.25">3</text>

  <!-- 箭头：层 2 → 层 3（向上，polygon 替代 marker）-->
  <line x1="284" y1="220" x2="284" y2="210" stroke="#5a6470" stroke-width="1.5"/>
  <polygon points="280,210 284,202 288,210" fill="#5a6470"/>

  <!-- ===== 层 2：公开 TypeScript API ===== -->
  <rect x="36" y="222" width="496" height="60" rx="6" ry="6"
        fill="#27ae60" stroke="#1e8449" stroke-width="1.5"/>
  <text x="56" y="247" font-size="16" font-weight="700" fill="#fefefe">公开 TypeScript API</text>
  <text x="56" y="268" font-size="14" fill="#d5f5e3">12 个符号：render · listPersonas · getContainerVocabulary · getVariantIds ···</text>
  <text x="508" y="258" font-size="30" font-weight="700" fill="#fefefe"
        text-anchor="middle" opacity="0.25">2</text>

  <!-- 箭头：层 1 → 层 2（向上，polygon 替代 marker）-->
  <line x1="284" y1="300" x2="284" y2="290" stroke="#5a6470" stroke-width="1.5"/>
  <polygon points="280,290 284,282 288,290" fill="#5a6470"/>

  <!-- ===== 层 1（底）：capabilities.json ===== -->
  <rect x="36" y="302" width="496" height="60" rx="6" ry="6"
        fill="#2c3e50" stroke="#1a252f" stroke-width="1.5"/>
  <text x="56" y="327" font-size="16" font-weight="700" fill="#fefefe">capabilities.json</text>
  <text x="56" y="348" font-size="14" fill="#aab7c4">schemaVersion 2.3 · jsDelivr CDN · 12h 缓存 · 无鉴权 CORS</text>
  <text x="508" y="338" font-size="30" font-weight="700" fill="#fefefe"
        text-anchor="middle" opacity="0.25">1</text>

  <!-- ===== 右侧标注栏 ===== -->
  <rect x="548" y="62" width="80" height="300" rx="6" ry="6"
        fill="#fefefe" stroke="#dde3eb" stroke-width="1.5"/>

  <!-- 标注标题 -->
  <text x="588" y="82" font-size="14" font-weight="700" fill="#2c3e50"
        text-anchor="middle">用途</text>

  <!-- 标注 4（对应层 4，y=62~122）-->
  <text x="588" y="102" font-size="14" fill="#3498db" text-anchor="middle">幻觉防控</text>
  <text x="588" y="120" font-size="14" fill="#7f8c8d" text-anchor="middle">事前注入</text>

  <line x1="558" y1="134" x2="618" y2="134" stroke="#dde3eb" stroke-width="1"/>

  <!-- 标注 3（对应层 3，y=142~202）-->
  <text x="588" y="156" font-size="14" fill="#9b59b6" text-anchor="middle">Agent</text>
  <text x="588" y="174" font-size="14" fill="#7f8c8d" text-anchor="middle">直接挂载</text>

  <line x1="558" y1="214" x2="618" y2="214" stroke="#dde3eb" stroke-width="1"/>

  <!-- 标注 2（对应层 2，y=222~282）-->
  <text x="588" y="236" font-size="14" fill="#27ae60" text-anchor="middle">Node-safe</text>
  <text x="588" y="254" font-size="14" fill="#7f8c8d" text-anchor="middle">无副作用</text>

  <line x1="558" y1="294" x2="618" y2="294" stroke="#dde3eb" stroke-width="1"/>

  <!-- 标注 1（对应层 1，y=302~362）-->
  <text x="588" y="316" font-size="14" fill="#2c3e50" text-anchor="middle">机器可读</text>
  <text x="588" y="334" font-size="14" fill="#7f8c8d" text-anchor="middle">CDN 订阅</text>

  <!-- 底部说明 -->
  <text x="320" y="398" font-size="14" fill="#7f8c8d"
        text-anchor="middle">wechat-typeset v0.2.0 · AI 接口层级</text>

</svg>

让 LLM 不靠记忆写排版，是这个工具最难的部分。

LLM 的本性是补完。给它一个"容器名"提示，它会自信地补完，`quoteCard`、`variant=glow`、`variant=modern`——这些都不存在。光靠提示词约束远远不够，必须给它一个**机器可读、运行时校验**的接口层。

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

剩下 8 个符号管 PersonaSpec 校验、签名容器查询、单容器规约获取。做主题工具链时按需调。所有 API 都有 TypeScript 类型，IDE 里直接补全。

### 钩子 3：4 个 SKILL.md 子 skill

可以直接挂到 Claude Code 上下文里。每个 skill 是一个独立的 Markdown 文件加几行脚本：

- **wechat-typeset**——路由入口，根据任务类型分发到下面三个
- **annotate-markdown**——把普通 markdown 注解成契约，自动加 `:::` 容器
- **author-persona**——设计自定义主题，`validatePersona()` 兜底
- **export-richtext**——渲染导出富文本，输出可直接粘贴的 HTML

::: tip variant=pill-tag
variant 名只能从 `getVariantIds()` 取，不能凭记忆。LLM 训练数据里没有它，凭空补出来的全是幻觉。
:::

### 钩子 4：system prompt 骨架

AI 真正写文章时挂的 prompt 大概这样（删了一半，留主干）：

```text
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

关键在第 7 行隐含的那条：**词汇表是运行时注入的，不是写死在 prompt 里**。capabilities.json 改一次。所有挂这个 prompt 的 Agent 自动跟着升级，不需要重新调教。

这才是"反幻觉"的真正姿势。事前就只给它合法选项，比事后拿 lint 抓错更有用。

接入后我自己的链路是这样的：以前一篇 3000 字的稿，从 Claude 写完到公众号点定时发送，平均 55 分钟。其中 40 多分钟全花在排版搬运上。

现在挂着 4 个 SKILL.md 的 Claude 直接输出契约 markdown，我粘进本地编辑器、瞄一眼主题、点复制，3 分钟搞定。一篇文章省下来的时间，正好够我多写一段思考。

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

<!-- IMAGE: pending-user fig-03 - 同一段 markdown 在 tech-geek 与 literary-humanism 主题下并排，建议宽 1200，左右各一张 -->

> 图 3：（待补，作者本地截图后替换）—— 同一段 markdown 在两个主题下的视觉差异

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

**坑 2**：手写 style 标签、class 属性或 font-family，进微信全部消失。所有样式只能走 juice 内联。

**坑 3**：`compare` 容器写错 fence 层级，外层用了三冒号。直接渲染失败，无救。外四内三，缺一不可。
:::

WxPatch 在渲染管线最后跑一遍，能自动救场 8 项机械错误：

- 删 style / script / noscript / link / meta 标签
- 删 inline font-family
- 删所有 id 属性
- 删 position 类样式
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
**30 秒**：打开在线 demo `https://lync-cyber.github.io/wechat-typeset`。粘 markdown，切两套主题对比差异。

**5 分钟**：本地跑 `npm ci && npm run dev`，浏览器开 `127.0.0.1:5173`。粘稿子、选主题、点复制富文本，粘进公众号后台。draft 自动存 localStorage。

**30 分钟**：在 Claude Code 里挂 4 个 SKILL.md，让 AI 全程生成契约 markdown 加导出富文本，作者只看终稿。
:::

写作与排版彻底解耦。AI 写完不算完，让 AI 把活儿做到底。

---

### 参考文献

1. wechat-typeset GitHub 仓库 [https://github.com/lync-cyber/wechat-typeset](https://github.com/lync-cyber/wechat-typeset)（2026-05）
2. wechat-typeset capabilities.json — jsDelivr CDN [https://cdn.jsdelivr.net/gh/lync-cyber/wechat-typeset@main/dist/api/capabilities.json](https://cdn.jsdelivr.net/gh/lync-cyber/wechat-typeset@main/dist/api/capabilities.json)（2026-05）
3. Markdown Nice — GFM 公众号排版工具 [https://mdnice.com](https://mdnice.com)（2026-05）
4. doocs/md — 开源微信 Markdown 编辑器 [https://github.com/doocs/md](https://github.com/doocs/md)（2026-05）

---

本文首发于 lync 笔记，未经授权禁止转载。

::: footer-cta cta=关注 href=https://github.com/lync-cyber/wechat-typeset
仓库在 GitHub，MIT 协议。觉得有用就点个 star。试完了来评论区说说效果？哪个主题最对你胃口？
:::

### 建议话题
#微信公众号 #排版工具 #AI写作 #LLM #开源工具
