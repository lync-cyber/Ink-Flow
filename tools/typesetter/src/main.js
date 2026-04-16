// ============================================================
// 入口 — UI 事件绑定 + 初始化
//
// 加载顺序由 index.html 保证：
//   parsers → config → decorators → exporter → state → render → main
// ============================================================
(function (global) {
  'use strict';

  const EL = (id) => document.getElementById(id);
  const ink = global.InkFlow;

  function flashStatus(msg) {
    EL('status').textContent = msg;
    clearTimeout(flashStatus._t);
    flashStatus._t = setTimeout(() => { EL('status').textContent = '就绪'; }, 2500);
  }

  function syncSlidersToState() {
    const s = ink.state.spec;
    const set = (id, val, label) => {
      const el = EL(id);
      if (el) el.value = val;
      const lab = EL(label);
      if (lab) lab.textContent =
        (typeof val === 'number' && Number.isInteger(val))
          ? val + (id.includes('size') || id.includes('pad') ? 'px' : '')
          : (+val).toFixed(2) + (id.includes('lh') ? '' : (id.includes('ls') ? 'px' : 'em'));
    };
    if (EL('sel-size'))  { EL('sel-size').value  = s.fontSize;       EL('val-size').textContent  = s.fontSize + 'px'; }
    if (EL('sel-lh'))    { EL('sel-lh').value    = s.lineHeight;     EL('val-lh').textContent    = (+s.lineHeight).toFixed(2); }
    if (EL('sel-ls'))    { EL('sel-ls').value    = s.letterSpacing;  EL('val-ls').textContent    = s.letterSpacing + 'px'; }
    if (EL('sel-pad-x')) { EL('sel-pad-x').value = s.pagePaddingX;   EL('val-pad-x').textContent = s.pagePaddingX + 'px'; }
    if (EL('sel-pad-y')) { EL('sel-pad-y').value = s.pagePaddingY;   EL('val-pad-y').textContent = s.pagePaddingY + 'px'; }
    if (EL('sel-pgap'))  { EL('sel-pgap').value  = s.paragraphGap;   EL('val-pgap').textContent  = (+s.paragraphGap).toFixed(2) + 'em'; }
    if (EL('sel-sgap'))  { EL('sel-sgap').value  = s.sectionGap;     EL('val-sgap').textContent  = (+s.sectionGap).toFixed(2) + 'em'; }
  }

  function loadPreset(column) {
    const SKELETONS = ink.SKELETONS;
    if (!SKELETONS[column]) return;
    const state = ink.state;

    state.column = column;
    const s = SKELETONS[column];
    state.spec = {
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      paragraphGap: s.paragraphGap,
      sectionGap: s.sectionGap,
      pagePaddingX: s.pagePaddingX,
      pagePaddingY: s.pagePaddingY,
    };
    state.colorOverride = null;
    state.paletteId     = null;
    syncSlidersToState();
    if (EL('sel-palette')) EL('sel-palette').value = '';

    if (!state.userEdited) {
      EL('editor').value = ink.getDefaultMd(column);
    }

    EL('sel-column-group').querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.column === column);
    });

    ink.render();
  }

  function updateResetBtn() {
    EL('btn-reset-content').style.display = ink.state.userEdited ? 'inline-block' : 'none';
  }

  // ---------- 滚动同步 ----------
  let syncing = false;
  function syncEditorToPreview() {
    if (syncing) return;
    const ed = EL('editor'); const pv = EL('preview-wrap');
    const edMax = ed.scrollHeight - ed.clientHeight;
    if (edMax <= 0) return;
    const ratio = ed.scrollTop / edMax;
    const pvMax = pv.scrollHeight - pv.clientHeight;
    syncing = true;
    pv.scrollTop = ratio * pvMax;
    requestAnimationFrame(() => { syncing = false; });
  }
  function syncPreviewToEditor() {
    if (syncing) return;
    const ed = EL('editor'); const pv = EL('preview-wrap');
    const pvMax = pv.scrollHeight - pv.clientHeight;
    if (pvMax <= 0) return;
    const ratio = pv.scrollTop / pvMax;
    const edMax = ed.scrollHeight - ed.clientHeight;
    syncing = true;
    ed.scrollTop = ratio * edMax;
    requestAnimationFrame(() => { syncing = false; });
  }

  function init() {
    if (typeof marked === 'undefined') {
      console.error('[InkFlow] marked.js failed to load');
      return;
    }
    ink.installAlertExtension();
    if (typeof ink.installMermaidExtension === 'function') {
      ink.installMermaidExtension();
    }

    // mermaid 异步渲染完成后：若源码视图正开着，刷新一次
    document.addEventListener('inkflow:mermaid-rendered', () => {
      if (ink.state.showSource) {
        EL('source-view').textContent = ink.buildExportHtml(EL('preview'));
      }
    });

    const state = ink.state;

    // 栏目 pill
    EL('sel-column-group').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-column]');
      if (!btn) return;
      loadPreset(btn.dataset.column);
    });

    // 主色 picker
    EL('sel-color').addEventListener('input', () => {
      state.colorOverride = EL('sel-color').value;
      ink.applyStyles();
    });
    EL('btn-reset-color').addEventListener('click', () => {
      state.colorOverride = null;
      state.paletteId = null;
      if (EL('sel-palette')) EL('sel-palette').value = '';
      ink.applyStyles();
    });

    // 色板下拉
    if (EL('sel-palette')) {
      const opts = ['<option value="">栏目默认</option>'];
      Object.keys(ink.PALETTES).forEach(k => {
        opts.push(`<option value="${k}">${ink.PALETTES[k].name}</option>`);
      });
      EL('sel-palette').innerHTML = opts.join('');
      EL('sel-palette').addEventListener('change', () => {
        state.paletteId = EL('sel-palette').value || null;
        state.colorOverride = null;
        ink.applyStyles();
      });
    }

    // 排版滑块
    EL('sel-size').addEventListener('input', () => {
      state.spec.fontSize = parseInt(EL('sel-size').value, 10);
      EL('val-size').textContent = state.spec.fontSize + 'px';
      ink.applyStyles();
    });
    EL('sel-lh').addEventListener('input', () => {
      state.spec.lineHeight = parseFloat(EL('sel-lh').value);
      EL('val-lh').textContent = state.spec.lineHeight.toFixed(2);
      ink.applyStyles();
    });
    EL('sel-ls').addEventListener('input', () => {
      state.spec.letterSpacing = parseFloat(EL('sel-ls').value);
      EL('val-ls').textContent = state.spec.letterSpacing + 'px';
      ink.applyStyles();
    });

    // 布局滑块
    if (EL('sel-pad-x')) {
      EL('sel-pad-x').addEventListener('input', () => {
        state.spec.pagePaddingX = parseInt(EL('sel-pad-x').value, 10);
        EL('val-pad-x').textContent = state.spec.pagePaddingX + 'px';
        ink.applyStyles();
      });
    }
    if (EL('sel-pad-y')) {
      EL('sel-pad-y').addEventListener('input', () => {
        state.spec.pagePaddingY = parseInt(EL('sel-pad-y').value, 10);
        EL('val-pad-y').textContent = state.spec.pagePaddingY + 'px';
        ink.applyStyles();
      });
    }
    if (EL('sel-pgap')) {
      EL('sel-pgap').addEventListener('input', () => {
        state.spec.paragraphGap = parseFloat(EL('sel-pgap').value);
        EL('val-pgap').textContent = state.spec.paragraphGap.toFixed(2) + 'em';
        ink.applyStyles();
      });
    }
    if (EL('sel-sgap')) {
      EL('sel-sgap').addEventListener('input', () => {
        state.spec.sectionGap = parseFloat(EL('sel-sgap').value);
        EL('val-sgap').textContent = state.spec.sectionGap.toFixed(2) + 'em';
        ink.applyStyles();
      });
    }

    // 重置参数
    EL('btn-reset-spec').addEventListener('click', () => {
      const s = ink.SKELETONS[state.column];
      state.spec = {
        fontSize: s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing,
        paragraphGap: s.paragraphGap, sectionGap: s.sectionGap,
        pagePaddingX: s.pagePaddingX, pagePaddingY: s.pagePaddingY,
      };
      state.colorOverride = null;
      state.paletteId     = null;
      if (EL('sel-palette')) EL('sel-palette').value = '';
      syncSlidersToState();
      ink.applyStyles();
    });

    // 重置内容
    EL('btn-reset-content').addEventListener('click', () => {
      EL('editor').value = ink.getDefaultMd(state.column);
      state.userEdited = false;
      updateResetBtn();
      ink.render();
    });

    // 深色切换
    EL('btn-dark').addEventListener('click', () => {
      state.isDark = !state.isDark;
      EL('btn-dark').textContent = state.isDark ? '\u2600' : '\uD83C\uDF19';
      EL('btn-dark').title = state.isDark
        ? '切换为 Light 主题（影响复制结果）'
        : '切换为 Dark 主题（影响复制结果）';
      ink.render();
    });

    // 源码切换
    EL('btn-source').addEventListener('click', () => {
      state.showSource = !state.showSource;
      EL('btn-source').classList.toggle('active', state.showSource);
      EL('source-view').style.display = state.showSource ? 'block' : 'none';
      EL('phone-frame').style.display = state.showSource ? 'none' : 'block';
      if (state.showSource) {
        EL('source-view').textContent = ink.buildExportHtml(EL('preview'));
      }
    });

    // 载入文件
    EL('btn-load').addEventListener('click', () => EL('file-input').click());
    EL('file-input').addEventListener('change', (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        EL('editor').value = r.result;
        state.userEdited = false;
        updateResetBtn();
        const { meta } = ink.parseFrontmatter(r.result);
        if (meta.column && ink.SKELETONS[meta.column]) {
          loadPreset(meta.column);
        } else {
          ink.render();
        }
      };
      r.readAsText(f, 'utf-8');
    });

    // 复制
    EL('btn-copy').addEventListener('click', () => {
      ink.copyRichText(EL('preview'), flashStatus);
    });

    // 编辑
    EL('editor').addEventListener('input', () => {
      state.userEdited = true;
      updateResetBtn();
      ink.render();
    });

    // 滚动同步
    EL('editor').addEventListener('scroll', syncEditorToPreview);
    EL('preview-wrap').addEventListener('scroll', syncPreviewToEditor);

    // 初始化：academic
    EL('editor').value = ink.getDefaultMd('academic');
    loadPreset('academic');
  }

  // 等 DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
