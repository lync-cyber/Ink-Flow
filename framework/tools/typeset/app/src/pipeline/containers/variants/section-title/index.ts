import type { SectionTitleVariantId } from '../../../../themes/types'
import type { SectionTitleVariant } from '../registry'
import { bordered } from './bordered'
import { cornered } from './cornered'

export const SECTION_TITLE_VARIANTS: Record<SectionTitleVariantId, SectionTitleVariant> = {
  bordered,
  cornered,
}
