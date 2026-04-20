/**
 * compare · stacked-row（上下堆叠）
 *
 * 375px 小屏上，两栏挤到每栏 ~120px 本就勉强。stacked-row 放弃"并列"的视觉，
 * 改为上下两卡片各占全宽，可读性显著提升。用边 color 区分 pros（tip.accent）/ cons（danger.accent）。
 */

import type { CompareVariant } from '../registry'

export const stackedRow: CompareVariant = {
  id: 'stacked-row',
  kind: 'compare',
  render: (ctx, { slot }) => {
    if (slot === 'wrapper') {
      return { wrapperCSS: `margin:16px 0` }
    }
    const pair =
      slot === 'pros' ? ctx.tokens.colors.status.tip : ctx.tokens.colors.status.danger
    return {
      wrapperCSS:
        `display:block;padding:12px 14px;margin-bottom:8px;` +
        `background-color:${pair.soft};` +
        `border-left:3px solid ${pair.accent};` +
        `border-radius:0 4px 4px 0`,
      titleCSS:
        `font-weight:700;color:${pair.accent};margin-bottom:6px;font-size:14px`,
    }
  },
}
