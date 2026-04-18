<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ html: string }>()

/**
 * 预览 iframe srcdoc：
 *   - viewport 锁 375px（移动端保真）
 *   - body 只做容器居中与最小化 reset；禁止注入任何额外 CSS
 *   - iframe 内容与剪贴板 HTML 共享同一份 props.html（保真不变量）
 */
const srcdoc = computed(() => {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=375, initial-scale=1, maximum-scale=1">
<style>
  html, body { margin: 0; padding: 0; background: #f2f2f2; }
  body {
    display: flex;
    justify-content: center;
    min-height: 100vh;
  }
  .phone-frame {
    width: 375px;
    min-height: 100vh;
    background: #ffffff;
    box-shadow: 0 2px 16px rgba(0,0,0,.08);
  }
</style>
</head>
<body>
  <div class="phone-frame">${props.html}</div>
</body>
</html>`
})
</script>

<template>
  <iframe class="preview-frame" :srcdoc="srcdoc" sandbox="allow-same-origin" />
</template>

<style scoped>
.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background: #f2f2f2;
}
</style>
