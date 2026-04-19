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

/**
 * 与 `.claude/rules/data/platform-limits.yaml` 的 forbidden_css 对齐：
 * 主题作者触碰任一条即 throw，让问题在开发阶段立刻暴露而不是粘贴后失效。
 */
const FORBIDDEN_PROPS = ['font-family', 'fontfamily', 'position', 'float']
const FORBIDDEN_VALUE_PATTERNS: Array<[RegExp, string]> = [
  [/-webkit-/i, '-webkit- 前缀在公众号会被剥离'],
  [/@media/i, '@media 查询会被公众号剥离'],
  [/@keyframes/i, '@keyframes 动画不被公众号支持'],
  [/:hover/i, ':hover 伪类粘贴后无效'],
  [/:active/i, ':active 伪类粘贴后无效'],
]

// display:flex / inline-flex 在公众号粘贴后会被剥成 display: 空值，
// 子项仍带 flex:1 / flex-direction 等 orphan 样式，布局必塌。
// patchFlexToFallback 只在 DOM 后处理阶段把已经写进产物的 flex 改回 block，
// 这里在"主题写 CSS"更早的阶段直接 throw，避免主题作者以为自己能用。
const FORBIDDEN_DISPLAY_VALUES = new Set(['flex', 'inline-flex', 'grid', 'inline-grid'])

function assertSafeProp(prop: string, value: string, path: string): void {
  const lower = prop.toLowerCase()
  if (FORBIDDEN_PROPS.includes(lower)) {
    throw new ThemeAuthoringError(
      `[themeCSS] 主题在 ${path} 声明了 \`${prop}\`，违反微信平台约束。请移除。`,
    )
  }
  if (lower === 'display' && FORBIDDEN_DISPLAY_VALUES.has(value.toLowerCase().trim())) {
    throw new ThemeAuthoringError(
      `[themeCSS] 主题在 ${path} 使用了 \`display: ${value}\`，微信粘贴后会被剥离。` +
        '改用 block / inline-block / table 系列。',
    )
  }
  for (const [re, reason] of FORBIDDEN_VALUE_PATTERNS) {
    if (re.test(value)) {
      throw new ThemeAuthoringError(
        `[themeCSS] 主题在 ${path} 的值里命中禁用模式（${reason}）：\`${value}\`。请移除。`,
      )
    }
  }
}

function toCssDecl(obj: CSSObject, path: string): string {
  const decls: string[] = []
  for (const [key, rawValue] of Object.entries(obj)) {
    const prop = key.trim()
    const value = typeof rawValue === 'number' ? `${rawValue}px` : String(rawValue).trim()
    if (!value) continue
    assertSafeProp(prop, value, path)
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
    // inline code 容易塞超长 token（UUID / 长 URL / 模块路径），不加 word-break 会撑宽段落。
    // 只针对 inline 场景打破；紧跟的 `pre code` 会显式复位成 normal，保留代码块的保真排版。
    ['code', { ...theme.elements.code, 'word-break': 'break-all' }],
    ['pre', theme.elements.pre],
    ['pre code', {
      'background-color': 'transparent',
      color: 'inherit',
      padding: '0',
      'word-break': 'normal',
    }],
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

  // compare 两栏专属收敛：
  //   - .markdown-body p { font-size: 15px; letter-spacing: 1px } 的选择器比行内 style 继承强；
  //     窄栏里 15px + 1px letter-spacing 只能容 6~7 个 CJK 字，必然阶梯换行。
  //   - 这里用等同长度的后代选择器一次把栏内 p/li/h3 的字号、字距、段距压到窄栏预算内。
  //   这不是主题作者可调参数——所有主题都共享这组"两栏最小可读版式"。
  const compareColSel =
    `.${ROOT_CLASS} .container-pros, .${ROOT_CLASS} .container-cons`
  const compareColDescendant = (suffix: string) =>
    `.${ROOT_CLASS} .container-pros ${suffix}, .${ROOT_CLASS} .container-cons ${suffix}`
  chunks.push(rule(compareColSel, { 'letter-spacing': '0' }, 'compare.col'))
  chunks.push(
    rule(
      compareColDescendant('p'),
      {
        'font-size': '13px',
        'letter-spacing': '0',
        'line-height': '1.6',
        'margin-bottom': '6px',
      },
      'compare.col p',
    ),
  )
  chunks.push(
    rule(
      compareColDescendant('li'),
      {
        'font-size': '13px',
        'letter-spacing': '0',
        'line-height': '1.55',
        'margin-bottom': '4px',
      },
      'compare.col li',
    ),
  )
  chunks.push(
    rule(
      compareColDescendant('ul') + `, ${compareColDescendant('ol')}`,
      { 'padding-left': '18px', 'margin-bottom': '8px' },
      'compare.col ul',
    ),
  )
  chunks.push(
    rule(
      compareColDescendant('h3'),
      { 'font-size': '14px', 'margin-top': '8px', 'margin-bottom': '6px', 'line-height': '1.4' },
      'compare.col h3',
    ),
  )
  // 栏内行内 code 也缩一号，避免继承自全局 14px 仍然撑开
  chunks.push(
    rule(
      compareColDescendant('code'),
      { 'font-size': '12px', padding: '1px 4px' },
      'compare.col code',
    ),
  )

  return chunks.filter(Boolean).join('\n\n')
}
