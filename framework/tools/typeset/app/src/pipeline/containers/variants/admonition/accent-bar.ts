/**
 * admonition · accent-bar（v1 默认行为的 v2 对等实现）
 *
 * 视觉：左侧 3px 色条 + 浅底 + 右侧轻圆角。语义色从 tokens.colors.status[kind] 取。
 * 为什么保留：它是最克制的 admonition 骨架，对任何主题都不过火，兜底默认。
 */

import type { AdmonitionVariant } from '../registry'

export const accentBar: AdmonitionVariant = {
  id: 'accent-bar',
  kind: 'admonition',
  render: (ctx, { kind }) => {
    const pair = ctx.tokens.colors.status[kind]
    const radius = ctx.tokens.radius.sm
    const padY = Math.max(10, Math.round(ctx.tokens.spacing.containerPadding * 0.75))
    const padX = ctx.tokens.spacing.containerPadding
    return {
      wrapperCSS:
        `background-color:${pair.soft};` +
        `border-left:3px solid ${pair.accent};` +
        `padding:${padY}px ${padX}px;` +
        `border-radius:0 ${radius}px ${radius}px 0;` +
        `margin:16px 0`,
      titleCSS: `font-weight:700;color:${pair.accent};margin-bottom:6px;letter-spacing:0.3px`,
    }
  },
}
