/**
 * quote · frame-brackets（四角 L 形装饰框）
 *
 * 视觉：四个角用 SVG 画 L 形短角，中间完全留白，正文居中。
 * 实现：svgSlot 放一个全宽 SVG 作为视觉兜底；wrapper 只管间距，不画任何边。
 * 注意：SVG 不用 id，viewBox 等比缩放；颜色走 currentColor 以便主色切换。
 */

import type { QuoteVariant } from '../registry'

function bracketsSvg(accent: string): string {
  return (
    '<svg viewBox="0 0 320 120" width="100%" height="120"' +
    ' xmlns="http://www.w3.org/2000/svg"' +
    ' preserveAspectRatio="none"' +
    ' style="display:block;margin-bottom:-120px">' +
    // 四个 L 形角，短边 20px，描边 2px
    `<path d="M0,20 L0,0 L20,0 M300,0 L320,0 L320,20 M0,100 L0,120 L20,120 M300,120 L320,120 L320,100" stroke="${accent}" stroke-width="2" fill="none"/>` +
    '</svg>'
  )
}

export const frameBrackets: QuoteVariant = {
  id: 'frame-brackets',
  kind: 'quote',
  render: (ctx) => {
    return {
      wrapperCSS: `padding:26px 22px;margin:22px 0`,
      bodyCSS: `font-size:16px;line-height:1.85;text-align:center;color:${ctx.tokens.colors.text}`,
      svgSlot: bracketsSvg(ctx.tokens.colors.primary),
    }
  },
}
