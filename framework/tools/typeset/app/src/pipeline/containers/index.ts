/**
 * 容器渲染器注册表
 *
 * 使用方：pipeline/markdown.ts 在构造 MarkdownIt 时遍历此 Map，
 * 把每个 name → ContainerRenderer 绑到 markdown-it-container 上。
 *
 * 注意 fence 长度：
 *   compare 必须用 4 个冒号（`::::`），其内部 pros/cons 用 3 个（`:::`）。
 *   markdown-it-container 按 fence 长度匹配闭合，同名同长度才互相关闭。
 *   这是插件的原生行为，不是我们的规定。
 */

import type { ContainerRenderer } from './types'
import {
  tipContainer,
  warningContainer,
  infoContainer,
  dangerContainer,
} from './admonitions'
import {
  introContainer,
  coverContainer,
  authorContainer,
  sectionTitleContainer,
} from './headline'
import { quoteCardContainer, highlightContainer } from './quote'
import { compareContainer, prosContainer, consContainer } from './compare'
import { stepsContainer } from './steps'
import { dividerContainer } from './divider'
import {
  footerCTAContainer,
  recommendContainer,
  qrcodeContainer,
} from './footer'
import { mpvoiceContainer, mpvideoContainer } from './media'

export const CONTAINER_REGISTRY: Record<string, ContainerRenderer> = {
  intro: introContainer,
  cover: coverContainer,
  author: authorContainer,
  'section-title': sectionTitleContainer,
  tip: tipContainer,
  warning: warningContainer,
  info: infoContainer,
  danger: dangerContainer,
  'quote-card': quoteCardContainer,
  highlight: highlightContainer,
  compare: compareContainer,
  pros: prosContainer,
  cons: consContainer,
  steps: stepsContainer,
  divider: dividerContainer,
  'footer-cta': footerCTAContainer,
  recommend: recommendContainer,
  qrcode: qrcodeContainer,
  mpvoice: mpvoiceContainer,
  mpvideo: mpvideoContainer,
}

export type { ContainerRenderer, ContainerRenderContext } from './types'
export { parseInfo, escAttr, escText } from './types'
