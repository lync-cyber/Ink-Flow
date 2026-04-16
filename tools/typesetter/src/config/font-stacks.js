// ============================================================
// 字体栈配置
// 三种字体 key（sans / serif / mono），骨架按 key 引用
// ============================================================
(function (global) {
  'use strict';

  const FONT_STACKS = {
    sans:  "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    serif: "Optima, 'PingFang SC', Cambria, Georgia, 'Times New Roman', serif",
    mono:  "'SF Mono', Menlo, Monaco, Consolas, 'Microsoft YaHei', monospace",
  };

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.FONT_STACKS = FONT_STACKS;
})(typeof window !== 'undefined' ? window : globalThis);
