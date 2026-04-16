// ============================================================
// decorator: colLabelPrefix
//
// 仅在 SKELETON.colLabelPrefix 非空（目前 tech 用 '// '）时执行。
// 把 .col-header .col-label 文本前注入 <span class="col-label-prefix">prefix</span>。
//
// 用 span 而非伪元素的原因：::before 烘焙后丢失，无法走 WeChat。
// ============================================================
(function (global) {
  'use strict';

  function colLabelPrefix(previewEl, ctx) {
    const { column } = ctx;
    const SKELETONS = global.InkFlow.SKELETONS || {};
    const skel = SKELETONS[column] || SKELETONS.academic;
    const prefix = skel.colLabelPrefix;
    if (!prefix) return;

    const label = previewEl.querySelector('.col-header .col-label');
    if (!label) return;
    if (label.querySelector(':scope > .col-label-prefix')) return;

    const span = document.createElement('span');
    span.className = 'col-label-prefix';
    span.textContent = prefix;
    label.insertBefore(span, label.firstChild);
  }

  global.InkFlow.registerDecorator('colLabelPrefix', colLabelPrefix);
})(typeof window !== 'undefined' ? window : globalThis);
