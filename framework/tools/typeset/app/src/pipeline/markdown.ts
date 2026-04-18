/**
 * markdown-it 实例构造（Step 1 最小版）
 *
 * 启用：container（占位）/ mark（==高亮==）/ ins / footnote / task-lists
 * 容器渲染器 Step 4 接入；此处只注册占位容器，保证 `::: xxx` 不被当成未知语法报错。
 */

import MarkdownIt from 'markdown-it'
// 注意：@types/markdown-it-container 基于旧版 markdown-it 类型，在 v14 下签名不兼容
// 因此这里用 any 绕过——运行时行为与类型无关
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import markdownItContainer from 'markdown-it-container'
import markdownItMark from 'markdown-it-mark'
import markdownItIns from 'markdown-it-ins'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItTaskLists from 'markdown-it-task-lists'

const CONTAINER_NAMES = [
  'intro',
  'author',
  'cover',
  'tip',
  'warning',
  'info',
  'danger',
  'quote-card',
  'highlight',
  'compare',
  'pros',
  'cons',
  'steps',
  'divider',
  'section-title',
  'footer-cta',
  'recommend',
  'qrcode',
  'mpvoice',
  'mpvideo',
]

export function createMarkdown(): MarkdownIt {
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

  // Step 1 占位：每个容器渲染为 <section class="container-xxx">
  // Step 4 会替换为含 SVG 装饰的专用渲染器
  for (const name of CONTAINER_NAMES) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (md as any).use(markdownItContainer, name, {
      render(tokens: Array<{ nesting: number; info: string }>, idx: number) {
        const token = tokens[idx]
        if (token.nesting === 1) {
          const title = token.info.trim().slice(name.length).trim()
          const titleAttr = title ? ` data-title="${escapeAttr(title)}"` : ''
          return `<section class="container-${name}"${titleAttr}>\n`
        }
        return `</section>\n`
      },
    })
  }

  return md
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
