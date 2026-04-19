/**
 * 主题设计系统契约
 *
 * - 默认主题：注入 status 配色 + SVG assets 全齐
 * - 切换主题时：admonition 外框色、divider SVG、h2 装饰前缀等全变
 * - 容器渲染器必须"读 theme"，不得把配色写死
 * - 主题里任何 CSSObject 出现 font-family → ThemeAuthoringError
 * - 经 wxPatch 后，主题注入的 SVG 仍然是无 id / 无 url 引号的合法产物
 */

import { describe, it, expect } from 'vitest'
import { render } from '../src/pipeline'
import { defaultTheme } from '../src/themes/default'
import { generateThemeCSS } from '../src/pipeline/themeCSS'
import { ThemeAuthoringError, type Theme } from '../src/themes/types'

function run(md: string, theme: Theme = defaultTheme): string {
  return render({ md, theme }).html
}

/**
 * 构造一个"基于默认主题"的克隆，覆盖其中若干字段。
 * 独立 id 确保 mdCache 不会复用旧实例。
 */
function cloneTheme(id: string, patch: (base: Theme) => Theme): Theme {
  const patched = patch(JSON.parse(JSON.stringify(defaultTheme)) as Theme)
  return { ...patched, id, assets: { ...defaultTheme.assets, ...patched.assets } }
}

describe('默认主题 · 资产完整', () => {
  it('提供 h2Prefix / dividerXxx / quoteMark / sectionCorner / 4 图标 / stepBadge', () => {
    const a = defaultTheme.assets
    expect(a.h2Prefix).toBeTypeOf('string')
    expect(a.dividerWave).toBeTypeOf('string')
    expect(a.dividerDots).toBeTypeOf('string')
    expect(a.dividerFlower).toBeTypeOf('string')
    expect(a.quoteMark).toBeTypeOf('string')
    expect(a.sectionCorner).toBeTypeOf('string')
    expect(a.tipIcon).toBeTypeOf('string')
    expect(a.warningIcon).toBeTypeOf('string')
    expect(a.infoIcon).toBeTypeOf('string')
    expect(a.dangerIcon).toBeTypeOf('string')
    expect(a.stepBadge?.(1)).toMatch(/<svg/)
  })

  it('资产 SVG 字符串本身不含 id / url 引号（避免 wxPatch 前后不一致）', () => {
    const a = defaultTheme.assets
    const all = [
      a.h2Prefix,
      a.dividerWave,
      a.dividerDots,
      a.dividerFlower,
      a.quoteMark,
      a.sectionCorner,
      a.tipIcon,
      a.warningIcon,
      a.infoIcon,
      a.dangerIcon,
      a.stepBadge?.(1),
    ].filter((s): s is string => typeof s === 'string')
    for (const s of all) {
      expect(s).not.toMatch(/\sid="/)
      expect(s).not.toMatch(/url\(['"]/)
    }
  })
})

describe('主题资产在最终 HTML 中确实注入', () => {
  it('h2 前带 h2Prefix SVG', () => {
    const out = run('## 标题\n正文。\n')
    // 经 juice + wxPatch 后，h2 内保留 SVG
    expect(out).toMatch(/<h2[^>]*>\s*<svg[\s\S]*?<\/svg>/)
    expect(out).toContain('标题')
  })

  it('divider wave/dots/flower 来自 theme.assets（≥ 200 宽度视图）', () => {
    const wave = run('::: divider variant=wave\n:::\n')
    expect(wave).toMatch(/<svg[^>]*viewBox="0 0 240 14"/)
    const dots = run('::: divider variant=dots\n:::\n')
    expect(dots).toMatch(/<svg[^>]*viewBox="0 0 240 8"/)
    const flower = run('::: divider variant=flower\n:::\n')
    expect(flower).toMatch(/<svg[^>]*viewBox="0 0 240 18"/)
  })

  it('quote-card 使用 theme.assets.quoteMark', () => {
    const out = run('::: quote-card 苏轼\n人生如逆旅\n:::\n')
    // 主题自带大号 SVG 引号（viewBox 0 0 40 32）
    expect(out).toMatch(/<svg[^>]*viewBox="0 0 40 32"/)
  })

  it('section-title 使用 theme.assets.sectionCorner', () => {
    const out = run('::: section-title 第一章\n:::\n')
    expect(out).toMatch(/<svg[^>]*viewBox="0 0 18 18"/)
    expect(out).toContain('第一章')
  })

  it('admonitions 注入对应图标（tip/warning/info/danger）', () => {
    const tip = run('::: tip\n正文\n:::\n')
    const warn = run('::: warning\n正文\n:::\n')
    const info = run('::: info\n正文\n:::\n')
    const danger = run('::: danger\n正文\n:::\n')
    // 四个都应含一个 16×16 viewBox 的图标
    for (const out of [tip, warn, info, danger]) {
      expect(out).toMatch(/<svg[^>]*viewBox="0 0 16 16"/)
    }
  })
})

describe('主题切换 · 完整脱钩', () => {
  it('覆盖 status.tip.accent → admonition tip 左色条 / 标题色都换', () => {
    const custom = cloneTheme('custom-tip', (base) => {
      base.tokens.colors.status.tip = { accent: '#ff0055', soft: '#fff0f4' }
      return base
    })
    const out = run('::: tip 自定义\n正文\n:::\n', custom)
    // 小写 hex 规范化保留
    expect(out.toLowerCase()).toMatch(/border-left:\s*3px solid #ff0055/)
    expect(out.toLowerCase()).toMatch(/background-color:\s*#fff0f4/)
    expect(out.toLowerCase()).toMatch(/color:\s*#ff0055/)
  })

  it('移除 h2Prefix 资产 → <h2> 不再注入 SVG', () => {
    const bare = cloneTheme('bare-h2', (base) => {
      base.assets.h2Prefix = undefined
      return base
    })
    // cloneTheme 把 defaultTheme.assets 合并进去；再抹掉 h2Prefix
    bare.assets = { ...bare.assets, h2Prefix: undefined }
    const out = run('## 标题\n正文。\n', bare)
    expect(out).not.toMatch(/<h2[^>]*>\s*<svg/)
  })

  it('替换 quoteMark 资产 → 新 SVG 出现', () => {
    const CUSTOM_MARK =
      '<svg viewBox="0 0 7 7" width="7" height="7" xmlns="http://www.w3.org/2000/svg"><circle cx="3.5" cy="3.5" r="3" fill="#000"/></svg>'
    const custom = cloneTheme('custom-mark', (base) => {
      base.assets.quoteMark = CUSTOM_MARK
      return base
    })
    custom.assets = { ...custom.assets, quoteMark: CUSTOM_MARK }
    const out = run('::: quote-card\n金句\n:::\n', custom)
    expect(out).toMatch(/viewBox="0 0 7 7"/)
    // 原装 40×32 引号不再出现
    expect(out).not.toMatch(/viewBox="0 0 40 32"/)
  })
})

describe('themeCSS font-family 守卫', () => {
  it('任一 CSSObject 含 font-family → 抛 ThemeAuthoringError', () => {
    const bad = cloneTheme('bad-font', (base) => {
      ;(base.elements.p as Record<string, string>)['font-family'] = 'Inter'
      return base
    })
    expect(() => generateThemeCSS(bad)).toThrowError(ThemeAuthoringError)
  })
})

describe('themeCSS display:flex 守卫', () => {
  it('任一 CSSObject 声明 display:flex → 抛 ThemeAuthoringError（微信粘贴后会被剥）', () => {
    const bad = cloneTheme('bad-flex', (base) => {
      ;(base.elements.p as Record<string, string>)['display'] = 'flex'
      return base
    })
    expect(() => generateThemeCSS(bad)).toThrowError(ThemeAuthoringError)
  })

  it('display:inline-flex 同样被拒', () => {
    const bad = cloneTheme('bad-inline-flex', (base) => {
      ;(base.elements.p as Record<string, string>)['display'] = 'inline-flex'
      return base
    })
    expect(() => generateThemeCSS(bad)).toThrowError(ThemeAuthoringError)
  })

  it('display:table-cell 允许（compare 容器等高布局依赖这条）', () => {
    const ok = cloneTheme('ok-table-cell', (base) => {
      ;(base.containers.compare as Record<string, string>)['display'] = 'table'
      return base
    })
    expect(() => generateThemeCSS(ok)).not.toThrow()
  })
})
