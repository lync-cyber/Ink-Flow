/**
 * sectionTitle · cornered
 *
 * 左上角装饰 SVG（theme.assets.sectionCorner）+ 标题文字，不画底线。
 * 适合想"轻装修"的主题：装饰只出现在标题行内。
 */

import type { SectionTitleVariant } from '../registry'

export const cornered: SectionTitleVariant = {
  id: 'cornered',
  kind: 'sectionTitle',
  render: (ctx) => ({
    wrapperCSS: `margin:24px 0 12px`,
    titleCSS: `font-weight:700;font-size:20px;color:${ctx.tokens.colors.text}`,
    svgSlot: ctx.assets.sectionCorner ?? '',
  }),
}
