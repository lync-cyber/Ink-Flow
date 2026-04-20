/**
 * wxPatch 契约
 *
 * 每个 patch 至少两个用例（典型命中 / 边界不改），外加 applyWxPatches 顺序与幂等。
 */

import { describe, it, expect } from 'vitest'
import {
  applyWxPatches,
  patchListWrap,
  stripForbiddenAttrs,
  stripForbiddenTags,
  stripFontFamily,
  patchSvgUrlQuotes,
  patchSvgIds,
  patchFlexToFallback,
  patchSvgWhiteBg,
} from '../src/pipeline/wxPatch'

describe('patchListWrap', () => {
  it('ul/ol 被包一层 section，并带上 data-wx-list-wrap', () => {
    const input = '<ul style="margin: 12px 0"><li>a</li></ul>'
    const out = patchListWrap(input)
    expect(out).toMatch(/<section[^>]*data-wx-list-wrap=""[^>]*>[\s\S]*<ul[^>]*>/)
    // 样式复制到 section
    expect(out).toMatch(/<section[^>]*style="margin: 12px 0"/)
  })

  it('已有 data-wx-list-wrap 外层：不二次包裹（幂等）', () => {
    const pre = '<section data-wx-list-wrap=""><ul><li>a</li></ul></section>'
    const once = patchListWrap(pre)
    const twice = patchListWrap(once)
    expect(once).toBe(twice)
    // 只应出现一次 data-wx-list-wrap
    expect(once.match(/data-wx-list-wrap/g)?.length).toBe(1)
  })
})

describe('stripForbiddenAttrs', () => {
  it('删除 id 属性', () => {
    const input = '<p id="x" style="color:red">hi</p>'
    const out = stripForbiddenAttrs(input)
    expect(out).not.toMatch(/\sid=/)
    // 无需改动时保留原样，允许 color:red 或 color: red
    expect(out).toMatch(/color:\s*red/)
  })

  it('剥掉 position / top / z-index 等定位声明', () => {
    const input = '<div style="position: absolute; top: 0; color: red; z-index: 9"></div>'
    const out = stripForbiddenAttrs(input)
    expect(out).not.toMatch(/position:/)
    expect(out).not.toMatch(/top:/)
    expect(out).not.toMatch(/z-index:/)
    expect(out).toMatch(/color: red/)
  })

  it('没有可剥内容时保持不变（近似：只看关键子串）', () => {
    const input = '<p style="color: red">hi</p>'
    const out = stripForbiddenAttrs(input)
    expect(out).toContain('color: red')
    expect(out).toContain('<p')
    expect(out).toContain('hi')
  })

  it('脚注锚点（fn / fnref 前缀）白名单放行', () => {
    const input =
      '<sup><a href="#fn1" id="fnref1">1</a></sup>' +
      '<li id="fn1"><p>脚注内容 <a href="#fnref1" id="fnref-return-1">↩</a></p></li>' +
      '<p id="random">被删</p>'
    const out = stripForbiddenAttrs(input)
    expect(out).toMatch(/id="fnref1"/)
    expect(out).toMatch(/id="fn1"/)
    expect(out).toMatch(/id="fnref-return-1"/)
    expect(out).not.toMatch(/id="random"/)
  })
})

describe('stripForbiddenTags', () => {
  it('删除 <style>/<script>/<noscript>', () => {
    const input = '<style>p{}</style><p>ok</p><script>1</script><noscript>x</noscript>'
    const out = stripForbiddenTags(input)
    expect(out).not.toMatch(/<style/)
    expect(out).not.toMatch(/<script/)
    expect(out).not.toMatch(/<noscript/)
    expect(out).toMatch(/<p>ok<\/p>/)
  })

  it('iframe 白名单：v.qq.com 保留，其他剥离', () => {
    const input =
      '<iframe src="https://v.qq.com/x/page/a.html"></iframe>' +
      '<iframe src="https://evil.example.com/x"></iframe>'
    const out = stripForbiddenTags(input)
    expect(out).toMatch(/v\.qq\.com/)
    expect(out).not.toMatch(/evil\.example\.com/)
  })
})

describe('stripFontFamily', () => {
  it('剥掉 inline style 中的 font-family，保留其他', () => {
    const input = '<p style="font-family: \'SF Pro\'; color: #111">x</p>'
    const out = stripFontFamily(input)
    expect(out).not.toMatch(/font-family/i)
    expect(out).toMatch(/color: #111/)
  })

  it('没有 font-family 时不动', () => {
    const input = '<p style="color: red">x</p>'
    const out = stripFontFamily(input)
    expect(out).toContain('color: red')
  })
})

describe('patchSvgUrlQuotes', () => {
  it('SVG 子树内：属性和 style 的 url("x") 去引号', () => {
    const input =
      '<svg><rect fill="url(&quot;#grad&quot;)" style="background-image: url(\'a.png\')"/></svg>'
    const out = patchSvgUrlQuotes(input)
    // fill 属性：不再带转义引号
    expect(out).toMatch(/fill="url\(#grad\)"/)
    // style：不再带单引号
    expect(out).toMatch(/background-image: url\(a\.png\)/)
  })

  it('SVG 外的 url() 不动', () => {
    const input = '<div style="background: url(\'a.png\')"></div>'
    const out = patchSvgUrlQuotes(input)
    // 保留单引号
    expect(out).toMatch(/url\('a\.png'\)/)
  })
})

describe('patchSvgIds', () => {
  it('移除 svg 及其子孙的 id', () => {
    const input = '<svg id="s1"><defs><linearGradient id="grad"></linearGradient></defs></svg>'
    const out = patchSvgIds(input)
    expect(out).not.toMatch(/\sid=/)
  })

  it('SVG 外的 id 不动', () => {
    const input = '<p id="x">y</p><svg id="s"><g id="g"/></svg>'
    const out = patchSvgIds(input)
    expect(out).toMatch(/<p id="x">/)
    expect(out).not.toMatch(/<svg id=/)
    expect(out).not.toMatch(/<g id=/)
  })
})

describe('patchFlexToFallback', () => {
  it('display: flex → display: block', () => {
    const input = '<div style="display: flex; gap: 8px"></div>'
    const out = patchFlexToFallback(input)
    expect(out).toMatch(/display: block/)
    expect(out).not.toMatch(/display: flex/)
  })

  it('data-wx-keep-flex 标记的保留', () => {
    const input = '<div data-wx-keep-flex style="display: flex"></div>'
    const out = patchFlexToFallback(input)
    expect(out).toMatch(/display: flex/)
  })
})

describe('patchSvgWhiteBg', () => {
  it('SVG 内 fill="#fff" → #fefefe', () => {
    const input = '<svg><rect fill="#fff" style="stroke: white"/></svg>'
    const out = patchSvgWhiteBg(input)
    expect(out).toMatch(/fill="#fefefe"/)
    expect(out).toMatch(/stroke: #fefefe/)
  })

  it('SVG 外的白色不动', () => {
    const input = '<div style="background: #fff"></div>'
    const out = patchSvgWhiteBg(input)
    expect(out).toMatch(/background: #fff/)
  })
})

describe('applyWxPatches · 顺序 & 幂等', () => {
  it('组合效果：id 被删、font-family 被剥、flex 降级、svg url 去引号', () => {
    const input = `
      <div id="x" style="display: flex; font-family: 'Inter'; color: red">
        <ul><li>a</li></ul>
        <svg id="s"><rect fill="url('#grad')"/></svg>
      </div>
    `
    const out = applyWxPatches(input)
    expect(out).not.toMatch(/\sid="x"/)
    expect(out).not.toMatch(/font-family/i)
    expect(out).toMatch(/display: block/)
    expect(out).toMatch(/fill="url\(#grad\)"/)
    // 列表被 section 包
    expect(out).toMatch(/data-wx-list-wrap/)
  })

  it('幂等：连续调用两次结果一致', () => {
    const input = `
      <p id="p" style="position: absolute; color: red; font-family: x">hi</p>
      <ul><li>a</li></ul>
      <svg id="s"><rect fill="url('#g')"/></svg>
      <style>p{color:red}</style>
    `
    const once = applyWxPatches(input)
    const twice = applyWxPatches(once)
    expect(twice).toBe(once)
  })

  it('opts.svgWhiteBg 默认开（兜底 #fff→#fefefe），显式 false 可关', () => {
    const input = '<svg><rect fill="#fff"/></svg>'
    const def = applyWxPatches(input)
    expect(def).toMatch(/fill="#fefefe"/)
    const off = applyWxPatches(input, { svgWhiteBg: false })
    expect(off).toMatch(/fill="#fff"/)
  })
})
