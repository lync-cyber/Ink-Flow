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

/**
 * 栏宽算账（375px 手机壳）：
 *   .markdown-body 内宽 ≈ 343px；table border-spacing 横向 4px → 每侧 2 条 4px 空挡
 *   占 12-16px；两栏内容区 ≈ 160px / 栏。去掉列内 padding (10px×2) 与 ul
 *   padding-left (18px) 后，正文可用宽 ≈ 120px，在 13px 字号下每行容 7~8 个 CJK 字。
 *   这是"两栏对比"能看的下限，再密就影响可读性。
 */
const COL_FONT_SIZE = 13
const COL_INNER_PAD = 10

function colStyle(ctx: ContainerRenderContext): string {
  const bg = ctx.tokens.colors.bgSoft
  const radius = ctx.tokens.radius.md
  return (
    'display:table-cell;vertical-align:top;width:50%;box-sizing:border-box;' +
    `padding:${COL_INNER_PAD}px ${COL_INNER_PAD}px;` +
    `background-color:${bg};border-radius:${radius}px`
  )
}

export const compareContainer: ContainerRenderer = {
  // border-spacing 从 8px 收到 4px，给两栏各多 4px 可用宽度（窄栏每像素都贵）。
  // data-wx-keep-flex 不需要——table 布局本身不会被 patchFlexToFallback 动到。
  open: () =>
    `<section class="container-compare" style="display:table;width:100%;table-layout:fixed;border-spacing:4px 0;border-collapse:separate">\n`,
  close: '</section>\n',
}

export const prosContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim() || '优点'
    const color = ctx.tokens.colors.status.tip.accent
    return (
      `<section class="container-pros" style="${colStyle(ctx)};font-size:${COL_FONT_SIZE}px;letter-spacing:0">` +
      `<section class="container-pros__title" style="font-size:${COL_FONT_SIZE + 1}px;font-weight:700;color:${color};margin-bottom:8px;letter-spacing:0;line-height:1.4">${escapeInner(title)}</section>\n`
    )
  },
  close: '</section>\n',
}

export const consContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim() || '缺点'
    const color = ctx.tokens.colors.status.danger.accent
    return (
      `<section class="container-cons" style="${colStyle(ctx)};font-size:${COL_FONT_SIZE}px;letter-spacing:0">` +
      `<section class="container-cons__title" style="font-size:${COL_FONT_SIZE + 1}px;font-weight:700;color:${color};margin-bottom:8px;letter-spacing:0;line-height:1.4">${escapeInner(title)}</section>\n`
    )
  },
  close: '</section>\n',
}

function escapeInner(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
