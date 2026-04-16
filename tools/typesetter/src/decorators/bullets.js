// ============================================================
// decorator: bullets
//
// 给 <ul>/<ol> 注入 .li-bullet / .li-num span，避免 ::before
// 在 WeChat 烘焙后丢失。
//
// 排除：
//   - .col-header 内的 ul（tag pills 用，跳过）
//   - .ref-list 内的 ol（参考文献用原生 list-style）
//   - .alert 内的 ul/ol 同样应用（统一视觉）
// ============================================================
(function (global) {
  'use strict';

  function bullets(previewEl, ctx) {
    const { column } = ctx;
    const SKELETONS = global.InkFlow.SKELETONS || {};
    const skel = SKELETONS[column] || SKELETONS.academic;

    // 防重入清理
    previewEl.querySelectorAll('.li-bullet, .li-num, .li-num-badge').forEach(el => el.remove());

    previewEl.querySelectorAll('ul > li').forEach(li => {
      if (li.closest('.col-header')) return;
      if (li.closest('.col-tags'))   return;
      const b = document.createElement('span');
      b.className = 'li-bullet';
      b.textContent = skel.ulBullet || '\u00B7';
      li.insertBefore(b, li.firstChild);
    });

    previewEl.querySelectorAll('ol').forEach(ol => {
      if (ol.closest('.col-header')) return;
      if (ol.closest('.ref-list'))   return;
      const isBadge = skel.olMode === 'badge';
      let n = 1;
      ol.querySelectorAll(':scope > li').forEach(li => {
        const num = document.createElement('span');
        num.className = isBadge ? 'li-num li-num-badge' : 'li-num';
        num.textContent = String(n++);
        li.insertBefore(num, li.firstChild);
      });
    });
  }

  global.InkFlow.registerDecorator('bullets', bullets);
})(typeof window !== 'undefined' ? window : globalThis);
