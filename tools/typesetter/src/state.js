// ============================================================
// 应用状态 — 单一可变对象
//
// 不上响应式框架，render() 显式调用即可保证一致性。
// 字段说明见 inline 注释。
// ============================================================
(function (global) {
  'use strict';

  const state = {
    column: 'academic',     // 当前栏目 id
    paletteId: null,        // null = 跟随栏目默认；否则覆盖
    userEdited: false,      // 用户是否手动编辑过 editor 内容
    isDark: false,          // Light / Dark
    showSource: false,      // 是否显示导出 HTML 源码视图
    spec: {                 // 用户可调的排版/布局参数
      fontSize: 15,
      lineHeight: 1.85,
      letterSpacing: 0.5,
      paragraphGap: 1.1,
      sectionGap: 2.0,
      pagePaddingX: 18,
      pagePaddingY: 22,
    },
    colorOverride: null,    // 颜色微调（覆盖 --md-primary）
    hrStyles: [],           // 当前文档 hr 风格序列（按出现顺序）
  };

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.state = state;
})(typeof window !== 'undefined' ? window : globalThis);
