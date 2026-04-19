/**
 * quote 预设：4 variant × 每 variant 2 预设 = 8 条
 */

import type { ComponentEntry } from '../types'
import { thumb } from '../thumbnail'

export const quotePresets: ComponentEntry[] = [
  {
    id: 'q-classic',
    name: '大引号金句',
    description: '浅底 + 装饰引号，居中大号',
    kind: 'quote',
    variantId: 'classic',
    markdownSnippet:
      '::: quote-card 作者名\n此处填写金句正文\n:::\n',
    thumbnailSvg: thumb.quoteClassic(),
  },
  {
    id: 'q-classic-no-byline',
    name: '无署名金句',
    description: '纯金句不署名',
    kind: 'quote',
    variantId: 'classic',
    markdownSnippet:
      '::: quote-card\n此处填写金句正文\n:::\n',
    thumbnailSvg: thumb.quoteClassic(),
  },
  {
    id: 'q-magazine',
    name: '杂志风金句',
    description: '上下双粗线 + 大号斜体引号',
    kind: 'quote',
    variantId: 'magazine-dropcap',
    themeCompat: ['literary-humanism'],
    markdownSnippet:
      '::: quote-card 出处 variant=magazine-dropcap\n此处填写金句正文\n:::\n',
    thumbnailSvg: thumb.quoteMagazine(),
  },
  {
    id: 'q-magazine-2',
    name: '杂志风无署名',
    description: '杂志气质极简版',
    kind: 'quote',
    variantId: 'magazine-dropcap',
    themeCompat: ['literary-humanism'],
    markdownSnippet:
      '::: quote-card variant=magazine-dropcap\n此处填写金句正文\n:::\n',
    thumbnailSvg: thumb.quoteMagazine(),
  },
  {
    id: 'q-column',
    name: '双竖线引用',
    description: '左右各一根细竖线夹正文',
    kind: 'quote',
    variantId: 'column-rule',
    markdownSnippet:
      '::: quote-card 作者 variant=column-rule\n此处填写正文\n:::\n',
    thumbnailSvg: thumb.quoteColumnRule(),
  },
  {
    id: 'q-column-2',
    name: '双竖线精简',
    description: '留白多，正文呼吸感强',
    kind: 'quote',
    variantId: 'column-rule',
    markdownSnippet:
      '::: quote-card variant=column-rule\n此处填写正文\n:::\n',
    thumbnailSvg: thumb.quoteColumnRule(),
  },
  {
    id: 'q-brackets',
    name: '四角括号框',
    description: '四角 L 形装饰，中间全留白',
    kind: 'quote',
    variantId: 'frame-brackets',
    markdownSnippet:
      '::: quote-card 作者 variant=frame-brackets\n此处填写正文\n:::\n',
    thumbnailSvg: thumb.quoteFrameBrackets(),
  },
  {
    id: 'q-brackets-2',
    name: '四角括号无署名',
    description: '最克制的引用',
    kind: 'quote',
    variantId: 'frame-brackets',
    markdownSnippet:
      '::: quote-card variant=frame-brackets\n此处填写正文\n:::\n',
    thumbnailSvg: thumb.quoteFrameBrackets(),
  },
]
