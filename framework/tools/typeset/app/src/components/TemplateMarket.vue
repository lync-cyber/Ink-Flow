<script setup lang="ts">
/**
 * 模板市场 · 从当前主题的 theme.templates 读取片段
 *
 * 用法：用户点一个片段，父组件收到 emit('insert', md)，在编辑器光标处插入。
 */
import { computed } from 'vue'
import type { Theme } from '../themes/types'

const props = defineProps<{ theme: Theme }>()
const emit = defineEmits<{
  (e: 'insert', md: string): void
  (e: 'close'): void
}>()

const templates = computed(() => {
  const t = props.theme.templates ?? {}
  return [
    { id: 'cover', label: '封面卡', md: t.cover },
    { id: 'authorBar', label: '作者栏', md: t.authorBar },
    { id: 'tip', label: '小贴士', md: t.tip },
    { id: 'compare', label: '对比两列', md: t.compare },
    { id: 'steps', label: '步骤流程', md: t.steps },
    { id: 'footerCTA', label: '文末引导', md: t.footerCTA },
    { id: 'recommend', label: '推荐阅读', md: t.recommend },
  ].filter((x): x is { id: string; label: string; md: string } => typeof x.md === 'string')
})

function copy(md: string) {
  emit('insert', md)
}
</script>

<template>
  <div class="market">
    <header class="market-head">
      <h3>模板市场 · {{ props.theme.name }}</h3>
      <button class="btn-text" @click="emit('close')">关闭</button>
    </header>
    <div class="list">
      <div v-for="t in templates" :key="t.id" class="card">
        <div class="card-head">
          <strong>{{ t.label }}</strong>
          <button class="btn-primary" @click="copy(t.md)">插入</button>
        </div>
        <pre class="snippet">{{ t.md }}</pre>
      </div>
      <div v-if="templates.length === 0" class="empty">当前主题暂无模板</div>
    </div>
  </div>
</template>

<style scoped>
.market {
  width: 340px; height: 100%;
  background: #fff; border-left: 1px solid #e1e4e8;
  display: flex; flex-direction: column; font-size: 13px;
}
.market-head { display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid #eaecef; }
.market-head h3 { margin: 0; font-size: 14px; }
.btn-text { background: none; border: none; color: #6a737d; cursor: pointer; font-size: 12px; }
.list { flex: 1 1 auto; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.card { border: 1px solid #eaecef; border-radius: 6px; padding: 10px; background: #fbfcfd; }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.btn-primary {
  height: 26px; padding: 0 10px; background: #2d6fdd; color: #fff;
  border: none; border-radius: 4px; cursor: pointer; font-size: 12px;
}
.btn-primary:hover { background: #1f5ec9; }
.snippet {
  margin: 0; font-size: 11px; white-space: pre-wrap; word-break: break-word;
  background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #f1f3f5; max-height: 140px; overflow: auto;
}
.empty { color: #6a737d; text-align: center; padding: 16px; }
</style>
