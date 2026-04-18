/**
 * 默认主题 · 中性白底
 * Step 1 只实现 tokens + elements + inline，容器 CSS 占位空对象；
 * 完整容器样式与 SVG 资产在 Step 5 补齐。
 */

import type { Theme, CSSObject } from '../types'

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

const empty: CSSObject = {}

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

const containers = {
  intro: empty,
  author: empty,
  cover: empty,
  tip: empty,
  warning: empty,
  info: empty,
  danger: empty,
  quoteCard: empty,
  highlight: empty,
  compare: empty,
  steps: empty,
  sectionTitle: empty,
  footerCTA: empty,
  recommend: empty,
  qrcode: empty,
}

export const defaultTheme: Theme = {
  id: 'default',
  name: '默认主题',
  description: '中性白底，Step 1 端到端验证用',
  author: 'InkFlow',
  preview: '',
  tokens,
  elements,
  containers,
  assets: {},
  templates: {},
  inline,
}
