<script setup lang="ts">
defineProps<{
  wordCount: number
  readingTime: number
  status: string
}>()
const emit = defineEmits<{
  (e: 'copy'): void
  (e: 'clear'): void
}>()
</script>

<template>
  <header class="toolbar">
    <div class="brand">
      <span class="brand-name">wx-md</span>
      <span class="brand-sub">微信公众号排版</span>
    </div>
    <div class="stats">
      <span>字数 {{ wordCount }}</span>
      <span class="dot">·</span>
      <span>阅读 {{ readingTime }} 分钟</span>
      <span v-if="status" class="status">{{ status }}</span>
    </div>
    <div class="actions">
      <button class="btn btn-ghost" @click="emit('clear')">清空</button>
      <button class="btn btn-primary" @click="emit('copy')">一键复制</button>
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
}
.brand { display: flex; align-items: baseline; gap: 8px; }
.brand-name { font-weight: 700; font-size: 16px; color: #1f2328; }
.brand-sub { font-size: 12px; color: #6a737d; }
.stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6a737d;
}
.dot { opacity: .5; }
.status { margin-left: 12px; color: #2d6fdd; }
.actions { display: flex; gap: 8px; }
.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 13px;
  cursor: pointer;
}
.btn-ghost { background: transparent; border-color: #d0d7de; color: #1f2328; }
.btn-ghost:hover { background: #f6f8fa; }
.btn-primary { background: #2d6fdd; color: #ffffff; }
.btn-primary:hover { background: #1f5ec9; }
</style>
