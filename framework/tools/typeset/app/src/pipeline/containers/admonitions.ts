/**
 * 四色提示类容器：tip / warning / info / danger
 *
 * 设计：无 emoji。主题 tokens.colors.status[kind] 决定外框色（accent + soft bg），
 * theme.assets.{tip,warning,info,danger}Icon 可选提供一个 SVG 前缀。
 * 整体靠"左侧 3px 色条 + 浅底"的典型 admonition 视觉，不依赖 flex。
 *
 * 作者层面：要改色，换 theme.tokens.colors.status 即可，无需碰渲染器。
 * 要换图标，换 theme.assets.tipIcon 即可。
 */

import type { ContainerRenderer, ContainerRenderContext } from './types'
import { escText } from './types'

const DEFAULT_TITLES: Record<AdmonitionKind, string> = {
  tip: '小贴士',
  warning: '注意',
  info: '说明',
  danger: '警告',
}

export type AdmonitionKind = 'tip' | 'warning' | 'info' | 'danger'

const ICON_KEYS: Record<AdmonitionKind, 'tipIcon' | 'warningIcon' | 'infoIcon' | 'dangerIcon'> = {
  tip: 'tipIcon',
  warning: 'warningIcon',
  info: 'infoIcon',
  danger: 'dangerIcon',
}

function openTag(kind: AdmonitionKind, ctx: ContainerRenderContext): string {
  const pair = ctx.tokens.colors.status[kind]
  const title = ctx.info.trim() || DEFAULT_TITLES[kind]
  const icon = ctx.assets[ICON_KEYS[kind]] ?? ''
  const frame =
    `background-color:${pair.soft};` +
    `border-left:3px solid ${pair.accent};` +
    'padding:12px 14px;' +
    'border-radius:0 4px 4px 0;' +
    'margin:16px 0'
  const titleCss = `font-weight:700;color:${pair.accent};margin-bottom:6px;letter-spacing:0.3px`
  return (
    `<section class="container-${kind}" style="${frame}">\n` +
    `<section class="container-${kind}__title" style="${titleCss}">${icon}${escText(title)}</section>\n`
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
