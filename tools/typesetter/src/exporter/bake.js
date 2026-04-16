// ============================================================
// Inline-style 烘焙 — WeChat 富文本兼容
//
// 公众号编辑器：
//   - 不接受 <style> 块、不接受 class
//   - 仅允许少量 inline style（white-list 之外的会被剥离）
//   - var(--xxx) 大概率被吃掉，必须 resolve 成具体值
//
// 因此必须在源 DOM（带 class、带 CSS 变量）的 getComputedStyle 上读，
// 把白名单属性写成 inline style 后克隆出去。
//
// 抽取 bakeOne(srcEl, dstEl) 是为了：
//   1. root 自身和子元素共用同一段属性收集逻辑
//   2. 未来若需要 partial bake（如只导出某 figure）可复用
// ============================================================
(function (global) {
  'use strict';

  // 烘焙后保留的 CSS 属性白名单（顺序对最终 style 字符串无影响，
  // 但保持组别清晰便于审阅）
  const KEEP_PROPS = [
    // ---- 文字 ----
    'color', 'background', 'background-color',
    'font-size', 'font-weight', 'font-style', 'font-family',
    'line-height', 'letter-spacing', 'text-align', 'text-decoration', 'text-indent',
    'text-transform', 'text-shadow',
    // ---- 盒模型 ----
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin',  'margin-top',  'margin-right',  'margin-bottom',  'margin-left',
    'border',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-radius', 'border-color', 'border-style', 'border-width',
    'box-shadow', 'opacity',
    'width', 'max-width', 'height', 'min-width', 'min-height',
    'display', 'vertical-align',
    'word-break', 'overflow-wrap', 'white-space',
    'list-style-type',
    // ---- figure / figcaption ----
    'caption-side',
    // ---- SVG ----
    'fill', 'stroke',
  ];

  // 这些值意味着"没有有效设置"，不要写进 inline style（节省字节）
  const SKIP_VALS = new Set([
    'normal', 'none', '0px', 'auto', 'rgba(0, 0, 0, 0)', 'static',
    'transparent', 'currentcolor', 'currentColor', 'inherit', 'initial',
    '0px 0px', '0px 0px 0px', '0px 0px 0px 0px',
  ]);

  /**
   * 把 srcEl 的 computed style 烘焙到 dstEl，并清掉 class/id/data-*。
   * srcEl 必须仍在原 DOM 中（getComputedStyle 才有效）。
   */
  function bakeOne(srcEl, dstEl) {
    const cs = window.getComputedStyle(srcEl);
    const parts = [];
    for (let i = 0; i < KEEP_PROPS.length; i++) {
      const p = KEEP_PROPS[i];
      const v = cs.getPropertyValue(p);
      if (!v) continue;
      const trimmed = v.trim();
      if (!trimmed || SKIP_VALS.has(trimmed)) continue;
      parts.push(`${p}:${trimmed}`);
    }
    dstEl.setAttribute('style', parts.join(';'));
    dstEl.removeAttribute('class');
    dstEl.removeAttribute('id');
    // data-* 属性后续 wechat-fixes.stripDataAttrs 兜底；这里清几类已知冗余
    dstEl.removeAttribute('data-decorated');
  }

  /**
   * 把 root 整棵子树烘焙为 inline style。
   * 返回克隆后的 DOM（可继续被 wechat-fixes 处理）。
   */
  function bakeInlineStyles(root) {
    const clone = root.cloneNode(true);

    // root 自身（容器 padding / background / font）
    bakeOne(root, clone);

    const srcEls = root.querySelectorAll('*');
    const dstEls = clone.querySelectorAll('*');
    for (let i = 0; i < srcEls.length; i++) {
      bakeOne(srcEls[i], dstEls[i]);
    }
    return clone;
  }

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.bakeInlineStyles = bakeInlineStyles;
  global.InkFlow.bakeOne = bakeOne;
})(typeof window !== 'undefined' ? window : globalThis);
