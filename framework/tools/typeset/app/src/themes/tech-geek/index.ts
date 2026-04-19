/**
 * tech-geek · 深色极客风
 *
 * - 深底 #12141a，低饱和青绿为主色
 * - 几何装饰（竖条、方块、点阵）
 * - 代码块与正文同色系，降低"代码块割裂感"
 */

import { buildTheme } from '../_shared/buildTheme'
import type { ThemeTokens } from '../types'
import { techGeekAssets } from './assets'
import { commonTemplates } from '../_shared/defaultTemplates'

const tokens: ThemeTokens = {
  colors: {
    primary: '#4ec9b0',
    secondary: '#56b6c2',
    accent: '#ffbf5f',
    bg: '#12141a',
    bgSoft: '#1b1f27',
    bgMuted: '#242933',
    text: '#e6e6e6',
    textMuted: '#9aa5b1',
    textInverse: '#12141a',
    border: '#2a2f3a',
    code: '#ffbf5f',
    status: {
      tip: { accent: '#4ec9b0', soft: '#18302b' },
      warning: { accent: '#f0a35b', soft: '#32271a' },
      info: { accent: '#61afef', soft: '#1a2838' },
      danger: { accent: '#e06c75', soft: '#3a1f23' },
    },
  },
  typography: {
    baseSize: 15,
    lineHeight: 1.8,
    h1Size: 24,
    h2Size: 20,
    h3Size: 17,
    letterSpacing: 0.4,
  },
  spacing: { paragraph: 18, section: 28, listItem: 8, containerPadding: 16 },
  radius: { sm: 3, md: 6, lg: 10 },
}

export const techGeekTheme = buildTheme({
  id: 'tech-geek',
  name: '极客夜行',
  description: '深色底 + 低饱和青绿几何，向终端美学致敬',
  tokens,
  assets: techGeekAssets({
    primary: tokens.colors.primary,
    accent: tokens.colors.accent,
    border: tokens.colors.border,
    tipAccent: tokens.colors.status.tip.accent,
    warningAccent: tokens.colors.status.warning.accent,
    infoAccent: tokens.colors.status.info.accent,
    dangerAccent: tokens.colors.status.danger.accent,
  }),
  elementOverrides: {
    blockquote: {
      'border-left': `3px solid ${tokens.colors.primary}`,
      'background-color': tokens.colors.bgSoft,
      color: tokens.colors.textMuted,
      'padding-top': '10px',
      'padding-right': '14px',
      'padding-bottom': '10px',
      'padding-left': '14px',
      'margin-top': '0',
      'margin-bottom': '18px',
      'border-radius': '0 4px 4px 0',
    },
    h2: {
      'font-size': '20px',
      'font-weight': '700',
      color: tokens.colors.text,
      'margin-top': '28px',
      'margin-bottom': '14px',
      'line-height': '1.4',
      'padding-bottom': '6px',
      'border-bottom': `1px dashed ${tokens.colors.border}`,
    },
    hr: {
      border: 'none',
      height: '1px',
      'background-color': tokens.colors.border,
      'margin-top': '24px',
      'margin-bottom': '24px',
    },
  },
  pre: {
    'background-color': '#1b1f27',
    color: '#e6e6e6',
    'padding-top': '14px',
    'padding-right': '16px',
    'padding-bottom': '14px',
    'padding-left': '16px',
    'border-radius': '6px',
    'border-left': `3px solid ${tokens.colors.primary}`,
    'overflow-x': 'auto',
    'white-space': 'pre',
    'max-width': '100%',
    'box-sizing': 'border-box',
    'box-shadow': 'inset -14px 0 10px -10px rgba(0,0,0,0.35)',
    'margin-top': '0',
    'margin-bottom': '20px',
    'font-size': '13px',
    'line-height': '1.6',
  },
  code: {
    'background-color': tokens.colors.bgMuted,
    color: tokens.colors.primary,
    padding: '2px 6px',
    'border-radius': '3px',
    'font-size': '14px',
  },
  inlineOverrides: {
    highlight: {
      'background-color': tokens.colors.accent,
      color: '#12141a',
      padding: '0 3px',
      'border-radius': '2px',
      'font-weight': '700',
    },
  },
  templates: {
    ...commonTemplates,
    // 主题特化：极客风常用"终端命令"开场，用 highlight 容器模拟
    cover: `::: cover 本期主题
![封面占位](https://placehold.co/1200x630?text=tech-geek)

> \`$ cat this_week.md\`  —— 给工程师读的工程随笔
:::
`,
  },
})
