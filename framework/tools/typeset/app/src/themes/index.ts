import type { Theme } from './types'
import { defaultTheme } from './default'
import { techGeekTheme } from './tech-geek'
import { lifeAestheticTheme } from './life-aesthetic'
import { businessFinanceTheme } from './business-finance'
import { literaryHumanismTheme } from './literary-humanism'

export const themeRegistry: Record<string, Theme> = {
  default: defaultTheme,
  'tech-geek': techGeekTheme,
  'life-aesthetic': lifeAestheticTheme,
  'business-finance': businessFinanceTheme,
  'literary-humanism': literaryHumanismTheme,
}

export const themeList: Theme[] = Object.values(themeRegistry)

export function getTheme(id: string): Theme {
  return themeRegistry[id] ?? defaultTheme
}

export { defaultTheme, techGeekTheme, lifeAestheticTheme, businessFinanceTheme, literaryHumanismTheme }
