<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const host = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null

/** 在当前光标处插入一段文本（替换选区）；父组件通过 ref 调用 */
function insertAtCursor(text: string): void {
  if (!view) return
  const { from, to } = view.state.selection.main
  const needsLeadingNewline = from > 0 && view.state.doc.sliceString(Math.max(0, from - 1), from) !== '\n'
  const insert = (needsLeadingNewline ? '\n' : '') + text + (text.endsWith('\n') ? '' : '\n')
  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + insert.length },
  })
  view.focus()
}

/** 读取当前选区文本；无选区返回空串 */
function getSelectedText(): string {
  if (!view) return ''
  const { from, to } = view.state.selection.main
  if (from === to) return ''
  return view.state.doc.sliceString(from, to)
}

defineExpose({ insertAtCursor, getSelectedText })

function createView(doc: string) {
  if (!host.value) return
  const state = EditorState.create({
    doc,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      markdown(),
      oneDark,
      EditorView.lineWrapping,
      EditorView.updateListener.of((upd) => {
        if (upd.docChanged) {
          emit('update:modelValue', upd.state.doc.toString())
        }
      }),
      EditorView.theme({
        '&': { height: '100%', fontSize: '14px' },
        '.cm-scroller': { overflow: 'auto' },
      }),
    ],
  })
  view = new EditorView({ state, parent: host.value })
}

onMounted(() => {
  createView(props.modelValue)
})

watch(
  () => props.modelValue,
  (val) => {
    if (!view) return
    const current = view.state.doc.toString()
    if (val !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: val } })
    }
  },
)

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})
</script>

<template>
  <div class="editor-host" ref="host" />
</template>

<style scoped>
.editor-host {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #282c34;
}
.editor-host :deep(.cm-editor) {
  height: 100%;
}
</style>
