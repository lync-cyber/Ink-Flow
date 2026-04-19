/**
 * 通用示例：覆盖全部 19 个容器 + 所有行内扩展 + 代码块 / 列表 / 图片 / 引用。
 * 切主题时可用此 md 作为基准；4 套主题的个性化示例则各自覆盖一份不同 slug。
 */

export const commonSample = `# wx-md · 全量示例

::: intro 本文通过一篇完整样稿演示所有容器、行内扩展与代码块。
这份示例用来验证：**所有容器在新主题下都有得体呈现**，且没有硬编码颜色遗留。
:::

::: cover 封面
![封面占位图](https://placehold.co/1200x630?text=wx-md)
:::

::: author 编辑部 role=主笔
负责全栈内容生产，关注工具、写作与研究方法。
:::

::: divider variant=wave
:::

## 一、段落与行内扩展

本工具把 Markdown 映射到公众号约束之上。==高亮==、~~波浪~~、*斜体*、**加粗**、\`inline code\` 在 4 套主题下都会跟着 tokens 走。

> 一个普通引用块：用来引出观点，不抢焦点。

::: divider variant=dots
:::

## 二、四色提示

::: tip 小贴士
高亮 \`ctx.tokens\` 里的色值——主题切换时会自然同步。
:::

::: warning 注意
\`:::: compare\` 必须用 4 个冒号，内层 pros/cons 用 3 个。
:::

::: info 说明
公众号不支持 \`<style>\` 块与 \`class\`——所有样式在导出阶段内联。
:::

::: danger 警告
禁止在主题里写 \`font-family\`；\`themeCSS\` 会抛出 \`ThemeAuthoringError\`。
:::

::: divider variant=flower
:::

## 三、金句与高亮

::: quote-card 王小波
一个人的成熟不是年纪的加法，而是欲望的减法。
:::

::: highlight
把复杂写简单，是一种对读者的尊重；
把简单写复杂，是对自己的谄媚。
:::

::: divider
:::

## 四、对比与步骤

:::: compare

::: pros 为什么选 wx-md
- 一个工具打穿 "写、排、发" 全链
- 主题与内容解耦，换色不改结构
- 容器语法无 HTML 依赖，可版本化
:::

::: cons 暂时不适合
- 需要复杂交互的长图文（SVG 只做轻装饰）
- 强调动效（公众号本身剥离所有动画）
- 短平快营销号（风格更偏严谨）
:::

::::

::: steps 实战流程
### 写初稿
把素材粘到左侧编辑器，先保证结构。

### 套主题
上方下拉切换主题，右侧实时 375px 预览。

### 一键复制
点右上角"一键复制"，粘贴到公众号后台。
:::

::: divider variant=wave
:::

## 五、代码与数据

\`\`\`ts
import { renderPipeline } from './pipeline'
import { getTheme } from './themes'

const theme = getTheme('tech-geek')
const { html, wordCount } = renderPipeline({
  md: '# Hello wx-md',
  theme,
})
\`\`\`

| 主题 | 基调 | 适用栏目 |
| --- | --- | --- |
| 极客夜行 | 深色 | 技术 / 产品 |
| 慢生活 | 暖米 | 生活 / 旅行 |
| 硬核财经 | 锐利 | 商业 / 财经 |
| 人文札记 | 素雅 | 散文 / 书评 |

::: divider variant=dots
:::

## 六、媒体占位

::: mpvoice 开篇语 fileid=placeholder-fileid
:::

::: mpvideo 产品演示 qqvid=placeholder-vid
:::

::: divider variant=flower
:::

## 七、文末引导

::: footer-cta 如果对你有启发 cta=关注我
每周一篇深度，愿意被慢慢读。
:::

::: recommend 延伸阅读
- [从零开始的 wx-md](https://example.com/a)
- [主题工程的五个误区](https://example.com/b)
- [LCH 色彩生成手册](https://example.com/c)
:::

::: qrcode 扫码加入读者群
![二维码占位](https://placehold.co/240x240?text=QR)
:::
`
