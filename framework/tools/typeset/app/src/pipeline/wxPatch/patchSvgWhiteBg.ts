/**
 * patchSvgWhiteBg：SVG 子树内把纯白（#fff / #ffffff / white / rgb(255,255,255)）
 * 换成一个"极近白但非正白"的 #fefefe。
 *
 * 为什么：
 *   公众号的 SVG→PNG 光栅化管线会把纯白像素转成 alpha=0，导致白色填充区域
 *   变成透明洞（在深色主题里尤其明显）。用不可察觉的偏色避开这个规则。
 *
 * 默认不开：
 *   只有确认当前主题使用深色背景 / 需要白色实心元素时才通过 opts 启用。
 *   因此 applyWxPatches 的 opts.svgWhiteBg 默认 false。
 *
 * 作用范围：
 *   只在 svg 子树内生效——正文里的白色（如段落背景）不应被改。
 */

import { parseFragment, parseStyle, serializeFragment, stringifyStyle, walkElements } from './utils'

const WHITE_VALUES = new Set(['#fff', '#ffffff', 'white'])
const RGB_WHITE_RE = /^\s*rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)\s*$/i

function isWhite(v: string): boolean {
  const s = v.trim().toLowerCase()
  return WHITE_VALUES.has(s) || RGB_WHITE_RE.test(s)
}

const NEAR_WHITE = '#fefefe'

const COLOR_ATTRS = new Set(['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'])
const COLOR_STYLE_PROPS = new Set(['fill', 'stroke', 'color', 'background', 'background-color', 'stop-color'])

export function patchSvgWhiteBg(html: string): string {
  const { container } = parseFragment(html)

  const svgs = container.querySelectorAll('svg')
  svgs.forEach((svg) => {
    walkElements(svg, (el) => {
      for (const name of Array.from(COLOR_ATTRS)) {
        const v = el.getAttribute(name)
        if (v && isWhite(v)) el.setAttribute(name, NEAR_WHITE)
      }
      const style = el.getAttribute('style')
      if (!style) return
      const decls = parseStyle(style).map((d) =>
        COLOR_STYLE_PROPS.has(d.prop.toLowerCase()) && isWhite(d.value) ? { ...d, value: NEAR_WHITE } : d,
      )
      el.setAttribute('style', stringifyStyle(decls))
    })
  })

  return serializeFragment(container)
}
