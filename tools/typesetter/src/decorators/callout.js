// ============================================================
// decorator: callout
//
// 后处理 GFM Alert 块：
//   1. 由 alert-presets.resolveAlert(type, custom, column) 决定标题
//   2. 把标题作为 <p class="alert-title"> 注入到 .alert 顶部
//   3. tech 栏目额外注入 .alert-title-prefix span ("$ ")
//   4. story 栏目把 NOTE/TIP 标题转小写更柔和（保持其它语言不变）
//
// 必须在 marked 渲染后运行，因为 marked 阶段还不知道 column。
// ============================================================
(function (global) {
  'use strict';

  function callout(previewEl, ctx) {
    const { column } = ctx;
    const resolveAlert = global.InkFlow.resolveAlert;
    if (typeof resolveAlert !== 'function') return;

    previewEl.querySelectorAll('.alert').forEach(el => {
      // 防重入：已经有 .alert-title 不再处理
      if (el.querySelector(':scope > .alert-title')) return;

      const type   = el.getAttribute('data-alert-type') || 'NOTE';
      const custom = el.getAttribute('data-alert-custom') || '';
      const { title } = resolveAlert(type, custom, column);

      const titleEl = document.createElement('p');
      titleEl.className = 'alert-title';

      if (column === 'tech') {
        const prefix = document.createElement('span');
        prefix.className = 'alert-title-prefix';
        prefix.textContent = '$ ';
        titleEl.appendChild(prefix);
        titleEl.appendChild(document.createTextNode(title));
      } else {
        titleEl.textContent = title;
      }

      el.insertBefore(titleEl, el.firstChild);
    });
  }

  global.InkFlow.registerDecorator('callout', callout);
})(typeof window !== 'undefined' ? window : globalThis);
