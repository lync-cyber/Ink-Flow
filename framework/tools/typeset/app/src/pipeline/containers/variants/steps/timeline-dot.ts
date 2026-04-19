/**
 * steps · timeline-dot
 *
 * 视觉：wrapper 左侧用 2px 点线，标题前插一个主色小圆点（inline SVG），"时间轴"感。
 * 点线样式 border-left:2px dotted 在公众号稳定；真正的"连线+圆点"用 inline SVG 最可靠。
 */

import type { StepsVariant } from '../registry'

export const timelineDot: StepsVariant = {
  id: 'timeline-dot',
  kind: 'steps',
  render: (ctx) => {
    const dot =
      '<svg viewBox="0 0 10 10" width="10" height="10"' +
      ' xmlns="http://www.w3.org/2000/svg"' +
      ' style="display:inline-block;vertical-align:middle;margin-right:8px;margin-left:-16px">' +
      `<circle cx="5" cy="5" r="4" fill="${ctx.tokens.colors.primary}"/></svg>`
    return {
      wrapperCSS:
        `margin:18px 0;padding:4px 0 4px 20px;` +
        `border-left:2px dotted ${ctx.tokens.colors.primary}`,
      titleCSS: `font-weight:700;color:${ctx.tokens.colors.primary};margin-bottom:10px`,
      svgSlot: dot,
    }
  },
}
