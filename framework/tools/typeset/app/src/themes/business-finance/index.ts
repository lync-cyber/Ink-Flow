/**
 * business-finance · 商业财经
 *
 * - 纯白底，深红主色 + 深海蓝辅色，克制锐利
 * - 方形序号徽章、K 线风分割、对比框带左右色带
 */

import { buildTheme } from '../_shared/buildTheme'
import type { ThemeTokens } from '../types'
import { businessFinanceAssets } from './assets'
import { commonTemplates } from '../_shared/defaultTemplates'

const tokens: ThemeTokens = {
  colors: {
    primary: '#b1252b',
    secondary: '#0f3a5b',
    accent: '#d4a23c',
    bg: '#ffffff',
    bgSoft: '#f4f6f9',
    bgMuted: '#e8ecf2',
    text: '#161d26',
    textMuted: '#5c6573',
    textInverse: '#ffffff',
    border: '#d7dce3',
    code: '#b1252b',
    status: {
      tip: { accent: '#0f3a5b', soft: '#e8eff5' },
      warning: { accent: '#b1700e', soft: '#faf0dc' },
      info: { accent: '#365d7d', soft: '#eaf1f7' },
      danger: { accent: '#a01c22', soft: '#f8e4e5' },
    },
  },
  typography: {
    baseSize: 15,
    lineHeight: 1.75,
    h1Size: 25,
    h2Size: 21,
    h3Size: 17,
    letterSpacing: 0.3,
  },
  spacing: { paragraph: 16, section: 26, listItem: 6, containerPadding: 14 },
  radius: { sm: 2, md: 4, lg: 6 },
}

export const businessFinanceTheme = buildTheme({
  id: 'business-finance',
  name: '硬核财经',
  description: '纯白 + 深红深蓝，报告感强，数字与判断优先',
  tokens,
  assets: businessFinanceAssets({
    primary: tokens.colors.primary,
    secondary: tokens.colors.secondary,
    accent: tokens.colors.accent,
    border: tokens.colors.border,
    textInverse: tokens.colors.textInverse,
    tipAccent: tokens.colors.status.tip.accent,
    warningAccent: tokens.colors.status.warning.accent,
    infoAccent: tokens.colors.status.info.accent,
    dangerAccent: tokens.colors.status.danger.accent,
  }),
  elementOverrides: {
    h1: {
      'font-size': '25px',
      'font-weight': '800',
      color: tokens.colors.text,
      'margin-top': '28px',
      'margin-bottom': '16px',
      'line-height': '1.35',
      'letter-spacing': '0.5px',
    },
    h2: {
      'font-size': '21px',
      'font-weight': '800',
      color: tokens.colors.text,
      'margin-top': '28px',
      'margin-bottom': '12px',
      'line-height': '1.4',
      'padding-left': '10px',
      'border-left': `5px solid ${tokens.colors.primary}`,
    },
    blockquote: {
      'border-left': `4px solid ${tokens.colors.secondary}`,
      'background-color': tokens.colors.bgSoft,
      color: tokens.colors.text,
      'padding-top': '10px',
      'padding-right': '14px',
      'padding-bottom': '10px',
      'padding-left': '14px',
      'margin-top': '0',
      'margin-bottom': '16px',
      'border-radius': '2px',
    },
    strong: { 'font-weight': '800', color: tokens.colors.primary },
  },
  pre: {
    'background-color': '#1b222c',
    color: '#e8ecf2',
    'padding-top': '14px',
    'padding-right': '16px',
    'padding-bottom': '14px',
    'padding-left': '16px',
    'border-radius': '2px',
    'overflow-x': 'auto',
    'white-space': 'pre',
    'max-width': '100%',
    'box-sizing': 'border-box',
    'box-shadow': 'inset -14px 0 10px -10px rgba(0,0,0,0.35)',
    'margin-top': '0',
    'margin-bottom': '18px',
    'font-size': '13px',
    'line-height': '1.6',
  },
  code: {
    'background-color': tokens.colors.bgMuted,
    color: tokens.colors.primary,
    padding: '2px 6px',
    'border-radius': '2px',
    'font-size': '14px',
  },
  inlineOverrides: {
    highlight: {
      'background-color': tokens.colors.accent,
      color: tokens.colors.text,
      padding: '0 4px',
      'border-radius': '2px',
    },
  },
  templates: {
    ...commonTemplates,
    cover: `::: cover 本期议题
![封面占位](https://placehold.co/1200x630?text=finance)

**核心判断**：一句话讲清观点，用 <mark>数据</mark> 与 **立场** 打底。
:::
`,
    footerCTA: `::: footer-cta 关注「硬核财经」 cta=每日送你一份观察
不吹票、不带节奏，只讲值得下判断的数据。
:::
`,
  },
})
