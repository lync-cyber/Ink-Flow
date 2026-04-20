/**
 * 配色生成器 · applyPalette 契约
 *
 * 覆盖：
 *  - derivePalette 从 seed 推导完整 tokens.colors，关键字段都给值
 *  - seedFromPrimary 自动补全辅色/点缀，主色色相保留
 *  - applyPalette 产出新 Theme：id 带 custom 后缀、色值被替换
 *  - checkContrast 对"低对比度"主色返回 fail
 */

import { describe, expect, it } from 'vitest'
import { applyPalette } from '../src/color/applyPalette'
import { checkContrast, derivePalette, seedFromPrimary } from '../src/color/generator'
import { defaultTheme } from '../src/themes/default'
import { lifeAestheticTheme } from '../src/themes/life-aesthetic'

describe('derivePalette', () => {
  it('给出 seed → 11 个基础色 + 4 套 status', () => {
    const colors = derivePalette({ primary: '#2d6fdd', secondary: '#1f3b70', accent: '#4ec9b0' })
    expect(colors.primary.toLowerCase()).toBe('#2d6fdd')
    expect(colors.bg).toBeTruthy()
    expect(colors.bgSoft).toBeTruthy()
    expect(colors.bgMuted).toBeTruthy()
    expect(colors.text).toBeTruthy()
    expect(colors.textMuted).toBeTruthy()
    expect(colors.textInverse).toBeTruthy()
    expect(colors.border).toBeTruthy()
    expect(colors.code).toBeTruthy()
    expect(colors.status.tip.accent).toBeTruthy()
    expect(colors.status.warning.accent).toBeTruthy()
    expect(colors.status.info.accent).toBeTruthy()
    expect(colors.status.danger.accent).toBeTruthy()
  })

  it('dark=true → 暗底 bg', () => {
    const colors = derivePalette({ primary: '#c9a96c', secondary: '#1a1a1a', accent: '#f4dfa3', dark: true })
    expect(colors.bg).toBe('#12141a')
    expect(colors.text).toMatch(/^#e/)
  })
})

describe('seedFromPrimary', () => {
  it('主色原样保留，辅色/点缀自动补全', () => {
    const s = seedFromPrimary('#2d6fdd')
    expect(s.primary.toLowerCase()).toBe('#2d6fdd')
    expect(s.secondary).not.toBe(s.primary)
    expect(s.accent).not.toBe(s.primary)
  })
})

describe('applyPalette', () => {
  it('默认主题 + 蓝色 seed → 产出新 Theme，id 以 --custom 结尾', () => {
    const newTheme = applyPalette({
      base: defaultTheme,
      seed: { primary: '#2d6fdd', secondary: '#1f3b70', accent: '#4ec9b0' },
    })
    expect(newTheme.id).toBe('default--custom')
    expect(newTheme.tokens.colors.primary.toLowerCase()).toBe('#2d6fdd')
    // 元素样式里的 primary 应被替换
    const h2 = JSON.stringify(newTheme.elements.h2)
    expect(h2).toMatch(/#2d6fdd/i)
  })

  it('保留基主题的元素样式结构（elementOverrides 不丢关键字段）', () => {
    // life-aesthetic 的 h2 有 dotted border-bottom，应该在 applyPalette 后仍然是 dotted
    const newTheme = applyPalette({
      base: lifeAestheticTheme,
      seed: { primary: '#2d6fdd', secondary: '#1f3b70', accent: '#4ec9b0' },
    })
    const h2 = newTheme.elements.h2 as Record<string, string>
    expect(h2['border-bottom']).toMatch(/dotted/)
  })
})

describe('checkContrast', () => {
  it('高对比 pass=true', () => {
    const { pass, ratio } = checkContrast('#000000', '#ffffff')
    expect(pass).toBe(true)
    expect(ratio).toBeGreaterThan(3)
  })

  it('低对比 pass=false', () => {
    const { pass } = checkContrast('#dddddd', '#ffffff')
    expect(pass).toBe(false)
  })
})
