/**
 * divider · glyph（单字符装饰）
 *
 * 居中放一个装饰字符（❦ / § / ◆），前后各一根短横线。适合文学/诗歌类栏目。
 * 默认字符 ❦（fleuron）；主题可通过 attrs.glyph 在 markdown 端临时覆盖。
 */

import type { DividerVariant } from '../registry'

export const glyph: DividerVariant = {
  id: 'glyph',
  kind: 'divider',
  render: (ctx) => {
    const char = ctx.attrs.glyph || '❦'
    const color = ctx.tokens.colors.primary
    const line = ctx.tokens.colors.border
    return {
      wrapperCSS: `text-align:center;margin:26px 0;color:${color};font-size:18px`,
      svgSlot:
        `<span style="display:inline-block;width:60px;height:1px;background-color:${line};vertical-align:middle;margin-right:12px"></span>` +
        `<span style="display:inline-block;vertical-align:middle">${char}</span>` +
        `<span style="display:inline-block;width:60px;height:1px;background-color:${line};vertical-align:middle;margin-left:12px"></span>`,
    }
  },
}
