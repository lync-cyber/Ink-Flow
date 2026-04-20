/**
 * 容器语法契约
 *
 * 每个容器至少验证：
 *   - fence 语法被识别（产生 class="container-xxx"）
 *   - info 作为标题被注入；attrs 被读取
 *   - 嵌套容器（compare / pros / cons）用 4 vs 3 冒号 fence 长度区分
 */

import { describe, it, expect } from 'vitest'
import { render } from '../src/pipeline'
import { defaultTheme } from '../src/themes/default'

function run(md: string): string {
  return render({ md, theme: defaultTheme }).html
}

describe('admonitions', () => {
  it('tip：识别 fence，注入标题', () => {
    const out = run('::: tip 小贴士\n正文内容\n:::\n')
    expect(out).toMatch(/class="container-tip(\s|")/)
    expect(out).toContain('小贴士')
    expect(out).toContain('正文内容')
  })

  it('warning / info / danger 都识别', () => {
    const out = run(
      '::: warning 注意\na\n:::\n' +
      '::: info 说明\nb\n:::\n' +
      '::: danger 警告\nc\n:::\n',
    )
    expect(out).toMatch(/class="container-warning(\s|")/)
    expect(out).toMatch(/class="container-info(\s|")/)
    expect(out).toMatch(/class="container-danger(\s|")/)
  })

  it('不含 emoji（质感优先）', () => {
    const out = run('::: tip 小贴士\n正文\n:::\n')
    expect(out).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
  })
})

describe('intro / cover / author / section-title', () => {
  it('intro 容器识别且 info 成为标题', () => {
    const out = run('::: intro 开场白\n正文\n:::\n')
    expect(out).toMatch(/class="container-intro"/)
    expect(out).toContain('开场白')
  })

  it('author 读取 attrs.role', () => {
    const out = run('::: author 张三 role=前端工程师\n简介\n:::\n')
    expect(out).toMatch(/class="container-author"/)
    expect(out).toContain('张三')
    expect(out).toContain('前端工程师')
  })

  it('section-title 生成独立容器 class', () => {
    const out = run('::: section-title 第一章\n:::\n')
    expect(out).toMatch(/class="container-section-title(\s|")/)
    expect(out).toContain('第一章')
  })
})

describe('quote-card / highlight', () => {
  it('quote-card 识别，byline 通过 info', () => {
    const out = run('::: quote-card 苏轼\n人生如逆旅\n:::\n')
    expect(out).toMatch(/class="container-quote-card(\s|")/)
    expect(out).toContain('人生如逆旅')
    // byline 渲染在关闭后：含"— 苏轼"
    expect(out).toContain('苏轼')
  })

  it('highlight 块识别', () => {
    const out = run('::: highlight\n核心观点\n:::\n')
    expect(out).toMatch(/class="container-highlight"/)
    expect(out).toContain('核心观点')
  })
})

describe('compare · pros · cons 嵌套', () => {
  it('外 4 冒号 + 内 3 冒号 → 两列嵌套', () => {
    const src =
      ':::: compare\n' +
      '::: pros 优点\n优A\n:::\n' +
      '::: cons 缺点\n缺B\n:::\n' +
      '::::\n'
    const out = run(src)
    expect(out).toMatch(/class="container-compare(\s|")/)
    expect(out).toMatch(/class="container-pros(\s|")/)
    expect(out).toMatch(/class="container-cons(\s|")/)
    expect(out).toContain('优A')
    expect(out).toContain('缺B')
  })

  it('两列使用 display:table-cell 保证等高（且不走 flex）', () => {
    const src =
      ':::: compare\n::: pros\nA\n:::\n::: cons\nB\n:::\n::::\n'
    const out = run(src)
    // 外层 table + 内列 table-cell：微信粘贴后保留、两列内容长短不一时等高
    expect(out).toMatch(/container-compare[^>]*display:\s*table/)
    expect(out).toMatch(/container-pros[^>]*display:\s*table-cell/)
    expect(out).toMatch(/container-cons[^>]*display:\s*table-cell/)
    expect(out).not.toMatch(/display:\s*flex/)
  })

  it('两列内部的 p / li 被压到 13px 且 letter-spacing:0（窄栏预算）', () => {
    const src =
      ':::: compare\n' +
      '::: pros 方案 A\n方案 A 的正文。\n\n- 要点一二三四\n:::\n' +
      '::: cons 方案 B\n- 要点一二三四\n:::\n' +
      '::::\n'
    const out = run(src)
    // juice 内联后栏内 p/li 必须落到 13px（否则 CJK 文字在 ~150px 栏里阶梯式换行）
    expect(out).toMatch(/container-pros[\s\S]*?<p[^>]*font-size:\s*13px/)
    expect(out).toMatch(/container-pros[\s\S]*?<li[^>]*font-size:\s*13px/)
    // letter-spacing 必须被覆盖为 0（全局是 1px，窄栏里会多出 ~10% 占宽）
    expect(out).toMatch(/container-pros[\s\S]*?<p[^>]*letter-spacing:\s*0/)
  })
})

describe('steps / divider', () => {
  it('steps 识别', () => {
    const out = run('::: steps 安装步骤\n1. a\n2. b\n:::\n')
    expect(out).toMatch(/class="container-steps(\s|")/)
    expect(out).toContain('安装步骤')
  })

  it('divider variant=wave 产出 SVG 无 id 无 url 引号', () => {
    const out = run('::: divider variant=wave\n:::\n')
    expect(out).toMatch(/class="container-divider(\s|")/)
    expect(out).toMatch(/<svg/)
    // 经 wxPatch：SVG 内部不应有 id
    expect(out).not.toMatch(/<svg[^>]*\sid=/)
  })

  it('divider 默认 variant 为线条', () => {
    const out = run('::: divider\n:::\n')
    expect(out).toMatch(/class="container-divider(\s|")/)
    // 默认 variant=line：用 hr
    expect(out).toMatch(/<hr/)
  })
})

describe('footer-cta / recommend / qrcode', () => {
  it('footer-cta 读取 info 与 cta attr', () => {
    const out = run('::: footer-cta 欢迎关注 cta=点此关注\n描述文案\n:::\n')
    expect(out).toMatch(/class="container-footer-cta"/)
    expect(out).toContain('欢迎关注')
    expect(out).toContain('点此关注')
  })

  it('recommend 块识别', () => {
    const out = run('::: recommend 推荐阅读\n- [A](http://a.com)\n:::\n')
    expect(out).toMatch(/class="container-recommend"/)
    expect(out).toContain('推荐阅读')
  })

  it('qrcode 块识别', () => {
    const out = run('::: qrcode 扫码关注\n:::\n')
    expect(out).toMatch(/class="container-qrcode"/)
    expect(out).toContain('扫码关注')
  })
})

describe('mpvoice / mpvideo', () => {
  it('mpvoice 默认占位卡', () => {
    const out = run('::: mpvoice 本期播客\n:::\n')
    expect(out).toMatch(/class="container-mpvoice"/)
    expect(out).toContain('本期播客')
  })

  it('mpvideo qqvid 渲染腾讯视频 iframe（v.qq.com 白名单）', () => {
    const out = run('::: mpvideo qqvid=w1234abcd 片头\n:::\n')
    expect(out).toMatch(/<iframe[^>]*v\.qq\.com/)
    // 白名单保留
    expect(out).toContain('vid=w1234abcd')
  })

  it('mpvideo 无 qqvid → 占位卡', () => {
    const out = run('::: mpvideo 待补视频\n:::\n')
    expect(out).toMatch(/class="container-mpvideo"/)
    expect(out).not.toMatch(/<iframe/)
  })
})

describe('info / attrs 解析', () => {
  it('attrs 支持引号包围空格值', () => {
    const out = run('::: author 张三 role="高级架构师"\n简介\n:::\n')
    expect(out).toContain('高级架构师')
  })

  it('多个 attrs 共存', () => {
    const out = run('::: divider variant=dots extra=unused\n:::\n')
    expect(out).toMatch(/class="container-divider(\s|")/)
    // dots variant 用 circle
    expect(out).toMatch(/<circle/)
  })
})
