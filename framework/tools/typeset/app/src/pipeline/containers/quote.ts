/**
 * 引用类容器：quote-card / highlight
 *
 * - quote-card：金句卡。大字号、居中、带装饰性引号（Step 5 换 SVG assets.quoteMark）。
 *   info 作为署名（"— 作者"）。
 * - highlight：整体高亮块，用主色浅底。内部保持普通段落节奏。
 */

import type { ContainerRenderer } from './types'
import { escText } from './types'

export const quoteCardContainer: ContainerRenderer = {
  open: () => {
    // Step 4 占位装饰：一对可放大的中文直角引号
    const mark = `<span style="display:inline-block;font-size:28px;line-height:1;opacity:0.35;margin-right:4px">「</span>`
    return (
      `<section class="container-quote-card">\n` +
      `<section class="container-quote-card__body" style="font-size:16px;line-height:1.7;text-align:center">${mark}\n`
    )
  },
  // 关闭时读取 ctx.info 作为署名；markdown-it-container 关闭 token 的 info 为空，
  // 我们的主入口会把 open 时解析出的 info 通过 env/stack 回传；close 是函数就可读 ctx.info。
  close: (ctx) => {
    const byline = ctx.info.trim()
    const closeMark = `<span style="display:inline-block;font-size:28px;line-height:1;opacity:0.35;margin-left:4px">」</span>`
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
