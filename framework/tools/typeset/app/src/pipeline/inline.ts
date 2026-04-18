/**
 * 自定义行内扩展：
 *   [.着重文本.]  → <span class="wx-emphasis">着重文本</span>
 *   [~波浪文本~] → <span class="wx-wavy">波浪文本</span>
 *
 * 为什么不用 markdown-it-sub/sup 之类的现成插件：
 *   中文社区里 `[.x.]` 和 `[~x~]` 是约定俗成的着重/波浪写法（而不是上下标），
 *   语义含义冲突；写自己的 inline rule 可以精准命中 token 形态。
 *
 * markdown-it 的 inline rule 契约：
 *   state.src 是整个 inline 文本；state.pos 是扫描游标。我们在当前位置
 *   尝试匹配 `[.` / `[~`，找到结束 `.]` / `~]` 后 push token 推进 pos。
 *   silent 模式下只做 lookahead，不 push token——必须尊重。
 */

import type MarkdownIt from 'markdown-it'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type State = any

const EMPHASIS_OPEN = '[.'
const EMPHASIS_CLOSE = '.]'
const WAVY_OPEN = '[~'
const WAVY_CLOSE = '~]'

function makeMatcher(openSeq: string, closeSeq: string, className: string) {
  return function matcher(state: State, silent: boolean): boolean {
    const src: string = state.src
    const start: number = state.pos
    if (src.substr(start, openSeq.length) !== openSeq) return false
    // 从 openSeq 后开始找 closeSeq；禁止跨行（遇到换行放弃）
    const contentStart = start + openSeq.length
    let end = -1
    for (let i = contentStart; i < src.length - (closeSeq.length - 1); i++) {
      const ch = src[i]
      if (ch === '\n') return false
      if (ch === '\\') {
        i++ // skip escaped char
        continue
      }
      if (src.substr(i, closeSeq.length) === closeSeq) {
        end = i
        break
      }
    }
    if (end < 0) return false
    const inner = src.slice(contentStart, end)
    if (!inner) return false // 空内容视为非匹配，避免吞掉 []

    if (!silent) {
      const tokenOpen = state.push('html_inline', '', 0)
      tokenOpen.content = `<span class="${className}">`
      // 解析 inner 的 inline 规则：调用 md.renderInline 等同于重新 parse
      const md: MarkdownIt = state.md
      // 只把纯文本渲染为 inline HTML，以便 **加粗** / ==高亮== 仍在其中生效
      const innerRendered: string = md.renderInline(inner, state.env)
      const tokenContent = state.push('html_inline', '', 0)
      tokenContent.content = innerRendered
      const tokenClose = state.push('html_inline', '', 0)
      tokenClose.content = `</span>`
    }

    state.pos = end + closeSeq.length
    return true
  }
}

export function registerInlineExtensions(md: MarkdownIt): void {
  md.inline.ruler.before('emphasis', 'wx_emphasis', makeMatcher(EMPHASIS_OPEN, EMPHASIS_CLOSE, 'wx-emphasis'))
  md.inline.ruler.before('emphasis', 'wx_wavy', makeMatcher(WAVY_OPEN, WAVY_CLOSE, 'wx-wavy'))
}
