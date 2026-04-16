// ============================================================
// decorator: blockquote
//
// 在普通 blockquote 的首/尾 <p> 注入 .bq-open / .bq-close span，
// 字符由 SKELETON.quoteOpen / quoteClose 决定。
//
// 跳过：
//   - .col-abstract（头部摘要，已被 wrap）
//   - .alert（GFM Alert，由 callout decorator 处理）
// ============================================================
(function (global) {
  'use strict';

  function blockquote(previewEl, ctx) {
    const { column } = ctx;
    const SKELETONS = global.InkFlow.SKELETONS || {};
    const skel = SKELETONS[column] || SKELETONS.academic;
    if (!skel.quoteOpen && !skel.quoteClose) return;

    previewEl.querySelectorAll('blockquote').forEach(bq => {
      if (bq.classList.contains('col-abstract')) return;
      if (bq.classList.contains('alert'))        return;
      if (bq.querySelector(':scope > p > .bq-open')) return;

      if (skel.quoteOpen) {
        const firstP = bq.querySelector(':scope > p');
        if (firstP) {
          const open = document.createElement('span');
          open.className = 'bq-open';
          open.textContent = skel.quoteOpen;
          firstP.insertBefore(open, firstP.firstChild);
        }
      }
      if (skel.quoteClose) {
        const ps = bq.querySelectorAll(':scope > p');
        const lastP = ps[ps.length - 1];
        if (lastP) {
          const close = document.createElement('span');
          close.className = 'bq-close';
          close.textContent = skel.quoteClose;
          lastP.appendChild(close);
        }
      }
    });
  }

  global.InkFlow.registerDecorator('blockquote', blockquote);
})(typeof window !== 'undefined' ? window : globalThis);
