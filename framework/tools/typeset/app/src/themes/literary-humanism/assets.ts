/**
 * literary-humanism · 专属 SVG 资产
 *
 * 视觉语言：古籍 & 云纹
 *   - H2 前缀：传统云纹（如意云头）+ 细横线
 *   - 分割线：花枝连续图案 / 古籍装饰回纹 / 中央云纹 + 两侧细线
 *   - 金句：古籍边框样式（方框 + 内角花）
 *   - sectionCorner：书角包裹（双折边）
 *   - 图标：细线几何 + 小三角/圆点（类木刻线条感）
 *   - stepBadge：圆形 + 边框（钤印效果），数字古铜色
 *
 * 共 11 个资产，超过"≥ 8"要求。严格遵守平台约束：
 *   - 无 id / 无 <style> / 无 url 引号
 *   - <text> 不声明 font-family（走系统默认，避免 Android 宋体回退不稳）
 *   - stepBadge viewBox = 渲染尺寸（等比）；font-size=15 光栅化后 ≥ 14px
 *   - 无纯白 #fff 填充（米白底）
 */

import type { ThemeAssets } from '../types'
import { strip } from '../_shared/svgLib'

interface Palette {
  primary: string   // 书卷棕
  secondary: string // 竹墨青
  accent: string    // 胭脂红
  border: string
  textInverse: string
  tipAccent: string
  warningAccent: string
  infoAccent: string
  dangerAccent: string
}

export function literaryHumanismAssets(p: Palette): ThemeAssets {
  // ---------- H2 Prefix：如意云头 + 细横线 ---------- //
  // 如意云纹由三个半圆与下方水平线组合，是古籍装饰最典型的元素。
  const h2Prefix = strip(`
    <svg viewBox="0 0 22 22" width="18" height="18" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:8px">
      <path d="M3,10 A3,3 0 0 1 9,10 A3,3 0 0 1 15,10 A3,3 0 0 1 21,10 L21,14 L3,14 Z"
            fill="${p.primary}" opacity="0.88"/>
      <line x1="1" y1="17" x2="21" y2="17" stroke="${p.accent}" stroke-width="0.8" opacity="0.7"/>
    </svg>
  `)

  // ---------- 分割线 · wave：花枝连续图案（缠枝花） ---------- //
  // 中央对称的 S 曲线主枝 + 叶片花朵点缀，体现"缠枝纹"的连续节律。
  const dividerWave = strip(`
    <svg viewBox="0 0 240 20" width="220" height="20" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,10 C40,4 60,16 80,10 C100,4 120,16 140,10 C160,4 180,16 200,10 C210,7 218,10 220,10"
            fill="none" stroke="${p.primary}" stroke-width="1" opacity="0.65"/>
      ${[60, 100, 140, 180]
        .map((cx, i) => {
          const cy = i % 2 === 0 ? 6 : 14
          return (
            `<ellipse cx="${cx}" cy="${cy}" rx="3.5" ry="1.6" fill="${p.primary}" opacity="0.55"/>` +
            `<circle cx="${cx}" cy="${cy}" r="1.2" fill="${p.accent}" opacity="0.8"/>`
          )
        })
        .join('')}
      <circle cx="30" cy="10" r="1.5" fill="${p.primary}" opacity="0.7"/>
      <circle cx="210" cy="10" r="1.5" fill="${p.primary}" opacity="0.7"/>
    </svg>
  `)

  // ---------- 分割线 · dots：回纹方印（古籍页眉装饰风） ---------- //
  // 用方框 + 内部 L 形折线模拟回纹（回字纹）的几何节律。
  const dividerDots = strip(`
    <svg viewBox="0 0 240 14" width="220" height="14" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="7" x2="72" y2="7" stroke="${p.border}" stroke-width="0.8"/>
      <line x1="168" y1="7" x2="240" y2="7" stroke="${p.border}" stroke-width="0.8"/>
      ${[80, 100, 120, 140, 160]
        .map(cx => {
          return (
            `<rect x="${cx - 4}" y="3" width="8" height="8" fill="none" stroke="${p.primary}" stroke-width="0.8" opacity="0.75"/>` +
            `<path d="M${cx - 2},5 L${cx + 2},5 L${cx + 2},9" fill="none" stroke="${p.primary}" stroke-width="0.8" opacity="0.6"/>`
          )
        })
        .join('')}
    </svg>
  `)

  // ---------- 分割线 · flower：中央云纹 + 两侧细线（章节切换） ---------- //
  // 中央放一组"如意云头"印章，两侧双线，模仿古籍章节分隔的"花口"样式。
  const dividerFlower = strip(`
    <svg viewBox="0 0 240 22" width="220" height="22" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="9" x2="96" y2="9" stroke="${p.border}" stroke-width="0.8"/>
      <line x1="0" y1="13" x2="96" y2="13" stroke="${p.border}" stroke-width="0.4" opacity="0.6"/>
      <line x1="144" y1="9" x2="240" y2="9" stroke="${p.border}" stroke-width="0.8"/>
      <line x1="144" y1="13" x2="240" y2="13" stroke="${p.border}" stroke-width="0.4" opacity="0.6"/>
      <!-- 中央云纹 -->
      <path d="M104,11 A4,4 0 0 1 112,11 A4,4 0 0 1 120,11 A4,4 0 0 1 128,11 A4,4 0 0 1 136,11 L136,15 L104,15 Z"
            fill="${p.primary}" opacity="0.8"/>
      <circle cx="120" cy="4" r="1.8" fill="${p.accent}" opacity="0.85"/>
      <line x1="120" y1="4" x2="120" y2="8" stroke="${p.primary}" stroke-width="0.8" opacity="0.7"/>
    </svg>
  `)

  // ---------- 金句引号：古籍边框样式（方框 + 四角花） ---------- //
  // 仿古籍"夹注"或"边栏"：外方框 + 四角小花饰，内部空白供文字使用（这里填一个暗色"引"字块）。
  const quoteMark = strip(`
    <svg viewBox="0 0 44 32" width="36" height="26" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:top;margin-right:4px">
      <rect x="2" y="4" width="40" height="24" fill="none" stroke="${p.primary}" stroke-width="0.9" opacity="0.7"/>
      <!-- 四角花饰 -->
      <path d="M2,8 L2,4 L6,4" fill="none" stroke="${p.accent}" stroke-width="1.2" opacity="0.8"/>
      <path d="M38,4 L42,4 L42,8" fill="none" stroke="${p.accent}" stroke-width="1.2" opacity="0.8"/>
      <path d="M2,24 L2,28 L6,28" fill="none" stroke="${p.accent}" stroke-width="1.2" opacity="0.8"/>
      <path d="M38,28 L42,28 L42,24" fill="none" stroke="${p.accent}" stroke-width="1.2" opacity="0.8"/>
      <!-- 内部"双引"符号：两对竖短线 -->
      <path d="M12,12 L12,18 M16,12 L16,18" stroke="${p.primary}" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
      <path d="M28,12 L28,18 M32,12 L32,18" stroke="${p.primary}" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
    </svg>
  `)

  // ---------- Section 角花：书页折角（双折边） ---------- //
  // 模拟线装书书角 / 藏书章的"折角"装饰。
  const sectionCorner = strip(`
    <svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:6px">
      <path d="M2,2 L14,2 L18,6 L18,18 L2,18 Z" fill="none" stroke="${p.primary}" stroke-width="1" opacity="0.8"/>
      <path d="M14,2 L14,6 L18,6" fill="none" stroke="${p.primary}" stroke-width="1" opacity="0.8"/>
      <circle cx="10" cy="12" r="1.2" fill="${p.accent}" opacity="0.85"/>
    </svg>
  `)

  // ---------- 图标：细线几何（木刻线条感） ---------- //
  // 外圆（钤印），内嵌语义线条；线条粗 1.2 保证缩到 ≈9.4px 时仍可见。
  const iconSeal = (color: string, inner: string) => strip(`
    <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:6px">
      <circle cx="8" cy="8" r="7" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.9"/>
      ${inner}
    </svg>
  `)

  const tipIcon = iconSeal(
    p.tipAccent,
    `<path d="M5,8 L7.5,10.5 L11,6" fill="none" stroke="${p.tipAccent}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  )
  const warningIcon = iconSeal(
    p.warningAccent,
    `<path d="M8,3.5 L8,9" stroke="${p.warningAccent}" stroke-width="1.4" stroke-linecap="round"/>` +
      `<circle cx="8" cy="11.5" r="0.9" fill="${p.warningAccent}"/>`,
  )
  const infoIcon = iconSeal(
    p.infoAccent,
    `<circle cx="8" cy="4.6" r="0.9" fill="${p.infoAccent}"/>` +
      `<path d="M8,7 L8,12.5" stroke="${p.infoAccent}" stroke-width="1.4" stroke-linecap="round"/>`,
  )
  const dangerIcon = iconSeal(
    p.dangerAccent,
    `<path d="M5,5 L11,11 M11,5 L5,11" stroke="${p.dangerAccent}" stroke-width="1.4" stroke-linecap="round"/>`,
  )

  // ---------- 步骤徽章：圆形钤印 + 古铜数字 ---------- //
  // viewBox 24×24 渲染 24×24 等比；font-size=15 光栅化后 ≥ 14px；
  // 不声明 font-family（避免 Android 宋体回退不稳）；
  // 双圈钤印 + accent 色数字，主色描边 + 极浅底色（避免纯白）。
  const stepBadge = (n: number) => strip(`
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:8px">
      <circle cx="12" cy="12" r="11" fill="${p.primary}" opacity="0.12"/>
      <circle cx="12" cy="12" r="11" fill="none" stroke="${p.primary}" stroke-width="1.2"/>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="${p.primary}" stroke-width="0.6" opacity="0.55"/>
      <text x="12" y="17" text-anchor="middle" font-size="15" font-weight="700" fill="${p.accent}">${n}</text>
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
