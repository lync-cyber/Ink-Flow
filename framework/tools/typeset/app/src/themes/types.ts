/**
 * Theme 设计系统类型定义
 *
 * 每个主题 = 设计令牌 + 元素样式 + 容器样式 + SVG 装饰资产 + 模板 + 骨架变体。
 * 主题严禁在任何层级声明 font-family——微信客户端会用系统字体覆盖，
 * themeCSS 生成器遇到 font-family 会直接 throw ThemeAuthoringError。
 *
 * v2 变更（variants）：
 *   P1「同质化」源头是 admonitions.ts 把"左 3px 色条 + 浅底"写死。
 *   v2 引入 ThemeVariants：主题在 variants 里选骨架，渲染器按 variant 分派。
 *   variant 模块只允许返回受类型约束的 { wrapperCSS, titleCSS, bodyCSS, svgSlot }
 *   四段式产物，不允许任意属性——避免"CSS 片段超市"。
 *
 *   variants 选择不放进 ThemeTokens（tokens 是纯数值令牌），而挂在 Theme 顶层，
 *   ContainerRenderContext 同步携带。主题不声明时用 DEFAULT_VARIANTS 回退，
 *   保持对现有 5 套主题向后兼容。
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
  compare?: string
  steps?: string
  tip?: string
}

export interface ThemeInline {
  highlight: CSSObject
  wavy: CSSObject
  emphasis: CSSObject
}

// ============================================================
// Variants：骨架变体（v2 新增）
// ============================================================
//
// 每一类容器提供 N 种"视觉骨架"。主题在 Theme.variants 里声明要用哪一个，
// renderer 按 id 分派到 variants/{kind}/{id}.ts 模块。
//
// 选择原则（和公众号硬约束强绑定）：
//   - 禁 position / float / @media / @keyframes / :hover / -webkit- / flex gap
//   - 需要"悬浮 / 缺口 / 折角"这类视觉，改用 SVG data-URI 背景或
//     inline SVG 节点 + 负 margin 实现，而非 position:absolute
//   - 每个 variant 的拼接 CSS 字符串 ≤ 400 字符（juice 后粘贴稳定性）

export type AdmonitionVariantId =
  // 左侧 3px 色条 + 浅底（默认，当前渲染器等效行为）
  | 'accent-bar'
  // 顶部胶囊标签 + 外框下沉（标题悬于边缘上沿）
  | 'pill-tag'
  // 票根缺口：左右两端圆切齿，SVG data-URI 背景实现
  | 'ticket-notch'
  // 卡片阴影悬浮：单层阴影 + 圆角 + 无边框
  | 'card-shadow'
  // 极简下划线：仅标题下方一道色条，整体无底色
  | 'minimal-underline'
  // 终端窗口：顶部三色圆点条 + 单色字号小的正文
  | 'terminal'

export type QuoteVariantId =
  // 大号装饰引号 + 居中（当前默认行为）
  | 'classic'
  // 首字下沉：第一字放大 2.5x，杂志排风
  | 'magazine-dropcap'
  // 双侧细竖线：左右各一根 1px 长线夹住段落
  | 'column-rule'
  // 四角括号框：四个角各一个 L 形 SVG 装饰
  | 'frame-brackets'

export type CompareVariantId =
  // 两栏卡片（当前默认行为，display:table-cell）
  | 'column-card'
  // 上下堆叠：两行 full-width 卡片，小屏友好
  | 'stacked-row'
  // 账本双色列：一列绿底一列红底，ledger 风
  | 'ledger'

export type StepsVariantId =
  // 编号圆圈徽章（当前默认行为）
  | 'number-circle'
  // 飘带链式：每步横向色条连续
  | 'ribbon-chain'
  // 时间轴点：左侧单列点阵 + 正文
  | 'timeline-dot'

export type DividerVariantId =
  | 'wave'
  | 'dots'
  | 'flower'
  | 'rule'
  | 'glyph' // 单字符装饰（§ / ❦ / ◆）

export type SectionTitleVariantId =
  // 底部 2px 主色线（当前默认）
  | 'bordered'
  // 左上角装饰 SVG（当前 assets.sectionCorner 对应）
  | 'cornered'

/**
 * 主题骨架选择。每个字段选一个 id，渲染器据此分派到 variants/{kind}/{id}.ts。
 *
 * 初版覆盖：6 + 4 + 3 + 3 + 5 + 2 = 23 种 variant，远超"至少 5×4=20 组合"基线。
 */
export interface ThemeVariants {
  admonition: AdmonitionVariantId
  quote: QuoteVariantId
  compare: CompareVariantId
  steps: StepsVariantId
  divider: DividerVariantId
  sectionTitle: SectionTitleVariantId
}

/**
 * 主题不声明时的回退。对齐 v1 各渲染器的当前视觉，保证现有 5 套主题零改动兼容。
 * buildTheme 会在 opts.variants 未提供时注入此常量。
 */
export const DEFAULT_VARIANTS: ThemeVariants = {
  admonition: 'accent-bar',
  quote: 'classic',
  compare: 'column-card',
  steps: 'number-circle',
  divider: 'rule',
  sectionTitle: 'bordered',
}

/**
 * 所有可选 VariantId 的常量清单（供 variant-sanity 测试枚举使用，
 * 任何新增 id 必须同步补齐，否则测试会漏掉新 variant）。
 */
export const VARIANT_IDS = {
  admonition: [
    'accent-bar',
    'pill-tag',
    'ticket-notch',
    'card-shadow',
    'minimal-underline',
    'terminal',
  ] as const satisfies readonly AdmonitionVariantId[],
  quote: [
    'classic',
    'magazine-dropcap',
    'column-rule',
    'frame-brackets',
  ] as const satisfies readonly QuoteVariantId[],
  compare: [
    'column-card',
    'stacked-row',
    'ledger',
  ] as const satisfies readonly CompareVariantId[],
  steps: [
    'number-circle',
    'ribbon-chain',
    'timeline-dot',
  ] as const satisfies readonly StepsVariantId[],
  divider: [
    'wave',
    'dots',
    'flower',
    'rule',
    'glyph',
  ] as const satisfies readonly DividerVariantId[],
  sectionTitle: [
    'bordered',
    'cornered',
  ] as const satisfies readonly SectionTitleVariantId[],
}

export type VariantKind = keyof ThemeVariants

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
  /**
   * v2 骨架选择。主题不声明时由 buildTheme 填入 DEFAULT_VARIANTS。
   * 渲染器在 ContainerRenderContext.variants 里读取。
   */
  variants: ThemeVariants
}

export class ThemeAuthoringError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ThemeAuthoringError'
  }
}
