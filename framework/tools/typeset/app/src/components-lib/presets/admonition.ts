/**
 * admonition 预设：6 个 variant × 每 variant ≥2 预设 = 12 条。
 * 每条对不同 kind（tip/warning/info/danger）+ 不同 variant 产出一段 fence。
 */

import type { ComponentEntry } from '../types'
import { thumb } from '../thumbnail'

export const admonitionPresets: ComponentEntry[] = [
  // ───── accent-bar（默认左条）
  {
    id: 'ad-tip-accent-bar',
    name: '左条 Tip',
    description: '左 3px 色条 + 浅底，最克制',
    kind: 'admonition',
    variantId: 'accent-bar',
    markdownSnippet:
      '::: tip 小贴士 variant=accent-bar\n正文内容\n:::\n',
    thumbnailSvg: thumb.accentBar({ accent: '#1a8450', soft: '#eef7f0' }),
  },
  {
    id: 'ad-warning-accent-bar',
    name: '左条 Warning',
    description: '提示读者谨慎的克制骨架',
    kind: 'admonition',
    variantId: 'accent-bar',
    markdownSnippet:
      '::: warning 注意 variant=accent-bar\n正文内容\n:::\n',
    thumbnailSvg: thumb.accentBar({ accent: '#b7791f', soft: '#fdf6e3' }),
  },

  // ───── pill-tag（顶标签悬浮）
  {
    id: 'ad-tip-pill-tag',
    name: '悬浮胶囊 Tip',
    description: '顶部胶囊标签，文字有视觉重心',
    kind: 'admonition',
    variantId: 'pill-tag',
    markdownSnippet:
      '::: tip 核心提示 variant=pill-tag\n正文内容\n:::\n',
    thumbnailSvg: thumb.pillTag({ accent: '#1a8450', soft: '#eef7f0' }),
  },
  {
    id: 'ad-info-pill-tag',
    name: '悬浮胶囊 Info',
    description: '浅底 + 深色描边，告示板感',
    kind: 'admonition',
    variantId: 'pill-tag',
    markdownSnippet:
      '::: info 背景说明 variant=pill-tag\n正文内容\n:::\n',
    thumbnailSvg: thumb.pillTag({ accent: '#1a73e8', soft: '#eef4ff' }),
  },

  // ───── ticket-notch（票根）
  {
    id: 'ad-warning-ticket-notch',
    name: '票根 Warning',
    description: '虚线撕口 + 三圆点，票据质感',
    kind: 'admonition',
    variantId: 'ticket-notch',
    markdownSnippet:
      '::: warning 注意事项 variant=ticket-notch\n正文内容\n:::\n',
    thumbnailSvg: thumb.ticketNotch({ accent: '#b7791f', soft: '#fdf6e3' }),
  },
  {
    id: 'ad-danger-ticket-notch',
    name: '票根 Danger',
    description: '强警示场景的票据式呈现',
    kind: 'admonition',
    variantId: 'ticket-notch',
    markdownSnippet:
      '::: danger 警告 variant=ticket-notch\n正文内容\n:::\n',
    thumbnailSvg: thumb.ticketNotch({ accent: '#b42318', soft: '#fdecea' }),
  },

  // ───── card-shadow（悬浮卡片）
  {
    id: 'ad-info-card-shadow',
    name: '悬浮卡 Info',
    description: '白底 + 顶部色条 + 柔阴影',
    kind: 'admonition',
    variantId: 'card-shadow',
    markdownSnippet:
      '::: info 提示 variant=card-shadow\n正文内容\n:::\n',
    thumbnailSvg: thumb.cardShadow({ accent: '#1a73e8' }),
  },
  {
    id: 'ad-tip-card-shadow',
    name: '悬浮卡 Tip',
    description: '卡片化，适合重点提示',
    kind: 'admonition',
    variantId: 'card-shadow',
    markdownSnippet:
      '::: tip 核心观点 variant=card-shadow\n正文内容\n:::\n',
    thumbnailSvg: thumb.cardShadow({ accent: '#1a8450' }),
  },

  // ───── minimal-underline（极简）
  {
    id: 'ad-tip-minimal',
    name: '极简 Tip',
    description: '无底色，仅标题下划线，省视觉预算',
    kind: 'admonition',
    variantId: 'minimal-underline',
    markdownSnippet:
      '::: tip 小提醒 variant=minimal-underline\n正文内容\n:::\n',
    thumbnailSvg: thumb.minimalUnderline({ accent: '#1a8450' }),
  },
  {
    id: 'ad-info-minimal',
    name: '极简 Info',
    description: '配合大量提示密集使用',
    kind: 'admonition',
    variantId: 'minimal-underline',
    markdownSnippet:
      '::: info 说明 variant=minimal-underline\n正文内容\n:::\n',
    thumbnailSvg: thumb.minimalUnderline({ accent: '#1a73e8' }),
  },

  // ───── terminal（终端窗口）
  {
    id: 'ad-tip-terminal',
    name: '终端 Tip',
    description: '黑底 + 三色圆点，代码讲解专用',
    kind: 'admonition',
    variantId: 'terminal',
    themeCompat: ['tech-geek', 'default'],
    markdownSnippet:
      '::: tip $ 执行这行 variant=terminal\n内容会渲染成终端风格\n:::\n',
    thumbnailSvg: thumb.terminal(),
  },
  {
    id: 'ad-info-terminal',
    name: '终端 Info',
    description: '命令日志类信息',
    kind: 'admonition',
    variantId: 'terminal',
    themeCompat: ['tech-geek'],
    markdownSnippet:
      '::: info $ deploy.sh variant=terminal\n2026-04-19 success\n:::\n',
    thumbnailSvg: thumb.terminal(),
  },
]
