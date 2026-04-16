// ============================================================
// highlight.js 适配 — 把运行时高亮包成 InkFlow.applyHljs
//
// 设计：
//   - 仅在全局 hljs 可用时注册（CDN 加载失败 → 不做事）
//   - 已经处理过的 <code> 用 data-hljs-done 防重入
//   - hljs 会注入 <span class="hljs-keyword"> 等子节点
//   - themes/primitives/hljs.css 把 .hljs-* 映射到我们的
//     --code-light-* / --code-dark-* 变量
//   - bake.js 烘焙时 getComputedStyle 直接读 color，自动 inline
//
// 兼容：highlight.js v11+。若版本不同，highlightElement 不存在
// 时回退到 highlightAuto + innerHTML 写回。
// ============================================================
(function (global) {
  'use strict';

  function applyHljs(codeEl, lang) {
    if (typeof global.hljs === 'undefined') return;
    if (!codeEl || codeEl.dataset.hljsDone === '1') return;

    try {
      if (typeof global.hljs.highlightElement === 'function') {
        // 标准路径（v11+）
        global.hljs.highlightElement(codeEl);
      } else if (typeof global.hljs.highlightAuto === 'function') {
        const text = codeEl.textContent || '';
        const result = lang
          ? global.hljs.highlight(text, { language: lang, ignoreIllegals: true })
          : global.hljs.highlightAuto(text);
        codeEl.innerHTML = result.value;
      }
      codeEl.dataset.hljsDone = '1';
    } catch (err) {
      console.warn('[InkFlow] hljs highlight failed:', err);
    }
  }

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.applyHljs = applyHljs;
})(typeof window !== 'undefined' ? window : globalThis);
