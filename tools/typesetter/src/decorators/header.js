// ============================================================
// decorator: header
//
// 把首个 H1 + 紧邻 blockquote 包成 <header class="col-header">
//
// 关键改动（vs 原 wrapHeader）：
//   - primaryMeta 由 SKELETON.primaryMeta(meta) 函数决定，去除大段 if-else
//   - sigText 留给 footer decorator
//   - col-meta-strip 自动跳过 industry（用 tag pills 单独承载）
// ============================================================
(function (global) {
  'use strict';

  const escape = global.InkFlow.escapeHtml;

  function header(previewEl, ctx) {
    const { meta, column, charCount } = ctx;
    const SKELETONS = global.InkFlow.SKELETONS || {};
    const skel = SKELETONS[column] || SKELETONS.academic;

    const h1 = previewEl.querySelector('h1');
    if (!h1) return;

    const headerEl = document.createElement('header');
    headerEl.className = 'col-header';

    // ---- 主徽章：栏目名 + primaryMeta ----
    const badge = document.createElement('div');
    badge.className = 'col-badge';

    const label = document.createElement('span');
    label.className = 'col-label';
    label.textContent = skel.name;
    badge.appendChild(label);

    const primary = (skel.primaryMeta ? skel.primaryMeta(meta) : '') || '';
    if (primary) {
      const metaEl = document.createElement('span');
      metaEl.className = 'col-meta';
      metaEl.textContent = primary;
      badge.appendChild(metaEl);
    }
    headerEl.appendChild(badge);

    // ---- H1 移入 ----
    h1.parentNode.insertBefore(headerEl, h1);
    headerEl.appendChild(h1);

    // ---- 摘要：紧邻 blockquote ----
    const next = headerEl.nextElementSibling;
    if (next && next.tagName === 'BLOCKQUOTE') {
      next.classList.add('col-abstract');
      headerEl.appendChild(next);
    }

    // ---- tech 专属：metabar（read_time / difficulty / prerequisites） ----
    if (column === 'tech') {
      const parts = [];
      if (meta.read_time)    parts.push(`<strong>${escape(meta.read_time)}</strong>`);
      if (meta.difficulty)   parts.push(`难度 ${escape(String(meta.difficulty))}`);
      if (meta.prerequisites)parts.push(`前置：${escape(String(meta.prerequisites))}`);
      if (parts.length) {
        const bar = document.createElement('div');
        bar.className = 'col-metabar';
        bar.innerHTML = parts.join('  ·  ');
        headerEl.appendChild(bar);
      }
    }

    // ---- 通用 col-meta-strip（次行 meta：阅读时长 / 作者 / 字数） ----
    if (column === 'industry') return;  // industry 用 tag pills 承载，不要 strip
    const stripParts = [];
    if (column !== 'tech' && meta.read_time) stripParts.push(escape(meta.read_time));
    if (column !== 'story' && meta.author && primary !== `by ${meta.author}`) {
      stripParts.push(`by ${escape(meta.author)}`);
    }
    if (column === 'academic' && meta.date) stripParts.push(escape(meta.date));
    if (typeof charCount === 'number' && charCount > 0) {
      const minutes = Math.max(1, Math.round(charCount / 600));
      stripParts.push(`${charCount} 字 · 约 ${minutes} 分钟`);
    }
    if (stripParts.length) {
      const strip = document.createElement('div');
      strip.className = 'col-meta-strip';
      strip.innerHTML = stripParts.join(' <span class="sep">·</span> ');
      headerEl.appendChild(strip);
    }
  }

  global.InkFlow.registerDecorator('header', header);
})(typeof window !== 'undefined' ? window : globalThis);
