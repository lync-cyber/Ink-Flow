// ============================================================
// GFM Alert 扩展（marked 插件）
//
// 解析 `> [!TYPE] customTitle` 块为 <section class="alert alert-XX">
// 标题文字由 alert-presets.js 的 resolveAlert(type, custom, column) 决定。
//
// 注意：renderer 在 marked 解析阶段被调用，但此时还不知道 column。
// 因此先在 DOM 里输出 data-alert-type / data-alert-custom，由
// decorateCallout 在渲染后按 column 解析最终标题文本。
// ============================================================
(function (global) {
  'use strict';

  function installAlertExtension() {
    if (typeof marked === 'undefined') {
      console.warn('[InkFlow] marked not loaded; alert extension skipped');
      return;
    }
    const escape = global.InkFlow.escapeHtml;

    marked.use({
      extensions: [{
        name: 'gfmAlert',
        level: 'block',
        start(src) {
          const m = src.match(/^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
          return m ? m.index : -1;
        },
        tokenizer(src) {
          const m = src.match(
            /^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:[ \t]+([^\n]*))?((?:\n> [^\n]*)*)\n?/
          );
          if (!m) return;
          const type = m[1];
          const customTitle = (m[2] || '').trim();
          const bodyLines = (m[3] || '')
            .split('\n')
            .map(l => l.replace(/^> ?/, ''))
            .filter(l => l.length > 0)
            .join('\n');
          return {
            type: 'gfmAlert',
            raw: m[0],
            alertType: type,
            customTitle,
            tokens: this.lexer.blockTokens(bodyLines || ''),
          };
        },
        renderer(token) {
          const cls = (global.InkFlow.ALERT_CLASSES || {})[token.alertType] || 'alert-note';
          const inner = this.parser.parse(token.tokens);
          return `<section class="alert ${cls}"`
               + ` data-alert-type="${token.alertType}"`
               + ` data-alert-custom="${escape(token.customTitle)}">`
               + inner
               + `</section>`;
        },
      }],
    });
  }

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.installAlertExtension = installAlertExtension;
})(typeof window !== 'undefined' ? window : globalThis);
