/**
 * admonition · ticket-notch（票根缺口家族）
 *
 * 视觉：上下 dashed 边 + 左右 dotted 边模拟"票根撕口"；标题文字带前缀"No."。
 * 为什么不用真 SVG 缺口：微信对 background-image data-URI 的双向缩放有时会糊边，
 * dashed/dotted 边是纯 CSS 且微信端 100% 稳定。配合两个圆点 SVG 在标题前后，
 * 已足以让读者识别为"票根"家族；不追求几何上真的有半圆凹陷。
 */

import type { AdmonitionVariant } from '../registry'

function dot(color: string): string {
  return (
    '<svg viewBox="0 0 8 8" width="8" height="8"' +
    ' xmlns="http://www.w3.org/2000/svg"' +
    ' style="display:inline-block;vertical-align:middle;margin:0 6px">' +
    `<circle cx="4" cy="4" r="3" fill="${color}"/></svg>`
  )
}

export const ticketNotch: AdmonitionVariant = {
  id: 'ticket-notch',
  kind: 'admonition',
  render: (ctx, { kind }) => {
    const pair = ctx.tokens.colors.status[kind]
    const pad = ctx.tokens.spacing.containerPadding
    return {
      wrapperCSS:
        `background-color:${pair.soft};` +
        `border:1px dashed ${pair.accent};` +
        `border-left:2px dotted ${pair.accent};` +
        `border-right:2px dotted ${pair.accent};` +
        `padding:${pad}px ${pad + 4}px;` +
        `margin:18px 0;` +
        `border-radius:3px`,
      titleCSS:
        `color:${pair.accent};` +
        `font-weight:700;` +
        `letter-spacing:1px;` +
        `text-transform:uppercase;` +
        `font-size:13px;` +
        `margin-bottom:8px`,
      svgSlot: `<section style="text-align:center;margin-bottom:4px">${dot(pair.accent)}${dot(pair.accent)}${dot(pair.accent)}</section>`,
    }
  },
}
