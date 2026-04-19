/**
 * Admonition variant 注册表
 *
 * renderer（admonitions.ts）按 ctx.variants.admonition 或 attrs.variant 查表分派。
 * 新增一个骨架 = 加一个文件 + 在此表里登记 + 在 types.ts 的 VARIANT_IDS.admonition 同步 id。
 */

import type { AdmonitionVariantId } from '../../../../themes/types'
import type { AdmonitionVariant } from '../registry'
import { accentBar } from './accent-bar'
import { pillTag } from './pill-tag'
import { ticketNotch } from './ticket-notch'
import { cardShadow } from './card-shadow'
import { minimalUnderline } from './minimal-underline'
import { terminal } from './terminal'

export const ADMONITION_VARIANTS: Record<AdmonitionVariantId, AdmonitionVariant> = {
  'accent-bar': accentBar,
  'pill-tag': pillTag,
  'ticket-notch': ticketNotch,
  'card-shadow': cardShadow,
  'minimal-underline': minimalUnderline,
  terminal,
}
