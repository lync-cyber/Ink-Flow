/**
 * divider · wave（波浪线）
 *
 * 优先用主题自带 assets.dividerWave；未提供时回退到单色几何波浪。
 */

import type { DividerVariant } from '../registry'

const FALLBACK =
  '<svg viewBox="0 0 120 12" width="120" height="12" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M0,6 Q15,0 30,6 T60,6 T90,6 T120,6" fill="none" stroke="#c0c6cf" stroke-width="1.5"/>' +
  '</svg>'

export const wave: DividerVariant = {
  id: 'wave',
  kind: 'divider',
  render: (ctx) => ({
    wrapperCSS: `text-align:center;margin:24px 0`,
    svgSlot: ctx.assets.dividerWave ?? FALLBACK,
  }),
}
