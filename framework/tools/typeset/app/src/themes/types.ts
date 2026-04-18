/**
 * Theme 设计系统类型定义
 *
 * 每个主题 = 设计令牌 + 元素样式 + 容器样式 + SVG 装饰资产 + 模板
 * 主题严禁在任何层级声明 font-family——微信客户端会用系统字体覆盖，
 * themeCSS 生成器遇到 font-family 会直接 throw ThemeAuthoringError。
 */

export type CSSObject = Record<string, string | number>
export type SVGString = string

/** 语义化状态色：提示容器与后续可能的徽章使用 */
export interface StatusPair {
  accent: string
  soft: string
}

export interface ThemeTokens {
  colors: {
    primary: string
    secondary: string
    accent: string
    bg: string
    bgSoft: string
    bgMuted: string
    text: string
    textMuted: string
    textInverse: string
    border: string
    code: string
    /** 语义色：tip / warning / info / danger，容器外框与标题色从此取 */
    status: {
      tip: StatusPair
      warning: StatusPair
      info: StatusPair
      danger: StatusPair
    }
  }
  typography: {
    baseSize: number
    lineHeight: number
    h1Size: number
    h2Size: number
    h3Size: number
    letterSpacing: number
    // 注意：禁止 fontFamily 字段；themeCSS 生成器会在 CSS 层扫描并拒绝 font-family
  }
  spacing: {
    paragraph: number
    section: number
    listItem: number
    containerPadding: number
  }
  radius: {
    sm: number
    md: number
    lg: number
  }
}

export interface ThemeElements {
  h1: CSSObject
  h2: CSSObject
  h3: CSSObject
  p: CSSObject
  blockquote: CSSObject
  ul: CSSObject
  ol: CSSObject
  li: CSSObject
  code: CSSObject
  pre: CSSObject
  img: CSSObject
  a: CSSObject
  hr: CSSObject
  table: CSSObject
  strong: CSSObject
  em: CSSObject
}

export interface ThemeContainers {
  intro: CSSObject
  author: CSSObject
  cover: CSSObject
  tip: CSSObject
  warning: CSSObject
  info: CSSObject
  danger: CSSObject
  quoteCard: CSSObject
  highlight: CSSObject
  compare: CSSObject
  steps: CSSObject
  sectionTitle: CSSObject
  footerCTA: CSSObject
  recommend: CSSObject
  qrcode: CSSObject
}

export interface ThemeAssets {
  h2Prefix?: SVGString
  h3Prefix?: SVGString
  dividerFlower?: SVGString
  dividerWave?: SVGString
  dividerDots?: SVGString
  quoteMark?: SVGString
  listBullet?: SVGString
  sectionCorner?: SVGString
  stepBadge?: (n: number) => SVGString
  tipIcon?: SVGString
  warningIcon?: SVGString
  infoIcon?: SVGString
  dangerIcon?: SVGString
}

export interface ThemeTemplates {
  cover?: string
  authorBar?: string
  footerCTA?: string
  recommend?: string
}

export interface ThemeInline {
  highlight: CSSObject
  wavy: CSSObject
  emphasis: CSSObject
}

export interface Theme {
  id: string
  name: string
  description: string
  author: string
  preview: string

  tokens: ThemeTokens
  elements: ThemeElements
  containers: ThemeContainers
  assets: ThemeAssets
  templates: ThemeTemplates
  inline: ThemeInline
}

export class ThemeAuthoringError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ThemeAuthoringError'
  }
}
