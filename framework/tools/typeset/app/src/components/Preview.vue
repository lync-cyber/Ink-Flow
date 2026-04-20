<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ html: string }>()

const iframeEl = ref<HTMLIFrameElement | null>(null)

/** 暴露 iframe 元素给父组件（长图导出等场景需要访问 iframe.contentDocument） */
function getIframe(): HTMLIFrameElement | null {
  return iframeEl.value
}

defineExpose({ getIframe })

/**
 * 375px 移动端保真预览
 *
 * 保真不变量（原则 1）：
 *   iframe 内的 .phone-viewport 内容与剪贴板 text/html 一字不差——
 *   都来自同一份 props.html（已经 juice 内联过）。
 *
 * 关于 iframe 内注入的那点 CSS：
 *   仅作用于三个容器节点（html / body / .phone-viewport），
 *   **不会选中 .markdown-body 或其任何子元素**，因此不会"污染"内容样式。
 *   这些是"外框"（模拟手机屏幕），不是"内容样式"。
 *
 * 为什么需要固定 375px：
 *   viewport meta 在桌面浏览器里不会真的收敛 layout viewport；必须通过
 *   物理宽度限定来模拟 iPhone 375pt 宽屏的视觉。.phone-viewport 宽度是硬约束。
 *
 * sandbox="allow-same-origin"：
 *   - 允许 iframe 与宿主同源，便于主题样式（已内联）即刻生效
 *   - 不加 allow-scripts：iframe 内不执行任何 JS，纯静态渲染
 */
const srcdoc = computed(() => {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=375, initial-scale=1, maximum-scale=1">
<style>
  /* —— 外框层，只作用于容器节点；不染指 .markdown-body —— */
  html, body {
    margin: 0;
    padding: 0;
    background: #ececec;
  }
  body {
    display: flex;
    justify-content: center;
    min-height: 100vh;
  }
  .phone-viewport {
    width: 375px;
    min-height: 100vh;
    background: #ffffff;
    box-shadow: 0 1px 12px rgba(0, 0, 0, 0.06);
  }
</style>
</head>
<body>
<div class="phone-viewport">${props.html}</div>
</body>
</html>`
})
</script>

<template>
  <div class="preview-shell">
    <div class="preview-meta">375px · 移动端保真预览</div>
    <iframe
      ref="iframeEl"
      class="preview-frame wx-md-preview"
      :srcdoc="srcdoc"
      sandbox="allow-same-origin"
      title="wx-md 预览"
    />
  </div>
</template>

<style scoped>
.preview-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ececec;
}
.preview-meta {
  flex: 0 0 auto;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  letter-spacing: 0.5px;
  color: #8a8f98;
  background: #f5f6f8;
  border-bottom: 1px solid #e1e4e8;
  user-select: none;
}
.preview-frame {
  flex: 1 1 auto;
  width: 100%;
  border: none;
  display: block;
  background: #ececec;
}
</style>
