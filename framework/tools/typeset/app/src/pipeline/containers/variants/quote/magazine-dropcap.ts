/**
 * quote · magazine-dropcap（杂志风格）
 *
 * 实话：CSS ::first-letter 被公众号剥离，真 dropcap 做不到。这里的 "dropcap" 指"杂志
 * 气质"——上下双粗线 + 超大斜体引号前缀 + 右对齐署名。读者识别为"杂志/评论"家族。
 *
 * 不用 italic 做 wrapper 整体（禁 font-family 之外并不禁 italic，但会影响 body 所有文字）。
 * italic 只用在 svgSlot 的装饰引号字符。
 */

import type { QuoteVariant } from '../registry'

const DROPCAP_QUOTE =
  '<span style="display:inline-block;font-size:48px;line-height:1;color:inherit;opacity:0.25;margin-right:8px;font-style:italic">&ldquo;</span>'

export const magazineDropcap: QuoteVariant = {
  id: 'magazine-dropcap',
  kind: 'quote',
  render: (ctx) => {
    const pad = ctx.tokens.spacing.containerPadding
    const accent = ctx.tokens.colors.primary
    return {
      wrapperCSS:
        `background-color:${ctx.tokens.colors.bg};` +
        `padding:${pad + 6}px ${pad + 2}px;` +
        `margin:24px 0;` +
        `border-top:3px double ${accent};` +
        `border-bottom:3px double ${accent}`,
      bodyCSS: `font-size:17px;line-height:1.85;color:${ctx.tokens.colors.text}`,
      svgSlot: DROPCAP_QUOTE,
    }
  },
}
