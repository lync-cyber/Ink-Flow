// InkFlow 轻量级微信排版器
// 依赖：marked.js（CDN）+ 栏目 CSS（col-*.css）
// 流程：markdown → marked (GFM) → GFM Alert + 栏目头部包装 → 按栏目注入 CSS 变量 → 复制时烘焙 inline style
//
// 设计原则：
//   1. 零后端、零构建 —— 所有数据（PRESETS / DEFAULT_MDS）内联，file:// 双击可用
//   2. 只用标准 Markdown + GFM Alert（5 种）+ 可选 frontmatter(column/title/issue/date/tags/...)
//   3. 差异化通过 .article.col-{id} 的 CSS 实现，不引入 :::block 扩展
//
// WeChat 兼容性：
//   - bakeInlineStyles() 遍历真实 DOM 节点，将 getComputedStyle 写为 inline style。
//   - CSS ::before/::after 伪元素不是真实 DOM，不可被捕获，粘贴后丢失。
//   - 关键装饰（列表子弹、HR 文字、引用大引号、H2 装饰线）由以下函数注入真实 DOM：
//       decorateListBullets / decorateHrDeco / decorateStoryElements

const EL = (id) => document.getElementById(id);

// ============================================================
// 栏目预设（唯一真源）
// ============================================================
const PRESETS = {
  academic: {
    name: "学术前沿",
    description: "午夜靛蓝 · 赭石强调 · 严谨期刊感",
    primary: "#1B3A5C",
    accent:  "#9C5127",
    fontKey: "sans",
    fontSize: 15,
    lineHeight: 1.85,
    letterSpacing: 0.5,
    ulBullet: "■",
    olMode: "plain",
    hrDeco: "§",
  },
  industry: {
    name: "行业趋势",
    description: "深松石蓝 · 琥珀强调 · 简报节奏",
    primary: "#1A3B4A",
    accent:  "#B06A1E",
    fontKey: "sans",
    fontSize: 15,
    lineHeight: 1.7,
    letterSpacing: 0.5,
    ulBullet: "→",
    olMode: "plain",
    hrDeco: null,
  },
  tech: {
    name: "技术专题",
    description: "午夜蓝 · 暗绿强调 · 工程精确感",
    primary: "#0C1F37",
    accent:  "#1C6A42",
    fontKey: "sans",
    fontSize: 14,
    lineHeight: 1.75,
    letterSpacing: 0.5,
    ulBullet: "▶",
    olMode: "badge",
    hrDeco: "· · ·",
  },
  story: {
    name: "人物故事",
    description: "深赭棕 · 衬线字体 · 暖米纸 · 叙事温度",
    primary: "#563322",
    accent:  "#8A5A3C",
    fontKey: "serif",
    fontSize: 16,
    lineHeight: 2.0,
    letterSpacing: 0.5,
    ulBullet: "◦",
    olMode: "plain",
    hrDeco: "✦",
  },
};

const FONT_STACKS = {
  sans:  "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  serif: "Optima, 'PingFang SC', Cambria, Georgia, 'Times New Roman', serif",
};

// GFM Alert 类型 → 图标 & 标题
const ALERT_MAP = {
  NOTE:      { title: '提示',   cls: 'alert-note',      icon: 'ℹ' },
  TIP:       { title: '建议',   cls: 'alert-tip',       icon: '✓' },
  IMPORTANT: { title: '重要',   cls: 'alert-important', icon: '★' },
  WARNING:   { title: '警告',   cls: 'alert-warning',   icon: '!' },
  CAUTION:   { title: '注意',   cls: 'alert-caution',   icon: '✕' },
};

// ============================================================
// Frontmatter 解析（最小实现）
// ============================================================
function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { body: md, meta: {} };
  const body = md.slice(m[0].length);
  const meta = {};
  m[1].split(/\r?\n/).forEach(line => {
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (!kv) return;
    let v = kv[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v.slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    meta[kv[1]] = v;
  });
  return { body, meta };
}

// ============================================================
// GFM Alert 扩展
// ============================================================
function installAlertExtension() {
  marked.use({
    extensions: [{
      name: 'gfmAlert',
      level: 'block',
      start(src) {
        const m = src.match(/^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
        return m ? m.index : -1;
      },
      tokenizer(src) {
        const m = src.match(/^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:[ \t]+([^\n]*))?((?:\n> [^\n]*)*)\n?/);
        if (!m) return;
        const type = m[1];
        const title = (m[2] || '').trim();
        const bodyLines = (m[3] || '').split('\n')
          .map(l => l.replace(/^> ?/, ''))
          .filter(l => l.length > 0)
          .join('\n');
        return {
          type: 'gfmAlert',
          raw: m[0],
          alertType: type,
          customTitle: title,
          tokens: this.lexer.blockTokens(bodyLines || ''),
        };
      },
      renderer(token) {
        const meta = ALERT_MAP[token.alertType];
        const title = token.customTitle || meta.title;
        const inner = this.parser.parse(token.tokens);
        return `<section class="alert ${meta.cls}">`
             + `<p class="alert-title">${escapeHtml(title)}</p>`
             + inner + `</section>`;
      },
    }],
  });
}

// ============================================================
// 状态
// ============================================================
const state = {
  column: 'academic',
  userEdited: false,
  isDark: false,
  showSource: false,
  spec: { fontSize: 15, lineHeight: 1.85, letterSpacing: 0.5 },
  colorOverride: null,
};

// ============================================================
// 从 DOM 读默认 markdown（嵌在 HTML 的 <script type="text/markdown">）
// ============================================================
function getDefaultMd(column) {
  const el = document.getElementById(`md-default-${column}`);
  return el ? el.textContent.replace(/^\n/, '') : '';
}

// ============================================================
// 栏目头部包装：把第一个 <h1> + 紧邻 blockquote（摘要）
// 改造为 <header class="col-header">...</header>
// ============================================================
function wrapHeader(previewEl, meta, column) {
  const h1 = previewEl.querySelector('h1');
  if (!h1) return;

  const preset = PRESETS[column] || PRESETS.academic;
  const header = document.createElement('header');
  header.className = 'col-header';

  // ---- 栏目徽章行 ----
  const badge = document.createElement('div');
  badge.className = 'col-badge';
  const label = document.createElement('span');
  label.className = 'col-label';
  label.textContent = preset.name;
  badge.appendChild(label);

  // 每栏目不同的 meta 字段
  let metaText = '';
  if (column === 'academic' && meta.issue) {
    metaText = `VOL.${String(meta.issue).padStart(3, '0')}`;
  } else if (column === 'industry' && meta.date) {
    metaText = String(meta.date);
  } else if (column === 'tech') {
    const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);
    if (tags.length > 0) metaText = tags.map(t => `#${t}`).join(' · ');
  } else if (column === 'story' && meta.author) {
    metaText = `by ${meta.author}`;
  }
  if (metaText) {
    const metaEl = document.createElement('span');
    metaEl.className = 'col-meta';
    metaEl.textContent = metaText;
    badge.appendChild(metaEl);
  }
  header.appendChild(badge);

  // ---- H1 移入 header ----
  h1.parentNode.insertBefore(header, h1);
  header.appendChild(h1);

  // ---- 紧邻的 blockquote 视为摘要 ----
  const next = header.nextElementSibling;
  if (next && next.tagName === 'BLOCKQUOTE') {
    next.classList.add('col-abstract');
    header.appendChild(next);
  }

  // ---- industry：tags → pill 列表 ----
  if (column === 'industry' && Array.isArray(meta.tags) && meta.tags.length > 0) {
    const ul = document.createElement('ul');
    ul.className = 'col-tags';
    meta.tags.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
    header.appendChild(ul);
  }

  // ---- tech：read_time / difficulty / prerequisites → metabar ----
  if (column === 'tech') {
    const parts = [];
    if (meta.read_time) parts.push(`<strong>${escapeHtml(meta.read_time)}</strong>`);
    if (meta.difficulty) parts.push(`难度 ${escapeHtml(String(meta.difficulty))}`);
    if (meta.prerequisites) parts.push(`前置：${escapeHtml(String(meta.prerequisites))}`);
    if (parts.length > 0) {
      const bar = document.createElement('div');
      bar.className = 'col-metabar';
      bar.innerHTML = parts.join(' · ');
      header.appendChild(bar);
    }
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// 代码块按 lang 注入 .code-lang 顶标（tech 栏目 CSS 使用）
// ============================================================
function decorateCodeBlocks(previewEl) {
  previewEl.querySelectorAll('pre > code').forEach(code => {
    const cls = code.className || '';
    const m = cls.match(/language-(\S+)/);
    if (!m) return;
    const pre = code.parentNode;
    if (pre.previousElementSibling && pre.previousElementSibling.classList &&
        pre.previousElementSibling.classList.contains('code-lang')) return;
    const tag = document.createElement('div');
    tag.className = 'code-lang';
    tag.textContent = m[1];
    pre.parentNode.insertBefore(tag, pre);
  });
}

// ============================================================
// 列表子弹 & 有序序号注入（真实 DOM，可被 bakeInlineStyles 捕获）
// WeChat 不支持 CSS ::before content，所以用真实 span 节点携带装饰字符
// ============================================================
function decorateListBullets(previewEl, column) {
  // 清除上次渲染残留
  previewEl.querySelectorAll('.li-bullet, .li-num, .li-num-badge').forEach(el => el.remove());

  const preset = PRESETS[column] || PRESETS.academic;

  // ul 子弹
  previewEl.querySelectorAll('ul > li').forEach(li => {
    // 跳过 col-header 内的列表（tags pill 等）
    if (li.closest('.col-header')) return;
    const b = document.createElement('span');
    b.className = 'li-bullet';
    b.textContent = preset.ulBullet || '·';
    li.insertBefore(b, li.firstChild);
  });

  // ol 序号
  previewEl.querySelectorAll('ol').forEach(ol => {
    if (ol.closest('.col-header')) return;
    let n = 1;
    ol.querySelectorAll(':scope > li').forEach(li => {
      const isBadge = preset.olMode === 'badge';
      const num = document.createElement('span');
      num.className = isBadge ? 'li-num li-num-badge' : 'li-num';
      num.textContent = String(n++);
      li.insertBefore(num, li.firstChild);
    });
  });
}

// ============================================================
// HR 装饰文字注入（真实 DOM div，跟在 hr 后面）
// ============================================================
function decorateHrDeco(previewEl, column) {
  previewEl.querySelectorAll('.hr-deco').forEach(el => el.remove());
  const text = (PRESETS[column] || PRESETS.academic).hrDeco;
  if (!text) return;
  previewEl.querySelectorAll('hr').forEach(hr => {
    const deco = document.createElement('div');
    deco.className = 'hr-deco';
    deco.textContent = text;
    hr.parentNode.insertBefore(deco, hr.nextSibling);
  });
}

// ============================================================
// 人物故事栏目专属装饰（行内大引号 + H2 装饰行）
// ============================================================
function decorateStoryElements(previewEl) {
  // blockquote 行内引号：嵌入第一个和最后一个 <p> 内，避免产生额外空行
  previewEl.querySelectorAll('blockquote').forEach(bq => {
    if (bq.classList.contains('col-abstract')) return;
    if (bq.querySelector('.bq-open')) return;

    const firstP = bq.querySelector('p');
    if (firstP) {
      const open = document.createElement('span');
      open.className = 'bq-open';
      open.textContent = '\u201C'; // "
      firstP.insertBefore(open, firstP.firstChild);
    }
    const allP = bq.querySelectorAll('p');
    const lastP = allP[allP.length - 1];
    if (lastP) {
      const close = document.createElement('span');
      close.className = 'bq-close';
      close.textContent = '\u201D'; // "
      lastP.appendChild(close);
    }
  });

  // H2 下方装饰行
  previewEl.querySelectorAll('h2').forEach(h2 => {
    if (h2.closest('.col-header')) return;
    const nextEl = h2.nextElementSibling;
    if (nextEl && nextEl.classList.contains('h2-deco')) return;
    const deco = document.createElement('div');
    deco.className = 'h2-deco';
    deco.textContent = '\u2014\u2003\u00B7\u2003\u2014'; // — · —
    h2.parentNode.insertBefore(deco, h2.nextSibling);
  });
}

// ============================================================
// 文章尾部签名栏（真实 DOM，显示栏目名 + meta 信息）
// ============================================================
function appendArticleFooter(previewEl, meta, column) {
  previewEl.querySelectorAll('.col-sig').forEach(el => el.remove());

  const preset = PRESETS[column] || PRESETS.academic;
  const sig = document.createElement('footer');
  sig.className = 'col-sig';

  const rule = document.createElement('div');
  rule.className = 'col-sig-rule';
  sig.appendChild(rule);

  const text = document.createElement('div');
  text.className = 'col-sig-text';

  const parts = [preset.name];
  if (column === 'academic' && meta.issue) {
    parts.push(`VOL.${String(meta.issue).padStart(3, '0')}`);
  } else if (column === 'industry' && meta.date) {
    parts.push(String(meta.date));
  } else if (column === 'tech') {
    const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);
    if (tags.length) parts.push(tags.map(t => `#${t}`).join(' '));
    // 等宽注释风格：// 技术专题 · #Rust #推理引擎
    text.textContent = '// ' + parts.join('  ·  ');
  } else if (column === 'story' && meta.author) {
    parts.push(`by ${meta.author}`);
  }

  if (column !== 'tech') {
    text.textContent = parts.join('  ·  ');
  }

  sig.appendChild(text);
  previewEl.appendChild(sig);
}

// ============================================================
// 主渲染
// ============================================================
function render() {
  const src = EL('editor').value;
  EL('char-count').textContent = `${src.length} 字符`;

  const { body, meta } = parseFrontmatter(src);
  const html = marked.parse(body, { gfm: true, breaks: true });

  // 如果 frontmatter.column 命中已知栏目，且用户没手改过，跟随切换
  if (meta.column && PRESETS[meta.column] && meta.column !== state.column) {
    state.column = meta.column;
    EL('sel-column-group').querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.column === state.column);
    });
  }

  const preview = EL('preview');
  preview.innerHTML = html;
  preview.className = 'article col-' + state.column + (state.isDark ? ' is-dark' : '');

  wrapHeader(preview, meta, state.column);
  decorateCodeBlocks(preview);
  decorateListBullets(preview, state.column);
  decorateHrDeco(preview, state.column);
  if (state.column === 'story') decorateStoryElements(preview);
  appendArticleFooter(preview, meta, state.column);

  applyStyles();

  EL('preset-info').textContent = `${PRESETS[state.column].name} · ${PRESETS[state.column].description}`;

  if (state.showSource) {
    EL('source-view').textContent = buildExportHtml();
  }
}

// ============================================================
// 把 UI 配置应用到 #preview（CSS 变量）
// ============================================================
function applyStyles() {
  const preset = PRESETS[state.column];
  const primary = state.colorOverride || preset.primary;
  const a = EL('preview');
  a.style.setProperty('--md-font-family', FONT_STACKS[preset.fontKey]);
  a.style.setProperty('--md-font-size', state.spec.fontSize + 'px');
  a.style.setProperty('--md-line-height', state.spec.lineHeight);
  a.style.setProperty('--md-letter-spacing', state.spec.letterSpacing + 'px');
  a.style.setProperty('--md-primary', primary);
  a.style.setProperty('--md-accent', preset.accent);
  EL('sel-color').value = primary;
}

// ============================================================
// 加载栏目预设（切换栏目时）
// ============================================================
function loadPreset(column) {
  if (!PRESETS[column]) return;
  state.column = column;
  const p = PRESETS[column];
  state.spec.fontSize = p.fontSize;
  state.spec.lineHeight = p.lineHeight;
  state.spec.letterSpacing = p.letterSpacing;
  state.colorOverride = null;
  syncSlidersToState();

  if (!state.userEdited) {
    EL('editor').value = getDefaultMd(column);
  }

  EL('sel-column-group').querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', b.dataset.column === column);
  });

  render();
}

function syncSlidersToState() {
  EL('sel-size').value = state.spec.fontSize;
  EL('val-size').textContent = state.spec.fontSize + 'px';
  EL('sel-lh').value = state.spec.lineHeight;
  EL('val-lh').textContent = state.spec.lineHeight.toFixed(2);
  EL('sel-ls').value = state.spec.letterSpacing;
  EL('val-ls').textContent = state.spec.letterSpacing + 'px';
}

// ============================================================
// 烘焙 inline style（微信粘贴后能保留）
// 说明：只烘焙真实 DOM 节点的 computedStyle；
//       ::before/::after 伪元素不在此列（WeChat 粘贴后丢失）。
//       因此关键装饰均已改为真实 DOM 节点注入（li-bullet、hr-deco 等）。
// ============================================================
function bakeInlineStyles(root) {
  const clone = root.cloneNode(true);
  const srcEls = root.querySelectorAll('*');
  const dstEls = clone.querySelectorAll('*');

  const keep = [
    'color', 'background', 'background-color',
    'font-size', 'font-weight', 'font-style', 'font-family',
    'line-height', 'letter-spacing', 'text-align', 'text-decoration', 'text-indent',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-radius', 'border-color', 'border-style', 'border-width',
    'box-shadow', 'opacity',
    'width', 'max-width', 'height', 'min-width', 'min-height',
    'display', 'vertical-align',
    'word-break', 'overflow-wrap', 'white-space',
    'text-transform',
    'list-style-type',
  ];

  // 过滤掉无意义的默认值（避免污染 inline style）
  const SKIP = new Set([
    'normal', 'none', '0px', 'auto', 'rgba(0, 0, 0, 0)', 'static',
    'transparent', 'currentColor', 'inherit', 'initial',
  ]);

  for (let i = 0; i < srcEls.length; i++) {
    const cs = window.getComputedStyle(srcEls[i]);
    const style = keep
      .map(prop => `${prop}:${cs.getPropertyValue(prop)}`)
      .filter(s => {
        const v = s.split(':').slice(1).join(':').trim();
        return v && !SKIP.has(v) && v !== '0px 0px' && v !== '0px 0px 0px' &&
               v !== '0px 0px 0px 0px';
      })
      .join(';');
    dstEls[i].setAttribute('style', style);
    dstEls[i].removeAttribute('class');
    dstEls[i].removeAttribute('id');
    dstEls[i].removeAttribute('data-decorated');
  }
  clone.removeAttribute('class');
  clone.removeAttribute('id');
  return clone;
}

function buildExportHtml() {
  const baked = bakeInlineStyles(EL('preview'));
  const wrapper = document.createElement('section');
  wrapper.appendChild(baked);
  return wrapper.outerHTML;
}

// ============================================================
// 复制为富文本
// ============================================================
async function copyRichText() {
  const html = buildExportHtml();
  const text = EL('preview').innerText;

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
    flashStatus('已复制，粘贴到公众号后台即可');
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = html;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    flashStatus('已复制（回退模式，格式可能受限）');
  }
}

function flashStatus(msg) {
  EL('status').textContent = msg;
  clearTimeout(flashStatus._t);
  flashStatus._t = setTimeout(() => {
    EL('status').textContent = '就绪';
  }, 2500);
}

// ============================================================
// 滚动同步：editor ⇄ preview
// ============================================================
let syncing = false;
function syncEditorToPreview() {
  if (syncing) return;
  const ed = EL('editor');
  const pv = EL('preview-wrap');
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
  const ed = EL('editor');
  const pv = EL('preview-wrap');
  const pvMax = pv.scrollHeight - pv.clientHeight;
  if (pvMax <= 0) return;
  const ratio = pv.scrollTop / pvMax;
  const edMax = ed.scrollHeight - ed.clientHeight;
  syncing = true;
  ed.scrollTop = ratio * edMax;
  requestAnimationFrame(() => { syncing = false; });
}

// ============================================================
// 初始化
// ============================================================
function init() {
  installAlertExtension();

  // 栏目 pill
  EL('sel-column-group').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-column]');
    if (!btn) return;
    loadPreset(btn.dataset.column);
  });

  // 主色
  EL('sel-color').addEventListener('input', () => {
    state.colorOverride = EL('sel-color').value;
    applyStyles();
  });
  EL('btn-reset-color').addEventListener('click', () => {
    state.colorOverride = null;
    applyStyles();
  });

  // 滑块
  EL('sel-size').addEventListener('input', () => {
    state.spec.fontSize = parseInt(EL('sel-size').value, 10);
    EL('val-size').textContent = state.spec.fontSize + 'px';
    applyStyles();
  });
  EL('sel-lh').addEventListener('input', () => {
    state.spec.lineHeight = parseFloat(EL('sel-lh').value);
    EL('val-lh').textContent = state.spec.lineHeight.toFixed(2);
    applyStyles();
  });
  EL('sel-ls').addEventListener('input', () => {
    state.spec.letterSpacing = parseFloat(EL('sel-ls').value);
    EL('val-ls').textContent = state.spec.letterSpacing + 'px';
    applyStyles();
  });
  EL('btn-reset-spec').addEventListener('click', () => {
    const p = PRESETS[state.column];
    state.spec = { fontSize: p.fontSize, lineHeight: p.lineHeight, letterSpacing: p.letterSpacing };
    state.colorOverride = null;
    syncSlidersToState();
    applyStyles();
  });

  // 重置内容
  EL('btn-reset-content').addEventListener('click', () => {
    EL('editor').value = getDefaultMd(state.column);
    state.userEdited = false;
    updateResetBtn();
    render();
  });

  // 深色切换
  EL('btn-dark').addEventListener('click', () => {
    state.isDark = !state.isDark;
    EL('btn-dark').textContent = state.isDark ? '☀' : '🌙';
    EL('phone-frame').classList.toggle('is-dark', state.isDark);
    render();
  });

  // 源码切换
  EL('btn-source').addEventListener('click', () => {
    state.showSource = !state.showSource;
    EL('btn-source').classList.toggle('active', state.showSource);
    EL('source-view').style.display = state.showSource ? 'block' : 'none';
    EL('phone-frame').style.display = state.showSource ? 'none' : 'block';
    if (state.showSource) EL('source-view').textContent = buildExportHtml();
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
      const { meta } = parseFrontmatter(r.result);
      if (meta.column && PRESETS[meta.column]) {
        loadPreset(meta.column);
      } else {
        render();
      }
    };
    r.readAsText(f, 'utf-8');
  });

  // 复制
  EL('btn-copy').addEventListener('click', copyRichText);

  // 编辑
  EL('editor').addEventListener('input', () => {
    state.userEdited = true;
    updateResetBtn();
    render();
  });

  // 滚动同步
  EL('editor').addEventListener('scroll', syncEditorToPreview);
  EL('preview-wrap').addEventListener('scroll', syncPreviewToEditor);

  // 初始化：用 academic 的默认 md
  EL('editor').value = getDefaultMd('academic');
  loadPreset('academic');
}

function updateResetBtn() {
  EL('btn-reset-content').style.display = state.userEdited ? 'inline-block' : 'none';
}

init();
