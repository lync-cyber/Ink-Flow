/**
 * Preview iframe srcdoc 契约
 *
 * - srcdoc 注入的 CSS 选择器必须**不**匹配 .markdown-body 或其子元素
 * - viewport meta 锁 375px
 * - .phone-viewport 固定 width:375px
 * - iframe 内容区的 HTML 与剪贴板 HTML 一字不差（保真）
 */

import { describe, it, expect } from 'vitest'
import { mount } from './helpers/mount'
import Preview from '../src/components/Preview.vue'

const SAMPLE = '<section class="markdown-body"><h1 style="color:red">Hello</h1><p style="margin:0">text</p></section>'

describe('Preview iframe srcdoc', () => {
  it('保真不变量：传入的 html 在 srcdoc 里一字不差', async () => {
    const { root, unmount } = await mount(Preview, { html: SAMPLE })
    const iframe = root.querySelector('iframe') as HTMLIFrameElement
    expect(iframe).toBeTruthy()
    const srcdoc = iframe.getAttribute('srcdoc') ?? ''
    expect(srcdoc).toContain(SAMPLE)
    unmount()
  })

  it('viewport meta 锁定 width=375', async () => {
    const { root, unmount } = await mount(Preview, { html: SAMPLE })
    const iframe = root.querySelector('iframe') as HTMLIFrameElement
    const srcdoc = iframe.getAttribute('srcdoc') ?? ''
    expect(srcdoc).toMatch(/<meta name="viewport" content="width=375/)
    unmount()
  })

  it('phone-viewport 宽度固定 375px', async () => {
    const { root, unmount } = await mount(Preview, { html: SAMPLE })
    const iframe = root.querySelector('iframe') as HTMLIFrameElement
    const srcdoc = iframe.getAttribute('srcdoc') ?? ''
    expect(srcdoc).toMatch(/\.phone-viewport\s*\{[^}]*width:\s*375px/)
    unmount()
  })

  it('iframe 内样式只选中外框，不选中 .markdown-body 或其子元素', async () => {
    const { root, unmount } = await mount(Preview, { html: SAMPLE })
    const iframe = root.querySelector('iframe') as HTMLIFrameElement
    const srcdoc = iframe.getAttribute('srcdoc') ?? ''
    // 抽出 <style> 块并剥掉 CSS 注释（注释里出现 .markdown-body 等标识不算选择器污染）
    const styleMatch = srcdoc.match(/<style>([\s\S]*?)<\/style>/)
    expect(styleMatch).toBeTruthy()
    const css = styleMatch![1].replace(/\/\*[\s\S]*?\*\//g, '')

    // 不得作为选择器出现（后面必跟 `,` 或 `{`）
    expect(css).not.toMatch(/\.markdown-body\s*[,{]/)
    expect(css).not.toMatch(/\bh[1-6]\s*[,{]/)
    expect(css).not.toMatch(/(^|\s)p\s*[,{]/m)
    expect(css).not.toMatch(/(^|\s)ul\s*[,{]/m)
    expect(css).not.toMatch(/(^|\s)ol\s*[,{]/m)
    expect(css).not.toMatch(/(^|\s)li\s*[,{]/m)
    expect(css).not.toMatch(/\bblockquote\s*[,{]/)
    // 只应包含这三个选择器
    expect(css).toMatch(/html,\s*body/)
    expect(css).toMatch(/\bbody\s*\{/)
    expect(css).toMatch(/\.phone-viewport\s*\{/)
    unmount()
  })

  it('iframe sandbox 不包含 allow-scripts', async () => {
    const { root, unmount } = await mount(Preview, { html: SAMPLE })
    const iframe = root.querySelector('iframe') as HTMLIFrameElement
    const sandbox = iframe.getAttribute('sandbox') ?? ''
    expect(sandbox).toContain('allow-same-origin')
    expect(sandbox).not.toContain('allow-scripts')
    unmount()
  })
})
