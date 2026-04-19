/**
 * sectionTitle · bordered（v1 默认）
 *
 * 下方一道 2px 主色线；最克制的小节大标题。
 */

import type { SectionTitleVariant } from '../registry'

export const bordered: SectionTitleVariant = {
  id: 'bordered',
  kind: 'sectionTitle',
  render: (ctx) => ({
    wrapperCSS:
      `margin:24px 0 12px;padding-bottom:6px;` +
      `border-bottom:2px solid ${ctx.tokens.colors.primary}`,
    titleCSS: `font-weight:700;font-size:20px;color:${ctx.tokens.colors.text}`,
    // 主题若声明了 sectionCorner SVG，也在 bordered 下显示（保持 v1 视觉对齐：
    // v1 总是拼 corner + 标题，不区分 variant；cornered variant 是"去掉底线只留角饰"的克制变种）
    svgSlot: ctx.assets.sectionCorner ?? undefined,
  }),
}
