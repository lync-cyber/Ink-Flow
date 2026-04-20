/**
 * patchListWrap：把每个 ul/ol 外层包一层 <section>，并把列表级行间样式复制到 section。
 *
 * 为什么：
 *   微信编辑器的后处理会吞掉 ul/ol 上的若干 margin / padding 声明，
 *   导致列表与上下段落贴死。标准 workaround 是外包一个 section，
 *   在 section 上承载 margin，让列表节点本身只承载内部排版。
 *
 * 幂等：
 *   如果 ul/ol 的 parentElement 已经是"我们加上"的 section（标记 data-wx-list-wrap=""），
 *   则跳过。这样重复调用或和编辑器已经处理过的产物共存不会层层嵌套。
 */

import { parseFragment, serializeFragment, walkElements } from './utils'

const WRAP_MARKER = 'data-wx-list-wrap'

export function patchListWrap(html: string): string {
  const { container } = parseFragment(html)

  // 先收集，再改写——避免边遍历边变更结构
  const lists: HTMLElement[] = []
  walkElements(container, (el) => {
    const tag = el.tagName.toLowerCase()
    if (tag !== 'ul' && tag !== 'ol') return
    const parent = el.parentElement
    if (parent && parent.hasAttribute(WRAP_MARKER)) return // 已包
    lists.push(el as HTMLElement)
  })

  for (const list of lists) {
    const section = list.ownerDocument.createElement('section')
    section.setAttribute(WRAP_MARKER, '')
    // 复制 margin 到 section，减少外部间距塌陷
    const listStyle = list.getAttribute('style') ?? ''
    if (listStyle) {
      section.setAttribute('style', listStyle)
    }
    list.parentElement?.insertBefore(section, list)
    section.appendChild(list)
  }

  return serializeFragment(container)
}
