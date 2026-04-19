/**
 * admonition · card-shadow
 *
 * 视觉：纯白底 + 圆角 + 单层柔和阴影 + 顶部 2px accent 色条。
 * 不用 border-left，改 border-top —— 悬浮感更像"卡片漂起"而非"档案栏"。
 * box-shadow 单层 rgba alpha ≤ 0.08，符合宪章"最多单层柔阴影"。
 */

import type { AdmonitionVariant } from '../registry'

export const cardShadow: AdmonitionVariant = {
  id: 'card-shadow',
  kind: 'admonition',
  render: (ctx, { kind }) => {
    const pair = ctx.tokens.colors.status[kind]
    const pad = ctx.tokens.spacing.containerPadding
    return {
      wrapperCSS:
        `background-color:${ctx.tokens.colors.bg};` +
        `border-top:2px solid ${pair.accent};` +
        `padding:${pad}px;` +
        `margin:18px 0;` +
        `border-radius:8px;` +
        `box-shadow:0 2px 10px rgba(0,0,0,0.06)`,
      titleCSS: `font-weight:700;color:${pair.accent};margin-bottom:8px;font-size:15px`,
    }
  },
}
