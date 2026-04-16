// ============================================================
// HR 风格扫描器
//
// 扫描原始 markdown，按 hr 出现顺序记录每条的源字符风格：
//   --- 或 ___ → 'line'（默认细线）
//   ***       → 'star'（accent 强调）
//
// decorateHrDeco 会按数组顺序应用对应 class（hr-line / hr-star）。
// ============================================================
(function (global) {
  'use strict';

  function scanHrStyles(md) {
    const styles = [];
    md.split(/\r?\n/).forEach(line => {
      const t = line.trim();
      if      (/^-{3,}$/.test(t))  styles.push('line');
      else if (/^\*{3,}$/.test(t)) styles.push('star');
      else if (/^_{3,}$/.test(t))  styles.push('line');
    });
    return styles;
  }

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.scanHrStyles = scanHrStyles;
})(typeof window !== 'undefined' ? window : globalThis);
