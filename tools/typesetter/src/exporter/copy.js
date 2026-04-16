// ============================================================
// 富文本复制 — 把烘焙好的 HTML + 纯文本写到剪贴板
//
// 优先：navigator.clipboard.write（带 text/html + text/plain）
// 回退：document.execCommand('copy')，仅 text/html，格式可能受限
// ============================================================
(function (global) {
  'use strict';

  /**
   * 生成可粘贴到公众号后台的 HTML 字符串：
   *   1. bakeInlineStyles 把 class/var(--xxx) 烘成 inline style
   *   2. WechatFixes.applyWechatFixes 应用平台兼容补丁
   *   3. 包一层 <section> 便于公众号编辑器识别为根容器
   */
  function buildExportHtml(previewEl) {
    const baked = global.InkFlow.bakeInlineStyles(previewEl);
    if (global.WechatFixes && typeof global.WechatFixes.applyWechatFixes === 'function') {
      global.WechatFixes.applyWechatFixes(baked);
    }
    const wrapper = document.createElement('section');
    wrapper.appendChild(baked);
    return wrapper.outerHTML;
  }

  async function copyRichText(previewEl, onStatus) {
    const html = buildExportHtml(previewEl);
    const text = previewEl.innerText;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html':  new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      onStatus && onStatus('已复制，粘贴到公众号后台即可');
    } catch (e) {
      // 回退：只走 text/html
      const ta = document.createElement('textarea');
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
      onStatus && onStatus('已复制（回退模式，格式可能受限）');
    }
  }

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.buildExportHtml = buildExportHtml;
  global.InkFlow.copyRichText    = copyRichText;
})(typeof window !== 'undefined' ? window : globalThis);
