// InkFlow 轻量级微信排版器
// 依赖：marked.js（CDN）+ doocs/md 风格 CSS 主题 + 栏目预设
// 流程：markdown → marked (GFM) → GFM Alert 转换 → 应用栏目预设 → 内联样式复制

const EL = (id) => document.getElementById(id);

// 字族预设
const FONT_STACKS = {
  sans: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
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

// 解析 YAML frontmatter（最小实现，只抽取 column/title/tldr）
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { body: md, meta: {} };
  const body = md.slice(m[0].length);
  const meta = {};
  m[1].split(/\n/).forEach(line => {
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+)$/);
    if (kv) {
      let v = kv[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      meta[kv[1]] = v;
    }
  });
  return { body, meta };
}

// GFM Alert 扩展：在 marked 里拦截 blockquote，识别 [!TYPE] 前缀
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
             + `<p class="alert-title"><span>${meta.icon}</span><span>${title}</span></p>`
             + inner + `</section>`;
      },
    }],
  });
}

// 主渲染
async function render() {
  const src = EL('editor').value;
  EL('char-count').textContent = `${src.length} 字符`;

  const { body, meta } = parseFrontmatter(src);

  // 自动切换栏目预设（若 frontmatter 含 column）
  if (meta.column && document.querySelector(`#sel-column option[value="${meta.column}"]`)) {
    if (EL('sel-column').value !== meta.column) {
      EL('sel-column').value = meta.column;
      await loadPreset(meta.column);
    }
  }

  const html = marked.parse(body, { gfm: true, breaks: true });
  EL('preview').innerHTML = html;
  EL('status').textContent = `${meta.column || '未指定栏目'} · ${EL('sel-theme').value}`;
}

// 应用栏目预设（theme + color + font + size）
async function loadPreset(column) {
  if (column === 'custom') return;
  try {
    const res = await fetch(`./presets/${column}.json`, { cache: 'no-cache' });
    if (!res.ok) return;
    const p = await res.json();
    EL('sel-theme').value = p.theme;
    EL('sel-color').value = p.primaryColor;
    EL('sel-size').value = p.fontSize;
    EL('sel-font').value = p.fontFamily.includes('serif') && !p.fontFamily.includes('sans-serif') ? 'serif' : 'sans';
    EL('preset-info').textContent = `${p.name} · ${p.description}`;
    applyStyles();
  } catch (e) {
    console.warn('preset load failed', e);
  }
}

// 把 UI 配置应用到 #preview
function applyStyles() {
  const theme = EL('sel-theme').value;
  const color = EL('sel-color').value;
  const size = EL('sel-size').value;
  const fontKey = EL('sel-font').value;
  const column = EL('sel-column').value;
  const lineHeight = column === 'story' ? '2.0' : '1.75';

  const a = EL('preview');
  a.className = 'article theme-' + theme;
  a.style.setProperty('--md-primary-color', color);
  a.style.setProperty('--md-font-size', size);
  a.style.setProperty('--md-font-family', FONT_STACKS[fontKey]);
  a.style.setProperty('--md-line-height', lineHeight);
}

// 把计算样式烘焙为 inline style（微信粘贴后能保留）
function bakeInlineStyles(root) {
  const clone = root.cloneNode(true);
  const srcEls = root.querySelectorAll('*');
  const dstEls = clone.querySelectorAll('*');
  const keep = [
    'color','background','background-color','font-size','font-weight','font-style','font-family',
    'line-height','letter-spacing','text-align','text-decoration','text-indent',
    'padding','padding-top','padding-right','padding-bottom','padding-left',
    'margin','margin-top','margin-right','margin-bottom','margin-left',
    'border','border-top','border-right','border-bottom','border-left',
    'border-radius','border-color','border-style','border-width',
    'box-shadow','opacity',
    'width','max-width','height','display','vertical-align',
    'word-break','overflow-wrap','white-space'
  ];
  for (let i = 0; i < srcEls.length; i++) {
    const cs = window.getComputedStyle(srcEls[i]);
    const style = keep
      .map(prop => `${prop}:${cs.getPropertyValue(prop)}`)
      .filter(s => !s.endsWith(':') && !s.endsWith(':normal') && !s.endsWith(':none') && !s.endsWith(':0px') && !s.endsWith(':auto'))
      .join(';');
    dstEls[i].setAttribute('style', style);
    // 去除 class（微信不保留）
    dstEls[i].removeAttribute('class');
  }
  clone.removeAttribute('class');
  return clone;
}

// 复制为富文本
async function copyRichText() {
  const baked = bakeInlineStyles(EL('preview'));
  const wrapper = document.createElement('section');
  wrapper.appendChild(baked);
  const html = wrapper.outerHTML;
  const text = EL('preview').innerText;

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
    EL('status').textContent = '已复制，打开公众号编辑器粘贴即可';
  } catch (e) {
    // 回退
    const ta = document.createElement('textarea');
    ta.value = html;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    EL('status').textContent = '已复制（回退模式，格式可能受限）';
  }
}

// 初始化
function init() {
  installAlertExtension();

  EL('editor').addEventListener('input', () => render());
  EL('sel-column').addEventListener('change', async () => {
    await loadPreset(EL('sel-column').value);
    await render();
  });
  for (const id of ['sel-theme','sel-color','sel-size','sel-font']) {
    EL(id).addEventListener('change', () => { applyStyles(); render(); });
  }
  EL('btn-copy').addEventListener('click', copyRichText);
  EL('btn-load').addEventListener('click', () => EL('file-input').click());
  EL('file-input').addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { EL('editor').value = r.result; render(); };
    r.readAsText(f, 'utf-8');
  });

  // 初始内容示例
  EL('editor').value = DEMO;
  loadPreset('academic').then(render);
}

const DEMO = `---
column: academic
title: "示例文章"
tldr: "一句话摘要，说明本文核心观点。"
---

# 示例文章

> 这是 TL;DR — 一句话概括核心观点，帮助读者决定是否继续阅读。

## 引言

这是正文段落。**加粗**使用主色，\`行内代码\`使用浅色背景。链接写作 [doocs/md](https://github.com/doocs/md)，粘贴到公众号后自动保留样式。

## 提示与警示（GFM Alert）

> [!NOTE]
> 这是普通提示，用于补充说明，不影响主线阅读。

> [!TIP]
> 这是建议，读者可以直接采纳。

> [!IMPORTANT]
> 这是重要信息，读者必须关注。

> [!WARNING]
> 这是警告，提醒潜在风险。

> [!CAUTION]
> 这是致命错误或红线，读者务必规避。

## 结构化数据（标准 Markdown 表格）

| 指标 | Baseline | 本文方法 |
|------|----------|----------|
| AUROC | 98.8% | **99.6%** |
| 推理延迟 | 120ms | **45ms** |

## 代码块

\`\`\`python
def inference(x):
    return model(x)
\`\`\`

## 分割线

---

正文结束语。

`;

init();
