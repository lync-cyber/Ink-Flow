// ============================================================
// 色板 PALETTES — 高级模式可独立于栏目切换
//
// 仅记录主/强调色，详细色板由 themes/columns/*.css 承载。
// 用户在顶栏下拉选择时，覆盖栏目的 --md-primary / --md-accent。
// ============================================================
(function (global) {
  'use strict';

  const PALETTES = {
    navy_ochre:    { name: '靛蓝·赭石',  primary: '#1B3A5C', accent: '#9C5127' },
    teal_amber:    { name: '松石·琥珀',  primary: '#1A3B4A', accent: '#B06A1E' },
    midnight_moss: { name: '午夜·暗绿',  primary: '#0C1F37', accent: '#1C6A42' },
    earth_caramel: { name: '赭棕·焦糖',  primary: '#563322', accent: '#8A5A3C' },
    rose_olive:    { name: '玫瑰·橄榄',  primary: '#A03554', accent: '#5C7032' },
    graphite_gold: { name: '石墨·金',    primary: '#1F2A37', accent: '#B68D2C' },
  };

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.PALETTES = PALETTES;
})(typeof window !== 'undefined' ? window : globalThis);
