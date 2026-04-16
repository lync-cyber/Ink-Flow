// ============================================================
// 骨架 SKELETONS — 决定结构、字符与 pipeline
//
// 设计：
//   1. SKELETON_BASE 提供共同基线，避免 4 栏目复制 80% 的相同字段
//   2. 每个栏目用 Object.assign 仅声明"差异"
//   3. primaryMeta(meta) 函数：提取栏目专属的头部 meta 字符串
//   4. sigText(meta, name) 函数：尾部签名生成
//   5. pipeline 数组：决定该栏目走哪些 decorators（null = 用默认）
// ============================================================
(function (global) {
  'use strict';

  // ---- 共同基线 ----
  const SKELETON_BASE = {
    fontKey: 'sans',
    fontSize: 15,
    lineHeight: 1.75,
    letterSpacing: 0.5,
    paragraphGap: 1.05,
    sectionGap: 2.0,
    pagePaddingX: 18,
    pagePaddingY: 22,
    ulBullet: '·',
    olMode: 'plain',
    hrDeco: null,
    quoteOpen: null,
    quoteClose: null,
    h2DecoLine: false,
    h3Prefix: null,             // tech 用 '›'
    colLabelPrefix: null,       // tech 用 '// '
    tagsAsPills: false,         // industry 用 true
    codeHead: { dots: false, lang: true },
    primaryMeta: () => '',
    sigText: (_, name) => name,
    pipeline: null,             // null = DEFAULT_PIPELINE
  };

  // ---- 默认 pipeline（按执行顺序） ----
  // mermaid / figureCaption 须在 codeBlock 之后、bullets/h2Line 之前：
  //   - mermaid 把异步渲染结果填到占位 .mermaid-diagram 里
  //   - figureCaption 把 <p><img></p> 升级为 <figure><img><figcaption>
  //   两者都改 DOM 结构，需在结构相关 decorator 之前完成
  const DEFAULT_PIPELINE = [
    'header',
    'tagPills',
    'callout',
    'codeBlock',
    'mermaid',
    'figureCaption',
    'bullets',
    'hrDeco',
    'blockquote',
    'h2Line',
    'h3Prefix',
    'colLabelPrefix',
    'refList',
    'footer',
  ];

  // ---- 工具 ----
  function pad(n, len) { return String(n).padStart(len, '0'); }
  function tagsArr(t)  { return Array.isArray(t) ? t : (t ? [t] : []); }

  // ---- 栏目骨架（仅声明差异部分） ----
  const SKELETONS = {
    academic: Object.assign({}, SKELETON_BASE, {
      name: '学术前沿',
      description: '午夜靛蓝 · 严谨期刊感',
      fontSize: 15,
      lineHeight: 1.85,
      paragraphGap: 1.1,
      hrDeco: '§',
      quoteOpen: '\u300C',   // 「
      quoteClose: '\u300D',  // 」
      primaryMeta: (meta) => meta.issue ? `VOL.${pad(meta.issue, 3)}` : '',
      sigText: (meta, name) => meta.issue
        ? `${name}  ·  VOL.${pad(meta.issue, 3)}`
        : name,
    }),

    industry: Object.assign({}, SKELETON_BASE, {
      name: '行业趋势',
      description: '深松石蓝 · 简报节奏',
      lineHeight: 1.7,
      paragraphGap: 0.95,
      sectionGap: 1.9,
      pagePaddingX: 16,
      pagePaddingY: 20,
      ulBullet: '\u2192',    // →
      tagsAsPills: true,
      primaryMeta: (meta) => meta.date ? String(meta.date) : '',
      sigText: (meta, name) => meta.date ? `${name}  ·  ${meta.date}` : name,
    }),

    tech: Object.assign({}, SKELETON_BASE, {
      name: '技术专题',
      description: '午夜蓝 · 工程精确感',
      fontSize: 14,
      lineHeight: 1.75,
      paragraphGap: 1.05,
      pagePaddingX: 16,
      pagePaddingY: 20,
      ulBullet: '\u25B6',    // ▶
      olMode: 'badge',
      hrDeco: '· · ·',
      quoteOpen: '//',
      quoteClose: '',
      h3Prefix: '\u203A',    // ›
      colLabelPrefix: '// ',
      codeHead: { dots: true, lang: true },
      primaryMeta: (meta) => {
        const tags = tagsArr(meta.tags);
        return tags.length ? tags.map(t => `#${t}`).join(' · ') : '';
      },
      sigText: (meta, name) => {
        const tags = tagsArr(meta.tags);
        const tail = tags.length ? '  ·  ' + tags.map(t => `#${t}`).join(' ') : '';
        return '// ' + name + tail;
      },
    }),

    story: Object.assign({}, SKELETON_BASE, {
      name: '人物故事',
      description: '深赭棕 · 衬线 · 暖米纸',
      fontKey: 'serif',
      fontSize: 16,
      lineHeight: 2.0,
      paragraphGap: 1.25,
      sectionGap: 2.4,
      pagePaddingX: 22,
      pagePaddingY: 26,
      ulBullet: '\u25E6',    // ◦
      hrDeco: '\u2726',      // ✦
      quoteOpen: '\u201C',   // "
      quoteClose: '\u201D',  // "
      h2DecoLine: true,
      primaryMeta: (meta) => meta.author ? `by ${meta.author}` : '',
      sigText: (meta, name) => meta.author ? `${name}  ·  by ${meta.author}` : name,
    }),
  };

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.SKELETONS = SKELETONS;
  global.InkFlow.SKELETON_BASE = SKELETON_BASE;
  global.InkFlow.DEFAULT_PIPELINE = DEFAULT_PIPELINE;
})(typeof window !== 'undefined' ? window : globalThis);
