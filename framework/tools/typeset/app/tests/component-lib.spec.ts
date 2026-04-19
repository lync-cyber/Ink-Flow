/**
 * 组件库 registry 基础契约
 *
 * 覆盖：
 *   - 每个 variant 都有 ≥1 条预设
 *   - 所有 markdownSnippet 能被 pipeline 渲染出对应容器 class
 *   - 缩略图是有效 SVG 字符串（viewBox 0 0 75 75）
 *   - 预设 id 唯一
 *   - localStorage CRUD 正常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BUILTIN_COMPONENTS, findPresetByVariant } from '../src/components-lib'
import { VARIANT_IDS } from '../src/themes/types'
import { render } from '../src/pipeline'
import { defaultTheme } from '../src/themes/default'
import {
  listUserComponents,
  createUserComponent,
  deleteUserComponent,
  importUserComponentsJSON,
  exportUserComponentsJSON,
} from '../src/storage/userComponents'

describe('BUILTIN_COMPONENTS', () => {
  it('每个 variant 都有至少一条预设覆盖', () => {
    for (const [kind, ids] of Object.entries(VARIANT_IDS)) {
      for (const id of ids) {
        const found = findPresetByVariant(kind as keyof typeof VARIANT_IDS, id)
        expect(found, `${kind}:${id} 缺预设`).toBeTruthy()
      }
    }
  })

  it('id 全局唯一', () => {
    const ids = BUILTIN_COMPONENTS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('缩略图是 75×75 SVG', () => {
    for (const c of BUILTIN_COMPONENTS) {
      expect(c.thumbnailSvg).toMatch(/<svg[^>]*viewBox="0 0 75 75"/)
      expect(c.thumbnailSvg).not.toMatch(/\sid=/)
    }
  })

  it('markdownSnippet 能被 pipeline 正确渲染', () => {
    for (const c of BUILTIN_COMPONENTS) {
      const { html } = render({ md: c.markdownSnippet, theme: defaultTheme })
      // 至少有一个 container-XXX class（自由组件 mpvideo-qq 例外：直接 iframe 不走 container）
      if (c.id === 'free-mpvideo-qq') {
        expect(html).toMatch(/<iframe/)
      } else {
        expect(html, `${c.id} 渲染缺容器`).toMatch(/class="container-/)
      }
    }
  })
})

describe('userComponents 存储', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('create / list / delete', () => {
    expect(listUserComponents()).toHaveLength(0)
    const uc = createUserComponent({
      name: '测试组件',
      markdownSnippet: '::: tip\n内容\n:::\n',
    })
    expect(listUserComponents()).toHaveLength(1)
    expect(listUserComponents()[0].id).toBe(uc.id)
    deleteUserComponent(uc.id)
    expect(listUserComponents()).toHaveLength(0)
  })

  it('import/export 往返', () => {
    createUserComponent({
      name: 'A',
      markdownSnippet: '::: tip\nA\n:::\n',
    })
    const json = exportUserComponentsJSON()
    localStorage.clear()
    const n = importUserComponentsJSON(json)
    expect(n).toBe(1)
    expect(listUserComponents()).toHaveLength(1)
  })

  it('非法 JSON 不抛异常', () => {
    expect(importUserComponentsJSON('{not-json}')).toBe(0)
    expect(importUserComponentsJSON('null')).toBe(0)
    expect(importUserComponentsJSON('[{"broken":true}]')).toBe(0)
  })
})
