/**
 * section-title 预设：2 variant × 每 variant 2 预设 = 4 条
 */

import type { ComponentEntry } from '../types'
import { thumb } from '../thumbnail'

export const sectionTitlePresets: ComponentEntry[] = [
  {
    id: 'sec-bordered',
    name: '下划线章标题',
    description: '2px 主色底线 + 角饰（默认）',
    kind: 'sectionTitle',
    variantId: 'bordered',
    markdownSnippet: '::: section-title 第一章\n:::\n',
    thumbnailSvg: thumb.sectionBordered(),
  },
  {
    id: 'sec-bordered-long',
    name: '下划线 · 长标题',
    description: '多字章标题下划线节奏',
    kind: 'sectionTitle',
    variantId: 'bordered',
    markdownSnippet: '::: section-title 第二部分 · 深入骨架\n:::\n',
    thumbnailSvg: thumb.sectionBordered(),
  },
  {
    id: 'sec-cornered',
    name: '左上角装饰',
    description: '只留角饰不画线，更克制',
    kind: 'sectionTitle',
    variantId: 'cornered',
    markdownSnippet: '::: section-title 第三章 variant=cornered\n:::\n',
    thumbnailSvg: thumb.sectionCornered(),
  },
  {
    id: 'sec-cornered-long',
    name: '角饰 · 长标题',
    description: '标题长时更显角饰作用',
    kind: 'sectionTitle',
    variantId: 'cornered',
    markdownSnippet:
      '::: section-title 第四部分 · 组件库手册 variant=cornered\n:::\n',
    thumbnailSvg: thumb.sectionCornered(),
  },
]
