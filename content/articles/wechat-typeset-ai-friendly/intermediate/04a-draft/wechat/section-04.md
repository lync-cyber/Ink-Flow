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
