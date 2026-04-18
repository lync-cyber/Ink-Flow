/**
 * divider 容器：装饰性分割线
 *
 * 用法：
 *   ::: divider
 *   :::
 *   ::: divider variant=wave
 *   :::
 *
 * variant：line（默认，渲染 hr）/ wave / dots / flower
 * 装饰性 SVG 从 theme.assets.dividerWave/dividerDots/dividerFlower 读取，
 * 主题未提供时回退到内置简版几何。
 */

import type { ContainerRenderer, ContainerRenderContext } from './types'

const FALLBACK_WAVE =
  '<svg viewBox="0 0 120 12" width="120" height="12" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M0,6 Q15,0 30,6 T60,6 T90,6 T120,6" fill="none" stroke="#c0c6cf" stroke-width="1.5"/>' +
  '</svg>'

const FALLBACK_DOTS =
  '<svg viewBox="0 0 120 8" width="120" height="8" xmlns="http://www.w3.org/2000/svg">' +
  [20, 40, 60, 80, 100]
    .map((cx) => `<circle cx="${cx}" cy="4" r="2" fill="#c0c6cf"/>`)
    .join('') +
  '</svg>'

const FALLBACK_FLOWER =
  '<svg viewBox="0 0 120 16" width="120" height="16" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M0,8 L50,8" stroke="#c0c6cf" stroke-width="1"/>' +
  '<path d="M70,8 L120,8" stroke="#c0c6cf" stroke-width="1"/>' +
  '<path d="M60,2 L63,8 L60,14 L57,8 Z" fill="#c0c6cf"/>' +
  '</svg>'

function svgForVariant(v: string, ctx: ContainerRenderContext): string {
  switch (v) {
    case 'wave':
      return ctx.assets.dividerWave ?? FALLBACK_WAVE
    case 'dots':
      return ctx.assets.dividerDots ?? FALLBACK_DOTS
    case 'flower':
      return ctx.assets.dividerFlower ?? FALLBACK_FLOWER
    default:
      return `<hr style="border:none;height:1px;background-color:${ctx.tokens.colors.border};margin:12px 0"/>`
  }
}

export const dividerContainer: ContainerRenderer = {
  open: (ctx) => {
    const variant = (ctx.attrs.variant ?? 'line').toLowerCase()
    const svg = svgForVariant(variant, ctx)
    return (
      `<section class="container-divider" style="text-align:center;margin:24px 0">\n` +
      svg +
      '\n'
    )
  },
  close: '</section>\n',
}
