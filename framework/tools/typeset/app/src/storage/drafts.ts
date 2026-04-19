/**
 * 草稿存储 · 多篇 CRUD（Step 8）
 *
 * 存储策略：
 *   - 主索引 (wx-md:drafts:index)：Draft 元数据列表（id / title / themeId / updatedAt），单条 localStorage
 *   - 每篇正文 (wx-md:drafts:body:<id>)：独立 key，避免一条记录超 5MB 限制
 *   - 当前活跃 id (wx-md:drafts:active)
 *   - 向后兼容：若发现遗留 key wx-md:draft:single，自动迁移为一篇 "未命名"
 *
 * 接口保持同步；Step 1 的 loadDraft/saveDraft 仍保留（读写当前活跃草稿正文），
 * 这样老调用点不需要改动即可兼容。
 */

const LEGACY_KEY = 'wx-md:draft:single'
const INDEX_KEY = 'wx-md:drafts:index'
const ACTIVE_KEY = 'wx-md:drafts:active'
const BODY_PREFIX = 'wx-md:drafts:body:'

export interface DraftMeta {
  id: string
  title: string
  themeId: string
  updatedAt: number
  createdAt: number
}

export interface Draft extends DraftMeta {
  body: string
}

function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeWrite(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 配额超限忽略
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function genId(): string {
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function readIndex(): DraftMeta[] {
  const raw = safeRead(INDEX_KEY)
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as DraftMeta[]) : []
  } catch {
    return []
  }
}

function writeIndex(list: DraftMeta[]): void {
  safeWrite(INDEX_KEY, JSON.stringify(list))
}

/** 懒迁移：发现老 single key 就转成一篇新草稿 */
function migrateLegacy(): void {
  const legacy = safeRead(LEGACY_KEY)
  if (legacy == null) return
  const index = readIndex()
  if (index.length > 0) {
    // 已经有新结构，老 key 留着不动——但标记为已迁移避免重复创建
    safeRemove(LEGACY_KEY)
    return
  }
  const id = genId()
  const now = Date.now()
  const meta: DraftMeta = {
    id,
    title: deriveTitle(legacy) || '未命名草稿',
    themeId: 'default',
    updatedAt: now,
    createdAt: now,
  }
  writeIndex([meta])
  safeWrite(`${BODY_PREFIX}${id}`, legacy)
  safeWrite(ACTIVE_KEY, id)
  safeRemove(LEGACY_KEY)
}

/** 从 md 里抽一行作为标题（第一个 # 或前 20 字） */
export function deriveTitle(md: string): string {
  const line = md
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  if (!line) return ''
  const stripped = line.replace(/^#+\s*/, '').slice(0, 24)
  return stripped
}

export function listDrafts(): DraftMeta[] {
  migrateLegacy()
  const list = readIndex()
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getActiveDraftId(): string | null {
  migrateLegacy()
  return safeRead(ACTIVE_KEY)
}

export function setActiveDraftId(id: string | null): void {
  if (id) safeWrite(ACTIVE_KEY, id)
  else safeRemove(ACTIVE_KEY)
}

export function readDraft(id: string): Draft | null {
  const meta = readIndex().find((m) => m.id === id)
  if (!meta) return null
  const body = safeRead(`${BODY_PREFIX}${id}`) ?? ''
  return { ...meta, body }
}

export function createDraft(initial?: { title?: string; themeId?: string; body?: string }): Draft {
  migrateLegacy()
  const id = genId()
  const now = Date.now()
  const body = initial?.body ?? ''
  // deriveTitle 可能返回空串，用 || 兜底到"未命名草稿"（空串是 falsy 但 ?? 不覆盖）
  const meta: DraftMeta = {
    id,
    title: initial?.title || deriveTitle(body) || '未命名草稿',
    themeId: initial?.themeId ?? 'default',
    updatedAt: now,
    createdAt: now,
  }
  const list = readIndex()
  list.unshift(meta)
  writeIndex(list)
  safeWrite(`${BODY_PREFIX}${id}`, body)
  setActiveDraftId(id)
  return { ...meta, body }
}

export function updateDraft(id: string, patch: Partial<Omit<Draft, 'id' | 'createdAt'>>): void {
  const list = readIndex()
  const idx = list.findIndex((m) => m.id === id)
  if (idx === -1) return
  const now = Date.now()
  const prev = list[idx]
  const next: DraftMeta = {
    ...prev,
    title: patch.title ?? prev.title,
    themeId: patch.themeId ?? prev.themeId,
    updatedAt: now,
  }
  list[idx] = next
  writeIndex(list)
  if (typeof patch.body === 'string') {
    safeWrite(`${BODY_PREFIX}${id}`, patch.body)
    // 未显式指定 title 时用正文第一行刷新
    if (!patch.title) {
      const fresh = deriveTitle(patch.body)
      if (fresh) {
        list[idx] = { ...next, title: fresh }
        writeIndex(list)
      }
    }
  }
}

export function deleteDraft(id: string): void {
  const list = readIndex().filter((m) => m.id !== id)
  writeIndex(list)
  safeRemove(`${BODY_PREFIX}${id}`)
  if (getActiveDraftId() === id) {
    setActiveDraftId(list[0]?.id ?? null)
  }
}

export function exportDraftsJSON(): string {
  const list = readIndex()
  const full = list.map((m) => ({ ...m, body: safeRead(`${BODY_PREFIX}${m.id}`) ?? '' }))
  return JSON.stringify({ version: 1, drafts: full }, null, 2)
}

export interface ImportResult {
  added: number
  skipped: number
  invalid: number
}

/** 只返回导入成功条数；详细统计请用 importDraftsJSONDetailed。 */
export function importDraftsJSON(json: string): number {
  return importDraftsJSONDetailed(json).added
}

/**
 * 导入并返回细项统计：added（新增）/ skipped（id 冲突）/ invalid（类型不合法）。
 * 非法 JSON 整体返回 `{0,0,0}`。
 */
export function importDraftsJSONDetailed(json: string): ImportResult {
  const result: ImportResult = { added: 0, skipped: 0, invalid: 0 }
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return result
  }
  const arr = isRecord(parsed) && Array.isArray((parsed as { drafts?: unknown }).drafts)
    ? ((parsed as { drafts: unknown[] }).drafts)
    : []
  const list = readIndex()
  for (const raw of arr) {
    if (!isRecord(raw)) {
      result.invalid += 1
      continue
    }
    const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : null
    if (!id) {
      result.invalid += 1
      continue
    }
    if (list.some((m) => m.id === id)) {
      result.skipped += 1
      continue
    }
    const body = typeof raw.body === 'string' ? raw.body : ''
    const title = typeof raw.title === 'string' && raw.title ? raw.title : deriveTitle(body) || '未命名草稿'
    const themeId = typeof raw.themeId === 'string' && raw.themeId ? raw.themeId : 'default'
    const updatedAt = typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now()
    const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : Date.now()
    list.push({ id, title, themeId, updatedAt, createdAt })
    safeWrite(`${BODY_PREFIX}${id}`, body)
    result.added += 1
  }
  writeIndex(list)
  return result
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// --------------------- 向后兼容接口 --------------------- //

/** @deprecated Step 1 签名，内部转发到活跃草稿正文 */
export function loadDraft(): string {
  migrateLegacy()
  const id = getActiveDraftId()
  if (!id) return ''
  return safeRead(`${BODY_PREFIX}${id}`) ?? ''
}

/** @deprecated Step 1 签名，内部转发到活跃草稿正文 */
export function saveDraft(md: string): void {
  migrateLegacy()
  let id = getActiveDraftId()
  if (!id) {
    const created = createDraft({ body: md })
    id = created.id
    return
  }
  updateDraft(id, { body: md })
}
