/**
 * steps 容器
 *
 * v2 变更：走 variant registry（number-circle / ribbon-chain / timeline-dot）。
 * variant 只管 wrapper + 标题行样式；内部 h3 仍由用户自行编号或由主题 assets.stepBadge(n)
 * 在 writer 阶段注入。renderer 不做 h3 级联。
 */

import type { StepsVariantId } from '../../themes/types'
import type { ContainerRenderer, ContainerRenderContext } from './types'
import { escText } from './types'
import { STEPS_VARIANTS } from './variants'

function resolveVariantId(ctx: ContainerRenderContext): StepsVariantId {
  const override = ctx.attrs.variant
  if (override && override in STEPS_VARIANTS) {
    return override as StepsVariantId
  }
  return ctx.variants.steps ?? 'number-circle'
}

export const stepsContainer: ContainerRenderer = {
  open: (ctx) => {
    const id = resolveVariantId(ctx)
    const result = STEPS_VARIANTS[id].render(ctx)
    const title = ctx.info.trim()
    const parts: string[] = []
    parts.push(`<section class="container-steps container-steps--${id}" style="${result.wrapperCSS}">`)
    if (result.svgSlot) parts.push(result.svgSlot)
    if (title && result.titleCSS !== '') {
      const ts = result.titleCSS ?? 'font-weight:700;margin-bottom:12px'
      parts.push(`<section class="container-steps__title" style="${ts}">${escText(title)}</section>`)
    }
    return parts.join('\n') + '\n'
  },
  close: '</section>\n',
}
