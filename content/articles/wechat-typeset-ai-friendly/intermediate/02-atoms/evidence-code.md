---
id: evidence-code-01
type: evidence-code
weight: primary
platforms: [wechat]
source_section: 代码片段
length_chars: 380
---

<!-- 解决：演示 ::: 容器完整嵌套结构，包含 intro/abstract/tip/compare/quote-card/footer-cta -->

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

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/docs/contract/base.md) (2026-05)

---
id: evidence-code-02
type: evidence-code
weight: primary
platforms: [wechat]
source_section: 代码片段
length_chars: 330
---

<!-- 解决：展示 capabilities.json 核心字段，供 LLM agent 订阅能力清单 -->

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
  "versionedSelfUri": "https://cdn.jsdelivr.net/gh/lync-cyber/wechat-typeset@v0.2.0/dist/api/capabilities.json"
}
```

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json) (2026-05)

---
id: evidence-code-03
type: evidence-code
weight: primary
platforms: [wechat]
source_section: 代码片段
length_chars: 360
---

<!-- 解决：展示 TypeScript 公开 API 调用方式，LLM 集成时查主题、查容器词汇表、查 variant 白名单、调渲染 -->

```typescript
import {
  render,
  listPersonas,
  getContainerVocabulary,
  getVariantIds,
} from 'wechat-typeset'

// 让 LLM 知道有哪些主题可选
const personas = listPersonas()
// → [{ id: 'tech-geek', name: '极客夜行', audience: '技术布道...', ... }, ...]

// 让 LLM 知道合法容器（fence 名 + 用途 + attrs），不靠记忆
const vocab = getContainerVocabulary()
// → [{ id: 'tip', description: 'tip：小贴士...', example: '::: tip ...' }, ...]

// 让 LLM 知道 variant 白名单，防止幻觉出 glow/modern/flat
const variants = getVariantIds()
// → { admonition: ['accent-bar', 'pill-tag', ...], quote: ['classic', ...], ... }

// 渲染（md → html，juice 内联 + wxPatch 全部自动处理）
const { html } = render({ md: contractMarkdown, persona: 'tech-geek' })
```

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/src/public/index.ts) (2026-05)

---
id: evidence-code-04
type: evidence-code
weight: supporting
platforms: [wechat]
source_section: 代码片段
length_chars: 420
---

<!-- 解决：展示 LLM agent system prompt 骨架，让 AI 生成合规 ::: 容器 markdown -->

```
# System prompt 示意（约 30 行）

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

参考词汇表：（调用 getContainerVocabulary() 动态注入）
可用主题：（调用 listPersonas() 动态注入）
```

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/wechat-typeset-annotate-markdown/SKILL.md) (2026-05)

---
id: evidence-code-05
type: evidence-code
weight: supporting
platforms: [wechat]
source_section: AI / LLM 集成钩子汇总
length_chars: 280
---

<!-- 解决：展示 annotate-markdown 子 skill 的 CLI 脚本调用方式 -->

```bash
# 推荐主题（给定标题/摘要/话题）
tsx skills/wechat-typeset-annotate-markdown/scripts/recommend-persona.ts \
  --title "React Server Components 实战" \
  --summary "从痛点出发的深度解析" \
  --topic tech

# 把普通 markdown 注解为契约 markdown
tsx skills/wechat-typeset-annotate-markdown/scripts/annotate-md.ts \
  --input article.md --persona tech-geek --out patches.json

# 校验契约合规性
tsx skills/wechat-typeset-annotate-markdown/scripts/lint-contract.ts output.md

# 渲染为富文本 HTML
tsx skills/wechat-typeset-export-richtext/scripts/render-html.ts \
  --input output.md --persona tech-geek --output result.html
```

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/wechat-typeset-annotate-markdown/SKILL.md) (2026-05)
