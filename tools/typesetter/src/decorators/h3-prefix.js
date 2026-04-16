// ============================================================
// decorator: h3Prefix
//
// 仅在 SKELETON.h3Prefix 非空（目前 tech 用 '›'）时执行。
// 在每个 H3 文本前注入 <span class="h3-prefix">char</span>。
// 跳过 .col-header 内的 H3（防御性，实际不出现）。
// ============================================================
(function (global) {
  'use strict';

  function h3Prefix(previewEl, ctx) {
    const { column } = ctx;
    const SKELETONS = global.InkFlow.SKELETONS || {};
    const skel = SKELETONS[column] || SKELETONS.academic;
    const ch = skel.h3Prefix;
    if (!ch) return;

    previewEl.querySelectorAll('h3').forEach(h3 => {
      if (h3.closest('.col-header')) return;
      if (h3.querySelector(':scope > .h3-prefix')) return;
      const span = document.createElement('span');
      span.className = 'h3-prefix';
      span.textContent = ch;
      h3.insertBefore(span, h3.firstChild);
    });
  }

  global.InkFlow.registerDecorator('h3Prefix', h3Prefix);
})(typeof window !== 'undefined' ? window : globalThis);
