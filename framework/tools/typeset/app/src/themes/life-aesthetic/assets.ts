/**
 * life-aesthetic · 专属 SVG 资产
 *
 * 视觉语言：手绘 & 慢生活
 *   - H2 前缀：一片叶子 + 细茎
 *   - 分割线：不规则手绘波浪 / 散落花瓣 / 叶脉花枝
 *   - 金句：大号西文双手写引号（斜体 47pt）
 *   - sectionCorner：叶片 + 短茎
 *   - 图标：圆润，有机感
 *   - stepBadge：软圆 + 浅填充，数字用 accent 暖色
 *
 * 共 11 个资产，超过"≥ 8"要求。无 id / 无 url 引号。
 */

import type { ThemeAssets } from '../types'
import { strip } from '../_shared/svgLib'

interface Palette {
  primary: string
  secondary: string
  accent: string
  border: string
  tipAccent: string
  warningAccent: string
  infoAccent: string
  dangerAccent: string
}

export function lifeAestheticAssets(p: Palette): ThemeAssets {
  // ---------- H2 Prefix：一片叶子 + 细茎 ---------- //
  const h2Prefix = strip(`
    <svg viewBox="0 0 22 22" width="18" height="18" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:8px">
      <path d="M2,20 C8,18 16,12 20,4 C14,6 6,10 2,20 Z"
            fill="${p.primary}" opacity="0.85"/>
      <path d="M4,18 C10,14 14,10 18,6"
            fill="none" stroke="${p.secondary}" stroke-width="1" opacity="0.6"/>
    </svg>
  `)

  // ---------- 分割线 · wave：不规则手绘波浪，末端渐淡 ---------- //
  const dividerWave = strip(`
    <svg viewBox="0 0 240 16" width="220" height="16" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,9 C18,2 36,14 54,8 C72,2 90,14 108,8 C126,2 144,14 162,8 C180,2 198,14 216,8 C228,5 240,9 240,9"
            fill="none" stroke="${p.primary}" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>
    </svg>
  `)

  // ---------- 分割线 · dots：散落的小花瓣 ---------- //
  const dividerDots = strip(`
    <svg viewBox="0 0 240 14" width="220" height="14" xmlns="http://www.w3.org/2000/svg">
      ${[70, 100, 130, 160].map((cx, i) => {
        const rot = i * 45
        return (
          `<g transform="translate(${cx} 7) rotate(${rot})">` +
          `<ellipse cx="0" cy="-3" rx="1.5" ry="3" fill="${p.primary}" opacity="0.75"/>` +
          `<ellipse cx="0" cy="3" rx="1.5" ry="3" fill="${p.primary}" opacity="0.5"/>` +
          `<circle cx="0" cy="0" r="1.2" fill="${p.accent}"/>` +
          `</g>`
        )
      }).join('')}
    </svg>
  `)

  // ---------- 分割线 · flower：叶脉花枝（两侧细线 + 中央花枝） ---------- //
  const dividerFlower = strip(`
    <svg viewBox="0 0 240 22" width="220" height="22" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,11 C40,11 80,11 95,11" fill="none" stroke="${p.border}" stroke-width="1"/>
      <path d="M145,11 C170,11 200,11 240,11" fill="none" stroke="${p.border}" stroke-width="1"/>
      <!-- 中央花枝 -->
      <path d="M120,2 C118,6 114,8 110,10 M120,2 C122,6 126,8 130,10"
            fill="none" stroke="${p.primary}" stroke-width="1.2" opacity="0.85"/>
      <ellipse cx="120" cy="14" rx="4" ry="2.5" fill="${p.primary}" opacity="0.7"/>
      <ellipse cx="120" cy="18" rx="3" ry="1.8" fill="${p.accent}" opacity="0.65"/>
    </svg>
  `)

  // ---------- 金句引号：手绘逗号形双引号（路径，不依赖字体） ---------- //
  // 不用 <text>：Android 微信对 Georgia 等装饰字体回退不稳，导致手写感失真。
  // 改用 Bezier 描绘"豆芽"形状，两个成一组做开引号。
  const quoteMark = strip(`
    <svg viewBox="0 0 48 36" width="40" height="30" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:top;margin-right:6px">
      <path d="M4,24 C4,14 10,6 18,4 C14,10 12,16 13,22 C13,28 9,30 4,24 Z"
            fill="${p.primary}" opacity="0.42"/>
      <path d="M26,24 C26,14 32,6 40,4 C36,10 34,16 35,22 C35,28 31,30 26,24 Z"
            fill="${p.primary}" opacity="0.42"/>
    </svg>
  `)

  // ---------- Section 角花：叶片 + 短茎 ---------- //
  const sectionCorner = strip(`
    <svg viewBox="0 0 22 18" width="18" height="14" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:6px">
      <path d="M1,16 C6,14 14,9 20,2 C15,3 6,6 1,16 Z" fill="${p.primary}" opacity="0.85"/>
      <line x1="1" y1="16" x2="8" y2="10" stroke="${p.secondary}" stroke-width="1" opacity="0.6"/>
    </svg>
  `)

  // ---------- 图标：圆润 ---------- //
  const iconFrame = (color: string, inner: string) => strip(`
    <svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:6px">
      <circle cx="8" cy="8" r="7" fill="${color}" opacity="0.2"/>
      <circle cx="8" cy="8" r="7" fill="none" stroke="${color}" stroke-width="1.2"/>
      ${inner}
    </svg>
  `)

  const tipIcon = iconFrame(
    p.tipAccent,
    `<path d="M5,8 L7.5,10.5 L11,6" fill="none" stroke="${p.tipAccent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  )
  const warningIcon = iconFrame(
    p.warningAccent,
    `<rect x="7" y="4" width="2" height="5" rx="1" fill="${p.warningAccent}"/>` +
      `<circle cx="8" cy="11.5" r="1" fill="${p.warningAccent}"/>`,
  )
  const infoIcon = iconFrame(
    p.infoAccent,
    `<circle cx="8" cy="4.5" r="1" fill="${p.infoAccent}"/>` +
      `<rect x="7" y="6.5" width="2" height="6" rx="1" fill="${p.infoAccent}"/>`,
  )
  const dangerIcon = iconFrame(
    p.dangerAccent,
    `<path d="M5,5 L11,11 M11,5 L5,11" stroke="${p.dangerAccent}" stroke-width="1.8" stroke-linecap="round"/>`,
  )

  // ---------- 步骤徽章：软圆双环 + 数字 ---------- //
  // viewBox 与渲染尺寸等比 (24×24)，font-size=15 光栅化后 ≥ 14px；
  // 不声明 font-family，避免 Android 系统字体回退导致数字变形。
  const stepBadge = (n: number) => strip(`
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"
         style="display:inline-block;vertical-align:middle;margin-right:8px">
      <circle cx="12" cy="12" r="11" fill="${p.primary}" opacity="0.22"/>
      <circle cx="12" cy="12" r="11" fill="none" stroke="${p.primary}" stroke-width="1.2"/>
      <text x="12" y="17" text-anchor="middle" font-size="15" font-weight="700" fill="${p.primary}">${n}</text>
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
