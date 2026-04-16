// ============================================================
// decorator: mermaid
//
// 接管由 src/parsers/mermaid-ext.js 输出的占位 .mermaid-diagram[data-mermaid-code]，
// 异步加载 mermaid lib（CDN ESM，单例），渲染为 SVG 后回填 innerHTML。
//
// 异步说明：
//   - decorator 同步返回（走与其它 decorator 一致的接口）
//   - 在内部 fire-and-forget 渲染；完成后 dispatch 'inkflow:mermaid-rendered'
//   - main.js / source-view 监听该事件，按需刷新源码视图
//
// 失败处理：渲染异常时填充红框错误占位（sticky，不再重试相同 hash）
//
// 性能：
//   - mermaidCache 全局 hash 缓存（首次跨渲染重复使用）
//   - mermaid lib 仅在第一次发现 mermaid 块时才动态 import（首屏零开销）
// ============================================================
(function (global) {
  'use strict';

  // 单例懒加载：返回 Promise<mermaid>
  let mermaidLibPromise = null;
  function getMermaidLib() {
    if (!mermaidLibPromise) {
      mermaidLibPromise = import('https://esm.sh/mermaid@11')
        .then(mod => {
          const m = mod.default || mod;
          // securityLevel:'loose' 允许 HTML 标签穿透到 nodeLabel 内（与 doocs 一致）
          m.initialize({ startOnLoad: false, securityLevel: 'loose' });
          return m;
        })
        .catch(err => {
          console.error('[InkFlow] mermaid lib load failed:', err);
          mermaidLibPromise = null; // 允许下次重试
          throw err;
        });
    }
    return mermaidLibPromise;
  }

  function utf8FromB64(b64) {
    return decodeURIComponent(escape(atob(b64)));
  }

  async function renderOne(el, mermaid) {
    const key = el.dataset.mermaidKey;
    const code = utf8FromB64(el.dataset.mermaidCode);
    try {
      const renderId = 'mermaid-render-' + key + '-' + Math.random().toString(36).slice(2, 7);
      const { svg } = await mermaid.render(renderId, code);
      global.InkFlow.mermaidCache.set(key, svg);
      el.innerHTML = svg;
      el.removeAttribute('data-mermaid-code');
    } catch (err) {
      console.error('[InkFlow] mermaid render failed:', err);
      el.innerHTML = `<div style="color:#c0392b;border:1px solid #c0392b;padding:8px;font-size:13px;">Mermaid 渲染失败：${(err && err.message) || err}</div>`;
      el.removeAttribute('data-mermaid-code');
    }
  }

  function mermaidDecorator(previewEl /*, ctx */) {
    const blocks = previewEl.querySelectorAll('.mermaid-diagram[data-mermaid-code]');
    if (!blocks.length) return;

    getMermaidLib()
      .then(async mermaid => {
        for (const el of blocks) {
          await renderOne(el, mermaid);
        }
        // 通知外部：异步渲染完成（main.js 用来刷新源码视图）
        document.dispatchEvent(new CustomEvent('inkflow:mermaid-rendered'));
      })
      .catch(() => {
        // lib 加载失败 → 全部占位填降级提示
        blocks.forEach(el => {
          el.innerHTML = `<div style="color:#c0392b;border:1px solid #c0392b;padding:8px;font-size:13px;">无法加载 Mermaid 库（请检查网络）</div>`;
          el.removeAttribute('data-mermaid-code');
        });
      });
  }

  global.InkFlow.registerDecorator('mermaid', mermaidDecorator);
})(typeof window !== 'undefined' ? window : globalThis);
