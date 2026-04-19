/**
 * 主题工厂：给 tokens 就能得到完整 Theme。
 *
 * 4 套内置主题共用同一组 elements/containers/inline 结构模板，
 * 视觉差异由 tokens + variant + templates + 少量 overrides 承担。
 * 这样主题作者关心"色彩/字号/圆角/变体"，不重复写一整套 CSS。
 */

import type {
  CSSObject,
  Theme,
  ThemeAssets,
  ThemeContainers,
  ThemeElements,
  ThemeInline,
  ThemeTemplates,
  ThemeTokens,
  ThemeVariants,
} from '../types'
import { DEFAULT_VARIANTS } from '../types'
import { buildAssets, type SvgVariant } from './svgAssets'

export interface BuildThemeOptions {
  id: string
  name: string
  description: string
  author?: string
  preview?: string
  tokens: ThemeTokens
  /** 直接提供手工 SVG 资产。优先级高于 variant。4 套内置主题用这条路径。 */
  assets?: ThemeAssets
  /** 参数化 SVG 工厂变体。未提供 assets 时生效；默认 'geometric'。 */
  variant?: SvgVariant
  /** 元素级样式补丁，按标签覆盖 */
  elementOverrides?: Partial<ThemeElements>
  /** 容器级样式补丁 */
  containerOverrides?: Partial<ThemeContainers>
  /** 内联级样式补丁 */
  inlineOverrides?: Partial<ThemeInline>
  /** 模板片段（封面卡 / 作者栏 / CTA / 推荐） */
  templates?: ThemeTemplates
  /** 代码块样式覆盖（部分主题需要浅色代码块） */
  pre?: CSSObject
  code?: CSSObject
  /**
   * v2 骨架变体。未声明时用 DEFAULT_VARIANTS（对齐 v1 视觉行为，零破坏兼容）。
   * Partial 支持"只换一项骨架" —— 比如某主题想 admonition 走 terminal、其余默认。
   */
  variants?: Partial<ThemeVariants>
}

export function baseElements(tokens: ThemeTokens, pre?: CSSObject, code?: CSSObject): ThemeElements {
  const { colors, typography } = tokens
  return {
    h1: {
      'font-size': `${typography.h1Size}px`,
      'font-weight': '700',
      color: colors.text,
      'margin-top': '28px',
      'margin-bottom': '16px',
      'line-height': '1.4',
    },
    h2: {
      'font-size': `${typography.h2Size}px`,
      'font-weight': '700',
      color: colors.text,
      'margin-top': '28px',
      'margin-bottom': '14px',
      'line-height': '1.4',
      'padding-bottom': '6px',
      'border-bottom': `2px solid ${colors.primary}`,
    },
    h3: {
      'font-size': `${typography.h3Size}px`,
      'font-weight': '700',
      color: colors.text,
      'margin-top': '22px',
      'margin-bottom': '10px',
      'line-height': '1.5',
    },
    p: {
      'font-size': `${typography.baseSize}px`,
      'line-height': String(typography.lineHeight),
      color: colors.text,
      'margin-top': '0',
      'margin-bottom': '18px',
      'letter-spacing': `${typography.letterSpacing}px`,
    },
    blockquote: {
      'border-left': `4px solid ${colors.primary}`,
      'background-color': colors.bgSoft,
      color: colors.textMuted,
      'padding-top': '12px',
      'padding-right': '16px',
      'padding-bottom': '12px',
      'padding-left': '16px',
      'margin-top': '0',
      'margin-bottom': '18px',
      'border-radius': '4px',
    },
    ul: { 'padding-left': '24px', 'margin-top': '0', 'margin-bottom': '18px' },
    ol: { 'padding-left': '24px', 'margin-top': '0', 'margin-bottom': '18px' },
    li: {
      'margin-bottom': '8px',
      'line-height': String(typography.lineHeight),
      color: colors.text,
    },
    code: code ?? {
      'background-color': colors.bgMuted,
      color: colors.code,
      padding: '2px 6px',
      'border-radius': '3px',
      'font-size': '14px',
    },
    pre: pre ?? {
      'background-color': '#282c34',
      color: '#abb2bf',
      'padding-top': '14px',
      'padding-right': '16px',
      'padding-bottom': '14px',
      'padding-left': '16px',
      'border-radius': '6px',
      // 代码块走"横向滚动"而非"强制换行"：
      //   - white-space:pre 保留原始换行，长行不折
      //   - max-width:100% + overflow-x:auto → 超宽时出现横向滑条
      //   WeChat 移动端实测 <pre> 的 overflow-x:auto 会启用原生触摸横滑（同 doocs/md 等）
      //   避免 break-all 把标识符 / 模板字符串在任意字符处剖开
      'overflow-x': 'auto',
      'white-space': 'pre',
      'max-width': '100%',
      'box-sizing': 'border-box',
      // 右侧内阴影：微信移动端 <pre> 横滑没有可见滚动条，用户不知道能滑；
      // inset box-shadow 在暗/亮底色上都能看见，被 border-radius 自然裁圆，
      // 相比 `background-attachment: local` 技巧在微信端稳定得多。
      'box-shadow': 'inset -14px 0 10px -10px rgba(0,0,0,0.28)',
      'margin-top': '0',
      'margin-bottom': '20px',
      'font-size': '13px',
      'line-height': '1.6',
    },
    img: {
      'max-width': '100%',
      display: 'block',
      'margin-top': '10px',
      'margin-right': 'auto',
      'margin-bottom': '10px',
      'margin-left': 'auto',
      'border-radius': '6px',
    },
    a: { color: colors.primary, 'text-decoration': 'underline' },
    hr: {
      border: 'none',
      height: '1px',
      'background-color': colors.border,
      'margin-top': '24px',
      'margin-bottom': '24px',
    },
    table: {
      'border-collapse': 'collapse',
      width: '100%',
      'margin-top': '0',
      'margin-bottom': '18px',
      'font-size': '14px',
    },
    strong: { 'font-weight': '700', color: colors.text },
    em: { 'font-style': 'italic', color: colors.text },
  }
}

export function baseContainers(tokens: ThemeTokens): ThemeContainers {
  return {
    intro: {
      'background-color': tokens.colors.bgSoft,
      'border-radius': '6px',
      padding: '14px 16px',
      margin: '16px 0',
      color: tokens.colors.textMuted,
    },
    author: {
      'background-color': tokens.colors.bgSoft,
      'border-radius': '6px',
      padding: '12px 14px',
      margin: '16px 0',
    },
    cover: { margin: '16px 0' },
    tip: {},
    warning: {},
    info: {},
    danger: {},
    quoteCard: {
      'background-color': tokens.colors.bgSoft,
      padding: '18px 16px',
      margin: '20px 0',
      'border-radius': '8px',
    },
    highlight: {
      'background-color': tokens.colors.bgMuted,
      padding: '12px 14px',
      margin: '16px 0',
      'border-radius': '6px',
    },
    compare: { margin: '16px 0' },
    steps: { margin: '16px 0' },
    sectionTitle: {
      margin: '24px 0 12px',
      'border-bottom': `2px solid ${tokens.colors.primary}`,
      'padding-bottom': '6px',
    },
    footerCTA: {
      margin: '24px 0',
      padding: '16px',
      'background-color': tokens.colors.bgSoft,
      'border-radius': '8px',
    },
    recommend: {
      margin: '20px 0',
      padding: '14px 16px',
      'background-color': tokens.colors.bgSoft,
      'border-radius': '6px',
    },
    qrcode: { margin: '20px 0', padding: '14px 16px' },
  }
}

export function baseInline(tokens: ThemeTokens): ThemeInline {
  return {
    highlight: {
      'background-color': tokens.colors.accent,
      color: tokens.colors.textInverse,
      padding: '0 3px',
      'border-radius': '2px',
    },
    wavy: {
      'text-decoration': 'underline wavy',
      'text-decoration-color': tokens.colors.accent,
      'text-underline-offset': '3px',
    },
    emphasis: {
      color: tokens.colors.primary,
      'font-weight': '600',
    },
  }
}

export function buildTheme(opts: BuildThemeOptions): Theme {
  const elements = { ...baseElements(opts.tokens, opts.pre, opts.code), ...(opts.elementOverrides ?? {}) }
  const containers = { ...baseContainers(opts.tokens), ...(opts.containerOverrides ?? {}) }
  const inline = { ...baseInline(opts.tokens), ...(opts.inlineOverrides ?? {}) }
  const assets = opts.assets ?? buildAssets({ tokens: opts.tokens, variant: opts.variant ?? 'geometric' })
  const variants: ThemeVariants = { ...DEFAULT_VARIANTS, ...(opts.variants ?? {}) }
  return {
    id: opts.id,
    name: opts.name,
    description: opts.description,
    author: opts.author ?? 'InkFlow',
    preview: opts.preview ?? '',
    tokens: opts.tokens,
    elements,
    containers,
    assets,
    templates: opts.templates ?? {},
    inline,
    variants,
  }
}
