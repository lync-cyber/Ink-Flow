// ============================================================
// 渲染主循环 — render() + applyStyles()
//
// render():
//   1. 解析 frontmatter + 扫 hr 风格
//   2. marked.parse → 写入 #preview
//   3. runPipeline 执行所有 decorators
//   4. applyStyles 注入 CSS 变量
//   5. 若 showSource，刷新源码视图
//
// applyStyles():
//   - 把字号/行高/边距等 spec 写为 --md-* 变量
//   - 仅在用户改了色板/picker 时才注入 --md-primary / --md-accent，
//     否则交给栏目 CSS 自身的色板（通过 .col-X 选择器）
// ============================================================
(function (global) {
  'use strict';

  const EL = (id) => document.getElementById(id);

  // 简单字数估算：中文字符 + 英文单词
  function countWords(s) {
    if (!s) return 0;
    const stripped = s
      .replace(/^---[\s\S]*?---/, '')
      .replace(/```[\s\S]*?```/g, '');
    const cn = (stripped.match(/[\u4e00-\u9fa5]/g) || []).length;
    const en = (stripped.match(/[A-Za-z]+/g) || []).length;
    return cn + en;
  }

  function rgbToHex(s) {
    if (!s) return '';
    s = s.trim();
    if (s.startsWith('#')) return s;
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return '';
    const parts = m[1].split(',').map(p => parseInt(p.trim(), 10));
    return '#' + parts.slice(0, 3).map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function getDefaultMd(column) {
    const el = document.getElementById(`md-default-${column}`);
    return el ? el.textContent.replace(/^\n/, '') : '';
  }

  function render() {
    const ink = global.InkFlow;
    const state = ink.state;

    const src = EL('editor').value;
    const charCount = countWords(src);
    EL('char-count').textContent = `${src.length} 字符`;

    const { body, meta } = ink.parseFrontmatter(src);
    state.hrStyles = ink.scanHrStyles(body);
    const html = marked.parse(body, { gfm: true, breaks: true });

    // frontmatter 指定 column → 自动切换 UI 标签
    if (meta.column && ink.SKELETONS[meta.column] && meta.column !== state.column) {
      state.column = meta.column;
      EL('sel-column-group').querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b.dataset.column === state.column);
      });
    }

    const preview = EL('preview');
    preview.innerHTML = html;
    preview.className = 'article col-' + state.column + (state.isDark ? ' is-dark' : '');

    // 跑 pipeline（顺序见 SKELETON.pipeline 或 DEFAULT_PIPELINE）
    ink.runPipeline(preview, { meta, column: state.column, charCount, hrStyles: state.hrStyles });

    applyStyles();

    const skel = ink.SKELETONS[state.column];
    EL('preset-info').textContent = `${skel.name} · ${skel.description}`;

    if (state.showSource) {
      EL('source-view').textContent = ink.buildExportHtml(preview);
    }
  }

  function applyStyles() {
    const ink = global.InkFlow;
    const state = ink.state;
    const skel = ink.SKELETONS[state.column];
    const palette = state.paletteId ? ink.PALETTES[state.paletteId] : null;
    const primary = state.colorOverride || (palette ? palette.primary : null);
    const accent  = palette ? palette.accent : null;

    const a = EL('preview');
    a.style.setProperty('--md-font-family',    ink.FONT_STACKS[skel.fontKey]);
    a.style.setProperty('--md-font-size',      state.spec.fontSize + 'px');
    a.style.setProperty('--md-line-height',    state.spec.lineHeight);
    a.style.setProperty('--md-letter-spacing', state.spec.letterSpacing + 'px');

    a.style.setProperty('--md-paragraph-gap',  state.spec.paragraphGap + 'em');
    a.style.setProperty('--md-section-gap',    state.spec.sectionGap   + 'em');
    a.style.setProperty('--md-page-padding-x', state.spec.pagePaddingX + 'px');
    a.style.setProperty('--md-page-padding-y', state.spec.pagePaddingY + 'px');

    if (primary) a.style.setProperty('--md-primary', primary);
    else         a.style.removeProperty('--md-primary');
    if (accent)  a.style.setProperty('--md-accent', accent);
    else         a.style.removeProperty('--md-accent');

    if (EL('sel-color')) {
      const cs = window.getComputedStyle(a);
      EL('sel-color').value = rgbToHex(cs.getPropertyValue('--md-primary')) || '#1B3A5C';
    }

    EL('phone-frame').classList.toggle('is-dark', state.isDark);
  }

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.render        = render;
  global.InkFlow.applyStyles   = applyStyles;
  global.InkFlow.countWords    = countWords;
  global.InkFlow.getDefaultMd  = getDefaultMd;
})(typeof window !== 'undefined' ? window : globalThis);
