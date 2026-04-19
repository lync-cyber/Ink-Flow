/**
 * compare 预设：3 variant × 每 variant 2 预设 = 6 条
 */

import type { ComponentEntry } from '../types'
import { thumb } from '../thumbnail'

const COLUMN_BODY =
  ':::: compare\n' +
  '::: pros 优点\n- 要点 1\n- 要点 2\n:::\n' +
  '::: cons 缺点\n- 要点 1\n- 要点 2\n:::\n' +
  '::::\n'

const COLUMN_BODY_WITH_VARIANT = (v: string): string =>
  `:::: compare variant=${v}\n` +
  '::: pros 优点\n- 要点 1\n- 要点 2\n:::\n' +
  '::: cons 缺点\n- 要点 1\n- 要点 2\n:::\n' +
  '::::\n'

export const comparePresets: ComponentEntry[] = [
  {
    id: 'cmp-column-card',
    name: '两栏卡片对比',
    description: '等高 table-cell 两栏（默认）',
    kind: 'compare',
    variantId: 'column-card',
    markdownSnippet: COLUMN_BODY,
    thumbnailSvg: thumb.compareColumn(),
  },
  {
    id: 'cmp-column-rich',
    name: '两栏 + 标题',
    description: '每栏带自定义标题',
    kind: 'compare',
    variantId: 'column-card',
    markdownSnippet:
      ':::: compare\n' +
      '::: pros 方案 A\n适合场景 / 成本 / 时效\n:::\n' +
      '::: cons 方案 B\n适合场景 / 成本 / 时效\n:::\n' +
      '::::\n',
    thumbnailSvg: thumb.compareColumn(),
  },
  {
    id: 'cmp-stacked',
    name: '上下堆叠对比',
    description: '两行全宽，小屏可读性高',
    kind: 'compare',
    variantId: 'stacked-row',
    markdownSnippet: COLUMN_BODY_WITH_VARIANT('stacked-row'),
    thumbnailSvg: thumb.compareStacked(),
  },
  {
    id: 'cmp-stacked-rich',
    name: '上下堆叠 + 段落',
    description: '每栏多段正文时推荐',
    kind: 'compare',
    variantId: 'stacked-row',
    markdownSnippet:
      ':::: compare variant=stacked-row\n' +
      '::: pros 方案 A\n一段说明。\n\n- 要点一\n- 要点二\n:::\n' +
      '::: cons 方案 B\n一段说明。\n\n- 要点一\n- 要点二\n:::\n' +
      '::::\n',
    thumbnailSvg: thumb.compareStacked(),
  },
  {
    id: 'cmp-ledger',
    name: '账本双色对比',
    description: '绿/红双色列，账面感',
    kind: 'compare',
    variantId: 'ledger',
    markdownSnippet: COLUMN_BODY_WITH_VARIANT('ledger'),
    thumbnailSvg: thumb.compareLedger(),
  },
  {
    id: 'cmp-ledger-short',
    name: '账本精简',
    description: '单列 ≤3 行场景',
    kind: 'compare',
    variantId: 'ledger',
    markdownSnippet:
      ':::: compare variant=ledger\n' +
      '::: pros 收入\n- 订阅\n- 广告\n:::\n' +
      '::: cons 支出\n- 服务器\n- 人力\n:::\n' +
      '::::\n',
    thumbnailSvg: thumb.compareLedger(),
  },
]
