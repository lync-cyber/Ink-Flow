// ============================================================
// Alert 标题预设 — 按栏目维度差异化
//
// 解决问题：原 ALERT_MAP 是全局单一表，导致所有栏目用同一组
// 标题词（提示/建议/重要/警告/注意），既缺乏栏目辨识度，又
// 让作者每次都得手填覆盖（如 industry 写"战略信号"）。
//
// 现在：选 column 自动套用对应预设；文章级 `> [!IMPORTANT] 自定义`
// 仍然优先级最高（兼容 GFM）。
//
// 5 种语义类型对应的视觉色由 base.css 的
// --alert-{note,tip,important,warning,caution}-color 控制；
// 5 种形态由 themes/primitives/callout-*.css 决定（每栏目挑一种）。
// ============================================================
(function (global) {
  'use strict';

  const ALERT_PRESETS = {
    default: {
      NOTE:      '提示',
      TIP:       '建议',
      IMPORTANT: '重要',
      WARNING:   '警告',
      CAUTION:   '注意',
    },
    academic: {
      NOTE:      '注释',
      TIP:       '方法说明',
      IMPORTANT: '关键约束',
      WARNING:   '局限',
      CAUTION:   '反例',
    },
    industry: {
      NOTE:      '行业速览',
      TIP:       '操盘建议',
      IMPORTANT: '战略信号',
      WARNING:   '监管风险',
      CAUTION:   '黑天鹅',
    },
    tech: {
      NOTE:      '技术备注',
      TIP:       '工程经验',
      IMPORTANT: '决策前提',
      WARNING:   '坑点警告',
      CAUTION:   '禁忌操作',
    },
    story: {
      NOTE:      '旁白',
      TIP:       '幕后',
      IMPORTANT: '转折点',
      WARNING:   '阴影面',
      CAUTION:   '伤痕',
    },
  };

  // alert 类型 → CSS class（保留与原实现一致）
  const ALERT_CLASSES = {
    NOTE:      'alert-note',
    TIP:       'alert-tip',
    IMPORTANT: 'alert-important',
    WARNING:   'alert-warning',
    CAUTION:   'alert-caution',
  };

  /**
   * 解析 alert 标题：优先文章自定义 > 栏目预设 > default
   * @param {string} type     - GFM 类型（NOTE/TIP/IMPORTANT/WARNING/CAUTION）
   * @param {string} custom   - 文章里 `> [!XX] 自定义` 的自定义部分
   * @param {string} column   - 当前栏目
   * @returns {{title: string, cls: string}}
   */
  function resolveAlert(type, custom, column) {
    const cls = ALERT_CLASSES[type] || 'alert-note';
    if (custom && custom.trim()) {
      return { title: custom.trim(), cls };
    }
    const preset = ALERT_PRESETS[column] || ALERT_PRESETS.default;
    return { title: preset[type] || ALERT_PRESETS.default[type] || type, cls };
  }

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.ALERT_PRESETS = ALERT_PRESETS;
  global.InkFlow.ALERT_CLASSES = ALERT_CLASSES;
  global.InkFlow.resolveAlert = resolveAlert;
})(typeof window !== 'undefined' ? window : globalThis);
