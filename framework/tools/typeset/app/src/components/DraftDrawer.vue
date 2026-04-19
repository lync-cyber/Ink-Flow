<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  createDraft,
  deleteDraft,
  exportDraftsJSON,
  importDraftsJSON,
  listDrafts,
  type DraftMeta,
} from '../storage/drafts'

const props = defineProps<{ activeId: string | null }>()
const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'close'): void
  (e: 'refresh'): void
}>()

const refreshTick = ref(0)
watch(
  () => props.activeId,
  () => {
    refreshTick.value += 1
  },
)

const drafts = computed<DraftMeta[]>(() => {
  // 访问一下 tick，强制依赖
  void refreshTick.value
  return listDrafts()
})

function refresh() {
  refreshTick.value += 1
  emit('refresh')
}

function fmt(ts: number): string {
  const d = new Date(ts)
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${m}-${day} ${hh}:${mm}`
}

function newDraft() {
  const created = createDraft({ title: '新草稿', body: '# 新草稿\n' })
  refresh()
  emit('select', created.id)
}

function remove(id: string) {
  if (!confirm('确定删除此草稿？此操作不可撤销。')) return
  deleteDraft(id)
  refresh()
}

function download(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportAll() {
  download(`wx-md-drafts-${Date.now()}.json`, exportDraftsJSON())
}

function onImport(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const added = importDraftsJSON(String(reader.result ?? ''))
    alert(`已导入 ${added} 篇草稿`)
    refresh()
    input.value = ''
  }
  reader.readAsText(file)
}
</script>

<template>
  <aside class="drawer">
    <header class="drawer-head">
      <h3>草稿</h3>
      <button class="btn-text" @click="emit('close')">关闭</button>
    </header>

    <div class="toolbar">
      <button class="btn-primary" @click="newDraft">+ 新建</button>
      <button class="btn-ghost" @click="exportAll">导出 JSON</button>
      <label class="btn-ghost">
        导入 JSON
        <input type="file" accept="application/json" hidden @change="onImport" />
      </label>
    </div>

    <ul class="list">
      <li
        v-for="d in drafts"
        :key="d.id"
        class="item"
        :class="{ active: d.id === props.activeId }"
        @click="emit('select', d.id)"
      >
        <div class="item-main">
          <div class="title">{{ d.title || '未命名' }}</div>
          <div class="meta">
            <span>{{ d.themeId }}</span>
            <span class="dot">·</span>
            <span>{{ fmt(d.updatedAt) }}</span>
          </div>
        </div>
        <button class="btn-danger" @click.stop="remove(d.id)">删</button>
      </li>
      <li v-if="drafts.length === 0" class="empty">暂无草稿</li>
    </ul>
  </aside>
</template>

<style scoped>
.drawer {
  width: 280px; height: 100%; display: flex; flex-direction: column;
  background: #fff; border-right: 1px solid #e1e4e8; font-size: 13px; color: #1f2328;
}
.drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid #eaecef;
}
.drawer-head h3 { margin: 0; font-size: 14px; }
.btn-text { background: none; border: none; color: #6a737d; cursor: pointer; font-size: 12px; }
.toolbar { display: flex; gap: 6px; padding: 8px 12px; border-bottom: 1px solid #f1f3f5; }
.btn-primary, .btn-ghost {
  height: 28px; padding: 0 10px; font-size: 12px; border-radius: 6px; cursor: pointer;
}
.btn-primary { background: #2d6fdd; color: #fff; border: 1px solid #2d6fdd; }
.btn-primary:hover { background: #1f5ec9; }
.btn-ghost { background: transparent; color: #1f2328; border: 1px solid #d0d7de; }
.btn-ghost:hover { background: #f6f8fa; }
.btn-ghost input[type="file"] { display: none; }
.list { list-style: none; margin: 0; padding: 4px 0; overflow-y: auto; flex: 1 1 auto; }
.item {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; cursor: pointer;
  border-left: 3px solid transparent;
}
.item:hover { background: #f6f8fa; }
.item.active { background: #eef4ff; border-left-color: #2d6fdd; }
.item-main { flex: 1 1 auto; min-width: 0; }
.title { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { font-size: 11px; color: #6a737d; margin-top: 2px; }
.dot { opacity: .5; margin: 0 4px; }
.btn-danger {
  background: transparent; border: 1px solid transparent; color: #b42318;
  font-size: 12px; height: 24px; padding: 0 6px; border-radius: 4px; cursor: pointer;
}
.btn-danger:hover { background: #fdecec; border-color: #fcc4c1; }
.empty { padding: 16px; color: #6a737d; text-align: center; font-size: 12px; }
</style>
