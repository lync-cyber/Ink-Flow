/**
 * 四色提示类容器：tip / warning / info / danger
 *
 * 设计：不用 emoji。质感靠字色 + 左侧色条（3px）+ 浅底色。
 * 标题行用主题色加粗小字，下面是正常段落。
 * 不依赖 flex；色条用 border-left + inline style，粘贴到公众号后保留。
 *
 * Step 5：每个变体可由 theme.assets.{tip,warning,info,danger}Icon 附加一个
 * SVG 图标；Step 4 先只上字排版。
 */

import type { ContainerRenderer, ContainerRenderContext } from './types'
import { escText } from './types'

const VARIANTS = {
  tip: { accent: '#1a8450', soft: '#eef7f0', defaultTitle: '小贴士' },
  warning: { accent: '#b7791f', soft: '#fdf6e3', defaultTitle: '注意' },
  info: { accent: '#1a73e8', soft: '#eef4ff', defaultTitle: '说明' },
  danger: { accent: '#b42318', soft: '#fdecea', defaultTitle: '警告' },
} as const

export type AdmonitionKind = keyof typeof VARIANTS

function openTag(kind: AdmonitionKind, ctx: ContainerRenderContext): string {
  const { accent, soft, defaultTitle } = VARIANTS[kind]
  const title = ctx.info.trim() || defaultTitle
  const frame =
    `background-color:${soft};` +
    `border-left:3px solid ${accent};` +
    'padding:12px 14px;' +
    'border-radius:0 4px 4px 0;' +
    'margin:16px 0'
  const titleCss = `font-weight:700;color:${accent};margin-bottom:6px;letter-spacing:0.3px`
  return (
    `<section class="container-${kind}" style="${frame}">\n` +
    `<section class="container-${kind}__title" style="${titleCss}">${escText(title)}</section>\n`
  )
}

function makeAdmonition(kind: AdmonitionKind): ContainerRenderer {
  return {
    open: (ctx) => openTag(kind, ctx),
    close: '</section>\n',
  }
}

export const tipContainer = makeAdmonition('tip')
export const warningContainer = makeAdmonition('warning')
export const infoContainer = makeAdmonition('info')
export const dangerContainer = makeAdmonition('danger')
