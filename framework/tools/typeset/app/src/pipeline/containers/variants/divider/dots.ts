import type { DividerVariant } from '../registry'

const FALLBACK =
  '<svg viewBox="0 0 120 8" width="120" height="8" xmlns="http://www.w3.org/2000/svg">' +
  [20, 40, 60, 80, 100].map((cx) => `<circle cx="${cx}" cy="4" r="2" fill="#c0c6cf"/>`).join('') +
  '</svg>'

export const dots: DividerVariant = {
  id: 'dots',
  kind: 'divider',
  render: (ctx) => ({
    wrapperCSS: `text-align:center;margin:24px 0`,
    svgSlot: ctx.assets.dividerDots ?? FALLBACK,
  }),
}
