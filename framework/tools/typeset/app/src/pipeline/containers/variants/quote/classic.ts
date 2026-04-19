/**
 * quote · classic（v1 默认）
 *
 * 视觉：浅底卡 + 大号装饰引号（theme.assets.quoteMark 或回退字符）+ 居中排布。
 * byline（ctx.info）由 container renderer 在 close 时拼 "— 作者"。
 */

import type { QuoteVariant } from '../registry'

const FALLBACK_OPEN_MARK =
  `<span style="display:inline-block;font-size:28px;line-height:1;opacity:0.35;margin-right:4px">「</span>`

export const classic: QuoteVariant = {
  id: 'classic',
  kind: 'quote',
  render: (ctx) => {
    const mark = ctx.assets.quoteMark ?? FALLBACK_OPEN_MARK
    const pad = ctx.tokens.spacing.containerPadding
    return {
      wrapperCSS:
        `background-color:${ctx.tokens.colors.bgSoft};` +
        `padding:${pad + 2}px ${pad}px;` +
        `margin:20px 0;` +
        `border-radius:8px`,
      bodyCSS: `font-size:16px;line-height:1.7;text-align:center`,
      svgSlot: mark,
    }
  },
}
