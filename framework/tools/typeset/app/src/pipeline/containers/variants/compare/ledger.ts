/**
 * compare · ledger（账本双色列）
 *
 * 外框一整块圆角矩形，中间 1px 竖线分隔；左右两列各用 tip.soft / danger.soft 垫底，
 * 像老账本的"收入 / 支出"对账。保留 column-card 的 display:table 骨架，仅底色和边框不同。
 */

import type { CompareVariant } from '../registry'

const COL_FONT_SIZE = 13

export const ledger: CompareVariant = {
  id: 'ledger',
  kind: 'compare',
  render: (ctx, { slot }) => {
    if (slot === 'wrapper') {
      return {
        wrapperCSS:
          `display:table;width:100%;table-layout:fixed;border-spacing:0;border-collapse:separate;` +
          `margin:16px 0;border:1px solid ${ctx.tokens.colors.border};border-radius:6px`,
      }
    }
    const pair =
      slot === 'pros' ? ctx.tokens.colors.status.tip : ctx.tokens.colors.status.danger
    const borderRight = slot === 'pros' ? `border-right:1px solid ${ctx.tokens.colors.border}` : 'border-right:0'
    const radius = slot === 'pros' ? `border-radius:5px 0 0 5px` : `border-radius:0 5px 5px 0`
    return {
      wrapperCSS:
        `display:table-cell;vertical-align:top;width:50%;box-sizing:border-box;` +
        `padding:12px;background-color:${pair.soft};${borderRight};${radius};` +
        `font-size:${COL_FONT_SIZE}px;letter-spacing:0`,
      titleCSS: `font-weight:700;color:${pair.accent};margin-bottom:6px;font-size:${COL_FONT_SIZE + 1}px`,
    }
  },
}
