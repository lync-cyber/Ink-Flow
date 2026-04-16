// ============================================================
// decorator: footer
//
// 在文章末尾追加 <footer class="col-sig">：
//   <div class="col-sig-rule"></div>
//   <div class="col-sig-text">{SKELETON.sigText(meta, name)}</div>
//
// sigText 函数完全收编原 if/else 链，现在所有差异收敛到 SKELETON。
// ============================================================
(function (global) {
  'use strict';

  function footer(previewEl, ctx) {
    const { meta, column } = ctx;
    const SKELETONS = global.InkFlow.SKELETONS || {};
    const skel = SKELETONS[column] || SKELETONS.academic;

    previewEl.querySelectorAll('.col-sig').forEach(el => el.remove());

    const sig = document.createElement('footer');
    sig.className = 'col-sig';

    const rule = document.createElement('div');
    rule.className = 'col-sig-rule';
    sig.appendChild(rule);

    const text = document.createElement('div');
    text.className = 'col-sig-text';
    const fn = skel.sigText || ((_, name) => name);
    text.textContent = fn(meta || {}, skel.name || '');
    sig.appendChild(text);

    previewEl.appendChild(sig);
  }

  global.InkFlow.registerDecorator('footer', footer);
})(typeof window !== 'undefined' ? window : globalThis);
