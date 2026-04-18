/**
 * 把 palette 应用到基主题上，生成一个新的 Theme。
 *
 * 策略：
 *   - tokens.colors 全部被 palette 覆盖
 *   - typography/spacing/radius 继承基主题
 *   - assets 用新 tokens 重新生成（保持基主题的 SVG variant）
 *   - elements / containers / inline 走 buildTheme 默认模板（丢失基主题的自定义 override，
 *     但会注入"新色 + 基布局"，在预览中呈现"换色版"基主题）
 *
 * 返回的 Theme 用独立 id，避免与基主题共用 mdCache 实例。
 */

import { buildTheme } from '../themes/_shared/buildTheme'
import type { SvgVariant } from '../themes/_shared/svgAssets'
import type {
  CSSObject,
  Theme,
  ThemeContainers,
  ThemeElements,
  ThemeInline,
  ThemeTokens,
} from '../themes/types'
import { derivePalette, type PaletteSeed } from './generator'

export interface ApplyPaletteOptions {
  base: Theme
  seed: PaletteSeed
  /** 自定义 id；默认 `${base.id}--custom` */
  id?: string
  /** 自定义显示名 */
  name?: string
  /** SVG 变体覆盖；默认沿用基主题变体的反查结果（无法反查时 geometric） */
  variant?: SvgVariant
}

const BASE_VARIANT: Record<string, SvgVariant> = {
  default: 'geometric',
  'tech-geek': 'geometric',
  'life-aesthetic': 'soft',
  'business-finance': 'geometric',
  'literary-humanism': 'serif',
}

export function applyPalette(opts: ApplyPaletteOptions): Theme {
  const { base, seed } = opts
  const newColors = derivePalette(seed)
  const newTokens: ThemeTokens = {
    ...base.tokens,
    colors: newColors,
  }
  const variant: SvgVariant = opts.variant ?? BASE_VARIANT[base.id] ?? 'geometric'
  return buildTheme({
    id: opts.id ?? `${base.id}--custom`,
    name: opts.name ?? `${base.name} · 自定义`,
    description: `基于 ${base.name} 的自定义配色`,
    variant,
    tokens: newTokens,
    // elements/containers 使用 base 的作为 seed，再让 buildTheme 填补；
    // 为了保留基主题的"元素级 CSS 变体"（如 life-aesthetic 的虚线下划 h2），
    // 这里把 base.elements 作为 overrides 注入，但替换其中硬编码的色值。
    elementOverrides: recolor(base.elements as unknown as CSSMap, base.tokens.colors, newColors) as unknown as Partial<ThemeElements>,
    containerOverrides: recolor(base.containers as unknown as CSSMap, base.tokens.colors, newColors) as unknown as Partial<ThemeContainers>,
    inlineOverrides: recolor(base.inline as unknown as CSSMap, base.tokens.colors, newColors) as unknown as Partial<ThemeInline>,
  })
}

/**
 * 对一个 CSSObject 集合做"色值替换"：把 base 色表里出现过的 hex 在字符串里替换为新色。
 * 匹配规则：大小写不敏感、按长度从长到短优先（避免短色覆盖长色的子串）。
 */
type CSSMap = Record<string, CSSObject>

function recolor(
  source: CSSMap,
  baseColors: ThemeTokens['colors'],
  newColors: ThemeTokens['colors'],
): CSSMap {
  const pairs = collectColorPairs(baseColors, newColors)
  const result: CSSMap = {}
  for (const [key, obj] of Object.entries(source)) {
    const next: CSSObject = {}
    for (const [prop, val] of Object.entries(obj)) {
      if (typeof val === 'string') {
        let replaced = val
        for (const [from, to] of pairs) {
          replaced = replaceAllCaseInsensitive(replaced, from, to)
        }
        next[prop] = replaced
      } else {
        next[prop] = val
      }
    }
    result[key] = next
  }
  return result
}

function collectColorPairs(
  a: ThemeTokens['colors'],
  b: ThemeTokens['colors'],
): Array<[string, string]> {
  const pairs: Array<[string, string]> = [
    [a.primary, b.primary],
    [a.secondary, b.secondary],
    [a.accent, b.accent],
    [a.bg, b.bg],
    [a.bgSoft, b.bgSoft],
    [a.bgMuted, b.bgMuted],
    [a.text, b.text],
    [a.textMuted, b.textMuted],
    [a.textInverse, b.textInverse],
    [a.border, b.border],
    [a.code, b.code],
    [a.status.tip.accent, b.status.tip.accent],
    [a.status.tip.soft, b.status.tip.soft],
    [a.status.warning.accent, b.status.warning.accent],
    [a.status.warning.soft, b.status.warning.soft],
    [a.status.info.accent, b.status.info.accent],
    [a.status.info.soft, b.status.info.soft],
    [a.status.danger.accent, b.status.danger.accent],
    [a.status.danger.soft, b.status.danger.soft],
  ]
  // 按源色长度从长到短，避免"#fff"误匹配"#ffffff"中的前缀
  pairs.sort((x, y) => y[0].length - x[0].length)
  // 去重：source 相同时保留第一个
  const seen = new Set<string>()
  return pairs.filter(([from]) => {
    const key = from.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function replaceAllCaseInsensitive(input: string, from: string, to: string): string {
  if (!from) return input
  const lower = input.toLowerCase()
  const fromLower = from.toLowerCase()
  let out = ''
  let i = 0
  while (i < input.length) {
    if (lower.slice(i, i + fromLower.length) === fromLower) {
      out += to
      i += fromLower.length
    } else {
      out += input[i]
      i += 1
    }
  }
  return out
}
