import type { StepsVariantId } from '../../../../themes/types'
import type { StepsVariant } from '../registry'
import { numberCircle } from './number-circle'
import { ribbonChain } from './ribbon-chain'
import { timelineDot } from './timeline-dot'

export const STEPS_VARIANTS: Record<StepsVariantId, StepsVariant> = {
  'number-circle': numberCircle,
  'ribbon-chain': ribbonChain,
  'timeline-dot': timelineDot,
}
