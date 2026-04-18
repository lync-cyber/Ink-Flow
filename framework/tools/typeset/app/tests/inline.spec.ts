/**
 * 行内扩展契约
 *
 * - [.x.]  → <span class="wx-emphasis">x</span>
 * - [~x~] → <span class="wx-wavy">x</span>
 * - 跨行不匹配（避免吞大段）
 * - 空内容不匹配（保留原文）
 * - 嵌套普通 markdown（**粗体** / ==高亮==）仍在 span 内渲染
 */

import { describe, it, expect } from 'vitest'
import { render } from '../src/pipeline'
import { defaultTheme } from '../src/themes/default'

function run(md: string): string {
  return render({ md, theme: defaultTheme }).html
}

describe('wx-emphasis / wx-wavy', () => {
  it('[.着重.] → wx-emphasis span', () => {
    const out = run('这是 [.关键字.]。\n')
    expect(out).toMatch(/<span class="wx-emphasis"[^>]*>关键字<\/span>/)
  })

  it('[~波浪~] → wx-wavy span', () => {
    const out = run('注意 [~这里~]。\n')
    expect(out).toMatch(/<span class="wx-wavy"[^>]*>这里<\/span>/)
  })

  it('内部保留粗体渲染', () => {
    const out = run('[.**加粗内嵌**.]\n')
    expect(out).toMatch(/class="wx-emphasis"/)
    expect(out).toMatch(/<strong[^>]*>加粗内嵌<\/strong>/)
  })

  it('空内容不匹配：`[..]` 原样保留（不产生 span）', () => {
    const out = run('空白 [..] 结束\n')
    expect(out).not.toMatch(/class="wx-emphasis"/)
    expect(out).toContain('[..]')
  })

  it('跨行不匹配：换行后放弃', () => {
    const out = run('第一行 [.试试\n跨行.]\n')
    expect(out).not.toMatch(/class="wx-emphasis"/)
  })

  it('同一行多处匹配都生效', () => {
    const out = run('[.A.] + [.B.] = [~C~]\n')
    expect(out.match(/wx-emphasis/g)?.length).toBe(2)
    expect(out.match(/wx-wavy/g)?.length).toBe(1)
  })
})
