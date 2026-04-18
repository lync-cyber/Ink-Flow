/**
 * stripForbiddenAttrs：移除公众号会剥离的属性 / 样式属性。
 *
 * - 全局删除 id 属性（公众号后处理会清理；保留反而触发额外的 DOM 变形）
 * - 删除 inline style 中的定位声明：position / top / right / bottom / left / z-index
 *   （公众号编辑器粘贴后会把这些吞掉，保留只会让预览和粘贴后的结果偏差）
 * - class 不动——主题用 juice 内联后 class 通常已无语义，但保留便于后续 patch 识别
 *
 * 例外：
 *   - svg 元素上的 id 也删（SVG 的 id 在公众号里也被擦，且还会互相冲突）。这里统一删。
 */

import { parseFragment, parseStyle, serializeFragment, stringifyStyle, walkElements } from './utils'

const FORBIDDEN_CSS_PROPS = new Set([
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
])

export function stripForbiddenAttrs(html: string): string {
  const { container } = parseFragment(html)

  walkElements(container, (el) => {
    if (el.hasAttribute('id')) el.removeAttribute('id')

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
