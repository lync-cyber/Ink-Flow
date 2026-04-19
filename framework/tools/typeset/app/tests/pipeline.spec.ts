/**
 * Step 1 管线烟测
 *
 * 契约：
 *   - render 给定 md + 默认主题，输出 HTML 是字符串
 *   - 产物中不含 <style>（juice 已把样式内联）
 *   - 产物中至少包含一个 style="..." inline 属性（说明 juice 生效）
 *   - generateThemeCSS 对含 font-family 的 Theme 必须 throw
 */

import { describe, it, expect } from 'vitest'
import { render } from '../src/pipeline'
import { generateThemeCSS } from '../src/pipeline/themeCSS'
import { defaultTheme } from '../src/themes/default'
import { ThemeAuthoringError } from '../src/themes/types'

describe('render (Step 1 最小管线)', () => {
  it('输出 HTML 为字符串且包含根节点 class', () => {
    const out = render({
      md: '# Hello\n\n这是**一段**文本。',
      theme: defaultTheme,
    })
    expect(typeof out.html).toBe('string')
    expect(out.html).toContain('markdown-body')
    expect(out.html).toContain('Hello')
  })

  it('juice 已内联：产物不含 <style> 标签', () => {
    const out = render({
      md: '# Title\n\ntext',
      theme: defaultTheme,
    })
    expect(out.html).not.toMatch(/<style[\s>]/i)
  })

  it('juice 已内联：产物至少包含一个 inline style 属性', () => {
    const out = render({
      md: '# Title\n\ntext',
      theme: defaultTheme,
    })
    expect(out.html).toMatch(/style="[^"]+"/)
  })

  it('字数与阅读时长是正数', () => {
    const out = render({
      md: '# 标题\n\n' + '中文'.repeat(300),
      theme: defaultTheme,
    })
    expect(out.wordCount).toBeGreaterThan(0)
    expect(out.readingTime).toBeGreaterThanOrEqual(1)
  })
})

describe('generateThemeCSS · font-family 守卫', () => {
  it('合法主题生成 CSS 字符串', () => {
    const css = generateThemeCSS(defaultTheme)
    expect(typeof css).toBe('string')
    expect(css).toContain('.markdown-body')
  })

  it('主题声明 font-family 时 throw ThemeAuthoringError', () => {
    const tainted = JSON.parse(JSON.stringify(defaultTheme))
    tainted.elements.h1 = { ...tainted.elements.h1, 'font-family': 'serif' }
    expect(() => generateThemeCSS(tainted)).toThrow(ThemeAuthoringError)
  })

  it('CSS 产物不含 font-family（确认默认主题合规）', () => {
    const css = generateThemeCSS(defaultTheme)
    expect(css.toLowerCase()).not.toContain('font-family')
  })
})
