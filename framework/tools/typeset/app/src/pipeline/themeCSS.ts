/**
 * Theme → <style> 字符串生成器
 *
 * 硬性约束：整个 Theme 对象中任何 CSSObject 不得出现 font-family；
 * 遇到则抛 ThemeAuthoringError，让主题作者立即发现。
 * 理由：微信客户端会用系统字体覆盖，写 font-family 无意义且浪费字符。
 */

import type { CSSObject, Theme } from '../themes/types'
import { ThemeAuthoringError } from '../themes/types'

const ROOT_CLASS = 'markdown-body'

type Selector = string

function toCssDecl(obj: CSSObject, path: string): string {
  const decls: string[] = []
  for (const [key, rawValue] of Object.entries(obj)) {
    const prop = key.trim()
    if (prop.toLowerCase() === 'font-family' || prop.toLowerCase() === 'fontfamily') {
      throw new ThemeAuthoringError(
        `[themeCSS] 主题在 ${path} 声明了 font-family，违反微信平台约束（客户端会用系统字体覆盖）。请移除。`,
      )
    }
    const value = typeof rawValue === 'number' ? `${rawValue}px` : String(rawValue).trim()
    if (!value) continue
    decls.push(`  ${prop}: ${value};`)
  }
  return decls.join('\n')
}

function rule(selector: Selector, obj: CSSObject, path: string): string {
  const body = toCssDecl(obj, path)
  if (!body) return ''
  return `${selector} {\n${body}\n}`
}

/**
 * 元素选择器：root class + 标签名。
 * 不写 `.markdown-body *`，避免过于激进影响内部 SVG/容器。
 */
function elementSelector(tag: string): Selector {
  return `.${ROOT_CLASS} ${tag}`
}

function containerSelector(name: string): Selector {
  // 容器节点由 containers/*.ts 渲染为 <section class="container-xxx"> 等结构
  // Step 1 尚未生成容器节点，这些规则暂时不会命中，但保留给后续 Step 使用
  return `.${ROOT_CLASS} .container-${name}`
}

export function generateThemeCSS(theme: Theme): string {
  const chunks: string[] = []

  // Root 自身：背景、基础字体（但不含 font-family）
  chunks.push(
    rule(
      `.${ROOT_CLASS}`,
      {
        'background-color': theme.tokens.colors.bg,
        color: theme.tokens.colors.text,
        'font-size': `${theme.tokens.typography.baseSize}px`,
        'line-height': String(theme.tokens.typography.lineHeight),
        'letter-spacing': `${theme.tokens.typography.letterSpacing}px`,
        padding: '20px 16px',
      },
      'root',
    ),
  )

  // Elements
  const elementMap: Array<[string, CSSObject]> = [
    ['h1', theme.elements.h1],
    ['h2', theme.elements.h2],
    ['h3', theme.elements.h3],
    ['p', theme.elements.p],
    ['blockquote', theme.elements.blockquote],
    ['ul', theme.elements.ul],
    ['ol', theme.elements.ol],
    ['li', theme.elements.li],
    ['code', theme.elements.code],
    ['pre', theme.elements.pre],
    ['pre code', { 'background-color': 'transparent', color: 'inherit', padding: '0' }],
    ['img', theme.elements.img],
    ['a', theme.elements.a],
    ['hr', theme.elements.hr],
    ['table', theme.elements.table],
    ['th', {
      border: `1px solid ${theme.tokens.colors.border}`,
      padding: '6px 10px',
      'background-color': theme.tokens.colors.bgSoft,
      'text-align': 'left',
    }],
    ['td', {
      border: `1px solid ${theme.tokens.colors.border}`,
      padding: '6px 10px',
    }],
    ['strong', theme.elements.strong],
    ['em', theme.elements.em],
  ]
  for (const [tag, obj] of elementMap) {
    const r = rule(elementSelector(tag), obj, `elements.${tag}`)
    if (r) chunks.push(r)
  }

  // Inline 内联增强
  chunks.push(rule(`.${ROOT_CLASS} mark`, theme.inline.highlight, 'inline.highlight'))
  chunks.push(rule(`.${ROOT_CLASS} .wx-wavy`, theme.inline.wavy, 'inline.wavy'))
  chunks.push(rule(`.${ROOT_CLASS} .wx-emphasis`, theme.inline.emphasis, 'inline.emphasis'))

  // Containers（Step 1 大多为空对象，生成空规则被自然跳过）
  const containerMap: Array<[string, CSSObject]> = [
    ['intro', theme.containers.intro],
    ['author', theme.containers.author],
    ['cover', theme.containers.cover],
    ['tip', theme.containers.tip],
    ['warning', theme.containers.warning],
    ['info', theme.containers.info],
    ['danger', theme.containers.danger],
    ['quote-card', theme.containers.quoteCard],
    ['highlight', theme.containers.highlight],
    ['compare', theme.containers.compare],
    ['steps', theme.containers.steps],
    ['section-title', theme.containers.sectionTitle],
    ['footer-cta', theme.containers.footerCTA],
    ['recommend', theme.containers.recommend],
    ['qrcode', theme.containers.qrcode],
  ]
  for (const [name, obj] of containerMap) {
    const r = rule(containerSelector(name), obj, `containers.${name}`)
    if (r) chunks.push(r)
  }

  return chunks.filter(Boolean).join('\n\n')
}
