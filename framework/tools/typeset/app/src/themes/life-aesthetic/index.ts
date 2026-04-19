/**
 * life-aesthetic · 生活美学
 *
 * - 暖米底 #faf6f0，暖橙为主色
 * - 圆角柔和、波浪分割、大号引号 SVG
 * - 代码块改成浅色，与整体"慢生活"色调统一
 */

import { buildTheme } from '../_shared/buildTheme'
import type { ThemeTokens } from '../types'
import { lifeAestheticAssets } from './assets'
import { commonTemplates } from '../_shared/defaultTemplates'

const tokens: ThemeTokens = {
  colors: {
    primary: '#d98141',
    secondary: '#b96234',
    accent: '#efb758',
    bg: '#faf6f0',
    bgSoft: '#f2ead8',
    bgMuted: '#eadfc7',
    text: '#3a2d20',
    textMuted: '#7a6a58',
    textInverse: '#faf6f0',
    border: '#e0d1ba',
    code: '#b96234',
    status: {
      tip: { accent: '#7ba05b', soft: '#eef3e4' },
      warning: { accent: '#c88e3b', soft: '#fcf1dc' },
      info: { accent: '#5b88a8', soft: '#e6edf3' },
      danger: { accent: '#c05a4e', soft: '#f8e1dc' },
    },
  },
  typography: {
    baseSize: 15,
    lineHeight: 1.9,
    h1Size: 24,
    h2Size: 20,
    h3Size: 17,
    letterSpacing: 0.6,
  },
  spacing: { paragraph: 20, section: 32, listItem: 10, containerPadding: 18 },
  radius: { sm: 6, md: 12, lg: 18 },
}

export const lifeAestheticTheme = buildTheme({
  id: 'life-aesthetic',
  name: '慢生活',
  description: '暖米底 + 圆角柔和，写写饮食、旅行与长日',
  tokens,
  assets: lifeAestheticAssets({
    primary: tokens.colors.primary,
    secondary: tokens.colors.secondary,
    accent: tokens.colors.accent,
    border: tokens.colors.border,
    tipAccent: tokens.colors.status.tip.accent,
    warningAccent: tokens.colors.status.warning.accent,
    infoAccent: tokens.colors.status.info.accent,
    dangerAccent: tokens.colors.status.danger.accent,
  }),
  elementOverrides: {
    h2: {
      'font-size': '20px',
      'font-weight': '700',
      color: tokens.colors.text,
      'margin-top': '30px',
      'margin-bottom': '14px',
      'line-height': '1.5',
      'padding-bottom': '6px',
      'border-bottom': `2px dotted ${tokens.colors.primary}`,
    },
    blockquote: {
      'border-left': `4px solid ${tokens.colors.primary}`,
      'background-color': tokens.colors.bgSoft,
      color: tokens.colors.textMuted,
      'padding-top': '14px',
      'padding-right': '18px',
      'padding-bottom': '14px',
      'padding-left': '18px',
      'margin-top': '0',
      'margin-bottom': '20px',
      'border-radius': '12px',
      'font-style': 'italic',
    },
  },
  pre: {
    'background-color': '#fffaef',
    color: '#3a2d20',
    'padding-top': '14px',
    'padding-right': '16px',
    'padding-bottom': '14px',
    'padding-left': '16px',
    'border-radius': '10px',
    border: `1px solid ${tokens.colors.border}`,
    'overflow-x': 'auto',
    'white-space': 'pre',
    'max-width': '100%',
    'box-sizing': 'border-box',
    'box-shadow': 'inset -14px 0 10px -10px rgba(90,60,30,0.18)',
    'margin-top': '0',
    'margin-bottom': '20px',
    'font-size': '13px',
    'line-height': '1.7',
  },
  code: {
    'background-color': '#f3e4cc',
    color: tokens.colors.secondary,
    padding: '2px 6px',
    'border-radius': '4px',
    'font-size': '14px',
  },
  containerOverrides: {
    quoteCard: {
      'background-color': '#fffaf1',
      padding: '22px 20px',
      margin: '22px 0',
      'border-radius': '14px',
      border: `1px dashed ${tokens.colors.border}`,
    },
  },
  templates: {
    ...commonTemplates,
    cover: `::: cover 本期主题
![封面占位](https://placehold.co/1200x630?text=life)

_一盏茶、一扇窗、一些可以慢下来的小事。_
:::
`,
    authorBar: `::: author 如初 role=生活作者
写于一个有风的下午。

记录日常、饭桌与缓慢的季节。
:::
`,
  },
})
