/**
 * divider 容器：装饰性分割线
 *
 * 用法：
 *   ::: divider
 *   :::
 *   ::: divider variant=wave
 *   :::
 *
 * 支持的 variant：line / wave / dots / flower。
 * Step 4：所有 variant 先渲染为 hr 或短 SVG（内联，无 id / 无 url 引号）。
 * Step 5 起，wave/flower/dots 从 theme.assets.dividerXxx 取 SVGString 注入。
 *
 * divider 没有有意义的正文，但 markdown-it-container 要求有 fence 包裹——
 * 用户在两条 fence 之间留空即可，我们不读内部内容。
 */

import type { ContainerRenderer } from './types'

const DIVIDER_SVG_WAVE =
  '<svg viewBox="0 0 120 12" width="120" height="12" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M0,6 Q15,0 30,6 T60,6 T90,6 T120,6" fill="none" stroke="#c0c6cf" stroke-width="1.5"/>' +
  '</svg>'

const DIVIDER_SVG_DOTS =
  '<svg viewBox="0 0 120 8" width="120" height="8" xmlns="http://www.w3.org/2000/svg">' +
  [20, 40, 60, 80, 100]
    .map((cx) => `<circle cx="${cx}" cy="4" r="2" fill="#c0c6cf"/>`)
    .join('') +
  '</svg>'

const DIVIDER_SVG_FLOWER =
  '<svg viewBox="0 0 120 16" width="120" height="16" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M0,8 L50,8" stroke="#c0c6cf" stroke-width="1"/>' +
  '<path d="M70,8 L120,8" stroke="#c0c6cf" stroke-width="1"/>' +
  '<path d="M60,2 L63,8 L60,14 L57,8 Z" fill="#c0c6cf"/>' +
  '</svg>'

function svgForVariant(v: string): string {
  switch (v) {
    case 'wave':
      return DIVIDER_SVG_WAVE
    case 'dots':
      return DIVIDER_SVG_DOTS
    case 'flower':
      return DIVIDER_SVG_FLOWER
    default:
      return '<hr style="border:none;height:1px;background-color:#e1e4e8;margin:12px 0"/>'
  }
}

export const dividerContainer: ContainerRenderer = {
  open: (ctx) => {
    const variant = (ctx.attrs.variant ?? 'line').toLowerCase()
    const svg = svgForVariant(variant)
    // 内容约定为空；即便用户不小心写了内容也只是出现在 SVG 之后，不致错乱
    return (
      `<section class="container-divider" style="text-align:center;margin:24px 0">\n` +
      svg +
      '\n'
    )
  },
  close: '</section>\n',
}
