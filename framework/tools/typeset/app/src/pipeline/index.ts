/**
 * 渲染管线主入口
 *
 * pipeline(md, theme, codeTheme) -> html
 *
 * Step 1 实现：markdown-it → themeCSS → highlight → juice → 最终 HTML
 * Step 3 会插入 wxPatch DOM 后处理层；Step 4 接入容器渲染器。
 */

import type { Theme } from '../themes/types'
import { createMarkdown } from './markdown'
import { generateThemeCSS } from './themeCSS'
import { atomOneDarkCss, highlightCode } from './highlight'
import { inlineHtml } from './juiceInline'

export interface RenderInput {
  md: string
  theme: Theme
}

export interface RenderOutput {
  html: string
  wordCount: number
  readingTime: number
}

const ROOT_CLASS = 'markdown-body'

export function render(input: RenderInput): RenderOutput {
  const { md: source, theme } = input

  const mdInstance = createMarkdown()
  // 在 fence 渲染时接入 highlight.js
  mdInstance.options.highlight = (code: string, lang: string) => {
    const { html, language } = highlightCode(code, lang)
    const langClass = language ? ` class="language-${language} hljs"` : ' class="hljs"'
    return `<pre><code${langClass}>${html}</code></pre>`
  }

  const bodyHtml = mdInstance.render(source)
  const themeCss = generateThemeCSS(theme)

  const htmlWithStyle = [
    `<section class="${ROOT_CLASS}">`,
    `<style>${themeCss}\n${atomOneDarkCss}</style>`,
    bodyHtml,
    `</section>`,
  ].join('\n')

  const inlined = inlineHtml(htmlWithStyle)

  // Step 3 在这里插入 wxPatch；Step 1 直接返回
  const finalHtml = inlined

  const wordCount = countWords(source)
  const readingTime = Math.max(1, Math.ceil(wordCount / 300))

  return { html: finalHtml, wordCount, readingTime }
}

function countWords(s: string): number {
  // 中文按字符计，英文按空白切分词
  const cjk = (s.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? []).length
  const enWords = s
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return cjk + enWords
}
