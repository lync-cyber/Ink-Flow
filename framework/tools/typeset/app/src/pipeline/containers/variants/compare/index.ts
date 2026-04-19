import type { CompareVariantId } from '../../../../themes/types'
import type { CompareVariant } from '../registry'
import { columnCard } from './column-card'
import { stackedRow } from './stacked-row'
import { ledger } from './ledger'

export const COMPARE_VARIANTS: Record<CompareVariantId, CompareVariant> = {
  'column-card': columnCard,
  'stacked-row': stackedRow,
  ledger,
}
