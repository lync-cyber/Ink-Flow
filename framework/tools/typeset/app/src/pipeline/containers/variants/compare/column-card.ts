/**
 * compare · column-card（v1 默认行为）
 *
 * 两栏 CSS table 等高卡片：display:table + table-cell。flex 不行、inline-block 阶梯，
 * table 是微信粘贴后唯一稳定的等高多栏。border-spacing 吸收列间隙。
 */

import type { CompareVariant } from '../registry'

const COL_FONT_SIZE = 13
const COL_INNER_PAD = 10

export const columnCard: CompareVariant = {
  id: 'column-card',
  kind: 'compare',
  render: (ctx, { slot, title }) => {
    if (slot === 'wrapper') {
      return {
        wrapperCSS:
          `display:table;width:100%;table-layout:fixed;` +
          `border-spacing:4px 0;border-collapse:separate;margin:16px 0`,
      }
    }
    const pair =
      slot === 'pros'
        ? ctx.tokens.colors.status.tip.accent
        : ctx.tokens.colors.status.danger.accent
    return {
      wrapperCSS:
        `display:table-cell;vertical-align:top;width:50%;box-sizing:border-box;` +
        `padding:${COL_INNER_PAD}px;` +
        `background-color:${ctx.tokens.colors.bgSoft};` +
        `border-radius:${ctx.tokens.radius.md}px;` +
        `font-size:${COL_FONT_SIZE}px;letter-spacing:0`,
      titleCSS:
        `font-size:${COL_FONT_SIZE + 1}px;font-weight:700;` +
        `color:${pair};margin-bottom:8px;letter-spacing:0;line-height:1.4`,
      svgSlot: undefined,
      bodyCSS: undefined,
      // title 由 renderer 读取 args.title 渲染
      ...(title ? {} : {}),
    }
  },
}
