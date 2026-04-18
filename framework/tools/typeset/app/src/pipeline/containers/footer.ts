/**
 * 文末引导类容器：footerCTA / recommend / qrcode
 *
 * - footerCTA：文末关注卡。info 作为主文案；attrs.cta 作为按钮文字（以 span 样式渲染）。
 * - recommend：推荐阅读块。内容为列表项，每项 [标题](链接)；markdown-it 正常渲染。
 * - qrcode：二维码卡。info 作为说明文字；内容通常是一张图（![](url)）。
 */

import type { ContainerRenderer } from './types'
import { escText } from './types'

export const footerCTAContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim() || '关注我'
    const cta = ctx.attrs.cta ? escText(ctx.attrs.cta) : ''
    const ctaEl = cta
      ? `<section class="container-footer-cta__cta" style="text-align:center;margin-top:10px">` +
        `<span style="display:inline-block;padding:6px 14px;border-radius:16px;background-color:#1a73e8;color:#fff">${cta}</span>` +
        `</section>`
      : ''
    return (
      `<section class="container-footer-cta" style="text-align:center">\n` +
      `<section class="container-footer-cta__title" style="font-weight:700;font-size:16px;margin-bottom:8px">${escText(title)}</section>\n` +
      ctaEl +
      `\n`
    )
  },
  close: '</section>\n',
}

export const recommendContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim() || '推荐阅读'
    return (
      `<section class="container-recommend">\n` +
      `<section class="container-recommend__title" style="font-weight:700;margin-bottom:10px">${escText(title)}</section>\n`
    )
  },
  close: '</section>\n',
}

export const qrcodeContainer: ContainerRenderer = {
  open: (ctx) => {
    const caption = ctx.info.trim()
    const cap = caption
      ? `<section class="container-qrcode__caption" style="text-align:center;color:#6a737d;margin-bottom:8px">${escText(caption)}</section>`
      : ''
    return `<section class="container-qrcode" style="text-align:center">\n${cap}\n`
  },
  close: '</section>\n',
}
