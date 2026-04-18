/**
 * steps 容器：带编号徽章的步骤列表
 *
 * 内部使用约定：用户每个步骤写成一个 h3 + 内容段落；
 * Step 4 不自动编号（那会要求 DOM 后处理）；Step 5 主题 assets.stepBadge(n)
 * 会在 sectionCss 里为 h3 注入"::before 编号圈"——但 ::before 被公众号剥离，
 * 实际路径是渲染器在 h3 前插入 inline-block 徽章 DOM。
 *
 * 当前 Step 4 仅提供外框 + info 标题；编号徽章在 Step 5 连同 SVG 资产一起落。
 */

import type { ContainerRenderer } from './types'
import { escText } from './types'

export const stepsContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim()
    const head = title
      ? `<section class="container-steps__title" style="font-weight:700;margin-bottom:12px">${escText(title)}</section>`
      : ''
    return `<section class="container-steps">\n${head}`
  },
  close: '</section>\n',
}
