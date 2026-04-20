<script setup lang="ts">
import { computed } from 'vue'
import { themeList } from '../themes'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const options = computed(() => themeList.map((t) => ({ id: t.id, name: t.name })))

function onChange(ev: Event) {
  const el = ev.target as HTMLSelectElement
  emit('update:modelValue', el.value)
}
</script>

<template>
  <label class="theme-picker">
    <span class="label">主题</span>
    <select :value="props.modelValue" @change="onChange">
      <option v-for="opt in options" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
    </select>
  </label>
</template>

<style scoped>
.theme-picker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #1f2328;
}
.label { color: #6a737d; }
select {
  height: 28px;
  padding: 0 8px;
  font-size: 13px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #fff;
  color: #1f2328;
  cursor: pointer;
}
select:hover { border-color: #2d6fdd; }
</style>
