/**
 * divider 容器
 *
 * v2 变更：5 种 variant（wave / dots / flower / rule / glyph）。
 * 解析优先级：attrs.variant（markdown 里写 `::: divider variant=glyph`）> ctx.variants.divider > 'rule'。
 * 兼容 v1 的 'line' 别名（映射到 'rule'）。
 */

import type { DividerVariantId } from '../../themes/types'
import type { ContainerRenderer, ContainerRenderContext } from './types'
import { DIVIDER_VARIANTS } from './variants'

function resolveVariantId(ctx: ContainerRenderContext): DividerVariantId {
  const raw = (ctx.attrs.variant ?? '').toLowerCase().trim()
  if (raw === 'line') return 'rule'
  if (raw && raw in DIVIDER_VARIANTS) return raw as DividerVariantId
  return ctx.variants.divider ?? 'rule'
}

export const dividerContainer: ContainerRenderer = {
  open: (ctx) => {
    const id = resolveVariantId(ctx)
    const result = DIVIDER_VARIANTS[id].render(ctx)
    const slot = result.svgSlot ?? ''
    return `<section class="container-divider container-divider--${id}" style="${result.wrapperCSS}">\n${slot}\n`
  },
  close: '</section>\n',
}
