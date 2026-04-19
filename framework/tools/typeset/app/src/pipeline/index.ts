/**
 * 渲染管线主入口
 *
 * pipeline(md, theme, codeTheme) -> html
 *
 * Step 1 实现：markdown-it → themeCSS → highlight → juice → 最终 HTML
 * Step 3 起：juice 之后插入 wxPatch DOM 后处理层；Step 4 接入容器渲染器。
 */

import type MarkdownIt from 'markdown-it'
import type { Theme } from '../themes/types'
import { createMarkdown } from './markdown'
import { generateThemeCSS } from './themeCSS'
import { atomOneDarkCss, highlightCode } from './highlight'
import { inlineHtml } from './juiceInline'
import { applyWxPatches, type WxPatchOptions } from './wxPatch'

export interface RenderInput {
  md: string
  theme: Theme
  wxPatch?: WxPatchOptions
}

export interface RenderOutput {
  html: string
  wordCount: number
  readingTime: number
}

const ROOT_CLASS = 'markdown-body'

/**
 * 按 theme.id 缓存 MarkdownIt 实例。
 *
 * 容器渲染器在 createMarkdown 的闭包里绑定了 theme 引用，
 * 因此主题切换必须换新实例。同 theme 复用——避免每次击键重建插件链。
 *
 * LRU（MAX=8）：自定义配色 apply 一次就产出 `${base.id}--custom` 这样的新 id，
 * 无上限会随操作堆积。8 个容量对"4 套基础 + 数次自定义"足够周转。
 */
const MD_CACHE_MAX = 8
const mdCache = new Map<string, MarkdownIt>()

function getMarkdown(theme: Theme): MarkdownIt {
  const cached = mdCache.get(theme.id)
  if (cached) {
    // LRU 更新：重新插入到末尾
    mdCache.delete(theme.id)
    mdCache.set(theme.id, cached)
    return cached
  }
  const md = createMarkdown({ theme })
  md.options.highlight = (code: string, lang: string) => {
    const { html, language } = highlightCode(code, lang)
    const langClass = language ? ` class="language-${language} hljs"` : ' class="hljs"'
    return `<pre><code${langClass}>${html}</code></pre>`
  }
  mdCache.set(theme.id, md)
  // 超出容量淘汰最老（Map 迭代序 = 插入序）
  if (mdCache.size > MD_CACHE_MAX) {
    const oldest = mdCache.keys().next().value
    if (oldest !== undefined) mdCache.delete(oldest)
  }
  return md
}

export function render(input: RenderInput): RenderOutput {
  const { md: source, theme } = input

  const mdInstance = getMarkdown(theme)

  const bodyHtml = mdInstance.render(source)
  const themeCss = generateThemeCSS(theme)

  const htmlWithStyle = [
    `<section class="${ROOT_CLASS}">`,
    `<style>${themeCss}\n${atomOneDarkCss}</style>`,
    bodyHtml,
    `</section>`,
  ].join('\n')

  const inlined = inlineHtml(htmlWithStyle)

  // Step 3：DOM 后处理层，抹平公众号粘贴的诸多坑
  const finalHtml = applyWxPatches(inlined, input.wxPatch)

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
