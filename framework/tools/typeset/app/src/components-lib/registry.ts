/**
 * 组件库注册表
 *
 * 汇总所有内置预设，供 ComponentPalette.vue 消费。
 * 用户自创组件通过 storage/userComponents.ts 独立管理，
 * UI 展示时在"我的组件"分类里叠加呈现。
 *
 * 约束：此文件只做聚合，不做运行时变形。新增预设 = 在 presets/ 下加条目。
 */

import type { ComponentEntry, ComponentKind } from './types'
import type { VariantKind } from '../themes/types'
import { admonitionPresets } from './presets/admonition'
import { quotePresets } from './presets/quote'
import { comparePresets } from './presets/compare'
import { stepsPresets } from './presets/steps'
import { dividerPresets } from './presets/divider'
import { sectionTitlePresets } from './presets/section-title'
import { freePresets } from './presets/free'

export const BUILTIN_COMPONENTS: ComponentEntry[] = [
  ...admonitionPresets,
  ...quotePresets,
  ...comparePresets,
  ...stepsPresets,
  ...dividerPresets,
  ...sectionTitlePresets,
  ...freePresets,
]

/** UI 分类：展示在抽屉 tab 上。顺序即抽屉 tab 顺序。 */
export const COMPONENT_TABS: ReadonlyArray<{
  kind: ComponentKind | 'user'
  label: string
}> = [
  { kind: 'admonition', label: '提示' },
  { kind: 'quote', label: '引用' },
  { kind: 'compare', label: '对比' },
  { kind: 'steps', label: '步骤' },
  { kind: 'divider', label: '分隔' },
  { kind: 'sectionTitle', label: '章节' },
  { kind: 'none', label: '其它' },
  { kind: 'user', label: '我的组件' },
]

export function filterByKind(
  entries: ReadonlyArray<ComponentEntry>,
  kind: ComponentKind,
): ComponentEntry[] {
  return entries.filter((e) => e.kind === kind)
}

/** 在 BUILTIN_COMPONENTS 内按 variant id 查找第一条预设（用于"替换为..."流程）。 */
export function findPresetByVariant(
  kind: VariantKind,
  variantId: string,
): ComponentEntry | undefined {
  return BUILTIN_COMPONENTS.find(
    (e) => e.kind === kind && e.variantId === variantId,
  )
}
