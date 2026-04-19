import type { QuoteVariantId } from '../../../../themes/types'
import type { QuoteVariant } from '../registry'
import { classic } from './classic'
import { magazineDropcap } from './magazine-dropcap'
import { columnRule } from './column-rule'
import { frameBrackets } from './frame-brackets'

export const QUOTE_VARIANTS: Record<QuoteVariantId, QuoteVariant> = {
  classic,
  'magazine-dropcap': magazineDropcap,
  'column-rule': columnRule,
  'frame-brackets': frameBrackets,
}
