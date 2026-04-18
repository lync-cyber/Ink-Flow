/**
 * 配色生成器 · chroma-js 驱动
 *
 * 输入：三色 seed（primary / secondary / accent）+ 是否暗底
 * 输出：完整的 colors token（bg / bgSoft / bgMuted / text / textMuted / border / status ×4）
 *
 * 关键决策：
 *   - 用 LCH 空间做"等明度/饱和度"推导，比 HSL 更接近人眼感知
 *   - status.tip/info/warning/danger 不跟着 primary 跑；保持语义稳定的固定色相，
 *     只在明度上同步 theme.dark → 暗底用更饱和的 accent、更低亮度的 soft
 *   - bg 为纯白 / 纯黑时，bgSoft 取 mix(bg, primary, 0.06)，避免全灰
 */

import chroma from 'chroma-js'
import type { ThemeTokens } from '../themes/types'

export interface PaletteSeed {
  primary: string
  secondary: string
  accent: string
  dark?: boolean
}

/**
 * 由 seed 推导完整的 colors token。
 * 保持与现有 Theme.tokens.colors 字段一一对应，方便合并到已有主题。
 */
export function derivePalette(seed: PaletteSeed): ThemeTokens['colors'] {
  const primary = chroma(seed.primary).hex()
  const secondary = chroma(seed.secondary).hex()
  const accent = chroma(seed.accent).hex()

  const dark = seed.dark ?? isDark(primary, secondary)

  const bg = dark ? '#12141a' : '#ffffff'
  const bgSoft = dark
    ? chroma.mix(bg, primary, 0.12, 'lch').hex()
    : chroma.mix(bg, primary, 0.06, 'lch').hex()
  const bgMuted = dark
    ? chroma.mix(bg, primary, 0.2, 'lch').hex()
    : chroma.mix(bg, primary, 0.12, 'lch').hex()

  const text = dark ? '#e6e6e6' : '#1f2328'
  const textMuted = dark ? '#9aa5b1' : '#6a737d'
  const textInverse = dark ? '#12141a' : '#ffffff'
  const border = dark
    ? chroma.mix(bg, '#ffffff', 0.12, 'lch').hex()
    : chroma.mix(bg, '#000000', 0.1, 'lch').hex()
  const code = accent

  const status = dark
    ? {
        tip: { accent: '#4ec9b0', soft: chroma.mix('#4ec9b0', bg, 0.8, 'lch').hex() },
        warning: { accent: '#f0a35b', soft: chroma.mix('#f0a35b', bg, 0.8, 'lch').hex() },
        info: { accent: '#61afef', soft: chroma.mix('#61afef', bg, 0.8, 'lch').hex() },
        danger: { accent: '#e06c75', soft: chroma.mix('#e06c75', bg, 0.8, 'lch').hex() },
      }
    : {
        tip: { accent: '#1a8450', soft: chroma.mix('#1a8450', bg, 0.88, 'lch').hex() },
        warning: { accent: '#b7791f', soft: chroma.mix('#b7791f', bg, 0.88, 'lch').hex() },
        info: { accent: '#1a73e8', soft: chroma.mix('#1a73e8', bg, 0.88, 'lch').hex() },
        danger: { accent: '#b42318', soft: chroma.mix('#b42318', bg, 0.88, 'lch').hex() },
      }

  return {
    primary,
    secondary,
    accent,
    bg,
    bgSoft,
    bgMuted,
    text,
    textMuted,
    textInverse,
    border,
    code,
    status,
  }
}

/**
 * 由单一主色推导 seed（auto-complete）。
 * secondary = 同色相加深；accent = LCH 色相 +150° 旋转。
 */
export function seedFromPrimary(primary: string, dark = false): PaletteSeed {
  const p = chroma(primary)
  const secondary = p.darken(1.2).saturate(0.3).hex()
  const [l, c, h] = p.lch()
  const rotated = chroma.lch(l, Math.max(c, 45), (h + 150) % 360)
  const accent = rotated.hex()
  return { primary: p.hex(), secondary, accent, dark }
}

/**
 * 检查一对色是否相对"深"——平均 luminance < 0.18 视为暗底场景。
 * 作为 seed.dark 未显式声明时的兜底判断。
 */
function isDark(primary: string, secondary: string): boolean {
  const l1 = chroma(primary).luminance()
  const l2 = chroma(secondary).luminance()
  return (l1 + l2) / 2 < 0.18
}

/**
 * 校验三色对比度：primary vs bg 是否达标（WCAG AA for large text = 3.0）。
 * 低于阈值返回建议；达标返回 null。
 */
export function checkContrast(primary: string, bg: string): { pass: boolean; ratio: number } {
  const ratio = chroma.contrast(primary, bg)
  return { pass: ratio >= 3.0, ratio: Math.round(ratio * 10) / 10 }
}
