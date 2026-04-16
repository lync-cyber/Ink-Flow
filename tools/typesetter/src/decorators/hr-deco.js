// ============================================================
// decorator: hrDeco
//
// 按 ctx.hrStyles[idx]（line / star）给每个 <hr> 加 class，
// 并在其后注入装饰文字 div：
//   - star  → ✦ ✦ ✦
//   - line  → SKELETON.hrDeco（如 § / · · · / ✦）
//
// SKELETON.hrDeco 为 null 时不注入文字（hr 本身仍上 class）
// ============================================================
(function (global) {
  'use strict';

  function hrDeco(previewEl, ctx) {
    const { column, hrStyles } = ctx;
    const SKELETONS = global.InkFlow.SKELETONS || {};
    const skel = SKELETONS[column] || SKELETONS.academic;
    const text = skel.hrDeco;

    previewEl.querySelectorAll('.hr-deco').forEach(el => el.remove());

    previewEl.querySelectorAll('hr').forEach((hr, idx) => {
      const styleId = (hrStyles && hrStyles[idx]) || 'line';
      hr.className = `hr-${styleId}`;
      if (!text) return;

      const deco = document.createElement('div');
      deco.className = 'hr-deco hr-deco-' + styleId;
      deco.textContent = (styleId === 'star')
        ? '\u2726 \u2726 \u2726'
        : text;
      hr.parentNode.insertBefore(deco, hr.nextSibling);
    });
  }

  global.InkFlow.registerDecorator('hrDeco', hrDeco);
})(typeof window !== 'undefined' ? window : globalThis);
