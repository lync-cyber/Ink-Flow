/**
 * 参数化 SVG 资产工厂
 *
 * 每个主题仅需提供一个"色彩函数集合"与一组参数，就能得到全套 assets。
 * 这样 4 套主题的 SVG 风格差异落在"图形变体"层（sharp / soft / serif / playful），
 * 色彩则随 tokens 自动流动，避免在每个主题里手写一遍相同的 SVG 字符串。
 */

import type { ThemeAssets, ThemeTokens } from '../types'

const strip = (s: string) => s.replace(/\s+/g, ' ').trim()

/** 主题级视觉变体 —— 控制 SVG 形状风格，不控制颜色 */
export type SvgVariant = 'geometric' | 'soft' | 'serif' | 'playful'

interface BuildOptions {
  tokens: ThemeTokens
  variant: SvgVariant
}

export function buildAssets({ tokens, variant }: BuildOptions): ThemeAssets {
  const primary = tokens.colors.primary
  const accent = tokens.colors.accent
  const border = tokens.colors.border

  return {
    h2Prefix: h2Prefix(variant, primary, accent),
    dividerWave: dividerWave(border, primary),
    dividerDots: dividerDots(border),
    dividerFlower: dividerFlower(border, primary),
    quoteMark: quoteMark(variant, primary),
    sectionCorner: sectionCorner(variant, primary),
    tipIcon: dotIcon(tokens.colors.status.tip.accent),
    warningIcon: triangleIcon(tokens.colors.status.warning.accent),
    infoIcon: iIcon(tokens.colors.status.info.accent),
    dangerIcon: minusIcon(tokens.colors.status.danger.accent),
    stepBadge: (n: number) => stepBadge(n, primary),
  }
}

// ---------- 形状 ---------- //

function h2Prefix(variant: SvgVariant, primary: string, accent: string): string {
  switch (variant) {
    case 'soft':
      // 两个叠加圆点
      return strip(`
        <svg viewBox="0 0 18 18" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:8px">
          <circle cx="6" cy="9" r="5" fill="${primary}"/>
          <circle cx="12" cy="9" r="5" fill="${accent}" opacity="0.55"/>
        </svg>
      `)
    case 'serif':
      // 书卷式双竖条装饰
      return strip(`
        <svg viewBox="0 0 14 22" width="11" height="18" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:8px">
          <rect x="0" y="1" width="3" height="20" fill="${primary}"/>
          <rect x="5" y="6" width="3" height="15" fill="${primary}" opacity="0.5"/>
        </svg>
      `)
    case 'playful':
      // 菱形 + 小方形
      return strip(`
        <svg viewBox="0 0 20 14" width="18" height="12" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:8px">
          <path d="M0,7 L7,0 L14,7 L7,14 Z" fill="${primary}"/>
          <rect x="15" y="4" width="5" height="6" fill="${accent}" opacity="0.7"/>
        </svg>
      `)
    case 'geometric':
    default:
      return strip(`
        <svg viewBox="0 0 14 22" width="12" height="18" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:8px">
          <rect x="0" y="0" width="4" height="22" fill="${primary}"/>
          <rect x="7" y="4" width="3" height="14" fill="${primary}" opacity="0.6"/>
        </svg>
      `)
  }
}

function dividerWave(border: string, _primary: string): string {
  return strip(`
    <svg viewBox="0 0 240 14" width="220" height="14" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,7 Q15,0 30,7 T60,7 T90,7 T120,7 T150,7 T180,7 T210,7 T240,7"
            fill="none" stroke="${border}" stroke-width="1.5"/>
    </svg>
  `)
}

function dividerDots(border: string): string {
  return strip(`
    <svg viewBox="0 0 240 8" width="220" height="8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="4" r="2" fill="${border}"/>
      <circle cx="100" cy="4" r="2" fill="${border}"/>
      <circle cx="140" cy="4" r="2" fill="${border}"/>
      <circle cx="180" cy="4" r="2" fill="${border}"/>
    </svg>
  `)
}

function dividerFlower(border: string, primary: string): string {
  return strip(`
    <svg viewBox="0 0 240 18" width="220" height="18" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="9" x2="100" y2="9" stroke="${border}" stroke-width="1"/>
      <line x1="140" y1="9" x2="240" y2="9" stroke="${border}" stroke-width="1"/>
      <path d="M120,2 L124,9 L120,16 L116,9 Z" fill="${primary}"/>
      <circle cx="105" cy="9" r="1.5" fill="${border}"/>
      <circle cx="135" cy="9" r="1.5" fill="${border}"/>
    </svg>
  `)
}

function quoteMark(variant: SvgVariant, primary: string): string {
  if (variant === 'serif') {
    // 大号西文双引号，书卷气浓
    return strip(`
      <svg viewBox="0 0 48 40" width="36" height="30" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:top;margin-right:4px">
        <text x="0" y="32" font-size="44" font-weight="700" fill="${primary}" opacity="0.3">&#8220;</text>
      </svg>
    `)
  }
  if (variant === 'playful') {
    // 圆润对话气泡
    return strip(`
      <svg viewBox="0 0 40 32" width="34" height="28" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:top;margin-right:4px">
        <path d="M4,20 C4,10 12,4 24,4 C34,4 38,10 38,16 C38,24 30,28 18,28 L12,32 L13,26 C7,24 4,22 4,20 Z"
              fill="${primary}" opacity="0.25"/>
      </svg>
    `)
  }
  // geometric / soft：常规双引号几何化
  return strip(`
    <svg viewBox="0 0 40 32" width="34" height="28" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:top;margin-right:4px">
      <path d="M4,26 L4,16 C4,10 8,6 14,4 L14,8 C10,9 8,12 8,16 L12,16 L12,26 Z
               M22,26 L22,16 C22,10 26,6 32,4 L32,8 C28,9 26,12 26,16 L30,16 L30,26 Z"
            fill="${primary}" opacity="${variant === 'soft' ? '0.4' : '0.3'}"/>
    </svg>
  `)
}

function sectionCorner(variant: SvgVariant, primary: string): string {
  if (variant === 'soft') {
    return strip(`
      <svg viewBox="0 0 18 18" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
        <circle cx="9" cy="9" r="7" fill="${primary}"/>
      </svg>
    `)
  }
  if (variant === 'playful') {
    return strip(`
      <svg viewBox="0 0 18 18" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
        <path d="M9,1 L11,7 L17,9 L11,11 L9,17 L7,11 L1,9 L7,7 Z" fill="${primary}"/>
      </svg>
    `)
  }
  return strip(`
    <svg viewBox="0 0 18 18" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
      <path d="M0,0 L18,0 L18,4 L4,4 L4,18 L0,18 Z" fill="${primary}"/>
    </svg>
  `)
}

function dotIcon(color: string): string {
  return strip(`
    <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
      <circle cx="8" cy="8" r="6" fill="none" stroke="${color}" stroke-width="1.5"/>
      <rect x="7" y="4" width="2" height="5" fill="${color}"/>
      <rect x="7" y="10" width="2" height="2" fill="${color}"/>
    </svg>
  `)
}

function triangleIcon(color: string): string {
  return strip(`
    <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
      <path d="M8,1 L15,14 L1,14 Z" fill="none" stroke="${color}" stroke-width="1.5"/>
      <rect x="7" y="5" width="2" height="5" fill="${color}"/>
      <rect x="7" y="11" width="2" height="2" fill="${color}"/>
    </svg>
  `)
}

function iIcon(color: string): string {
  return strip(`
    <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
      <circle cx="8" cy="8" r="6" fill="none" stroke="${color}" stroke-width="1.5"/>
      <rect x="7" y="3" width="2" height="2" fill="${color}"/>
      <rect x="7" y="6" width="2" height="7" fill="${color}"/>
    </svg>
  `)
}

function minusIcon(color: string): string {
  // 横线色用 #fefefe 而非纯白：公众号把 SVG 光栅化时会把 fill=#fff 当做背景透明化
  return strip(`
    <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:6px">
      <circle cx="8" cy="8" r="6" fill="${color}"/>
      <rect x="3" y="7" width="10" height="2" fill="#fefefe"/>
    </svg>
  `)
}

function stepBadge(n: number, primary: string): string {
  // font-size=15（平台下限 14，640→375 缩放后 ≈ 8.8px）；数字色 #fefefe 同上
  return strip(`
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:8px">
      <circle cx="12" cy="12" r="11" fill="${primary}"/>
      <text x="12" y="17" text-anchor="middle" font-size="15" font-weight="700" fill="#fefefe">${n}</text>
    </svg>
  `)
}
