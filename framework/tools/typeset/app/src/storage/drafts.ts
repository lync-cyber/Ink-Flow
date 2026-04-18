/**
 * localStorage 草稿存储（Step 1 最小版 · 单篇自动保存）
 *
 * Step 8 扩展为多篇 CRUD + 导入导出 + 超 5MB 迁 IndexedDB。
 */

const KEY_SINGLE = 'wx-md:draft:single'

export function loadDraft(): string {
  try {
    return localStorage.getItem(KEY_SINGLE) ?? ''
  } catch {
    return ''
  }
}

export function saveDraft(md: string): void {
  try {
    localStorage.setItem(KEY_SINGLE, md)
  } catch {
    // 配额超限等，忽略
  }
}
