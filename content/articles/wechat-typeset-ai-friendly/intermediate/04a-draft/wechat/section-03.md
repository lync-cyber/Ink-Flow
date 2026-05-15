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
