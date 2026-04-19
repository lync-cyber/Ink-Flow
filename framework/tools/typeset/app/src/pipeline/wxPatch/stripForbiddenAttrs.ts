/**
 * stripForbiddenAttrs：移除公众号会剥离的属性 / 样式属性。
 *
 * - 全局删除 id 属性（公众号后处理会清理；保留反而触发额外的 DOM 变形）
 * - 删除 inline style 中的定位声明：position / top / right / bottom / left / z-index
 *   （公众号编辑器粘贴后会把这些吞掉，保留只会让预览和粘贴后的结果偏差）
 * - class 不动——主题用 juice 内联后 class 通常已无语义，但保留便于后续 patch 识别
 *
 * id 保留白名单：
 *   - markdown-it-footnote 生成的锚点：`fn` / `fnref` / `footnote` 前缀
 *     （对应 <sup><a href="#fn1">…</a></sup> 与 <li id="fn1">…</li> 的跳转关系）
 *     公众号里这些锚点虽然不可点击，但在 iframe 预览与导出的 HTML / 长图里保留
 *     可以让阅读路径不坏；删了则 preview 里锚点跳转全坏。
 *
 * 例外：
 *   - svg 元素上的 id 也删（SVG 的 id 在公众号里也被擦，且还会互相冲突）。
 */

import { parseFragment, parseStyle, serializeFragment, stringifyStyle, walkElements, isInSvg } from './utils'

const FORBIDDEN_CSS_PROPS = new Set([
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
])

const ID_WHITELIST = /^(fn|fnref|footnote)[-\d]/i

export function stripForbiddenAttrs(html: string): string {
  const { container } = parseFragment(html)

  walkElements(container, (el) => {
    if (el.hasAttribute('id')) {
      const id = el.getAttribute('id') ?? ''
      // SVG 子树统一删；非 SVG 里按白名单放行脚注锚点，其它一律删
      if (isInSvg(el) || !ID_WHITELIST.test(id)) {
        el.removeAttribute('id')
      }
    }

    const style = el.getAttribute('style')
    if (!style) return
    const decls = parseStyle(style)
    const kept = decls.filter((d) => !FORBIDDEN_CSS_PROPS.has(d.prop.toLowerCase()))
    if (kept.length === decls.length) return
    if (kept.length === 0) {
      el.removeAttribute('style')
    } else {
      el.setAttribute('style', stringifyStyle(kept))
    }
  })

  return serializeFragment(container)
}
