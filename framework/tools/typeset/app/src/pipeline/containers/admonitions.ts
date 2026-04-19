/**
 * 四色提示容器：tip / warning / info / danger
 *
 * v2 变更：把"视觉骨架"从本文件硬编码里拆出，改为 registry 分派。
 *   - 主题层：theme.variants.admonition 指定默认骨架（accent-bar / pill-tag / ticket-notch / ...）
 *   - 容器层：`::: tip variant=terminal` 的 attrs.variant 可临时覆盖主题选择
 *   - variant 模块：variants/admonition/{id}.ts 返回 { wrapperCSS, titleCSS?, bodyCSS?, svgSlot? }
 *
 * 本文件只做三件事：
 *   1. 决定用哪个 variant（attrs.variant > theme.variants.admonition > 'accent-bar' 兜底）
 *   2. 组装 open/close HTML：wrapper + svgSlot + title? + body?
 *   3. 处理 title 显示约定（titleCSS==='' 跳过默认 title 行，由 svgSlot 承担）
 */

import type {
  AdmonitionVariantId,
  ThemeAssets,
} from '../../themes/types'
import type { ContainerRenderer, ContainerRenderContext } from './types'
import { escText } from './types'
import { ADMONITION_VARIANTS } from './variants'
import type { AdmonitionKind } from './variants'

const DEFAULT_TITLES: Record<AdmonitionKind, string> = {
  tip: '小贴士',
  warning: '注意',
  info: '说明',
  danger: '警告',
}

const ICON_KEYS: Record<AdmonitionKind, keyof ThemeAssets> = {
  tip: 'tipIcon',
  warning: 'warningIcon',
  info: 'infoIcon',
  danger: 'dangerIcon',
}

function resolveVariantId(ctx: ContainerRenderContext): AdmonitionVariantId {
  const override = ctx.attrs.variant
  if (override && override in ADMONITION_VARIANTS) {
    return override as AdmonitionVariantId
  }
  return ctx.variants.admonition ?? 'accent-bar'
}

function makeAdmonition(kind: AdmonitionKind): ContainerRenderer {
  return {
    open: (ctx) => {
      const variantId = resolveVariantId(ctx)
      const variant = ADMONITION_VARIANTS[variantId]
      const result = variant.render(ctx, { kind })
      const title = ctx.info.trim() || DEFAULT_TITLES[kind]
      const iconKey = ICON_KEYS[kind]
      const icon = (ctx.assets[iconKey] as string | undefined) ?? ''

      const parts: string[] = []
      // 双 class：第一项保持 v1 兼容名，第二项带 variant 后缀方便组件库 UI 抓取
      parts.push(
        `<section class="container-${kind} container-${kind}--${variantId}" style="${result.wrapperCSS}">`,
      )
      if (result.svgSlot) parts.push(result.svgSlot)
      // titleCSS === '' 约定：variant 自己在 svgSlot 内渲染了标题，renderer 跳过默认 title
      if (result.titleCSS !== '') {
        const titleStyle =
          result.titleCSS ??
          `font-weight:700;color:${ctx.tokens.colors.status[kind].accent};margin-bottom:6px;letter-spacing:0.3px`
        parts.push(
          `<section class="container-${kind}__title" style="${titleStyle}">${icon}${escText(title)}</section>`,
        )
      }
      if (result.bodyCSS) {
        parts.push(`<section class="container-${kind}__body" style="${result.bodyCSS}">`)
      }
      return parts.join('\n') + '\n'
    },
    close: (ctx) => {
      const variantId = resolveVariantId(ctx)
      const result = ADMONITION_VARIANTS[variantId].render(ctx, { kind })
      return (result.bodyCSS ? '</section>\n' : '') + '</section>\n'
    },
  }
}

export const tipContainer = makeAdmonition('tip')
export const warningContainer = makeAdmonition('warning')
export const infoContainer = makeAdmonition('info')
export const dangerContainer = makeAdmonition('danger')
