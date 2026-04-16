// ============================================================
// Mermaid 扩展（marked 插件）
//
// 解析 ```mermaid 代码块为 <div class="mermaid-diagram"> 占位，
// 真正渲染由 src/decorators/mermaid.js 在 pipeline 末尾完成（异步）。
//
// 思路源自 doocs/md（packages/core/src/extensions/mermaid.ts），简化为：
//   - tokenizer 同步返回占位 + 缓存键
//   - renderer 命中 mermaidCache 时直接吐 SVG（重渲秒返）
//   - 否则给一个带 data-mermaid-code (base64) 的容器，等 decorator 异步填充
//   - 头尾用 <!--mermaid-start--> / <!--mermaid-end--> 注释包住，
//     便于未来加 sanitize 时整段保护放行（DOMPurify 会删 foreignObject）
// ============================================================
(function (global) {
  'use strict';

  // 与 doocs/md 完全一致的简易 hash（用作缓存键，避免长字符串当 key）
  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(36);
  }

  // UTF-8 安全的 base64（mermaid 代码可能含中文节点）
  function utf8ToB64(s) {
    return btoa(unescape(encodeURIComponent(s)));
  }

  // 缓存：cacheKey -> svgString
  // 暴露到 global，让 decorator/render 可读写
  const mermaidCache = new Map();

  function installMermaidExtension() {
    if (typeof marked === 'undefined') {
      console.warn('[InkFlow] marked not loaded; mermaid extension skipped');
      return;
    }

    marked.use({
      extensions: [{
        name: 'mermaid',
        level: 'block',
        start(src) {
          const m = src.match(/^```mermaid/m);
          return m ? m.index : -1;
        },
        tokenizer(src) {
          const m = /^```mermaid\r?\n([\s\S]*?)\r?\n```\s*(?:\n|$)/.exec(src);
          if (!m) return;
          return {
            type: 'mermaid',
            raw: m[0],
            text: m[1].trim(),
          };
        },
        renderer(token) {
          const code = token.text;
          const key = simpleHash(code);
          const cached = mermaidCache.get(key);
          const open = '<!--mermaid-start-->';
          const close = '<!--mermaid-end-->';

          if (cached) {
            return `${open}<div class="mermaid-diagram" data-mermaid-key="${key}">${cached}</div>${close}`;
          }

          // 占位：data-mermaid-code 是 b64 编码的源码，由 decorator 异步消费
          const b64 = utf8ToB64(code);
          return `${open}<div class="mermaid-diagram" data-mermaid-key="${key}" data-mermaid-code="${b64}">`
               + `<div class="mermaid-loading" style="color:#888;font-size:13px;padding:12px;text-align:center;">正在加载 Mermaid…</div>`
               + `</div>${close}`;
        },
      }],
      // 兜底：把 ``` lang=mermaid 的 code token 改成 mermaid 类型
      walkTokens(token) {
        if (token && token.type === 'code' && token.lang === 'mermaid') {
          token.type = 'mermaid';
          token.text = token.text;
        }
      },
    });
  }

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.installMermaidExtension = installMermaidExtension;
  global.InkFlow.mermaidCache = mermaidCache;
  global.InkFlow.simpleHash = simpleHash;
})(typeof window !== 'undefined' ? window : globalThis);
