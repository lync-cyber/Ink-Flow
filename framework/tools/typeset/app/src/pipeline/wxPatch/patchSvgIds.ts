/**
 * patchSvgIds：从 svg 及其子树删除 id 属性。
 *
 * 为什么：
 *   - 公众号编辑器会给粘贴进来的 SVG 的 id 重命名或剥离，导致原本 url(#grad)
 *     这类同文档引用断裂。
 *   - 同一篇文章里多张 SVG 如果各自带了 "grad" 这种常见 id，还会互相冲突。
 *
 * 策略：
 *   彻底不依赖同文档引用——删 id，同时 patchSvgUrlQuotes 已去引号，
 *   必要时下一步 patchSvgIntraRefs（如果需要）会把 xlink:href="#foo" 改成
 *   data URI / 内联展开。当前版本只做第一步：删 id。
 *
 * 注意：
 *   stripForbiddenAttrs 已经全局删过 id。这个 patch 作为冗余保险——
 *   即使上游顺序变了，或有 patch 在中间又引入 id，svg 子树也能保证干净。
 */

import { parseFragment, serializeFragment, walkElements } from './utils'

export function patchSvgIds(html: string): string {
  const { container } = parseFragment(html)

  const svgs = container.querySelectorAll('svg')
  svgs.forEach((svg) => {
    if (svg.hasAttribute('id')) svg.removeAttribute('id')
    walkElements(svg, (el) => {
      if (el.hasAttribute('id')) el.removeAttribute('id')
    })
  })

  return serializeFragment(container)
}
