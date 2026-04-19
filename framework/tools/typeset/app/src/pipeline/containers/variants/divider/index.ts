import type { DividerVariantId } from '../../../../themes/types'
import type { DividerVariant } from '../registry'
import { wave } from './wave'
import { dots } from './dots'
import { flower } from './flower'
import { rule } from './rule'
import { glyph } from './glyph'

export const DIVIDER_VARIANTS: Record<DividerVariantId, DividerVariant> = {
  wave,
  dots,
  flower,
  rule,
  glyph,
}
