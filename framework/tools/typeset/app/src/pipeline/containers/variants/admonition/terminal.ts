/**
 * admonition · terminal（终端窗口）
 *
 * 视觉：黑底 + 顶部灰色标题栏 + 三色圆点（红 #ff5f56 / 黄 #ffbd2e / 绿 #27c93f）。
 * 等宽字体无法指定（禁 font-family）——"终端感"靠配色 + 圆点 + 标题栏三件套承担，
 * 读者会把它读作"终端"即使字体不是 mono。
 *
 * 约束妥协：wrapperCSS 的 padding 为 0，把标题栏和正文各自的 padding 封在 titleCSS/bodyCSS 里。
 * 这是为了让 svgSlot 的圆点行能贴在 wrapper 顶边不露缝。
 */

import type { AdmonitionVariant } from '../registry'
import { escText } from '../../types'

const TRAFFIC_LIGHTS =
  '<svg viewBox="0 0 54 14" width="42" height="11"' +
  ' xmlns="http://www.w3.org/2000/svg"' +
  ' style="display:inline-block;vertical-align:middle;margin-right:10px">' +
  '<circle cx="7" cy="7" r="5" fill="#ff5f56"/>' +
  '<circle cx="22" cy="7" r="5" fill="#ffbd2e"/>' +
  '<circle cx="37" cy="7" r="5" fill="#27c93f"/>' +
  '</svg>'

const DEFAULT_TITLES: Record<string, string> = {
  tip: 'tip',
  warning: 'warning',
  info: 'info',
  danger: 'error',
}

export const terminal: AdmonitionVariant = {
  id: 'terminal',
  kind: 'admonition',
  themeCompat: ['tech-geek', 'default'],
  render: (ctx, { kind }) => {
    // titleCSS='' 约定：renderer 跳过默认 title 渲染，交给 svgSlot 自建
    const title = ctx.info.trim() || DEFAULT_TITLES[kind] || kind
    return {
      wrapperCSS:
        `background-color:#1f2937;` +
        `padding:0;` +
        `margin:18px 0;` +
        `border-radius:6px;` +
        `box-shadow:0 2px 8px rgba(0,0,0,0.18)`,
      titleCSS: '',
      bodyCSS:
        `color:#e5e7eb;padding:14px 16px;font-size:14px;line-height:1.7;` +
        `border-radius:0 0 6px 6px`,
      svgSlot:
        '<section style="background-color:#2d3748;padding:8px 14px;border-bottom:1px solid #111827;border-radius:6px 6px 0 0;color:#e5e7eb;font-weight:600;font-size:13px;letter-spacing:0.4px">' +
        TRAFFIC_LIGHTS +
        escText(title) +
        '</section>',
    }
  },
}
