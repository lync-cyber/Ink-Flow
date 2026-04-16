// ============================================================
// decorator: figureCaption
//
// 把 marked 默认输出的 <p><img alt="..."></p> 升级为
//   <figure><img alt="..."><figcaption>alt</figcaption></figure>
//
// 思路源自 doocs/md 的 image renderer（packages/core/src/renderer/renderer-impl.ts）
// 与 paragraph 检测：当段落只含一张图片时，不再用 <p> 包裹，避免语义嵌套。
//
// 触发条件：<p> 仅含一张 <img>（允许 <a> 包裹）。其余情况（图夹文字、多图）
// 保持原状，避免破坏作者的混排意图。
//
// alt 为空时仅输出 <figure><img>，不强行造图注。
// ============================================================
(function (global) {
  'use strict';

  function isLoneImage(p) {
    const kids = Array.from(p.childNodes).filter(n =>
      n.nodeType === 3 ? /\S/.test(n.textContent) : true
    );
    if (kids.length !== 1) return null;
    const only = kids[0];
    if (only.nodeType !== 1) return null;
    if (only.tagName === 'IMG') return only;
    // <a><img></a> 也视为孤图
    if (only.tagName === 'A' && only.children.length === 1 && only.children[0].tagName === 'IMG') {
      return only.children[0];
    }
    return null;
  }

  function figureCaption(previewEl /*, ctx */) {
    const ps = previewEl.querySelectorAll('p');
    ps.forEach(p => {
      const img = isLoneImage(p);
      if (!img) return;
      // 已被升级过则跳过
      if (p.parentNode && p.parentNode.tagName === 'FIGURE') return;

      const fig = document.createElement('figure');
      fig.className = 'md-figure';

      // 把 p 内整段（含可能的 <a> 包裹）搬到 figure 里，保留链接结构
      while (p.firstChild) {
        fig.appendChild(p.firstChild);
      }

      const alt = (img.getAttribute('alt') || '').trim();
      if (alt) {
        const cap = document.createElement('figcaption');
        cap.className = 'md-figcaption';
        cap.textContent = alt;
        fig.appendChild(cap);
      }

      p.replaceWith(fig);
    });
  }

  global.InkFlow.registerDecorator('figureCaption', figureCaption);
})(typeof window !== 'undefined' ? window : globalThis);
