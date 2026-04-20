/**
 * divider 预设：5 variant × 每 variant 1 预设 + glyph 3 种字符变体 = 7 条
 * （divider 几何简单，每 variant 1 条足够；glyph 单独给 3 种字符选择）
 */

import type { ComponentEntry } from '../types'
import { thumb } from '../thumbnail'

export const dividerPresets: ComponentEntry[] = [
  {
    id: 'dv-rule',
    name: '细线',
    description: '最克制的 1px 灰线',
    kind: 'divider',
    variantId: 'rule',
    markdownSnippet: '::: divider\n:::\n',
    thumbnailSvg: thumb.dividerRule(),
  },
  {
    id: 'dv-wave',
    name: '波浪线',
    description: '柔和波形，叙事换场',
    kind: 'divider',
    variantId: 'wave',
    markdownSnippet: '::: divider variant=wave\n:::\n',
    thumbnailSvg: thumb.dividerWave(),
  },
  {
    id: 'dv-dots',
    name: '点阵',
    description: '等距 4 点，现代克制',
    kind: 'divider',
    variantId: 'dots',
    markdownSnippet: '::: divider variant=dots\n:::\n',
    thumbnailSvg: thumb.dividerDots(),
  },
  {
    id: 'dv-flower',
    name: '菱形纹章',
    description: '中央菱形 + 两侧短线',
    kind: 'divider',
    variantId: 'flower',
    markdownSnippet: '::: divider variant=flower\n:::\n',
    thumbnailSvg: thumb.dividerFlower(),
  },
  {
    id: 'dv-glyph-fleuron',
    name: 'Fleuron 花饰',
    description: '文学气质，换场分隔',
    kind: 'divider',
    variantId: 'glyph',
    markdownSnippet: '::: divider variant=glyph\n:::\n',
    thumbnailSvg: thumb.dividerGlyph(),
  },
  {
    id: 'dv-glyph-section',
    name: 'Section §',
    description: '法条/章节感',
    kind: 'divider',
    variantId: 'glyph',
    markdownSnippet: '::: divider variant=glyph glyph="§"\n:::\n',
    thumbnailSvg: thumb.dividerGlyph(),
  },
  {
    id: 'dv-glyph-diamond',
    name: '菱形 ◆',
    description: '现代分隔',
    kind: 'divider',
    variantId: 'glyph',
    markdownSnippet: '::: divider variant=glyph glyph="◆"\n:::\n',
    thumbnailSvg: thumb.dividerGlyph(),
  },
]
