import type { Theme } from './types'
import { defaultTheme } from './default'

export const themeRegistry: Record<string, Theme> = {
  default: defaultTheme,
}

export const themeList: Theme[] = Object.values(themeRegistry)

export function getTheme(id: string): Theme {
  return themeRegistry[id] ?? defaultTheme
}
