/**
 * 头部/节点叙事容器：intro / cover / author / sectionTitle
 *
 * - intro：文章开头"引子"卡；承载背景+立意。外框 section，内部自由排版。
 * - cover：封面卡，通常内含一张图 + 一行描述。不做 aspect-ratio 强制。
 * - author：作者栏，placeholder 版本。info 作为作者名。
 * - sectionTitle：小节大标题 —— 不靠 Markdown ## 表达的"强力分章线"，
 *   由 theme.assets.sectionCorner 装饰（Step 5）。此处先出标题行。
 */

import type { ContainerRenderer } from './types'
import { escText } from './types'

export const introContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim()
    const head = title
      ? `<section class="container-intro__title" style="font-weight:700;margin-bottom:10px">${escText(title)}</section>`
      : ''
    return `<section class="container-intro">\n${head}`
  },
  close: '</section>\n',
}

export const coverContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim()
    const head = title
      ? `<section class="container-cover__title" style="text-align:center;font-weight:700;font-size:18px;margin-bottom:10px">${escText(title)}</section>`
      : ''
    return `<section class="container-cover">\n${head}`
  },
  close: '</section>\n',
}

export const authorContainer: ContainerRenderer = {
  open: (ctx) => {
    const name = ctx.info.trim() || '作者'
    const role = ctx.attrs.role
      ? `<span style="color:${ctx.tokens.colors.textMuted};margin-left:8px">${escText(ctx.attrs.role)}</span>`
      : ''
    return (
      `<section class="container-author">\n` +
      `<section class="container-author__header" style="margin-bottom:8px">` +
      `<strong>${escText(name)}</strong>${role}` +
      `</section>\n`
    )
  },
  close: '</section>\n',
}

export const sectionTitleContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim()
    const corner = ctx.assets.sectionCorner ?? ''
    const head = title
      ? `<section class="container-section-title__label" style="font-weight:700;font-size:20px;margin-bottom:8px">${corner}${escText(title)}</section>`
      : ''
    return `<section class="container-section-title">\n${head}`
  },
  close: '</section>\n',
}
