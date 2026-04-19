/**
 * divider · rule（纯 hr，最克制）
 *
 * 对应 v1 'line' 行为。wrapper 自带 margin，svgSlot 用 inline hr 避免块级 hr 的多余上下 margin。
 */

import type { DividerVariant } from '../registry'

export const rule: DividerVariant = {
  id: 'rule',
  kind: 'divider',
  render: (ctx) => ({
    wrapperCSS: `margin:24px 0`,
    svgSlot: `<hr style="border:none;height:1px;background-color:${ctx.tokens.colors.border};margin:0"/>`,
  }),
}
