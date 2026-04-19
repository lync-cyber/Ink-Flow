/**
 * compare / pros / cons 容器
 *
 * v2 变更：wrapper 与列都走 variant registry。三个容器（compare / pros / cons）
 * 通过 slot 参数共享同一套 variant 模块：
 *   - compare → slot:'wrapper' → 外壳样式
 *   - pros    → slot:'pros'    → 左/上列样式
 *   - cons    → slot:'cons'    → 右/下列样式
 *
 * column-card：display:table 等高两栏（v1 行为）
 * stacked-row：上下堆叠（小屏友好）
 * ledger：账本双色（tip.soft / danger.soft 底）
 *
 * 所有 variant 都避开 flex，改用 table / block + margin 组合——公众号粘贴后稳定。
 */

import type { CompareVariantId } from '../../themes/types'
import type { ContainerRenderer, ContainerRenderContext } from './types'
import { COMPARE_VARIANTS } from './variants'

function resolveVariantId(ctx: ContainerRenderContext): CompareVariantId {
  const override = ctx.attrs.variant
  if (override && override in COMPARE_VARIANTS) {
    return override as CompareVariantId
  }
  return ctx.variants.compare ?? 'column-card'
}

export const compareContainer: ContainerRenderer = {
  open: (ctx) => {
    const id = resolveVariantId(ctx)
    const result = COMPARE_VARIANTS[id].render(ctx, { slot: 'wrapper' })
    return `<section class="container-compare container-compare--${id}" style="${result.wrapperCSS}">\n`
  },
  close: '</section>\n',
}

function makeColumn(slot: 'pros' | 'cons', defaultTitle: string): ContainerRenderer {
  return {
    open: (ctx) => {
      const id = resolveVariantId(ctx)
      const result = COMPARE_VARIANTS[id].render(ctx, { slot })
      const title = ctx.info.trim() || defaultTitle
      const parts: string[] = []
      parts.push(`<section class="container-${slot} container-${slot}--${id}" style="${result.wrapperCSS}">`)
      if (result.svgSlot) parts.push(result.svgSlot)
      if (result.titleCSS !== '') {
        const titleStyle = result.titleCSS ?? 'font-weight:700;margin-bottom:6px'
        parts.push(`<section class="container-${slot}__title" style="${titleStyle}">${escapeInner(title)}</section>`)
      }
      return parts.join('\n') + '\n'
    },
    close: '</section>\n',
  }
}

export const prosContainer = makeColumn('pros', '优点')
export const consContainer = makeColumn('cons', '缺点')

function escapeInner(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
