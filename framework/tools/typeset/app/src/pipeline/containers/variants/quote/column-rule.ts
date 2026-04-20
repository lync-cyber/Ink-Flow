/**
 * quote · column-rule
 *
 * 视觉：左右两侧各一根 3px 主色竖线夹住段落，无底色；正文居中、气息开阔。
 * 适合文学/人文主题；极简且辨识度高（不是典型 admonition 左条）。
 */

import type { QuoteVariant } from '../registry'

export const columnRule: QuoteVariant = {
  id: 'column-rule',
  kind: 'quote',
  render: (ctx) => {
    const accent = ctx.tokens.colors.primary
    return {
      wrapperCSS:
        `padding:18px 28px;` +
        `margin:22px 12px;` +
        `border-left:3px solid ${accent};` +
        `border-right:3px solid ${accent}`,
      bodyCSS: `font-size:16px;line-height:1.85;text-align:center;color:${ctx.tokens.colors.text}`,
    }
  },
}
