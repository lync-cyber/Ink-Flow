/**
 * 容器渲染器契约
 *
 * markdown-it-container 的渲染回调是"开/闭标签分别触发"的流式模型——
 * 我们沿用它：每个容器导出一对 `open(ctx)` / `close`，中间的内容由
 * markdown-it 自己按普通 Markdown 渲染。这让"嵌套容器"（compare 包 pros/cons）
 * 天然可行，也让"内容里写 **加粗** / ==高亮== / ![图](url)"照常生效。
 *
 * 为什么不做"整体吞入后再渲染"的模式：
 *   markdown-it 的 tokens 流里，容器内文本已被切成 open_close 之间的
 *   block/inline 子 token；如果自己吞下再手动触发渲染，会丢格式或
 *   走到了 inline-only 路径。让 markdown-it 自己把内容渲染完，我们
 *   只管外框——更稳、更少惊喜。
 */

import type {
  ThemeAssets,
  ThemeContainers,
  ThemeInline,
  ThemeTokens,
  ThemeVariants,
} from '../../themes/types'

export interface ContainerRenderContext {
  tokens: ThemeTokens
  assets: ThemeAssets
  containers: ThemeContainers
  inline: ThemeInline
  /**
   * v2 骨架选择。renderer 按 ctx.variants.{kind} 分派到 variants/{kind}/{id}.ts。
   * attrs.variant 可按容器级覆盖主题级选择（比如 `::: tip variant=terminal`）。
   */
  variants: ThemeVariants
  /** `::: tip 小贴士 type=positive` → info = "小贴士" */
  info: string
  /** 从 info 里剥出来的 YAML 风格 key=value（value 支持空格用引号包） */
  attrs: Record<string, string>
}

export interface ContainerRenderer {
  /** 打开标签，读取 ctx.info / attrs / tokens 装饰外框 */
  open: (ctx: ContainerRenderContext) => string
  /** 关闭标签；大多是常量字符串，复杂嵌套可用函数形式 */
  close: string | ((ctx: ContainerRenderContext) => string)
}

/**
 * 解析 `::: name 标题文本 key=value key2="v with space"` 的 info 串。
 * name 已由 markdown-it-container 识别并去掉，传进来的是 name 之后的部分。
 */
export interface ParsedInfo {
  title: string
  attrs: Record<string, string>
}

const ATTR_RE = /([a-zA-Z_][\w-]*)=("([^"]*)"|'([^']*)'|(\S+))/g

export function parseInfo(raw: string): ParsedInfo {
  const attrs: Record<string, string> = {}
  let rest = raw
  rest = rest.replace(ATTR_RE, (_, key, _full, qv, sv, bare) => {
    attrs[key] = qv ?? sv ?? bare ?? ''
    return ''
  })
  const title = rest.replace(/\s+/g, ' ').trim()
  return { title, attrs }
}

/** HTML 属性值转义 */
export function escAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** HTML 文本转义（不处理引号，留给属性值专用函数） */
export function escText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
