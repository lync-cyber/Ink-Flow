// ============================================================
// decorator: tagPills
//
// 仅在 SKELETON.tagsAsPills = true 且 meta.tags 存在时执行。
// 把 tags 渲染为统一高宽的 <ul.col-tags><li>...</li></ul>，
// 追加到 col-header 末尾。
// ============================================================
(function (global) {
  'use strict';

  function tagPills(previewEl, ctx) {
    const { meta, column } = ctx;
    const SKELETONS = global.InkFlow.SKELETONS || {};
    const skel = SKELETONS[column] || SKELETONS.academic;
    if (!skel.tagsAsPills) return;

    const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);
    if (!tags.length) return;

    const headerEl = previewEl.querySelector('.col-header');
    if (!headerEl) return;
    if (headerEl.querySelector('.col-tags')) return; // 防重入

    const ul = document.createElement('ul');
    ul.className = 'col-tags';
    tags.forEach(t => {
      const li = document.createElement('li');
      li.textContent = String(t);
      ul.appendChild(li);
    });
    headerEl.appendChild(ul);
  }

  global.InkFlow.registerDecorator('tagPills', tagPills);
})(typeof window !== 'undefined' ? window : globalThis);
