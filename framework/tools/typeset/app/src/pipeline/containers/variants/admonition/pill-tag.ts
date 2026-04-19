/**
 * admonition · pill-tag
 *
 * 视觉：外框四边 1px accent + 浅底；标题以 inline-block 胶囊形式悬在顶边（负 margin-top）。
 * 为什么不是 position:absolute：公众号剥离 absolute，只能靠 margin 负值制造"悬出"。
 * section { display:inline-block } 粘贴后稳定；胶囊背景用 accent 色 + 反白字。
 */

import type { AdmonitionVariant } from '../registry'

export const pillTag: AdmonitionVariant = {
  id: 'pill-tag',
  kind: 'admonition',
  render: (ctx, { kind }) => {
    const pair = ctx.tokens.colors.status[kind]
    const padY = ctx.tokens.spacing.containerPadding
    const padX = ctx.tokens.spacing.containerPadding
    return {
      wrapperCSS:
        `background-color:${pair.soft};` +
        `border:1px solid ${pair.accent};` +
        `padding:${padY + 8}px ${padX}px ${padY}px;` +
        `border-radius:6px;` +
        `margin:24px 0 16px`,
      titleCSS:
        `display:inline-block;` +
        `padding:3px 12px;` +
        `background-color:${pair.accent};` +
        `color:${ctx.tokens.colors.textInverse};` +
        `border-radius:12px;` +
        `font-size:13px;` +
        `font-weight:700;` +
        `margin-top:-${padY + 18}px;` +
        `margin-bottom:10px;` +
        `letter-spacing:0.4px`,
    }
  },
}
