/**
 * business-finance · 专属 SVG 资产
 *
 * 视觉语言：报告 & 图表
 *   - H2 前缀：色块 + 标签（图表 legend 风）
 *   - 分割线：K 线柱状分布（红绿交错）/ 方块序列 / 中心对称方块 + 横线
 *   - 金句：干净无装饰引号，短直粗笔
 *   - sectionCorner：L 形直角（报告卡片角标）
 *   - 图标：方形硬边，锐利
 *   - stepBadge：正方形徽章 + 白色数字
 *
 * 共 11 个资产，超过"≥ 8"要求。
 * 严格遵守平台约束：
 *   - SVG 无 id
 *   - <text> 不声明 font-family（走系统默认）
 *   - 徽章数字 font-size ≥ 14（viewBox = 渲染尺寸等比）
 *   - 无纯白 #fff 填充（本主题为白底，不需 patchSvgWhiteBg）
 */

import type { ThemeAssets } from '../types'
import { strip } from '../_shared/svgLib'

interface Palette {
  primary: string   // 深红
  secondary: string // 深海蓝
  accent: string    // 金点缀
  border: string
  textInverse: string
  tipAccent: string
  warningAccent: string
  infoAccent: string
  dangerAccent: string
}

export function businessFinanceAssets(p: Palette): ThemeAssets {
  // ---------- H2 Prefix：实心方块 + 细线（图表 legend 风） ---------- //
  const h2Prefix = strip(`
    <svg viewBox="0 0 18 18" width="14" height="14" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:8px">
      <rect x="0" y="3" width="4" height="12" fill="${p.primary}"/>
      <rect x="6" y="7" width="12" height="4" fill="${p.secondary}" opacity="0.75"/>
    </svg>
  `)

  // ---------- 分割线 · wave：K 线柱状（深红/深蓝交替，涨跌节律） ---------- //
  const dividerWave = strip(`
    <svg viewBox="0 0 240 20" width="220" height="20" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="10" x2="240" y2="10" stroke="${p.border}" stroke-width="0.8"/>
      ${[
        { x: 70, open: 14, close: 6, color: p.primary }, // 阳
        { x: 82, open: 6, close: 12, color: p.secondary }, // 阴
        { x: 94, open: 12, close: 5, color: p.primary },
        { x: 106, open: 5, close: 14, color: p.secondary },
        { x: 118, open: 14, close: 4, color: p.primary },
        { x: 130, open: 4, close: 10, color: p.secondary },
        { x: 142, open: 10, close: 3, color: p.primary },
        { x: 154, open: 3, close: 9, color: p.secondary },
        { x: 166, open: 9, close: 2, color: p.primary },
      ]
        .map(({ x, open, close, color }) => {
          const top = Math.min(open, close)
          const h = Math.abs(close - open)
          return (
            `<line x1="${x + 2}" y1="${Math.min(open, close) - 2}" x2="${x + 2}" y2="${Math.max(open, close) + 2}" stroke="${color}" stroke-width="0.8"/>` +
            `<rect x="${x}" y="${top}" width="4" height="${h}" fill="${color}"/>`
          )
        })
        .join('')}
    </svg>
  `)

  // ---------- 分割线 · dots：方块序列（data-grid 感） ---------- //
  const dividerDots = strip(`
    <svg viewBox="0 0 240 10" width="220" height="10" xmlns="http://www.w3.org/2000/svg">
      ${[76, 92, 108, 124, 140, 156]
        .map((x, i) => `<rect x="${x - 2}" y="3" width="4" height="4" fill="${i % 2 === 0 ? p.primary : p.secondary}"/>`)
        .join('')}
    </svg>
  `)

  // ---------- 分割线 · flower：中心方块 + 横线（章节切换，报告感） ---------- //
  const dividerFlower = strip(`
    <svg viewBox="0 0 240 14" width="220" height="14" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="7" x2="102" y2="7" stroke="${p.border}" stroke-width="1"/>
      <line x1="138" y1="7" x2="240" y2="7" stroke="${p.border}" stroke-width="1"/>
      <rect x="108" y="3" width="8" height="8" fill="${p.primary}"/>
      <rect x="120" y="5" width="4" height="4" fill="${p.accent}"/>
      <rect x="128" y="3" width="8" height="8" fill="${p.secondary}"/>
    </svg>
  `)

  // ---------- 金句引号：锐利方头双引号 ---------- //
  const quoteMark = strip(`
    <svg viewBox="0 0 40 32" width="34" height="28" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:top;margin-right:4px">
      <path d="M4,6 L4,14 L8,14 L8,20 L14,20 L14,6 Z M22,6 L22,14 L26,14 L26,20 L32,20 L32,6 Z"
            fill="${p.primary}" opacity="0.42"/>
    </svg>
  `)

  // ---------- Section 角花：L 形直角（报告卡片角标） ---------- //
  const sectionCorner = strip(`
    <svg viewBox="0 0 18 18" width="14" height="14" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:6px">
      <path d="M0,0 L6,0 L6,3 L3,3 L3,18 L0,18 Z" fill="${p.primary}"/>
      <rect x="8" y="14" width="4" height="4" fill="${p.accent}"/>
    </svg>
  `)

  // ---------- 图标：方形硬边 ---------- //
  const iconSquare = (color: string, inner: string) => strip(`
    <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:6px">
      <rect x="1" y="1" width="14" height="14" fill="none" stroke="${color}" stroke-width="1.5"/>
      ${inner}
    </svg>
  `)

  const tipIcon = iconSquare(
    p.tipAccent,
    `<rect x="7" y="4" width="2" height="5" fill="${p.tipAccent}"/>` +
      `<rect x="7" y="10" width="2" height="2" fill="${p.tipAccent}"/>`,
  )
  const warningIcon = iconSquare(
    p.warningAccent,
    `<rect x="7" y="4" width="2" height="5" fill="${p.warningAccent}"/>` +
      `<rect x="7" y="10" width="2" height="2" fill="${p.warningAccent}"/>` +
      `<path d="M1,1 L8,1" stroke="${p.warningAccent}" stroke-width="1.5"/>`,
  )
  const infoIcon = iconSquare(
    p.infoAccent,
    `<rect x="7" y="3" width="2" height="2" fill="${p.infoAccent}"/>` +
      `<rect x="7" y="6" width="2" height="7" fill="${p.infoAccent}"/>`,
  )
  const dangerIcon = iconSquare(
    p.dangerAccent,
    `<rect x="3" y="7" width="10" height="2" fill="${p.dangerAccent}"/>`,
  )

  // ---------- 步骤徽章：正方形 + 大号数字 ---------- //
  // viewBox 24×24，渲染尺寸 24×24 等比；font-size=15 在公众号光栅化后 ≥ 14px；
  // 数字色用 "#fefefe" 近白，避开公众号 SVG→PNG 把纯白转透明的问题
  // （详见 wxPatch.patchSvgWhiteBg 的背景说明）。
  const stepBadge = (n: number) => strip(`
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:8px">
      <rect x="1" y="1" width="22" height="22" fill="${p.primary}"/>
      <rect x="1" y="20" width="22" height="3" fill="${p.accent}"/>
      <text x="12" y="16" text-anchor="middle" font-size="15" font-weight="700" fill="#fefefe">${n}</text>
    </svg>
  `)

  return {
    h2Prefix,
    dividerWave,
    dividerDots,
    dividerFlower,
    quoteMark,
    sectionCorner,
    tipIcon,
    warningIcon,
    infoIcon,
    dangerIcon,
    stepBadge,
  }
}
