<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Editor from './components/Editor.vue'
import Preview from './components/Preview.vue'
import Toolbar from './components/Toolbar.vue'
import { render } from './pipeline'
import { defaultTheme } from './themes/default'
import { copyHtmlToClipboard } from './clipboard/copyHtml'
import { loadDraft, saveDraft } from './storage/drafts'

const sampleMd = `# 欢迎使用 wx-md

这是 **InkFlow · 微信公众号 Markdown 排版工具**。左侧编辑 Markdown，右侧实时预览 375px 移动端效果。

## Step 1 · 端到端链路验证

当前版本只验证最小管线是否跑通：

- markdown-it 解析 Markdown
- themeCSS 生成主题样式
- juice/client 将 <style> 内联到元素 style
- 预览 iframe 与剪贴板 HTML 来自同一份产物

> 视觉质感、容器语法、SVG 装饰、4 套风格包会在后续 Step 陆续上线。

### 代码块

\`\`\`ts
function hello(name: string) {
  console.log(\`Hello, \${name}!\`)
}
\`\`\`

### 行内增强

==这是高亮文字==，*这是斜体*，**这是加粗**，\`inline code\`。

- 列表项 1
- 列表项 2
- 列表项 3

1. 有序项 1
2. 有序项 2
3. 有序项 3
`

const md = ref<string>('')
const status = ref<string>('')

onMounted(() => {
  const stored = loadDraft()
  md.value = stored || sampleMd
})

watch(md, (val) => {
  saveDraft(val)
})

const rendered = computed(() => {
  try {
    return render({ md: md.value, theme: defaultTheme })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[render] failed:', err)
    return { html: `<pre style="color:#c00;padding:16px">渲染失败：${String(err)}</pre>`, wordCount: 0, readingTime: 1 }
  }
})

async function handleCopy() {
  const html = rendered.value.html
  const plain = md.value
  const result = await copyHtmlToClipboard(html, plain)
  if (result.ok) {
    status.value = result.mode === 'clipboard-api' ? '已复制（富文本）' : '已复制（降级模式）'
  } else {
    status.value = `复制失败：${result.error ?? '未知错误'}`
  }
  setTimeout(() => {
    status.value = ''
  }, 2500)
}

function handleClear() {
  if (!confirm('确定清空当前草稿？此操作不可撤销。')) return
  md.value = ''
  status.value = '已清空'
  setTimeout(() => {
    status.value = ''
  }, 1500)
}
</script>

<template>
  <div class="app">
    <Toolbar
      :word-count="rendered.wordCount"
      :reading-time="rendered.readingTime"
      :status="status"
      @copy="handleCopy"
      @clear="handleClear"
    />
    <main class="main">
      <section class="pane pane-editor">
        <Editor v-model="md" />
      </section>
      <section class="pane pane-preview">
        <Preview :html="rendered.html" />
      </section>
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
