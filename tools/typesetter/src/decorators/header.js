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
    // 保持视觉样式不变（卡片 + `·` 分隔 + 等宽 + strong 加粗），
    // 仅用 flex-wrap 调整布局：read+难度同行 inline，prereq 自动换行成独立一行，
    // 避免长 prereq 把"难度"挤到换行处，造成断点错位。
    // tech 不再生成通用 col-meta-strip（避免与 metabar 内的 read_time 重复）
    if (column === 'tech') {
      const inline = [];
      if (meta.read_time) {
        inline.push(`<span class="metabar-item"><strong>${escape(meta.read_time)}</strong></span>`);
      }
      if (meta.difficulty) {
        inline.push(`<span class="metabar-item">难度 ${escape(String(meta.difficulty))}</span>`);
      }
      const inlineHtml = inline.join('<span class="metabar-sep">·</span>');
      const wideHtml = meta.prerequisites
        ? `<span class="metabar-item metabar-wide">前置：${escape(String(meta.prerequisites))}</span>`
        : '';
      if (inlineHtml || wideHtml) {
        const bar = document.createElement('div');
        bar.className = 'col-metabar';
        bar.innerHTML = inlineHtml + wideHtml;
        headerEl.appendChild(bar);
      }
      return; // tech 跳过下方 col-meta-strip，已由 metabar 完整承载
    }

    // ---- 通用 col-meta-strip（次行 meta：阅读时长 / 作者 / 字数） ----
    if (column === 'industry') return;  // industry 用 tag pills 承载，不要 strip
    const stripParts = [];
    if (meta.read_time) stripParts.push(escape(meta.read_time));
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
