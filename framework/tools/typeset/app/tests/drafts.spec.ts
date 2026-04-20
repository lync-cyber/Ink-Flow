/**
 * 多篇草稿 CRUD 测试（Step 8）
 *
 * 覆盖：
 *  - 遗留 single key 自动迁移成一篇草稿
 *  - create / list / read / update / delete / active id
 *  - export/import JSON 往返
 *  - deriveTitle 从首个非空行（或首个 # 标题）抽取
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createDraft,
  deleteDraft,
  deriveTitle,
  exportDraftsJSON,
  getActiveDraftId,
  importDraftsJSON,
  listDrafts,
  loadDraft,
  readDraft,
  saveDraft,
  setActiveDraftId,
  updateDraft,
} from '../src/storage/drafts'

function resetStorage() {
  localStorage.clear()
}

beforeEach(() => resetStorage())
afterEach(() => resetStorage())

describe('deriveTitle', () => {
  it('优先用首个 # 标题，截断至 24 字', () => {
    expect(deriveTitle('# 今天是个好日子\n正文')).toBe('今天是个好日子')
    expect(deriveTitle('\n\n## 二级标题也行\n正文')).toBe('二级标题也行')
  })

  it('无标题时用首个非空行', () => {
    expect(deriveTitle('  \n\n 开场白 \n正文')).toBe('开场白')
    expect(deriveTitle('')).toBe('')
  })
})

describe('遗留 single key 自动迁移', () => {
  it('首次 listDrafts 把老 key 迁移成一篇', () => {
    localStorage.setItem('wx-md:draft:single', '# 迁移\n这是老草稿')
    const list = listDrafts()
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('迁移')
    expect(getActiveDraftId()).toBe(list[0].id)
    expect(readDraft(list[0].id)?.body).toBe('# 迁移\n这是老草稿')
    // 老 key 已被清
    expect(localStorage.getItem('wx-md:draft:single')).toBeNull()
  })

  it('已有新结构时老 key 不再覆盖，仅被清除', () => {
    createDraft({ title: '已有', body: '已有正文' })
    localStorage.setItem('wx-md:draft:single', '老货不要')
    const list = listDrafts()
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('已有')
    expect(localStorage.getItem('wx-md:draft:single')).toBeNull()
  })
})

describe('CRUD 基本流', () => {
  it('create → list 能读到；setActiveDraftId 生效', () => {
    const d = createDraft({ title: 'a', body: '# a' })
    expect(listDrafts().map((m) => m.id)).toContain(d.id)
    expect(getActiveDraftId()).toBe(d.id)
  })

  it('updateDraft 改 body 同时刷新 title（若未显式指定）', () => {
    const d = createDraft({ title: '旧', body: '旧正文' })
    updateDraft(d.id, { body: '# 新标题\n内容' })
    const reloaded = readDraft(d.id)
    expect(reloaded?.body).toBe('# 新标题\n内容')
    expect(reloaded?.title).toBe('新标题')
  })

  it('deleteDraft 把条目从索引和正文一起删', () => {
    const d = createDraft({ body: 'x' })
    deleteDraft(d.id)
    expect(listDrafts()).toHaveLength(0)
    expect(readDraft(d.id)).toBeNull()
    expect(getActiveDraftId()).toBeNull()
  })
})

describe('导出 / 导入 JSON 往返', () => {
  it('exportDraftsJSON 输出合法 JSON，importDraftsJSON 恢复条目', () => {
    const a = createDraft({ title: 'A', body: 'body-a' })
    const b = createDraft({ title: 'B', body: 'body-b' })
    const dump = exportDraftsJSON()
    resetStorage()
    expect(listDrafts()).toHaveLength(0)
    const added = importDraftsJSON(dump)
    expect(added).toBe(2)
    const ids = listDrafts().map((m) => m.id).sort()
    expect(ids).toEqual([a.id, b.id].sort())
    expect(readDraft(a.id)?.body).toBe('body-a')
    expect(readDraft(b.id)?.body).toBe('body-b')
  })

  it('非法 JSON 不抛错，返回 0', () => {
    expect(importDraftsJSON('not json')).toBe(0)
    expect(listDrafts()).toHaveLength(0)
  })
})

describe('向后兼容 loadDraft / saveDraft', () => {
  it('saveDraft 首次调用触发建草稿', () => {
    saveDraft('# 初稿')
    const list = listDrafts()
    expect(list).toHaveLength(1)
    expect(loadDraft()).toBe('# 初稿')
  })

  it('saveDraft 后续写入同一篇', () => {
    saveDraft('v1')
    const first = getActiveDraftId()
    saveDraft('v2')
    expect(getActiveDraftId()).toBe(first)
    expect(loadDraft()).toBe('v2')
  })

  it('setActiveDraftId(null) → loadDraft 返回空', () => {
    createDraft({ body: 'x' })
    setActiveDraftId(null)
    expect(loadDraft()).toBe('')
  })
})
