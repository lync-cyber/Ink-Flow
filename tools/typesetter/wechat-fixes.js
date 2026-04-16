// ============================================================
// 微信公众号兼容性补丁集（重构版）
//
// 灵感与思路来源 doocs/md 多年的踩坑实践，集中处理几类微信
// 富文本编辑器对 inline style 的"剥离 / 改写"行为。
//
// 调用时机：bakeInlineStyles() 之后、写入剪贴板之前。
// 输入是已经烘焙好 inline style 的 cloned DOM 树（root），就地修改。
//
// ── 性能改造 ──
// 原版：9 个独立 querySelectorAll('[style]') 各自遍历一次
// 现在：合并为 3 个语义 pass：
//   1. PASS A · 全树元素遍历：处理 [style]、img、tspan 等通用补丁
//   2. PASS B · SVG 包裹与列表提升（结构变更，需独立 pass）
//   3. PASS C · 元素删除（no-export / 滚动容器剥壳）
// ============================================================

(function (global) {
  'use strict';

  // ----------------------------------------------------------------
  // style 字符串解析 / 序列化
  // ----------------------------------------------------------------
  function parseStyle(s) {
    const out = {};
    if (!s) return out;
    s.split(';').forEach(decl => {
      const i = decl.indexOf(':');
      if (i < 0) return;
      const k = decl.slice(0, i).trim().toLowerCase();
      const v = decl.slice(i + 1).trim();
      if (k && v) out[k] = v;
    });
    return out;
  }

  function stringifyStyle(obj) {
    return Object.keys(obj).map(k => `${k}:${obj[k]}`).join(';');
  }

  // ----------------------------------------------------------------
  // 微信会忽略 / 改写的属性清单（PASS A 一次性删）
  // ----------------------------------------------------------------
  const STRIP_PROPS = [
    'cursor', 'pointer-events', 'user-select',
    '-webkit-user-select', '-moz-user-select', '-ms-user-select',
    'transition', 'transition-property', 'transition-duration',
    'animation', 'animation-name', 'animation-duration',
    'will-change', 'contain', 'content-visibility',
    'outline-color', 'outline-style', 'outline-width', 'outline-offset',
    'caret-color', 'accent-color',
    // 滚动相关（浏览器预览专用）
    'scrollbar-width', 'scrollbar-color',
    'overflow-x', 'overflow-y', 'overflow',
    // 高度限制（剥后让微信端展示完整列表）
    'max-height',
  ];

  // ----------------------------------------------------------------
  // 元素级补丁：在 PASS A 内对每个元素调用，可读 / 改 style 对象
  // 返回值若为 true 表示已修改 style，需回写
  // ----------------------------------------------------------------
  function patchTopProperty(el, style) {
    const top = style['top'];
    const pos = style['position'];
    if (!top || top === '0px' || top === 'auto') return false;
    if (pos && pos !== 'static') return false;
    delete style['top'];
    const existing = style['transform'] || '';
    style['transform'] = (existing + ` translateY(${top})`).trim();
    return true;
  }

  function patchVarFallback(el, style) {
    let changed = false;
    Object.keys(style).forEach(k => {
      if (/var\s*\(/i.test(style[k])) {
        delete style[k];
        changed = true;
      }
    });
    return changed;
  }

  function patchUselessProps(el, style) {
    let changed = false;
    STRIP_PROPS.forEach(p => {
      if (p in style) { delete style[p]; changed = true; }
    });
    if (style['box-shadow'] === 'none') { delete style['box-shadow']; changed = true; }
    if (style['opacity'] === '1')        { delete style['opacity'];   changed = true; }
    return changed;
  }

  // ----------------------------------------------------------------
  // PASS A · 全树元素遍历：合并 7 类元素级补丁
  //   - top → translateY
  //   - var() 兜底剥除
  //   - tspan 强制 fill
  //   - mermaid nodeLabel/edgeLabel 内嵌 <p> 剥成纯文本（doocs 实践）
  //   - img width/height → style
  //   - 无用属性清理
  //   - data-* 清理
  // ----------------------------------------------------------------
  function passElementPatches(root) {
    const all = root.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const tag = el.tagName;

      // ---- img: width/height 属性 → style ----
      if (tag === 'IMG' || tag === 'img') {
        const w = el.getAttribute('width');
        const h = el.getAttribute('height');
        if ((w && /^\d+$/.test(w)) || (h && /^\d+$/.test(h))) {
          const st = parseStyle(el.getAttribute('style') || '');
          if (w && /^\d+$/.test(w)) { st['width']  = w + 'px'; el.removeAttribute('width');  }
          if (h && /^\d+$/.test(h)) { st['height'] = h + 'px'; el.removeAttribute('height'); }
          el.setAttribute('style', stringifyStyle(st));
        }
      }

      // ---- tspan: 强制 fill + color + stroke none（doocs 实践） ----
      // 微信富文本编辑器在某些场景会把 tspan 的 fill 改成黑或丢色；
      // 同时部分主题靠 stroke 描线，复制后会盖掉文字 → 一律重置。
      // 注意：SVG 命名空间元素的 tagName 是小写（'tspan'）；HTML 元素才大写。
      if (tag === 'TSPAN' || tag === 'tspan') {
        const fill = el.getAttribute('fill') || el.style.fill || '#333333';
        const existing = el.getAttribute('style') || '';
        const cleaned = existing
          .replace(/fill\s*:[^;]+;?/i, '')
          .replace(/color\s*:[^;]+;?/i, '')
          .replace(/stroke\s*:[^;]+;?/i, '');
        el.setAttribute('style',
          `${cleaned};fill:${fill} !important;color:${fill} !important;stroke:none !important`);
      }

      // ---- mermaid: .nodeLabel / .edgeLabel 内嵌 <p> 剥成纯文本 ----
      // mermaid 渲染产物常含 <span class="nodeLabel"><p>文字</p></span>，
      // 复制到微信后 <p> 被外层环境吞掉，文字位置错位。doocs/md 用相同补丁。
      if (el.classList && (el.classList.contains('nodeLabel') || el.classList.contains('edgeLabel'))) {
        const inner = el.querySelector(':scope > p');
        if (inner) {
          el.innerHTML = inner.innerHTML;
        }
      }

      // ---- 通用 style 修补：top / var() / 无用属性 ----
      const sAttr = el.getAttribute('style');
      if (sAttr) {
        const style = parseStyle(sAttr);
        let dirty = false;
        if (style['top'])     dirty = patchTopProperty(el, style)  || dirty;
        if (sAttr.indexOf('var(') >= 0) dirty = patchVarFallback(el, style) || dirty;
        dirty = patchUselessProps(el, style) || dirty;
        if (dirty) el.setAttribute('style', stringifyStyle(style));
      }

      // ---- 清理 data-* 标记（导出后已无意义） ----
      const attrs = el.attributes;
      for (let j = attrs.length - 1; j >= 0; j--) {
        const name = attrs[j].name;
        if (name.startsWith('data-')) el.removeAttribute(name);
      }
    }
  }

  // ----------------------------------------------------------------
  // PASS B · 结构变更：SVG 包裹 + 嵌套列表提升
  // 这两个会改 DOM 树，必须独立于 PASS A
  // ----------------------------------------------------------------
  function makeSvgSpacer() {
    // 用 <p>&nbsp;</p> 而非空 <section>：
    // doocs/md 多年实践证明含真实文本节点的 <p> 在微信编辑器更稳定，
    // 空容器在某些版本会被合并/丢弃，导致 SVG 紧贴上下段落。
    const p = document.createElement('p');
    p.style.cssText = 'margin:0;padding:0;font-size:0;line-height:0;';
    p.innerHTML = '&nbsp;';
    return p;
  }

  function isSvgSpacer(el) {
    return el && el.tagName === 'P' &&
           el.style && el.style.lineHeight === '0' &&
           el.innerHTML === '&nbsp;';
  }

  function passStructure(root) {
    // SVG 前后插占位（避免微信换行错乱）
    root.querySelectorAll('svg').forEach(svg => {
      if (isSvgSpacer(svg.previousElementSibling)) return;
      svg.parentNode.insertBefore(makeSvgSpacer(), svg);
      svg.parentNode.insertBefore(makeSvgSpacer(), svg.nextSibling);
    });

    // 嵌套 ul/ol 从 li 内部移出（微信会展平）
    root.querySelectorAll('li > ul, li > ol').forEach(nested => {
      const li = nested.parentNode;
      const list = li.parentNode;
      if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) return;
      const cur = nested.getAttribute('style') || '';
      if (!/padding-left/.test(cur)) {
        nested.setAttribute('style', cur + ';padding-left:1.2em;margin-top:0.3em;margin-bottom:0.3em;');
      }
      list.insertBefore(nested, li.nextSibling);
    });
  }

  // ----------------------------------------------------------------
  // PASS C · 元素删除 / 容器剥壳
  //   - .no-export / [data-no-export] 元素删除
  //   - .ref-list 等带 max-height + overflow:auto 的"滚动容器"
  //     在公众号里没有 scrollbar，把限制剥掉，让内容完整展开
  // ----------------------------------------------------------------
  function dropNoExport(root) {
    root.querySelectorAll('.no-export,[data-no-export]').forEach(el => el.remove());
  }

  function dropScrollContainer(root) {
    // 烘焙后 class 已被删，但 max-height/overflow 已写到 inline style
    // PASS A 的 STRIP_PROPS 已删 overflow-* 和 max-height，这里只是兜底。
    // 仍然单独走一次：如果某 [style] 残留 overflow:auto，手动删
    root.querySelectorAll('[style*="overflow"]').forEach(el => {
      const style = parseStyle(el.getAttribute('style') || '');
      let dirty = false;
      ['overflow', 'overflow-x', 'overflow-y', 'max-height'].forEach(k => {
        if (k in style) { delete style[k]; dirty = true; }
      });
      if (dirty) el.setAttribute('style', stringifyStyle(style));
    });
  }

  // ----------------------------------------------------------------
  // 主入口：3 个 pass 顺序执行
  // ----------------------------------------------------------------
  function applyWechatFixes(root) {
    if (!root) return;
    dropNoExport(root);
    passElementPatches(root);
    passStructure(root);
    dropScrollContainer(root);
  }

  global.WechatFixes = {
    applyWechatFixes,
    // 暴露内部函数便于测试
    parseStyle, stringifyStyle,
    passElementPatches, passStructure,
    dropNoExport, dropScrollContainer,
  };
})(typeof window !== 'undefined' ? window : globalThis);
