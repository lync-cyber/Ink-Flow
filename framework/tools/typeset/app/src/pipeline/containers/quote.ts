/**
 * quote-card / highlight 容器
 *
 * v2 变更：quote-card 走 variant registry（classic / magazine-dropcap / column-rule / frame-brackets）。
 * highlight 保持 v1 行为（简单高亮块，无骨架切换需求）。
 *
 * byline（ctx.info）作为署名，在 close 时用 textMuted 色加一行"— 作者"。
 * 所有 variant 共享这个收尾逻辑，避免每个 variant 重写。
 */

import type { QuoteVariantId } from '../../themes/types'
import type { ContainerRenderer, ContainerRenderContext } from './types'
import { escText } from './types'
import { QUOTE_VARIANTS } from './variants'

function resolveVariantId(ctx: ContainerRenderContext): QuoteVariantId {
  const override = ctx.attrs.variant
  if (override && override in QUOTE_VARIANTS) {
    return override as QuoteVariantId
  }
  return ctx.variants.quote ?? 'classic'
}

export const quoteCardContainer: ContainerRenderer = {
  open: (ctx) => {
    const id = resolveVariantId(ctx)
    const result = QUOTE_VARIANTS[id].render(ctx)
    const parts: string[] = []
    parts.push(`<section class="container-quote-card container-quote-card--${id}" style="${result.wrapperCSS}">`)
    if (result.svgSlot) parts.push(result.svgSlot)
    parts.push(`<section class="container-quote-card__body" style="${result.bodyCSS ?? ''}">`)
    return parts.join('\n') + '\n'
  },
  close: (ctx) => {
    const byline = ctx.info.trim()
    const sig = byline
      ? `<section class="container-quote-card__byline" style="text-align:center;color:${ctx.tokens.colors.textMuted};margin-top:10px;font-size:13px">— ${escText(byline)}</section>`
      : ''
    return `</section>\n${sig}</section>\n`
  },
}

export const highlightContainer: ContainerRenderer = {
  open: () => `<section class="container-highlight">\n`,
  close: '</section>\n',
}
