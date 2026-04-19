<script setup lang="ts">
/**
 * 配色自定义面板
 *
 * 工作流：
 *   1. 预设十套 palette 横排可点
 *   2. 三个色选器（primary / secondary / accent）+ dark toggle
 *   3. 点"应用"→ 父组件收到 emit('apply', seed)，父组件用 applyPalette 合成新 Theme
 *   4. 实时显示 primary 与推导 bg 的 WCAG 对比度，不过关时给提示
 */
import { reactive, watch } from 'vue'
import { palettePresets } from '../color/palettes'
import { checkContrast, derivePalette, seedFromPrimary } from '../color/generator'

interface Seed {
  primary: string
  secondary: string
  accent: string
  dark: boolean
}

const seed = reactive<Seed>({
  primary: '#2d6fdd',
  secondary: '#1f3b70',
  accent: '#4ec9b0',
  dark: false,
})

const state = reactive({
  previewBg: '#ffffff',
  contrastRatio: 0,
  contrastPass: true,
})

watch(
  () => [seed.primary, seed.secondary, seed.accent, seed.dark],
  () => {
    const derived = derivePalette(seed)
    state.previewBg = derived.bg
    const { pass, ratio } = checkContrast(seed.primary, derived.bg)
    state.contrastPass = pass
    state.contrastRatio = ratio
  },
  { immediate: true },
)

const emit = defineEmits<{
  (e: 'apply', value: Seed): void
  (e: 'close'): void
}>()

function pick(p: (typeof palettePresets)[number]) {
  seed.primary = p.primary
  seed.secondary = p.secondary
  seed.accent = p.accent
  seed.dark = Boolean(p.dark)
}

function autoCompleteFromPrimary() {
  const s = seedFromPrimary(seed.primary, seed.dark)
  seed.secondary = s.secondary
  seed.accent = s.accent
}

function apply() {
  emit('apply', { ...seed })
}
</script>

<template>
  <div class="panel">
    <header class="panel-head">
      <h3>自定义配色</h3>
      <button class="btn-text" @click="emit('close')">关闭</button>
    </header>

    <section class="panel-section">
      <div class="section-title">预设调色板</div>
      <div class="preset-grid">
        <button
          v-for="p in palettePresets"
          :key="p.id"
          class="preset"
          :title="p.description"
          @click="pick(p)"
        >
          <span class="swatch" :style="{ background: p.primary }" />
          <span class="swatch" :style="{ background: p.secondary }" />
          <span class="swatch" :style="{ background: p.accent }" />
          <span class="preset-name">{{ p.name }}</span>
        </button>
      </div>
    </section>

    <section class="panel-section">
      <div class="section-title">三色 seed</div>
      <div class="row">
        <label class="field"><span>主色</span><input type="color" v-model="seed.primary" /><code>{{ seed.primary }}</code></label>
        <label class="field"><span>辅色</span><input type="color" v-model="seed.secondary" /><code>{{ seed.secondary }}</code></label>
        <label class="field"><span>点缀</span><input type="color" v-model="seed.accent" /><code>{{ seed.accent }}</code></label>
      </div>
      <div class="row">
        <label class="toggle"><input type="checkbox" v-model="seed.dark" /> 暗底主题</label>
        <button class="btn-ghost" @click="autoCompleteFromPrimary">由主色补全辅色/点缀</button>
      </div>
    </section>

    <section class="panel-section">
      <div class="section-title">对比度检查</div>
      <div class="check" :class="{ fail: !state.contrastPass }">
        primary vs bg 对比度 = <strong>{{ state.contrastRatio.toFixed(1) }}</strong>
        <span v-if="state.contrastPass">（通过 WCAG AA 3.0）</span>
        <span v-else>（不足 3.0，可读性低，建议换主色）</span>
      </div>
    </section>

    <footer class="panel-foot">
      <button class="btn-primary" @click="apply">应用到当前主题</button>
    </footer>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  min-width: 360px;
  max-width: 440px;
  height: 100%;
  font-size: 13px;
  color: #1f2328;
  border-left: 1px solid #e1e4e8;
}
.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid #eaecef;
}
.panel-head h3 { margin: 0; font-size: 14px; }
.btn-text { background: none; border: none; color: #6a737d; cursor: pointer; font-size: 12px; }
.panel-section { padding: 12px 16px; border-bottom: 1px solid #f1f3f5; }
.section-title { font-size: 12px; color: #6a737d; margin-bottom: 8px; }
.preset-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.preset {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 8px; background: #f6f8fa; border: 1px solid transparent;
  border-radius: 6px; cursor: pointer; font-size: 12px;
}
.preset:hover { border-color: #2d6fdd; }
.swatch { display: inline-block; width: 14px; height: 14px; border-radius: 3px; border: 1px solid #d0d7de; }
.preset-name { margin-left: 6px; }
.row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 8px; }
.field { display: inline-flex; align-items: center; gap: 6px; }
.field input[type="color"] { width: 36px; height: 28px; border: 1px solid #d0d7de; border-radius: 4px; padding: 0; cursor: pointer; }
.field code { color: #6a737d; font-size: 11px; }
.toggle { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
.btn-ghost { height: 28px; padding: 0 10px; background: transparent; border: 1px solid #d0d7de; border-radius: 6px; cursor: pointer; font-size: 12px; }
.check { padding: 8px 10px; background: #eef6ee; color: #1a8450; border-radius: 4px; font-size: 12px; }
.check.fail { background: #fdecec; color: #b42318; }
.panel-foot { padding: 12px 16px; margin-top: auto; }
.btn-primary {
  width: 100%; height: 32px; background: #2d6fdd; color: #fff; border: none;
  border-radius: 6px; cursor: pointer; font-size: 13px;
}
.btn-primary:hover { background: #1f5ec9; }
</style>
