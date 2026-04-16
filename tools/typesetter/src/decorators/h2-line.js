// ============================================================
// decorator: h2Line
//
// 仅在 SKELETON.h2DecoLine = true（目前 story）时执行。
// 在每个 H2 后面追加 <div class="h2-deco">— · —</div>。
// 跳过 .col-header 内的 H2（实际不会出现，保险起见）。
// ============================================================
(function (global) {
  'use strict';

  function h2Line(previewEl, ctx) {
    const { column } = ctx;
    const SKELETONS = global.InkFlow.SKELETONS || {};
    const skel = SKELETONS[column] || SKELETONS.academic;
    if (!skel.h2DecoLine) return;

    previewEl.querySelectorAll('h2').forEach(h2 => {
      if (h2.closest('.col-header')) return;
      const next = h2.nextElementSibling;
      if (next && next.classList.contains('h2-deco')) return;
      const deco = document.createElement('div');
      deco.className = 'h2-deco';
      deco.textContent = '\u2014\u2003\u00B7\u2003\u2014';  // — · —
      h2.parentNode.insertBefore(deco, h2.nextSibling);
    });
  }

  global.InkFlow.registerDecorator('h2Line', h2Line);
})(typeof window !== 'undefined' ? window : globalThis);
