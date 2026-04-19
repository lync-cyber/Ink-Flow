import type { DividerVariant } from '../registry'

const FALLBACK =
  '<svg viewBox="0 0 120 16" width="120" height="16" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M0,8 L50,8" stroke="#c0c6cf" stroke-width="1"/>' +
  '<path d="M70,8 L120,8" stroke="#c0c6cf" stroke-width="1"/>' +
  '<path d="M60,2 L63,8 L60,14 L57,8 Z" fill="#c0c6cf"/>' +
  '</svg>'

export const flower: DividerVariant = {
  id: 'flower',
  kind: 'divider',
  render: (ctx) => ({
    wrapperCSS: `text-align:center;margin:24px 0`,
    svgSlot: ctx.assets.dividerFlower ?? FALLBACK,
  }),
}
