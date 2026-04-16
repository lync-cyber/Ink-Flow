// ============================================================
// decorator: codeBlock
//
// 把 <pre> 包成 .code-block，并按 SKELETON.codeHead 选项注入头部：
//   { dots: bool, lang: bool }
//
// 若 InkFlow.applyHljs 函数存在（来自 highlight.js 集成），
// 自动对每个 <pre><code class="language-XX"> 调用一次高亮，
// 之后的 inline 烘焙会把 hljs-* 的颜色搬进 style。
// ============================================================
(function (global) {
  'use strict';

  function codeBlock(previewEl, ctx) {
    const { column } = ctx;
    const SKELETONS = global.InkFlow.SKELETONS || {};
    const skel = SKELETONS[column] || SKELETONS.academic;
    const opts = skel.codeHead || { dots: false, lang: true };

    previewEl.querySelectorAll('pre').forEach(pre => {
      const parent = pre.parentNode;
      if (parent && parent.classList && parent.classList.contains('code-block')) return;

      const code = pre.querySelector('code');
      let lang = '';
      if (code) {
        const m = (code.className || '').match(/language-(\S+)/);
        if (m) lang = m[1];

        // ---- 可选：highlight.js 高亮 ----
        if (typeof global.InkFlow.applyHljs === 'function') {
          try { global.InkFlow.applyHljs(code, lang); }
          catch (err) { console.warn('[InkFlow] hljs failed:', err); }
        }
      }

      const wrap = document.createElement('section');
      wrap.className = 'code-block';
      pre.parentNode.insertBefore(wrap, pre);

      if (opts.dots || (opts.lang && lang)) {
        const head = document.createElement('div');
        head.className = 'code-head';
        if (opts.dots) {
          const dots = document.createElement('span');
          dots.className = 'code-dots';
          dots.textContent = '\u25CF \u25CF \u25CF';
          head.appendChild(dots);
        }
        if (opts.lang && lang) {
          const langEl = document.createElement('span');
          langEl.className = 'code-lang';
          langEl.textContent = lang;
          head.appendChild(langEl);
        }
        wrap.appendChild(head);
      }
      wrap.appendChild(pre);
    });
  }

  global.InkFlow.registerDecorator('codeBlock', codeBlock);
})(typeof window !== 'undefined' ? window : globalThis);
