/**
 * markdown-it 实例构造
 *
 * 启用插件：container / mark（==高亮==）/ ins / footnote / task-lists，
 * 再叠加两条自定义 inline rule（[.着重.] / [~波浪~]）。
 *
 * 容器：从 CONTAINER_REGISTRY 读取每个容器的 open/close 渲染器，
 * 绑到 markdown-it-container。open 调用时解析 info + attrs；
 * close 如果是函数，会复用同一组 ctx（info/attrs 由容器栈回退得到）。
 *
 * 嵌套容器（compare 包 pros/cons）依赖 fence 长度：外 `::::`、内 `:::`。
 */

import MarkdownIt from 'markdown-it'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import markdownItContainer from 'markdown-it-container'
import markdownItMark from 'markdown-it-mark'
import markdownItIns from 'markdown-it-ins'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItTaskLists from 'markdown-it-task-lists'

import { defaultTheme } from '../themes/default'
import type { Theme } from '../themes/types'
import { CONTAINER_REGISTRY } from './containers'
import type { ContainerRenderContext } from './containers'
import { parseInfo } from './containers'
import { registerInlineExtensions } from './inline'

/**
 * 容器渲染器在 open 时解析 info/attrs，close 是函数时也要能读取——
 * 用一个 per-render 的 stack：按 name 压入 open 时的 ctx，close 时弹出同名。
 * stack 存在 env 里，确保每次 md.render(...) 彼此隔离。
 */
interface ContainerEnv {
  __wxContainerStacks?: Record<string, ContainerRenderContext[]>
}

function pushCtx(env: ContainerEnv, name: string, ctx: ContainerRenderContext): void {
  env.__wxContainerStacks ??= {}
  env.__wxContainerStacks[name] ??= []
  env.__wxContainerStacks[name].push(ctx)
}

function popCtx(env: ContainerEnv, name: string): ContainerRenderContext | undefined {
  return env.__wxContainerStacks?.[name]?.pop()
}

export interface CreateMarkdownOptions {
  theme?: Theme
}

export function createMarkdown(options: CreateMarkdownOptions = {}): MarkdownIt {
  const theme = options.theme ?? defaultTheme

  const md = new MarkdownIt({
    html: true,
    xhtmlOut: false,
    breaks: false,
    linkify: true,
    typographer: false,
  })

  md.use(markdownItMark)
  md.use(markdownItIns)
  md.use(markdownItFootnote)
  md.use(markdownItTaskLists, { enabled: true, label: true })

  for (const [name, renderer] of Object.entries(CONTAINER_REGISTRY)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(md as any).use(markdownItContainer, name, {
      validate(params: string): boolean {
        // params 为 `name rest...`，name 区分大小写
        return params.trim().split(/\s+/)[0] === name
      },
      render(
        tokens: Array<{ nesting: number; info: string }>,
        idx: number,
        _opts: unknown,
        env: ContainerEnv,
      ) {
        const token = tokens[idx]
        if (token.nesting === 1) {
          // 裁掉 name，剩余为 info；再拆 title + attrs
          const rest = token.info.trim().slice(name.length).trim()
          const { title, attrs } = parseInfo(rest)
          const ctx: ContainerRenderContext = {
            tokens: theme.tokens,
            assets: theme.assets,
            containers: theme.containers,
            inline: theme.inline,
            variants: theme.variants,
            info: title,
            attrs,
          }
          pushCtx(env, name, ctx)
          return renderer.open(ctx)
        }
        const ctx = popCtx(env, name) ?? emptyCtx(theme)
        return typeof renderer.close === 'function' ? renderer.close(ctx) : renderer.close
      },
    })
  }

  registerInlineExtensions(md)

  // h2Prefix：theme.assets.h2Prefix 注入到 <h2> 开头。
  // 为什么不用 CSS ::before：公众号后台剥离 ::before/::after；
  // 唯一稳妥的路径是在 DOM 里真实插入一个 inline-block 元素。
  if (theme.assets.h2Prefix) {
    const prefix = theme.assets.h2Prefix
    md.renderer.rules.heading_open = (tokens, idx, opts, _env, self) => {
      const t = tokens[idx]
      if (t.tag === 'h2') {
        return `<h2>${prefix}`
      }
      return self.renderToken(tokens, idx, opts)
    }
  }

  // stepBadge：theme.assets.stepBadge(n) 是扩展点；默认不自动注入，
  // 避免污染全局 <ol>。后续主题如需自动编号，可在此处加限定路径的 DOM pass。

  return md
}

function emptyCtx(theme: Theme): ContainerRenderContext {
  return {
    tokens: theme.tokens,
    assets: theme.assets,
    containers: theme.containers,
    inline: theme.inline,
    variants: theme.variants,
    info: '',
    attrs: {},
  }
}
