/**
 * steps · ribbon-chain
 *
 * 视觉：wrapper 左侧用 4px 主色实线贯穿，标题行用 inline-block 胶囊（主色底白字），
 * 形成"飘带一路串起"的感觉。内容区无额外背景，保留 markdown 原生层级。
 */

import type { StepsVariant } from '../registry'

export const ribbonChain: StepsVariant = {
  id: 'ribbon-chain',
  kind: 'steps',
  render: (ctx) => ({
    wrapperCSS:
      `margin:18px 0;padding:8px 0 8px 18px;` +
      `border-left:4px solid ${ctx.tokens.colors.primary}`,
    titleCSS:
      `display:inline-block;padding:4px 12px;` +
      `background-color:${ctx.tokens.colors.primary};` +
      `color:${ctx.tokens.colors.textInverse};` +
      `border-radius:12px;font-weight:700;font-size:13px;` +
      `margin:0 0 12px -30px;letter-spacing:0.4px`,
  }),
}
