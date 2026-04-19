/**
 * steps · number-circle（v1 默认）
 *
 * 只管 wrapper 外框 + 标题行。编号徽章 theme.assets.stepBadge(n) 由 writer 在 h3 里手工使用，
 * 或未来 DOM 后处理 pass 自动注入；variant 本身不做 h3 级联。
 */

import type { StepsVariant } from '../registry'

export const numberCircle: StepsVariant = {
  id: 'number-circle',
  kind: 'steps',
  render: (_ctx) => ({
    wrapperCSS: `margin:16px 0`,
    titleCSS: `font-weight:700;margin-bottom:12px`,
  }),
}
