/**
 * Variant 注册表（v2 P1 同质化修复核心）
 *
 * 契约：每个 variant 模块只返回受约束的 { wrapperCSS, titleCSS, bodyCSS, svgSlot }
 * 四段产物——避免"CSS 片段超市"，避免把骨架做成字符串拼接泳池。
 *
 *   - wrapperCSS  (必填)：外框 inline style 声明串（以 ";" 分隔）。长度 ≤ 400 字符。
 *   - titleCSS    (可选)：标题行 inline style；不填则沿用默认 bold + 主色。
 *   - bodyCSS     (可选)：正文区 inline style；多半不填。terminal / ticket 等需要
 *                         特定字号/内边距时写。
 *   - svgSlot     (可选)：放在 wrapper 首位的装饰节点（纯 SVG / inline-block 胶囊条）。
 *                         该字段走 HTML 逃生口，允许 variant 叠装饰但不可出现 flex/position。
 *
 * 选择原则：
 *   - 禁 position / float / @media / @keyframes / :hover / -webkit- / flex gap
 *   - 悬浮/缺口/折角等"传统靠 position 实现"的骨架改用 SVG data-URI 背景
 *     （CSS url() 用 utf8 + 单引号规避，或 base64；主题的 SVG 内部 url() 另走 no-quotes 规则）
 *   - 外框 margin/padding/border/border-radius/background-color 全允许
 *   - box-shadow 单层允许
 */

import type {
  AdmonitionVariantId,
  CompareVariantId,
  DividerVariantId,
  QuoteVariantId,
  SectionTitleVariantId,
  StepsVariantId,
  VariantKind,
} from '../../../themes/types'
import type { ContainerRenderContext } from '../types'

export interface VariantRenderResult {
  wrapperCSS: string
  /**
   * 标题行 inline style。
   *   - undefined  → renderer 用默认 title 样式（bold + accent 色）
   *   - 非空字符串 → renderer 用此样式渲染 title section
   *   - 空字符串   → renderer **跳过** 默认 title 行，标题文字由 svgSlot 自行承担
   *                  （仅在 variant 需要特殊 title 结构，如 terminal 的"圆点条 + 文字"时使用）
   */
  titleCSS?: string
  bodyCSS?: string
  svgSlot?: string
}

export type AdmonitionKind = 'tip' | 'warning' | 'info' | 'danger'

export interface AdmonitionRenderArgs {
  kind: AdmonitionKind
}

export interface CompareRenderArgs {
  slot: 'wrapper' | 'pros' | 'cons'
  title?: string
}

export type VariantRender<Args = void> = Args extends void
  ? (ctx: ContainerRenderContext) => VariantRenderResult
  : (ctx: ContainerRenderContext, args: Args) => VariantRenderResult

export interface VariantModule<Id extends string, Args = void> {
  id: Id
  kind: VariantKind
  /**
   * 与哪些主题天然契合（用于组件库 UI 给"推荐"徽章）；空数组等价于全兼容。
   * 兼容性是推荐而非强制——用户想把 terminal 骨架接到文学主题上也合法。
   */
  themeCompat?: string[]
  render: VariantRender<Args>
}

/** AdmonitionVariant 接收 kind 以便选色 / 选图标。 */
export type AdmonitionVariant = VariantModule<AdmonitionVariantId, AdmonitionRenderArgs>
/** Quote 返回 wrapper/title/body；close 行为由 container renderer 自己处理。 */
export type QuoteVariant = VariantModule<QuoteVariantId>
/** Compare 用 slot 区分外壳 / pros 列 / cons 列。 */
export type CompareVariant = VariantModule<CompareVariantId, CompareRenderArgs>
export type StepsVariant = VariantModule<StepsVariantId>
/** Divider 的 svgSlot 承担全部可视；wrapperCSS 仅管对齐和间距。 */
export type DividerVariant = VariantModule<DividerVariantId>
export type SectionTitleVariant = VariantModule<SectionTitleVariantId>

/** 工具：把 CSSObject 样式串中的空值剔除并用 `;` 拼接。 */
export function joinCss(entries: ReadonlyArray<string | false | null | undefined>): string {
  return entries.filter(Boolean).join(';')
}

/** 400 字符上限硬检查，variant 写超出即 throw——让问题在开发阶段暴露。 */
export function assertVariantCSSLength(path: string, css: string): void {
  if (css.length > 400) {
    throw new Error(
      `[variant] ${path} 的 wrapperCSS 长度 ${css.length} > 400（软约束）。` +
        '拆分样式或将装饰移到 svgSlot。',
    )
  }
}
