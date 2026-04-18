/**
 * tech-geek · 专属 SVG 资产
 *
 * 视觉语言：终端 & 赛博
 *   - H2 前缀：左实心竖条 + 叠加扫描线（命令行光标感）
 *   - 分割线：虚线扫描线 / 点阵矩阵 / 竖条阵列（频谱条）
 *   - 金句：方头 "<>" 代码块引号（像 heredoc 开头）
 *   - sectionCorner：方块角 + 小竖条（terminal 窗口装饰）
 *   - 图标：圆 + 方几何组合，硬边
 *   - stepBadge：圆角方形 + 单色数字（code block 风）
 *
 * 共 12 个资产，超过"≥ 8"要求。全部无 id / 无 url 引号。
 */

import type { ThemeAssets } from '../types'
import { strip } from '../_shared/svgLib'

interface Palette {
  primary: string
  accent: string
  border: string
  tipAccent: string
  warningAccent: string
  infoAccent: string
  dangerAccent: string
}

export function techGeekAssets(p: Palette): ThemeAssets {
  // ---------- H2 Prefix：扫描线竖条 ---------- //
  const h2Prefix = strip(`
    <svg viewBox="0 0 14 22" width="12" height="18" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:8px">
      <rect x="0" y="0" width="3" height="22" fill="${p.primary}"/>
      <rect x="5" y="2" width="3" height="3" fill="${p.primary}" opacity="0.85"/>
      <rect x="5" y="7" width="3" height="3" fill="${p.primary}" opacity="0.55"/>
      <rect x="5" y="12" width="3" height="3" fill="${p.primary}" opacity="0.3"/>
    </svg>
  `)

  // ---------- 分割线 · wave：虚线扫描 + 两端方块 ---------- //
  const dividerWave = strip(`
    <svg viewBox="0 0 240 10" width="220" height="10" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="3" width="8" height="4" fill="${p.primary}"/>
      <line x1="14" y1="5" x2="226" y2="5" stroke="${p.border}" stroke-width="1" stroke-dasharray="4 3"/>
      <rect x="232" y="3" width="8" height="4" fill="${p.primary}"/>
    </svg>
  `)

  // ---------- 分割线 · dots：9 × 1 点阵矩阵 ---------- //
  const dividerDots = strip(`
    <svg viewBox="0 0 240 10" width="220" height="10" xmlns="http://www.w3.org/2000/svg">
      ${[60, 75, 90, 105, 120, 135, 150, 165, 180]
        .map((cx, i) => `<rect x="${cx - 2}" y="3" width="4" height="4" fill="${p.primary}" opacity="${0.3 + (i % 5) * 0.14}"/>`)
        .join('')}
    </svg>
  `)

  // ---------- 分割线 · flower：频谱条（高度起伏的竖条阵列） ---------- //
  const dividerFlower = strip(`
    <svg viewBox="0 0 240 18" width="220" height="18" xmlns="http://www.w3.org/2000/svg">
      ${[4, 6, 10, 14, 12, 8, 12, 14, 10, 6, 4]
        .map((h, i) => {
          const x = 80 + i * 8
          const y = (18 - h) / 2
          return `<rect x="${x}" y="${y}" width="3" height="${h}" fill="${p.primary}" opacity="${0.5 + (i % 3) * 0.15}"/>`
        })
        .join('')}
      <line x1="0" y1="9" x2="75" y2="9" stroke="${p.border}" stroke-width="1"/>
      <line x1="173" y1="9" x2="240" y2="9" stroke="${p.border}" stroke-width="1"/>
    </svg>
  `)

  // ---------- 金句引号：heredoc 风 <> ---------- //
  const quoteMark = strip(`
    <svg viewBox="0 0 40 32" width="34" height="28" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:top;margin-right:4px">
      <path d="M14,4 L4,16 L14,28" fill="none" stroke="${p.primary}" stroke-width="3" opacity="0.55"/>
      <path d="M26,4 L36,16 L26,28" fill="none" stroke="${p.primary}" stroke-width="3" opacity="0.55"/>
    </svg>
  `)

  // ---------- Section 角花：窗口装饰（三个小方块 + 短竖条） ---------- //
  const sectionCorner = strip(`
    <svg viewBox="0 0 22 14" width="18" height="12" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:6px">
      <rect x="0" y="2" width="4" height="4" fill="${p.primary}"/>
      <rect x="5" y="2" width="4" height="4" fill="${p.primary}" opacity="0.55"/>
      <rect x="10" y="2" width="4" height="4" fill="${p.primary}" opacity="0.3"/>
      <rect x="17" y="0" width="3" height="14" fill="${p.primary}"/>
    </svg>
  `)

  // ---------- 图标 ---------- //
  const iconBase = (color: string, inner: string) => strip(`
    <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:6px">
      <rect x="1" y="1" width="14" height="14" fill="none" stroke="${color}" stroke-width="1.5" rx="1"/>
      ${inner}
    </svg>
  `)

  const tipIcon = iconBase(
    p.tipAccent,
    `<rect x="7" y="4" width="2" height="5" fill="${p.tipAccent}"/>` +
      `<rect x="7" y="10" width="2" height="2" fill="${p.tipAccent}"/>`,
  )
  const warningIcon = iconBase(
    p.warningAccent,
    `<path d="M8,3 L13,12 L3,12 Z" fill="none" stroke="${p.warningAccent}" stroke-width="1.2"/>` +
      `<rect x="7" y="6" width="2" height="3" fill="${p.warningAccent}"/>` +
      `<rect x="7" y="10" width="2" height="1.5" fill="${p.warningAccent}"/>`,
  )
  const infoIcon = iconBase(
    p.infoAccent,
    `<rect x="7" y="3" width="2" height="2" fill="${p.infoAccent}"/>` +
      `<rect x="7" y="6" width="2" height="7" fill="${p.infoAccent}"/>`,
  )
  const dangerIcon = iconBase(
    p.dangerAccent,
    `<rect x="3" y="7" width="10" height="2" fill="${p.dangerAccent}"/>`,
  )

  // ---------- 步骤徽章：圆角方形 + 数字 ---------- //
  // viewBox 与渲染尺寸等比 (24×24 → 24×24)，font-size=16 在公众号光栅化后仍 ≥ 14px，
  // 达到 svg.min_font_size 规则；不声明 font-family，走系统默认避免 Android 字体漂移。
  const stepBadge = (n: number) => strip(`
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:8px">
      <rect x="1" y="1" width="22" height="22" rx="3" fill="${p.primary}"/>
      <text x="12" y="17" text-anchor="middle" font-size="16" font-weight="700" fill="${p.accent}">${n}</text>
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
