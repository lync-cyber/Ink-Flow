// ============================================================
// YAML Frontmatter 最小解析器
//
// 仅支持：
//   - 标量：key: value（带可选引号）
//   - 行内数组：key: [a, b, "c"]
//
// 不支持（故意丢弃，避免引入 js-yaml 9KB 依赖）：
//   - 多行数组（YAML "- " 块）
//   - 嵌套对象
//   - YAML 注释 / 锚点
// 如未来需求增加，可考虑 CDN 引入 js-yaml mini build。
// ============================================================
(function (global) {
  'use strict';

  function parseFrontmatter(md) {
    const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!m) return { body: md, meta: {} };
    const body = md.slice(m[0].length);
    const meta = {};
    m[1].split(/\r?\n/).forEach(line => {
      const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
      if (!kv) return;
      let v = kv[2].trim();
      if (v.startsWith('[') && v.endsWith(']')) {
        v = v.slice(1, -1)
          .split(',')
          .map(s => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      meta[kv[1]] = v;
    });
    return { body, meta };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.parseFrontmatter = parseFrontmatter;
  global.InkFlow.escapeHtml = escapeHtml;
})(typeof window !== 'undefined' ? window : globalThis);
