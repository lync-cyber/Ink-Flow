/**
 * compare / pros / cons
 *
 * 布局：绝不用 flex，改用 CSS table 做"等高两列"。
 *   外层 section   → display:table; width:100%; table-layout:fixed; border-spacing:8px 0
 *   pros / cons 列 → display:table-cell; vertical-align:top; width:50%
 *
 * 为什么是 table 而不是 inline-block：
 *   - flex 会被微信粘贴后剥离，不能依赖
 *   - inline-block + vertical-align:top 布局能成立，但两列高度取决于各自内容长度，
 *     长短不一时会像"阶梯"——这是早期版本用户反馈的主要槽点
 *   - display:table-cell 天生等高，border-spacing 吸收间隙，
 *     且微信编辑器粘贴后保留完好（doocs/md 等排版器都走这条路径）
 *
 * 嵌套约定（markdown-it-container 用 fence 长度匹配）：
 *   `:::: compare` 包 `::: pros` / `::: cons`。用户必须写 4 个冒号外层、
 *   3 个冒号内层，否则 compare 的 4-colon fence 不会把 3-colon 当子级。
 *   这是 markdown-it-container 的原生行为，不是我们定的规则。
 *
 * 配色：全部从 ctx.tokens 读取——
 *   列背景用 tokens.colors.bgSoft
 *   pros 标题 = tokens.colors.status.tip.accent
 *   cons 标题 = tokens.colors.status.danger.accent
 *   圆角 / 内边距用 tokens.radius / tokens.spacing，让 4 套主题自然呈现差异
 */

import type { ContainerRenderer, ContainerRenderContext } from './types'

function colStyle(ctx: ContainerRenderContext): string {
  const bg = ctx.tokens.colors.bgSoft
  const radius = ctx.tokens.radius.md
  const pad = ctx.tokens.spacing.containerPadding
  const innerPad = pad - 4 < 10 ? 10 : pad - 4
  return (
    'display:table-cell;vertical-align:top;width:50%;box-sizing:border-box;' +
    `padding:${innerPad}px ${innerPad}px;` +
    `background-color:${bg};border-radius:${radius}px`
  )
}

export const compareContainer: ContainerRenderer = {
  // border-spacing 给两列之间留缝，比 inline-block 的 4% gutter 稳定得多。
  // data-wx-keep-flex 不需要——table 布局本身不会被 patchFlexToFallback 动到。
  open: () =>
    `<section class="container-compare" style="display:table;width:100%;table-layout:fixed;border-spacing:8px 0;border-collapse:separate">\n`,
  close: '</section>\n',
}

export const prosContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim() || '优点'
    const baseSize = ctx.tokens.typography.baseSize
    const color = ctx.tokens.colors.status.tip.accent
    return (
      `<section class="container-pros" style="${colStyle(ctx)};font-size:${baseSize}px">` +
      `<section class="container-pros__title" style="font-weight:700;color:${color};margin-bottom:8px">${escapeInner(title)}</section>\n`
    )
  },
  close: '</section>\n',
}

export const consContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim() || '缺点'
    const baseSize = ctx.tokens.typography.baseSize
    const color = ctx.tokens.colors.status.danger.accent
    return (
      `<section class="container-cons" style="${colStyle(ctx)};font-size:${baseSize}px">` +
      `<section class="container-cons__title" style="font-weight:700;color:${color};margin-bottom:8px">${escapeInner(title)}</section>\n`
    )
  },
  close: '</section>\n',
}

function escapeInner(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
