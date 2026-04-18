/**
 * 预设调色板 · 10 套
 *
 * 每个 palette 只定义 "主色 + 辅色 + 强调色"三元组（seed）；
 * 完整的 Theme tokens（bg / bgSoft / border / textMuted / status ...）
 * 由 generator.ts 的 derivePalette() 基于 seed 在 LCH 空间推导。
 *
 * 这样调色板的"美学决策"集中在三色搭配上，其余令牌可算法推导。
 */

export interface PaletteSeed {
  id: string
  name: string
  description: string
  primary: string
  secondary: string
  accent: string
  /** 是否暗色底。暗色底的 bg 由 generator 走暗化路径 */
  dark?: boolean
}

export const palettePresets: PaletteSeed[] = [
  {
    id: 'warm',
    name: '温暖',
    description: '暖橙 + 奶油黄，适合生活美学',
    primary: '#d98141',
    secondary: '#b96234',
    accent: '#efb758',
  },
  {
    id: 'cool',
    name: '冷静',
    description: '青绿 + 深蓝，技术/产品稳重感',
    primary: '#2d6fdd',
    secondary: '#1f3b70',
    accent: '#4ec9b0',
  },
  {
    id: 'morandi',
    name: '莫兰迪',
    description: '低饱和灰粉 + 灰绿，克制优雅',
    primary: '#a88b8a',
    secondary: '#6b7c7b',
    accent: '#c9b9a0',
  },
  {
    id: 'clash',
    name: '撞色',
    description: '高饱和撞色，运营号放大表达',
    primary: '#e23e57',
    secondary: '#522546',
    accent: '#f8b400',
  },
  {
    id: 'sophisticated-gray',
    name: '高级灰',
    description: '深灰 + 金点缀，商务深度',
    primary: '#3a3d42',
    secondary: '#1f2124',
    accent: '#c9a96c',
  },
  {
    id: 'japanese',
    name: '日系',
    description: '樱粉 + 淡黄 + 浅竹青',
    primary: '#d67b8c',
    secondary: '#a85a6a',
    accent: '#8ba888',
  },
  {
    id: 'nordic',
    name: '北欧',
    description: '雾蓝 + 浅灰 + 木色',
    primary: '#4a7590',
    secondary: '#2e4a5c',
    accent: '#c7a97a',
  },
  {
    id: 'black-gold',
    name: '黑金',
    description: '深黑 + 金，奢侈品调性',
    primary: '#c9a96c',
    secondary: '#1a1a1a',
    accent: '#f4dfa3',
    dark: true,
  },
  {
    id: 'porcelain',
    name: '青花',
    description: '深青 + 瓷白 + 赭红',
    primary: '#2a5b8a',
    secondary: '#143154',
    accent: '#b1413a',
  },
  {
    id: 'neo-chinese',
    name: '新中式',
    description: '胭脂红 + 墨绿 + 米黄',
    primary: '#9b2f2b',
    secondary: '#3e4e3a',
    accent: '#d9b26a',
  },
]

export function getPaletteById(id: string): PaletteSeed | undefined {
  return palettePresets.find((p) => p.id === id)
}
