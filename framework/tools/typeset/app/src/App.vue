<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Editor from './components/Editor.vue'
import Preview from './components/Preview.vue'
import Toolbar from './components/Toolbar.vue'
import DraftDrawer from './components/DraftDrawer.vue'
import ColorCustomizer from './components/ColorCustomizer.vue'
import ComponentPalette from './components/ComponentPalette.vue'
import TemplateMarket from './components/TemplateMarket.vue'
import { useDebouncedRender } from './composables/useDebouncedRender'
import { getTheme } from './themes'
import type { Theme } from './themes/types'
import { applyPalette } from './color/applyPalette'
import { copyHtmlToClipboard } from './clipboard/copyHtml'
import { exportHtml, exportImage, exportMd } from './clipboard/exportFile'
import { getSample } from './samples'
import {
  createDraft,
  getActiveDraftId,
  listDrafts,
  readDraft,
  setActiveDraftId,
  updateDraft,
} from './storage/drafts'

const THEME_STORAGE_KEY = 'wx-md:theme:last'

const md = ref<string>('')
const status = ref<string>('')
const activeDraftId = ref<string | null>(null)
const baseThemeId = ref<string>('default')
const customTheme = ref<Theme | null>(null) // 自定义配色时覆盖 baseThemeId
const editorRef = ref<InstanceType<typeof Editor> | null>(null)
const previewRef = ref<InstanceType<typeof Preview> | null>(null)
const paletteRef = ref<InstanceType<typeof ComponentPalette> | null>(null)

const ui = reactive({
  draftsOpen: false,
  customizerOpen: false,
  templatesOpen: false,
  componentsOpen: false,
})

const activeTheme = computed<Theme>(() => customTheme.value ?? getTheme(baseThemeId.value))

function initActiveDraft(preferredThemeId: string = 'default') {
  const id = getActiveDraftId()
  if (id) {
    const existing = readDraft(id)
    if (existing) {
      activeDraftId.value = existing.id
      md.value = existing.body
      if (existing.themeId) baseThemeId.value = existing.themeId
      return
    }
  }
  // 首次进入：若有已存列表，取最新；否则按当前主题挑对应 sample 新建
  const drafts = listDrafts()
  if (drafts.length > 0) {
    const first = drafts[0]
    activeDraftId.value = first.id
    setActiveDraftId(first.id)
    const body = readDraft(first.id)?.body ?? ''
    md.value = body
    if (first.themeId) baseThemeId.value = first.themeId
  } else {
    const created = createDraft({
      title: 'wx-md 示例',
      body: getSample(preferredThemeId),
      themeId: preferredThemeId,
    })
    activeDraftId.value = created.id
    md.value = created.body
  }
}

onMounted(() => {
  const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedThemeId) baseThemeId.value = savedThemeId
  // 传入当前 baseThemeId，让首次创建的示例草稿跟上保存的主题
  initActiveDraft(baseThemeId.value)
  window.addEventListener('keydown', onShortcut)
  // pagehide 在标签关闭 / 前进后退缓存时触发，比 beforeunload 覆盖更广；
  // onBeforeUnmount 只在 Vue 实例销毁时触发，不包括"关 tab"这种情况。
  window.addEventListener('pagehide', flushDraftSave)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onShortcut)
  window.removeEventListener('pagehide', flushDraftSave)
  flushDraftSave()
})

// 每次击键都 JSON.stringify 整篇正文写 localStorage 在长文里可感知卡顿；
// 渲染管线已有 80ms 防抖，这里取 400ms：断电风险仅"半秒内最新一击"，
// 关闭页面前 onBeforeUnmount 会 flush 最终态。
const DRAFT_SAVE_DELAY = 400
let draftSaveTimer: number | null = null
let pendingDraftBody: string | null = null

function flushDraftSave() {
  if (draftSaveTimer !== null) {
    window.clearTimeout(draftSaveTimer)
    draftSaveTimer = null
  }
  if (pendingDraftBody !== null && activeDraftId.value) {
    updateDraft(activeDraftId.value, { body: pendingDraftBody })
    pendingDraftBody = null
  }
}

watch(md, (val) => {
  if (!activeDraftId.value) return
  pendingDraftBody = val
  if (draftSaveTimer !== null) window.clearTimeout(draftSaveTimer)
  draftSaveTimer = window.setTimeout(flushDraftSave, DRAFT_SAVE_DELAY)
})

watch(baseThemeId, (val) => {
  customTheme.value = null // 切 base 主题时自动清掉自定义层
  localStorage.setItem(THEME_STORAGE_KEY, val)
  if (activeDraftId.value) {
    updateDraft(activeDraftId.value, { themeId: val })
  }
})

const pipelineInput = computed(() => ({ md: md.value, theme: activeTheme.value }))
const { rendered, flush } = useDebouncedRender(pipelineInput, { delayMs: 80 })

async function handleCopy() {
  flush()
  const html = rendered.value.html
  const plain = md.value
  const result = await copyHtmlToClipboard(html, plain)
  if (result.ok) {
    status.value = result.mode === 'clipboard-api' ? '已复制（富文本）' : '已复制（降级模式）'
  } else {
    status.value = `复制失败：${result.error ?? '未知错误'}（请关闭跨域 iframe 或改用 Chrome/Safari）`
  }
  pingStatus()
}

function handleClear() {
  if (!confirm('确定清空当前草稿？此操作不可撤销。')) return
  md.value = ''
  status.value = '已清空'
  pingStatus(1500)
}

function handleLoadSample() {
  const sample = getSample(baseThemeId.value)
  // 有内容时先确认，避免用户误点覆盖正在写的正文
  if (md.value.trim() && !confirm('当前草稿将被替换为该主题的示例内容，确定继续？')) return
  md.value = sample
  status.value = '已载入示例'
  pingStatus(1500)
}

function handleSelectDraft(id: string) {
  if (id === activeDraftId.value) return
  // 切草稿前把防抖中的 body 落到老草稿，避免老草稿内容跑到新草稿上
  flushDraftSave()
  const d = readDraft(id)
  if (!d) return
  activeDraftId.value = d.id
  setActiveDraftId(d.id)
  md.value = d.body
  if (d.themeId) baseThemeId.value = d.themeId
}

function handleApplyPalette(seed: {
  primary: string
  secondary: string
  accent: string
  dark: boolean
}) {
  const base = getTheme(baseThemeId.value)
  customTheme.value = applyPalette({
    base,
    seed,
    id: `${base.id}--custom`,
    name: `${base.name} · 自定义`,
  })
  status.value = '已应用自定义配色'
  pingStatus(1500)
}

function handleInsertTemplate(snippet: string) {
  // 优先走 CodeMirror 光标位置；拿不到编辑器实例时退化为 body 末尾追加
  const inst = editorRef.value
  if (inst && typeof inst.insertAtCursor === 'function') {
    inst.insertAtCursor(snippet)
  } else {
    md.value = `${md.value}${md.value.endsWith('\n') ? '' : '\n'}\n${snippet}`
  }
  status.value = '已插入模板'
  pingStatus(1200)
}

function handleInsertComponent(snippet: string) {
  handleInsertTemplate(snippet)
}

function handleSaveSelection() {
  const inst = editorRef.value
  const text = inst?.getSelectedText?.() ?? ''
  if (!text.trim()) {
    status.value = '请先在编辑器中选中一段 markdown'
    pingStatus(2000)
    return
  }
  if (!ui.componentsOpen) ui.componentsOpen = true
  // 等抽屉挂载后再打弹窗
  requestAnimationFrame(() => paletteRef.value?.openSaveDialog?.(text))
}

function pingStatus(timeoutMs = 2500) {
  setTimeout(() => {
    status.value = ''
  }, timeoutMs)
}

function fileStem(): string {
  const t = (listDrafts().find((d) => d.id === activeDraftId.value)?.title ?? 'wx-md-export').replace(
    /[\\/:*?"<>|\s]+/g,
    '-',
  )
  return t || 'wx-md-export'
}

function doExportHtml() {
  flush()
  const colors = activeTheme.value.tokens.colors
  exportHtml(`${fileStem()}.html`, rendered.value.html, {
    background: colors.bg,
    color: colors.text,
  })
  status.value = '已导出 HTML'
  pingStatus(1500)
}

function doExportMd() {
  exportMd(`${fileStem()}.md`, md.value)
  status.value = '已导出 Markdown'
  pingStatus(1500)
}

async function doExportImage() {
  status.value = '长图渲染中…'
  // 通过 Preview 组件的 ref 拿 iframe，避免全局 querySelector（多 iframe / SSR 都更稳）
  const iframe = previewRef.value?.getIframe?.() ?? null
  const body = iframe?.contentDocument?.body
  if (!body) {
    status.value = '长图导出失败：未找到预览节点'
    pingStatus(2000)
    return
  }
  const result = await exportImage(body, `${fileStem()}.png`, {
    background: activeTheme.value.tokens.colors.bg,
  })
  if (result.ok) status.value = '已导出长图'
  else status.value = `长图导出失败：${result.error ?? '未知错误'}`
  pingStatus(3000)
}

function onShortcut(e: KeyboardEvent) {
  const meta = e.ctrlKey || e.metaKey
  if (!meta) return
  // Ctrl/⌘ + S：手动保存（本工具已自动保存，这里吃掉默认浏览器保存）
  if (e.key.toLowerCase() === 's' && !e.shiftKey) {
    e.preventDefault()
    if (activeDraftId.value) {
      // 立即 flush 防抖，保证 Ctrl+S 的语义是"现在就写盘"
      pendingDraftBody = md.value
      flushDraftSave()
      status.value = '已保存'
      pingStatus(1000)
    }
    return
  }
  // Ctrl/⌘ + K：复制
  if (e.key.toLowerCase() === 'k' && !e.shiftKey) {
    e.preventDefault()
    handleCopy()
    return
  }
  // Ctrl/⌘ + Shift + C：打开自定义配色
  if (e.key.toLowerCase() === 'c' && e.shiftKey) {
    e.preventDefault()
    ui.customizerOpen = !ui.customizerOpen
    return
  }
  // Ctrl/⌘ + Shift + D：打开草稿抽屉
  if (e.key.toLowerCase() === 'd' && e.shiftKey) {
    e.preventDefault()
    ui.draftsOpen = !ui.draftsOpen
    return
  }
  // Ctrl/⌘ + Shift + P：打开组件库抽屉
  if (e.key.toLowerCase() === 'p' && e.shiftKey) {
    e.preventDefault()
    ui.componentsOpen = !ui.componentsOpen
    return
  }
  // Ctrl/⌘ + Shift + H / M：导出
  if (e.key.toLowerCase() === 'h' && e.shiftKey) {
    e.preventDefault()
    doExportHtml()
    return
  }
  if (e.key.toLowerCase() === 'm' && e.shiftKey) {
    e.preventDefault()
    doExportMd()
    return
  }
}
</script>

<template>
  <div class="app">
    <Toolbar
      :word-count="rendered.wordCount"
      :reading-time="rendered.readingTime"
      :status="status"
      :theme-id="baseThemeId"
      @update:theme-id="baseThemeId = $event"
      @copy="handleCopy"
      @clear="handleClear"
      @load-sample="handleLoadSample"
      @toggle-drafts="ui.draftsOpen = !ui.draftsOpen"
      @toggle-templates="ui.templatesOpen = !ui.templatesOpen"
      @toggle-components="ui.componentsOpen = !ui.componentsOpen"
      @save-selection="handleSaveSelection"
      @toggle-customizer="ui.customizerOpen = !ui.customizerOpen"
      @export-html="doExportHtml"
      @export-md="doExportMd"
      @export-image="doExportImage"
    />
    <main class="main">
      <DraftDrawer
        v-if="ui.draftsOpen"
        :active-id="activeDraftId"
        @select="handleSelectDraft"
        @close="ui.draftsOpen = false"
      />
      <section class="pane pane-editor">
        <Editor ref="editorRef" v-model="md" />
      </section>
      <section class="pane pane-preview">
        <Preview ref="previewRef" :html="rendered.html" />
      </section>
      <TemplateMarket
        v-if="ui.templatesOpen"
        :theme="activeTheme"
        @insert="handleInsertTemplate"
        @close="ui.templatesOpen = false"
      />
      <ComponentPalette
        v-if="ui.componentsOpen"
        ref="paletteRef"
        @insert="handleInsertComponent"
        @close="ui.componentsOpen = false"
      />
      <ColorCustomizer
        v-if="ui.customizerOpen"
        @apply="handleApplyPalette"
        @close="ui.customizerOpen = false"
      />
    </main>
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.main {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
}
.pane {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.pane-editor {
  border-right: 1px solid #e1e4e8;
}
.pane-preview {
  background: #f2f2f2;
}
</style>
