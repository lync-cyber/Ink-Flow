/**
 * wxPatch 共用工具：HTML 片段 ↔ DOM、inline style 解析/序列化
 *
 * 为什么走 DOMParser：
 *   patch 的输入/输出是 HTML 字符串，但判断逻辑天然是结构性的
 *   （"此节点是否位于 svg 子树"、"此 ul 是否需要包一层 section"）。
 *   字符串正则做结构判断容易踩坑，DOM 遍历是更稳妥的路径。
 *
 * 为什么不用 template：
 *   <template> 允许块级子节点保真，但其 content DocumentFragment 的 innerHTML
 *   不会包含外层 wrap。我们用一个 <div> 承载，序列化时取 innerHTML，语义相同。
 */

export function parseFragment(html: string): { doc: Document; container: HTMLElement } {
  const parser = new DOMParser()
  // 包一层已知外壳，避免 body/html 自动生成带来的边界
  const doc = parser.parseFromString(`<!doctype html><html><body><div id="__wx_root__">${html}</div></body></html>`, 'text/html')
  const container = doc.getElementById('__wx_root__') as HTMLElement
  return { doc, container }
}

export function serializeFragment(container: HTMLElement): string {
  return container.innerHTML
}

/**
 * 解析 inline style 字符串为有序键值列表。
 *
 * 保留声明顺序：CSS 层叠依赖书写顺序，重建时必须一致。
 * !important 作为独立字段记录，不丢。
 */
export interface StyleDecl {
  prop: string
  value: string
  important: boolean
}

export function parseStyle(style: string): StyleDecl[] {
  if (!style) return []
  const out: StyleDecl[] = []
  // 以分号切；注意 url(data:...;...) 中的分号被括号保护——简单处理：先把括号内分号替换为占位符
  const placeholder = '\u0000'
  let depth = 0
  let protected_ = ''
  for (const ch of style) {
    if (ch === '(') depth++
    if (ch === ')') depth = Math.max(0, depth - 1)
    protected_ += depth > 0 && ch === ';' ? placeholder : ch
  }
  for (const raw of protected_.split(';')) {
    const decl = raw.replace(new RegExp(placeholder, 'g'), ';').trim()
    if (!decl) continue
    const idx = decl.indexOf(':')
    if (idx < 0) continue
    let prop = decl.slice(0, idx).trim()
    let value = decl.slice(idx + 1).trim()
    let important = false
    if (/!important\s*$/i.test(value)) {
      important = true
      value = value.replace(/!important\s*$/i, '').trim()
    }
    if (!prop || !value) continue
    out.push({ prop, value, important })
  }
  return out
}

export function stringifyStyle(decls: StyleDecl[]): string {
  return decls
    .map((d) => `${d.prop}: ${d.value}${d.important ? ' !important' : ''}`)
    .join('; ')
}

/** 深度优先遍历元素子树，回调可决定是否继续深入 */
export function walkElements(root: Element, visitor: (el: Element) => void): void {
  const stack: Element[] = [root]
  while (stack.length) {
    const el = stack.pop()!
    visitor(el)
    for (let i = el.children.length - 1; i >= 0; i--) {
      stack.push(el.children[i])
    }
  }
}

/** 判断节点是否位于 svg 子树（含自身） */
export function isInSvg(el: Element): boolean {
  let cur: Element | null = el
  while (cur) {
    if (cur.tagName.toLowerCase() === 'svg') return true
    cur = cur.parentElement
  }
  return false
}
