/**
 * Variant Sanity 契约（v2 P1 同质化修复后的回归基线）
 *
 * 覆盖矩阵：
 *   6 kind（admonition / quote / compare / steps / divider / sectionTitle）
 *   × 23 个 variant
 *   × 5 套主题（default / tech-geek / life-aesthetic / business-finance / literary-humanism）
 *
 * 每组 render 必须：
 *   ① 零抛错（variant 代码不炸、themeCSS 守卫不炸、juice / wxPatch 全程不炸）
 *   ② 输出含 `container-{kindName}--{variantId}` 双 class（组件库 UI 反查点）
 *   ③ HTML 全文不得出现被微信剥离的 CSS（position:/float:/@media/@keyframes/:hover/:active/-webkit-）
 *   ④ HTML 内嵌 SVG 不得出现 id 属性 / url('…') / url("…")（粘贴到公众号会坏）
 *   ⑤ juice 后不再残留 <style> 标签（主题 CSS 已全部内联到元素 style 属性）
 *
 * 另有每个 variant 在默认主题下的 inline snapshot，任何 variant 代码改动都会被测试显式捕获。
 */

import { describe, expect, it } from 'vitest'
import { render } from '../src/pipeline'
import { themeList, defaultTheme } from '../src/themes'
import { VARIANT_IDS, type VariantKind } from '../src/themes/types'

type Kind = VariantKind
type VariantCase = {
  kind: Kind
  id: string
  /** 用于生成 markdown fence 的容器名 */
  containerName: string
  md: string
}

/** 构造 6 大类的测试 fence */
function buildCases(): VariantCase[] {
  const out: VariantCase[] = []
  for (const id of VARIANT_IDS.admonition) {
    out.push({
      kind: 'admonition',
      id,
      containerName: 'tip',
      md: `::: tip 测试标题 variant=${id}\n第一行正文。\n第二行正文，含 ==高亮== 与 \`code\`。\n:::\n`,
    })
  }
  for (const id of VARIANT_IDS.quote) {
    out.push({
      kind: 'quote',
      id,
      containerName: 'quote-card',
      md: `::: quote-card 苏轼 variant=${id}\n人生如逆旅，我亦是行人。\n:::\n`,
    })
  }
  for (const id of VARIANT_IDS.compare) {
    out.push({
      kind: 'compare',
      id,
      containerName: 'compare',
      md:
        `:::: compare variant=${id}\n\n` +
        `::: pros 正方\n- 要点 A\n- 要点 B\n:::\n\n` +
        `::: cons 反方\n- 要点 C\n- 要点 D\n:::\n\n` +
        `::::\n`,
    })
  }
  for (const id of VARIANT_IDS.steps) {
    out.push({
      kind: 'steps',
      id,
      containerName: 'steps',
      md:
        `::: steps 操作步骤 variant=${id}\n` +
        `### 第一步\n准备材料。\n\n` +
        `### 第二步\n下锅翻炒。\n\n` +
        `### 第三步\n起锅装盘。\n` +
        `:::\n`,
    })
  }
  for (const id of VARIANT_IDS.divider) {
    out.push({
      kind: 'divider',
      id,
      containerName: 'divider',
      md: `::: divider variant=${id}${id === 'glyph' ? ' glyph=◆' : ''}\n:::\n`,
    })
  }
  for (const id of VARIANT_IDS.sectionTitle) {
    out.push({
      kind: 'sectionTitle',
      id,
      containerName: 'section-title',
      md: `::: section-title 章节标题 variant=${id}\n:::\n`,
    })
  }
  return out
}

const CASES = buildCases()

// 微信粘贴会剥离的 CSS / 伪类（与 .claude/rules/data/platform-limits.yaml 的 forbidden_css 对齐）
const FORBIDDEN_CSS_PATTERNS: Array<[RegExp, string]> = [
  [/position\s*:/i, 'position:* 在微信粘贴后被剥离'],
  [/float\s*:/i, 'float:* 会被微信剥离'],
  [/@media\b/i, '@media 查询不被微信支持'],
  [/@keyframes\b/i, '@keyframes 动画不被微信支持'],
  [/:hover\b/i, ':hover 伪类在微信无效'],
  [/:active\b/i, ':active 伪类在微信无效'],
  [/-webkit-(?!print-color-adjust)/i, '-webkit- 前缀会被剥离（print-color-adjust 为 juice 注入例外）'],
]

function assertNoForbiddenCss(html: string, label: string): void {
  for (const [pattern, reason] of FORBIDDEN_CSS_PATTERNS) {
    if (pattern.test(html)) {
      throw new Error(`[${label}] 产出命中禁用 CSS：${reason}. match=${html.match(pattern)?.[0]}`)
    }
  }
}

/** 抓出所有 inline SVG 片段（从 `<svg` 到 `</svg>`） */
function extractSvgs(html: string): string[] {
  const out: string[] = []
  const re = /<svg[\s\S]*?<\/svg>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) out.push(m[0])
  return out
}

function assertSvgSafe(html: string, label: string): void {
  for (const svg of extractSvgs(html)) {
    expect(svg, `${label} · SVG 含 id=`).not.toMatch(/\sid="/)
    expect(svg, `${label} · SVG 含 url('`).not.toMatch(/url\(['"]/)
  }
}

// -------------------- 主矩阵：5 × 23 = 115 组合全部跑一遍 --------------------

for (const theme of themeList) {
  describe(`${theme.id} · variant sanity`, () => {
    for (const c of CASES) {
      const label = `${theme.id} · ${c.kind}:${c.id}`
      it(label, () => {
        const { html } = render({ md: c.md, theme })

        // ① 非空产物
        expect(html.length, label).toBeGreaterThan(0)

        // ② 双 class：container-X + container-X--{id}
        const baseRe = new RegExp(`class="[^"]*container-${c.containerName}(\\s|--|")`)
        const variantRe = new RegExp(`container-${c.containerName}--${c.id}\\b`)
        expect(html, `${label} 缺基础 class`).toMatch(baseRe)
        expect(html, `${label} 缺 variant class`).toMatch(variantRe)

        // ③ CSS 禁用字清零
        assertNoForbiddenCss(html, label)

        // ④ SVG 无 id / url 引号
        assertSvgSafe(html, label)

        // ⑤ 无 <style>（juice 后应全部内联）
        expect(html, `${label} 残留 <style>`).not.toMatch(/<style\b/i)
      })
    }
  })
}

// -------------------- 跨主题覆盖验证（防止漏跑） --------------------

describe('枚举完整性', () => {
  it('6 kind × 23 variant 全部进入测试矩阵', () => {
    const totals: Record<string, number> = {}
    for (const c of CASES) totals[c.kind] = (totals[c.kind] ?? 0) + 1
    expect(totals).toEqual({
      admonition: 6,
      quote: 4,
      compare: 3,
      steps: 3,
      divider: 5,
      sectionTitle: 2,
    })
  })

  it('5 套主题都进入矩阵', () => {
    expect(themeList.map((t) => t.id)).toEqual([
      'default',
      'tech-geek',
      'life-aesthetic',
      'business-finance',
      'literary-humanism',
    ])
  })
})

// -------------------- HTML 片段快照（默认主题，每 variant 一条） --------------------

/**
 * 目的：variant wrapperCSS / svgSlot / titleCSS 的任何意外改动都要被显式捕获，
 * 避免被 ① 的"不抛错"和 ② 的"含 class"放行。
 *
 * 取"render 输出里定位到 variant wrapper 的那一段"做快照 —— 避免把整篇 html + 大段主题 CSS 都吸进来。
 */

function sliceVariantChunk(html: string, containerName: string, variantId: string): string {
  const re = new RegExp(
    `<section[^>]*container-${containerName}--${variantId}[\\s\\S]*?</section>`,
  )
  const m = html.match(re)
  return m?.[0] ?? '<no-match>'
}

describe('默认主题 · 每 variant 渲染片段快照', () => {
  for (const c of CASES) {
    it(`${c.kind}:${c.id}`, () => {
      const { html } = render({ md: c.md, theme: defaultTheme })
      const chunk = sliceVariantChunk(html, c.containerName, c.id)
      expect(chunk).not.toBe('<no-match>')
      // 写入 __snapshots__/variant-sanity.spec.ts.snap；首次运行自动生成
      expect(chunk).toMatchSnapshot()
    })
  }
})
