<script setup lang="ts">
/**
 * 组件库抽屉
 *
 * 消费 components-lib/registry 的内置预设 + storage/userComponents 的自创组件。
 * 行为：
 *   - 左列：分类 tab（COMPONENT_TABS 顺序）
 *   - 右列：75×75 缩略图网格，悬停显示描述，点击 emit('insert', md)
 *   - 「我的组件」tab：叠加自创组件，每项右上角悬停删除按钮
 *   - 顶部「保存选区」按钮：父组件通过 ref 调 openSaveDialog(selectionText) 弹窗
 */
import { computed, reactive, ref } from 'vue'
import {
  BUILTIN_COMPONENTS,
  COMPONENT_TABS,
  type ComponentEntry,
  type ComponentKind,
} from '../components-lib'
import {
  createUserComponent,
  deleteUserComponent,
  listUserComponents,
  toEntry,
} from '../storage/userComponents'

const emit = defineEmits<{
  (e: 'insert', md: string): void
  (e: 'close'): void
}>()

type TabKind = ComponentKind | 'user'

const activeTab = ref<TabKind>('admonition')
const refreshTick = ref(0)
// touch refreshTick so list recomputes after create/delete without manual signal plumbing
const userComponents = computed<ComponentEntry[]>(() => {
  void refreshTick.value
  return listUserComponents().map(toEntry)
})

const builtinByKind = computed<Record<ComponentKind, ComponentEntry[]>>(() => {
  const bucket: Record<ComponentKind, ComponentEntry[]> = {
    admonition: [],
    quote: [],
    compare: [],
    steps: [],
    divider: [],
    sectionTitle: [],
    none: [],
  }
  for (const c of BUILTIN_COMPONENTS) bucket[c.kind].push(c)
  return bucket
})

const currentList = computed<ComponentEntry[]>(() => {
  if (activeTab.value === 'user') return userComponents.value
  return builtinByKind.value[activeTab.value]
})

function clickEntry(entry: ComponentEntry) {
  emit('insert', entry.markdownSnippet)
}

function removeUser(id: string, ev: Event) {
  ev.stopPropagation()
  if (!confirm('确定删除该自创组件？')) return
  deleteUserComponent(id)
  refreshTick.value += 1
}

// ---------- 保存选区为组件 ----------
const save = reactive({
  open: false,
  name: '',
  description: '',
  source: '',
})

function openSaveDialog(selectionText: string) {
  const text = selectionText.trim()
  if (!text) {
    alert('先在左侧编辑器选中一段 markdown 再保存')
    return
  }
  save.open = true
  save.name = ''
  save.description = ''
  save.source = selectionText
}

function cancelSave() {
  save.open = false
}

function confirmSave() {
  const name = save.name.trim()
  if (!name) {
    alert('组件名不能为空')
    return
  }
  createUserComponent({
    name,
    description: save.description,
    markdownSnippet: ensureTrailingNewline(save.source),
    sourceMarkdown: save.source,
    kind: 'none',
  })
  save.open = false
  refreshTick.value += 1
  activeTab.value = 'user'
}

function ensureTrailingNewline(s: string): string {
  return s.endsWith('\n') ? s : s + '\n'
}

defineExpose({ openSaveDialog })
</script>

<template>
  <aside class="palette">
    <header class="palette-head">
      <h3>组件库</h3>
      <button class="btn-text" @click="emit('close')">关闭</button>
    </header>

    <nav class="tabs">
      <button
        v-for="t in COMPONENT_TABS"
        :key="t.kind"
        class="tab"
        :class="{ active: activeTab === t.kind }"
        @click="activeTab = t.kind as TabKind"
      >
        {{ t.label }}
      </button>
    </nav>

    <div class="body">
      <div v-if="currentList.length === 0" class="empty">
        <template v-if="activeTab === 'user'">
          还没有自创组件。在编辑器里选中一段 markdown，点顶部「保存选区」。
        </template>
        <template v-else>本分类暂无预设</template>
      </div>
      <div v-else class="grid">
        <button
          v-for="entry in currentList"
          :key="entry.id"
          class="cell"
          :title="entry.description"
          @click="clickEntry(entry)"
        >
          <span class="thumb" v-html="entry.thumbnailSvg" />
          <span class="name">{{ entry.name }}</span>
          <button
            v-if="activeTab === 'user'"
            class="cell-del"
            title="删除"
            @click="removeUser(entry.id, $event)"
          >×</button>
        </button>
      </div>
    </div>

    <!-- 保存选区弹窗 -->
    <div v-if="save.open" class="modal-mask" @click.self="cancelSave">
      <div class="modal">
        <h4>保存选区为组件</h4>
        <label>
          <span>名称</span>
          <input v-model="save.name" maxlength="20" placeholder="如：我的封面卡" />
        </label>
        <label>
          <span>描述</span>
          <input v-model="save.description" maxlength="30" placeholder="一句话说明（可选）" />
        </label>
        <details class="preview-src">
          <summary>选区预览（只读）</summary>
          <pre>{{ save.source }}</pre>
        </details>
        <div class="modal-actions">
          <button class="btn-ghost" @click="cancelSave">取消</button>
          <button class="btn-primary" @click="confirmSave">保存</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.palette {
  position: relative;
  width: 340px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 1px solid #e1e4e8;
  font-size: 13px;
  color: #1f2328;
}
.palette-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eaecef;
}
.palette-head h3 {
  margin: 0;
  font-size: 14px;
}
.btn-text {
  background: none;
  border: none;
  color: #6a737d;
  cursor: pointer;
  font-size: 12px;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f3f5;
}
.tab {
  height: 26px;
  padding: 0 10px;
  border-radius: 13px;
  border: 1px solid #e1e4e8;
  background: #fff;
  font-size: 12px;
  color: #1f2328;
  cursor: pointer;
}
.tab:hover { background: #f6f8fa; }
.tab.active {
  background: #2d6fdd;
  color: #fff;
  border-color: #2d6fdd;
}

.body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 12px;
}
.empty {
  padding: 20px 8px;
  color: #6a737d;
  text-align: center;
  font-size: 12px;
  line-height: 1.6;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px 10px;
  border-radius: 8px;
  border: 1px solid #eaecef;
  background: #fbfcfd;
  cursor: pointer;
  font-size: 11px;
  color: #1f2328;
  text-align: center;
}
.cell:hover {
  background: #f0f6ff;
  border-color: #2d6fdd;
}
.thumb {
  width: 75px;
  height: 75px;
  display: block;
  pointer-events: none;
}
.thumb :deep(svg) {
  width: 75px;
  height: 75px;
  display: block;
}
.name {
  line-height: 1.3;
  word-break: break-word;
}
.cell-del {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border: none;
  background: rgba(180, 35, 24, 0.9);
  color: #fff;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s;
}
.cell:hover .cell-del { opacity: 1; }

/* modal */
.modal-mask {
  position: absolute;
  inset: 0;
  background: rgba(31, 35, 40, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.modal {
  width: 300px;
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.modal h4 { margin: 0; font-size: 14px; }
.modal label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6a737d;
}
.modal input {
  height: 28px;
  padding: 0 8px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  font-size: 13px;
  color: #1f2328;
}
.preview-src {
  font-size: 11px;
  color: #6a737d;
}
.preview-src pre {
  margin: 6px 0 0;
  max-height: 120px;
  overflow: auto;
  background: #f6f8fa;
  padding: 8px;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.btn-primary, .btn-ghost {
  height: 28px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.btn-primary {
  background: #2d6fdd;
  color: #fff;
  border: 1px solid #2d6fdd;
}
.btn-primary:hover { background: #1f5ec9; }
.btn-ghost {
  background: #fff;
  color: #1f2328;
  border: 1px solid #d0d7de;
}
.btn-ghost:hover { background: #f6f8fa; }
</style>
