/**
 * Variants 入口：按 kind 导出 Record。
 * 使用方：admonitions.ts / quote.ts / compare.ts / steps.ts / divider.ts / headline.ts
 *         用 `ctx.attrs.variant ?? ctx.variants.{kind}` 查表分派。
 */

export { ADMONITION_VARIANTS } from './admonition'
export { QUOTE_VARIANTS } from './quote'
export { COMPARE_VARIANTS } from './compare'
export { STEPS_VARIANTS } from './steps'
export { DIVIDER_VARIANTS } from './divider'
export { SECTION_TITLE_VARIANTS } from './section-title'
export type {
  VariantRenderResult,
  VariantModule,
  AdmonitionVariant,
  QuoteVariant,
  CompareVariant,
  StepsVariant,
  DividerVariant,
  SectionTitleVariant,
  AdmonitionKind,
  AdmonitionRenderArgs,
  CompareRenderArgs,
} from './registry'
