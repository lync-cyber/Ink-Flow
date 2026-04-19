/**
 * 默认主题 · 中性白底
 * Step 1 只实现 tokens + elements + inline，容器 CSS 占位空对象；
 * 完整容器样式与 SVG 资产在 Step 5 补齐。
 */

import type { Theme, CSSObject } from '../types'
import { DEFAULT_VARIANTS } from '../types'
import { commonTemplates } from '../_shared/defaultTemplates'

const tokens = {
  colors: {
    primary: '#2d6fdd',
    secondary: '#1f3b70',
    accent: '#ff7043',
    bg: '#ffffff',
    bgSoft: '#f7f8fa',
    bgMuted: '#eef1f6',
    text: '#1f2328',
    textMuted: '#6a737d',
    textInverse: '#ffffff',
    border: '#e1e4e8',
    code: '#d63384',
    status: {
      tip: { accent: '#1a8450', soft: '#eef7f0' },
      warning: { accent: '#b7791f', soft: '#fdf6e3' },
      info: { accent: '#1a73e8', soft: '#eef4ff' },
      danger: { accent: '#b42318', soft: '#fdecea' },
    },
  },
  typography: {
    baseSize: 15,
    lineHeight: 1.8,
    h1Size: 24,
    h2Size: 20,
    h3Size: 17,
    letterSpacing: 0.5,
  },
  spacing: {
    paragraph: 18,
    section: 28,
    listItem: 8,
    containerPadding: 16,
  },
  radius: { sm: 4, md: 8, lg: 12 },
}

const elements = {
  h1: {
    'font-size': '24px',
    'font-weight': '700',
    color: tokens.colors.text,
    'margin-top': '28px',
    'margin-bottom': '16px',
    'line-height': '1.4',
  },
  h2: {
    'font-size': '20px',
    'font-weight': '700',
    color: tokens.colors.text,
    'margin-top': '28px',
    'margin-bottom': '14px',
    'line-height': '1.4',
    'padding-bottom': '6px',
    'border-bottom': `2px solid ${tokens.colors.primary}`,
  },
  h3: {
    'font-size': '17px',
    'font-weight': '700',
    color: tokens.colors.text,
    'margin-top': '22px',
    'margin-bottom': '10px',
    'line-height': '1.5',
  },
  p: {
    'font-size': '15px',
    'line-height': '1.8',
    color: tokens.colors.text,
    'margin-top': '0',
    'margin-bottom': '18px',
    'letter-spacing': '0.5px',
  },
  blockquote: {
    'border-left': `4px solid ${tokens.colors.primary}`,
    'background-color': tokens.colors.bgSoft,
    color: tokens.colors.textMuted,
    'padding-top': '12px',
    'padding-right': '16px',
    'padding-bottom': '12px',
    'padding-left': '16px',
    'margin-top': '0',
    'margin-bottom': '18px',
    'border-radius': '4px',
  },
  ul: {
    'padding-left': '24px',
    'margin-top': '0',
    'margin-bottom': '18px',
  },
  ol: {
    'padding-left': '24px',
    'margin-top': '0',
    'margin-bottom': '18px',
  },
  li: {
    'margin-bottom': '8px',
    'line-height': '1.8',
    color: tokens.colors.text,
  },
  code: {
    'background-color': tokens.colors.bgMuted,
    color: tokens.colors.code,
    padding: '2px 6px',
    'border-radius': '3px',
    'font-size': '14px',
  },
  pre: {
    'background-color': '#282c34',
    color: '#abb2bf',
    'padding-top': '14px',
    'padding-right': '16px',
    'padding-bottom': '14px',
    'padding-left': '16px',
    'border-radius': '6px',
    'overflow-x': 'auto',
    'white-space': 'pre',
    'max-width': '100%',
    'box-sizing': 'border-box',
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
  a: {
    color: tokens.colors.primary,
    'text-decoration': 'underline',
  },
  hr: {
    border: 'none',
    height: '1px',
    'background-color': tokens.colors.border,
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
  strong: { 'font-weight': '700', color: tokens.colors.text },
  em: { 'font-style': 'italic', color: tokens.colors.text },
}

const inline = {
  highlight: {
    'background-color': '#fff3b0',
    color: tokens.colors.text,
    padding: '0 2px',
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

// 容器样式（默认主题 · 中性白底）
// 只承担"容器外框"的留白/边框，内部结构色（标题色条）由渲染器写在 inline style。
// Step 5 起，高质感主题会在这里叠加更多视觉。
const containers = {
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
  cover: {
    margin: '16px 0',
  },
  tip: { /* 渲染器内 inline 色调；保留空以便主题扩展 */ } as CSSObject,
  warning: {} as CSSObject,
  info: {} as CSSObject,
  danger: {} as CSSObject,
  quoteCard: {
    'background-color': tokens.colors.bgSoft,
    padding: '18px 16px',
    margin: '20px 0',
    'border-radius': '8px',
  },
  highlight: {
    'background-color': '#fff8e1',
    padding: '12px 14px',
    margin: '16px 0',
    'border-radius': '6px',
  },
  compare: {
    margin: '16px 0',
  },
  steps: {
    margin: '16px 0',
  },
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
  qrcode: {
    margin: '20px 0',
    padding: '14px 16px',
  },
}

/**
 * SVG 资产 · 中性白底主题
 *
 * 设计原则：
 *   - 全部 inline SVG 字符串（无 id、无 url() 引号、无 <style> / <script>）
 *   - 尺寸小（< 2KB 单条），加载零成本
 *   - 颜色用主色 / 辅助灰，不引入额外强色；由容器渲染器注入位置
 *   - 粘贴后公众号会光栅化为 PNG，笔画避免过细（stroke-width ≥ 1）
 */

const SVG = (s: string) => s.replace(/\s+/g, ' ').trim()

const svgH2Prefix = SVG(`
  <svg viewBox="0 0 14 22" width="12" height="18" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:8px">
    <rect x="0" y="0" width="4" height="22" fill="${tokens.colors.primary}"/>
    <rect x="7" y="4" width="3" height="14" fill="${tokens.colors.primary}" opacity="0.6"/>
  </svg>
`)

const svgDividerWave = SVG(`
  <svg viewBox="0 0 240 14" width="220" height="14" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,7 Q15,0 30,7 T60,7 T90,7 T120,7 T150,7 T180,7 T210,7 T240,7"
          fill="none" stroke="${tokens.colors.border}" stroke-width="1.5"/>
  </svg>
`)

const svgDividerDots = SVG(`
  <svg viewBox="0 0 240 8" width="220" height="8" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="4" r="2" fill="${tokens.colors.border}"/>
    <circle cx="100" cy="4" r="2" fill="${tokens.colors.border}"/>
    <circle cx="140" cy="4" r="2" fill="${tokens.colors.border}"/>
    <circle cx="180" cy="4" r="2" fill="${tokens.colors.border}"/>
  </svg>
`)

const svgDividerFlower = SVG(`
  <svg viewBox="0 0 240 18" width="220" height="18" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="9" x2="100" y2="9" stroke="${tokens.colors.border}" stroke-width="1"/>
    <line x1="140" y1="9" x2="240" y2="9" stroke="${tokens.colors.border}" stroke-width="1"/>
    <path d="M120,2 L124,9 L120,16 L116,9 Z" fill="${tokens.colors.primary}"/>
    <circle cx="105" cy="9" r="1.5" fill="${tokens.colors.border}"/>
    <circle cx="135" cy="9" r="1.5" fill="${tokens.colors.border}"/>
  </svg>
`)

const svgQuoteMark = SVG(`
  <svg viewBox="0 0 40 32" width="34" height="28" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:top;margin-right:4px">
    <path d="M4,26 L4,16 C4,10 8,6 14,4 L14,8 C10,9 8,12 8,16 L12,16 L12,26 Z
             M22,26 L22,16 C22,10 26,6 32,4 L32,8 C28,9 26,12 26,16 L30,16 L30,26 Z"
          fill="${tokens.colors.primary}" opacity="0.3"/>
  </svg>
`)

const svgSectionCorner = SVG(`
  <svg viewBox="0 0 18 18" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
    <path d="M0,0 L18,0 L18,4 L4,4 L4,18 L0,18 Z" fill="${tokens.colors.primary}"/>
  </svg>
`)

const svgTipIcon = SVG(`
  <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
    <circle cx="8" cy="8" r="6" fill="none" stroke="${tokens.colors.status.tip.accent}" stroke-width="1.5"/>
    <rect x="7" y="4" width="2" height="5" fill="${tokens.colors.status.tip.accent}"/>
    <rect x="7" y="10" width="2" height="2" fill="${tokens.colors.status.tip.accent}"/>
  </svg>
`)

const svgWarningIcon = SVG(`
  <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
    <path d="M8,1 L15,14 L1,14 Z" fill="none" stroke="${tokens.colors.status.warning.accent}" stroke-width="1.5"/>
    <rect x="7" y="5" width="2" height="5" fill="${tokens.colors.status.warning.accent}"/>
    <rect x="7" y="11" width="2" height="2" fill="${tokens.colors.status.warning.accent}"/>
  </svg>
`)

const svgInfoIcon = SVG(`
  <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
    <circle cx="8" cy="8" r="6" fill="none" stroke="${tokens.colors.status.info.accent}" stroke-width="1.5"/>
    <rect x="7" y="3" width="2" height="2" fill="${tokens.colors.status.info.accent}"/>
    <rect x="7" y="6" width="2" height="7" fill="${tokens.colors.status.info.accent}"/>
  </svg>
`)

// 横线用 #fefefe，规避公众号 SVG→PNG 把 #fff 透明化
const svgDangerIcon = SVG(`
  <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
    <circle cx="8" cy="8" r="6" fill="${tokens.colors.status.danger.accent}"/>
    <rect x="3" y="7" width="10" height="2" fill="#fefefe"/>
  </svg>
`)

// font-size=15（平台下限 14）；数字色用 #fefefe 规避公众号 SVG→PNG 把纯白变透明
const svgStepBadge = (n: number) => SVG(`
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:8px">
    <circle cx="12" cy="12" r="11" fill="${tokens.colors.primary}"/>
    <text x="12" y="17" text-anchor="middle" font-size="15" font-weight="700" fill="#fefefe">${n}</text>
  </svg>
`)

export const defaultTheme: Theme = {
  id: 'default',
  name: '默认主题',
  description: '中性白底，语义色 + 几何装饰 SVG',
  author: 'InkFlow',
  preview: '',
  tokens,
  elements,
  containers,
  assets: {
    h2Prefix: svgH2Prefix,
    dividerWave: svgDividerWave,
    dividerDots: svgDividerDots,
    dividerFlower: svgDividerFlower,
    quoteMark: svgQuoteMark,
    sectionCorner: svgSectionCorner,
    tipIcon: svgTipIcon,
    warningIcon: svgWarningIcon,
    infoIcon: svgInfoIcon,
    dangerIcon: svgDangerIcon,
    stepBadge: svgStepBadge,
  },
  templates: commonTemplates,
  inline,
  variants: DEFAULT_VARIANTS,
}
