// ============================================================
// decorator: refList
//
// 找 H2 文本为 "参考文献" / "参考资料" / "References" 的标题，
// 把它和后续的 <ol> 一起包成：
//   <section class="ref-list" data-count="N" data-count-overflow="true|false">
//     <h2>参考文献</h2>
//     <ol>...</ol>
//   </section>
//
// 浏览器预览：data-count-overflow=true 触发 max-height + 滚动
// 微信导出：wechat-fixes.dropScrollContainer 自动剥 overflow，
//          保留紧凑字号 + 完整列表
// ============================================================
(function (global) {
  'use strict';

  const REF_TITLES = ['参考文献', '参考资料', 'References', 'REFERENCES', 'reference', '引用'];
  const OVERFLOW_THRESHOLD = 8;

  function isRefHeading(h) {
    if (!h) return false;
    const t = (h.textContent || '').trim();
    return REF_TITLES.some(name => t === name || t.toLowerCase() === name.toLowerCase());
  }

  function refList(previewEl /*, ctx */) {
    previewEl.querySelectorAll('h2').forEach(h2 => {
      if (!isRefHeading(h2)) return;
      // 已被包裹则跳过
      if (h2.parentNode && h2.parentNode.classList.contains('ref-list')) return;

      // 跳到下一个非空兄弟，必须是 <ol>
      let sib = h2.nextElementSibling;
      while (sib && sib.nodeType === 1 && sib.tagName === 'P' && !sib.textContent.trim()) {
        sib = sib.nextElementSibling;
      }
      if (!sib || sib.tagName !== 'OL') return;

      const ol = sib;
      const count = ol.querySelectorAll(':scope > li').length;

      const wrap = document.createElement('section');
      wrap.className = 'ref-list';
      wrap.setAttribute('data-count', String(count));
      if (count >= OVERFLOW_THRESHOLD) {
        wrap.setAttribute('data-count-overflow', 'true');
      }

      h2.parentNode.insertBefore(wrap, h2);
      wrap.appendChild(h2);
      wrap.appendChild(ol);
    });
  }

  global.InkFlow.registerDecorator('refList', refList);
})(typeof window !== 'undefined' ? window : globalThis);
