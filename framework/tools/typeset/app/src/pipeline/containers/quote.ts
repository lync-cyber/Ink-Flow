/**
 * 引用类容器：quote-card / highlight
 *
 * - quote-card：金句卡。theme.assets.quoteMark 可提供大号装饰引号 SVG；
 *   未提供时回退为中文直角引号字符，降级不失美。
 *   info 作为署名（"— 作者"）。
 * - highlight：整体高亮块，用主色浅底。内部保持普通段落节奏。
 */

import type { ContainerRenderer } from './types'
import { escText } from './types'

const FALLBACK_OPEN_MARK = `<span style="display:inline-block;font-size:28px;line-height:1;opacity:0.35;margin-right:4px">「</span>`
const FALLBACK_CLOSE_MARK = `<span style="display:inline-block;font-size:28px;line-height:1;opacity:0.35;margin-left:4px">」</span>`

export const quoteCardContainer: ContainerRenderer = {
  open: (ctx) => {
    const mark = ctx.assets.quoteMark ?? FALLBACK_OPEN_MARK
    return (
      `<section class="container-quote-card">\n` +
      `<section class="container-quote-card__body" style="font-size:16px;line-height:1.7;text-align:center">${mark}\n`
    )
  },
  close: (ctx) => {
    const byline = ctx.info.trim()
    // 使用资产时无需镜像收尾（大多数 SVG 自成对）；回退字符模式用闭合直角引号
    const closeMark = ctx.assets.quoteMark ? '' : FALLBACK_CLOSE_MARK
    const sig = byline
      ? `<section class="container-quote-card__byline" style="text-align:center;color:#6a737d;margin-top:8px">— ${escText(byline)}</section>`
      : ''
    return `${closeMark}\n</section>\n${sig}</section>\n`
  },
}

export const highlightContainer: ContainerRenderer = {
  open: () => `<section class="container-highlight">\n`,
  close: '</section>\n',
}
