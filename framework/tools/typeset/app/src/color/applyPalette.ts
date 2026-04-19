/**
 * 把 palette 应用到基主题上，生成一个新的 Theme。
 *
 * 策略（避免"基主题已合并值被当 override 透传"的污染）：
 *   1. tokens.colors 全部被 palette 覆盖，其余 tokens 沿用基主题
 *   2. 用"基主题实际的 override"（= base 当前值 − baseElements(base.tokens) 的差值）做 delta
 *   3. 对 delta 做 color recolor（把基主题 tokens.colors 里的 hex 替换为新 palette 的 hex）
 *   4. 交给 buildTheme 时，baseContainers(newTokens) 重算基线，delta 仅覆盖主题真正定制过的字段
 *
 * 这样：
 *   - 未被基主题覆盖的容器/元素 → 跟着新 tokens 走
 *   - 基主题真正自定义过的字段（如 life-aesthetic 的 h2 dotted border-bottom）→ 保留结构 + 换色
 *   - 基主题里 hardcoded 的非 tokens 色（已知限制）→ 保持原样
 */

import { baseContainers, baseElements, baseInline, buildTheme } from '../themes/_shared/buildTheme'
import type { SvgVariant } from '../themes/_shared/svgAssets'
import type { CSSObject, Theme, ThemeTokens } from '../themes/types'
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

type CSSMap = Record<string, CSSObject>

export function applyPalette(opts: ApplyPaletteOptions): Theme {
  const { base, seed } = opts
  const newColors = derivePalette(seed)
  const newTokens: ThemeTokens = {
    ...base.tokens,
    colors: newColors,
  }
  const variant: SvgVariant = opts.variant ?? BASE_VARIANT[base.id] ?? 'geometric'

  // 重建基主题的"默认基线"——这是 buildTheme 在 apply 前会产生的那份干净起点。
  // base.elements/containers/inline 与这份基线的差值才是"主题作者真正的定制"。
  const baseElBaseline = baseElements(base.tokens)
  const baseCoBaseline = baseContainers(base.tokens)
  const baseInBaseline = baseInline(base.tokens)

  const elementsDelta = diff(base.elements as unknown as CSSMap, baseElBaseline as unknown as CSSMap)
  const containersDelta = diff(base.containers as unknown as CSSMap, baseCoBaseline as unknown as CSSMap)
  const inlineDelta = diff(base.inline as unknown as CSSMap, baseInBaseline as unknown as CSSMap)

  return buildTheme({
    id: opts.id ?? `${base.id}--custom`,
    name: opts.name ?? `${base.name} · 自定义`,
    description: `基于 ${base.name} 的自定义配色`,
    variant,
    tokens: newTokens,
    elementOverrides: recolor(elementsDelta, base.tokens.colors, newColors) as never,
    containerOverrides: recolor(containersDelta, base.tokens.colors, newColors) as never,
    inlineOverrides: recolor(inlineDelta, base.tokens.colors, newColors) as never,
  })
}

/** 逐 key / 逐 prop 对比；只保留 merged 与 baseline 不同的字段。 */
function diff(merged: CSSMap, baseline: CSSMap): CSSMap {
  const out: CSSMap = {}
  for (const [key, mergedObj] of Object.entries(merged)) {
    const baseObj = baseline[key] ?? {}
    const delta: CSSObject = {}
    for (const [prop, val] of Object.entries(mergedObj)) {
      if (baseObj[prop] !== val) {
        delta[prop] = val
      }
    }
    if (Object.keys(delta).length > 0) {
      out[key] = delta
    }
  }
  return out
}

/**
 * 对一个 CSSObject 集合做"色值替换"：把 base 色表里出现过的 hex 在字符串里替换为新色。
 * 匹配规则：
 *   - 大小写不敏感
 *   - 3 字符 hex（#abc）也能匹配 6 字符（#aabbcc）的等价形式
 *   - 按长度从长到短优先，避免短色覆盖长色的子串
 */
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

/** #abc → #aabbcc；其它格式原样返回 */
function expandShortHex(hex: string): string {
  const m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex.trim())
  if (!m) return hex
  return `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`
}

function collectColorPairs(
  a: ThemeTokens['colors'],
  b: ThemeTokens['colors'],
): Array<[string, string]> {
  const raw: Array<[string, string]> = [
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
  // 每个 pair 再展开一份"短 hex → 新色"的别名，提升命中率
  const expanded: Array<[string, string]> = []
  for (const [from, to] of raw) {
    expanded.push([from, to])
    const long = expandShortHex(from)
    if (long !== from) expanded.push([long, to])
  }
  // 按源色长度从长到短，避免"#fff"误匹配"#ffffff"中的前缀
  expanded.sort((x, y) => y[0].length - x[0].length)
  // 去重：source 相同时保留第一个
  const seen = new Set<string>()
  return expanded.filter(([from]) => {
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
