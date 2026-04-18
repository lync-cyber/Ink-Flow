/**
 * compare / pros / cons
 *
 * 布局：绝不用 flex。
 *   外层 section 包两列，每列 display:inline-block; vertical-align:top; width:48%。
 *   中间留 2% 间隙；空白字符分隔 inline-block 的 4px 间距由 margin 吸收。
 *
 * 嵌套约定（markdown-it-container 用 fence 长度匹配）：
 *   `:::: compare` 包 `::: pros` / `::: cons`。用户必须写 4 个冒号外层、
 *   3 个冒号内层，否则 compare 的 4-colon fence 不会把 3-colon 当子级。
 *   这是 markdown-it-container 的原生行为，不是我们定的规则。
 */

import type { ContainerRenderer } from './types'

const COL_STYLE =
  'display:inline-block;vertical-align:top;width:48%;box-sizing:border-box;' +
  'padding:12px;background-color:#f7f8fa;border-radius:6px'

const GUTTER_STYLE = 'display:inline-block;width:4%;'

export const compareContainer: ContainerRenderer = {
  open: () => `<section class="container-compare" style="font-size:0">\n`,
  // font-size:0 抹平 inline-block 之间的空白；列内部再把字号恢复
  close: '</section>\n',
}

export const prosContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim() || '优点'
    return (
      `<section class="container-pros" style="${COL_STYLE};font-size:15px">` +
      `<section class="container-pros__title" style="font-weight:700;color:#1a8450;margin-bottom:8px">${escapeInner(title)}</section>\n`
    )
  },
  // 在 cons 之前插入 gutter：通过 close 追加尾部 gutter；pros 之后紧跟 cons 时会产生一个 gutter
  close: `</section><span style="${GUTTER_STYLE}"></span>\n`,
}

export const consContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim() || '缺点'
    return (
      `<section class="container-cons" style="${COL_STYLE};font-size:15px">` +
      `<section class="container-cons__title" style="font-weight:700;color:#b42318;margin-bottom:8px">${escapeInner(title)}</section>\n`
    )
  },
  close: '</section>\n',
}

function escapeInner(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
