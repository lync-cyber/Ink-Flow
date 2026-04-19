<script setup lang="ts">
import ThemePicker from './ThemePicker.vue'

defineProps<{
  wordCount: number
  readingTime: number
  status: string
  themeId: string
}>()
const emit = defineEmits<{
  (e: 'update:themeId', value: string): void
  (e: 'copy'): void
  (e: 'clear'): void
  (e: 'toggleDrafts'): void
  (e: 'toggleTemplates'): void
  (e: 'toggleComponents'): void
  (e: 'saveSelection'): void
  (e: 'toggleCustomizer'): void
  (e: 'loadSample'): void
  (e: 'exportHtml'): void
  (e: 'exportMd'): void
  (e: 'exportImage'): void
}>()
</script>

<template>
  <header class="toolbar">
    <div class="brand">
      <span class="brand-name">wx-md</span>
      <span class="brand-sub">微信公众号排版</span>
    </div>

    <div class="middle">
      <ThemePicker :model-value="themeId" @update:model-value="(v) => emit('update:themeId', v)" />
      <button class="btn btn-ghost" @click="emit('toggleDrafts')" title="草稿列表">草稿</button>
      <button class="btn btn-ghost" @click="emit('toggleTemplates')" title="模板市场">模板</button>
      <button class="btn btn-ghost" @click="emit('toggleComponents')" title="组件库 (Ctrl/⌘+Shift+P)">组件</button>
      <button class="btn btn-ghost" @click="emit('saveSelection')" title="把编辑器当前选区保存为自创组件">存选</button>
      <button class="btn btn-ghost" @click="emit('toggleCustomizer')" title="自定义配色">配色</button>
      <span class="sep" />
      <button class="btn btn-ghost" @click="emit('exportHtml')" title="导出 HTML (Ctrl/⌘+Shift+H)">HTML</button>
      <button class="btn btn-ghost" @click="emit('exportMd')" title="导出 Markdown (Ctrl/⌘+Shift+M)">MD</button>
      <button class="btn btn-ghost" @click="emit('exportImage')" title="导出长图">长图</button>
    </div>

    <div class="stats">
      <span>字数 {{ wordCount }}</span>
      <span class="dot">·</span>
      <span>阅读 {{ readingTime }} 分钟</span>
      <span v-if="status" class="status">{{ status }}</span>
    </div>

    <div class="actions">
      <button
        class="btn btn-ghost"
        @click="emit('loadSample')"
        title="恢复为当前主题的示例正文"
      >示例</button>
      <button class="btn btn-ghost" @click="emit('clear')" title="清空正文">清空</button>
      <button class="btn btn-primary" @click="emit('copy')" title="复制到剪贴板 (Ctrl/⌘+K)">一键复制</button>
    </div>
  </header>
</template>

<style scoped>
.toolbar {
  height: 48px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #e1e4e8;
  gap: 12px;
}
.brand { display: flex; align-items: baseline; gap: 8px; flex: 0 0 auto; }
.brand-name { font-weight: 700; font-size: 16px; color: #1f2328; }
.brand-sub { font-size: 12px; color: #6a737d; }
.middle { display: flex; align-items: center; gap: 6px; flex: 1 1 auto; justify-content: center; flex-wrap: wrap; }
.sep { width: 1px; height: 18px; background: #eaecef; margin: 0 4px; }
.stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6a737d;
  flex: 0 0 auto;
}
.dot { opacity: .5; }
.status { margin-left: 12px; color: #2d6fdd; }
.actions { display: flex; gap: 8px; flex: 0 0 auto; }
.btn {
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 12px;
  cursor: pointer;
  background: transparent;
}
.btn-ghost { background: transparent; border-color: #d0d7de; color: #1f2328; }
.btn-ghost:hover { background: #f6f8fa; }
.btn-primary { background: #2d6fdd; color: #ffffff; height: 32px; padding: 0 14px; font-size: 13px; border-color: #2d6fdd; }
.btn-primary:hover { background: #1f5ec9; }
</style>
