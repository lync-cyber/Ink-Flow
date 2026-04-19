/**
 * literary-humanism · 文艺人文
 *
 * - 米白底 #f5f1e8，大字距 + 书卷感装饰
 * - 引号用西文大号双引号；分割用花纹；代码块低调浅色
 */

import { buildTheme } from '../_shared/buildTheme'
import type { ThemeTokens } from '../types'
import { literaryHumanismAssets } from './assets'
import { commonTemplates } from '../_shared/defaultTemplates'

const tokens: ThemeTokens = {
  colors: {
    primary: '#7a5c3a',
    secondary: '#3c4e3a',
    accent: '#a94633',
    bg: '#f5f1e8',
    bgSoft: '#ede6d4',
    bgMuted: '#e3d9bf',
    text: '#2b261c',
    textMuted: '#6a604c',
    textInverse: '#f5f1e8',
    border: '#d7ccb2',
    code: '#a94633',
    status: {
      tip: { accent: '#5c7148', soft: '#e6ebdb' },
      warning: { accent: '#a07032', soft: '#f1e5ce' },
      info: { accent: '#4d6880', soft: '#e4ebf1' },
      danger: { accent: '#9b4532', soft: '#efdbd4' },
    },
  },
  typography: {
    baseSize: 16,
    lineHeight: 2.0,
    h1Size: 25,
    h2Size: 20,
    h3Size: 17,
    letterSpacing: 1.0,
  },
  spacing: { paragraph: 22, section: 34, listItem: 12, containerPadding: 18 },
  radius: { sm: 2, md: 4, lg: 8 },
}

export const literaryHumanismTheme = buildTheme({
  id: 'literary-humanism',
  name: '人文札记',
  description: '米白底 + 大字距，给散文、书评、长评留足呼吸',
  tokens,
  assets: literaryHumanismAssets({
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
      'font-weight': '700',
      color: tokens.colors.text,
      'margin-top': '30px',
      'margin-bottom': '18px',
      'line-height': '1.5',
      'letter-spacing': '2px',
      'text-align': 'center',
    },
    h2: {
      'font-size': '20px',
      'font-weight': '700',
      color: tokens.colors.text,
      'margin-top': '32px',
      'margin-bottom': '14px',
      'line-height': '1.6',
      'letter-spacing': '1.5px',
      'padding-bottom': '8px',
      'border-bottom': `1px solid ${tokens.colors.border}`,
    },
    p: {
      'font-size': '16px',
      'line-height': '2.0',
      color: tokens.colors.text,
      'margin-top': '0',
      'margin-bottom': '22px',
      'letter-spacing': '1px',
    },
    blockquote: {
      'border-left': `3px double ${tokens.colors.primary}`,
      'background-color': 'transparent',
      color: tokens.colors.textMuted,
      'padding-top': '12px',
      'padding-right': '18px',
      'padding-bottom': '12px',
      'padding-left': '22px',
      'margin-top': '0',
      'margin-bottom': '22px',
      'font-style': 'italic',
    },
  },
  pre: {
    'background-color': tokens.colors.bgSoft,
    color: tokens.colors.text,
    'padding-top': '14px',
    'padding-right': '16px',
    'padding-bottom': '14px',
    'padding-left': '16px',
    'border-radius': '4px',
    border: `1px solid ${tokens.colors.border}`,
    'overflow-x': 'auto',
    'white-space': 'pre',
    'max-width': '100%',
    'box-sizing': 'border-box',
    'box-shadow': 'inset -14px 0 10px -10px rgba(0,0,0,0.15)',
    'margin-top': '0',
    'margin-bottom': '22px',
    'font-size': '13px',
    'line-height': '1.7',
  },
  code: {
    'background-color': tokens.colors.bgMuted,
    color: tokens.colors.accent,
    padding: '2px 6px',
    'border-radius': '2px',
    'font-size': '14px',
  },
  containerOverrides: {
    quoteCard: {
      'background-color': tokens.colors.bgSoft,
      padding: '24px 20px',
      margin: '24px 0',
      'border-radius': '2px',
      border: `1px solid ${tokens.colors.border}`,
    },
  },
  templates: {
    ...commonTemplates,
    cover: `::: cover 卷首语
![封面占位](https://placehold.co/1200x630?text=humanism)

_写于春分后第二日，时雨初歇。_
:::
`,
    authorBar: `::: author 钟山 role=主笔
长读深耕，短评不妄。
:::
`,
  },
})
