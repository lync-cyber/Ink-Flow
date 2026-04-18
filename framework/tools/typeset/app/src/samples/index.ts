/**
 * 每套主题的演示 Markdown
 *
 * 设计目标：一份 md 跑遍所有容器（intro/cover/author/section-title/tip/warning/info/danger/
 * quote-card/highlight/compare-pros-cons/steps/divider×4/footer-cta/recommend/qrcode/mpvoice/mpvideo），
 * 让用户在"主题切换"下拉切换时能直观看到 4 套风格差异。
 */

import { commonSample } from './common'
import { techGeekSample } from './tech-geek'
import { lifeAestheticSample } from './life-aesthetic'
import { businessFinanceSample } from './business-finance'
import { literaryHumanismSample } from './literary-humanism'

export const sampleByTheme: Record<string, string> = {
  default: commonSample,
  'tech-geek': techGeekSample,
  'life-aesthetic': lifeAestheticSample,
  'business-finance': businessFinanceSample,
  'literary-humanism': literaryHumanismSample,
}

export function getSample(themeId: string): string {
  return sampleByTheme[themeId] ?? commonSample
}
