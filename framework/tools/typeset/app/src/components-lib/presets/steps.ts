/**
 * steps 预设：3 variant × 每 variant 2 预设 = 6 条
 */

import type { ComponentEntry } from '../types'
import { thumb } from '../thumbnail'

const BODY3 =
  '### 01 第一步\n正文说明\n\n### 02 第二步\n正文说明\n\n### 03 第三步\n正文说明\n'

export const stepsPresets: ComponentEntry[] = [
  {
    id: 'st-number-circle',
    name: '编号圆圈步骤',
    description: 'h3 手写编号，标题加粗',
    kind: 'steps',
    variantId: 'number-circle',
    markdownSnippet:
      '::: steps 流程\n' + BODY3 + ':::\n',
    thumbnailSvg: thumb.stepsCircle(),
  },
  {
    id: 'st-number-circle-short',
    name: '两步精简',
    description: '轻量版双步骤',
    kind: 'steps',
    variantId: 'number-circle',
    markdownSnippet:
      '::: steps\n### 01 准备\n描述\n\n### 02 执行\n描述\n:::\n',
    thumbnailSvg: thumb.stepsCircle(),
  },
  {
    id: 'st-ribbon',
    name: '飘带链式',
    description: '左侧色条贯穿，胶囊标题',
    kind: 'steps',
    variantId: 'ribbon-chain',
    markdownSnippet:
      '::: steps 步骤 variant=ribbon-chain\n' + BODY3 + ':::\n',
    thumbnailSvg: thumb.stepsRibbon(),
  },
  {
    id: 'st-ribbon-with-intro',
    name: '飘带 + 导语',
    description: '步骤列表前加一段引子',
    kind: 'steps',
    variantId: 'ribbon-chain',
    markdownSnippet:
      '::: steps 上线流程 variant=ribbon-chain\n先阅读[操作文档](#)，然后：\n\n' +
      BODY3 +
      ':::\n',
    thumbnailSvg: thumb.stepsRibbon(),
  },
  {
    id: 'st-timeline',
    name: '时间轴步骤',
    description: '左侧点线 + 主色小圆点',
    kind: 'steps',
    variantId: 'timeline-dot',
    markdownSnippet:
      '::: steps 变更轨迹 variant=timeline-dot\n' + BODY3 + ':::\n',
    thumbnailSvg: thumb.stepsTimeline(),
  },
  {
    id: 'st-timeline-log',
    name: '时间轴日志',
    description: '日期 + 事件的日志流',
    kind: 'steps',
    variantId: 'timeline-dot',
    markdownSnippet:
      '::: steps 更新日志 variant=timeline-dot\n### 2026-04-01 初版上线\n说明\n\n### 2026-04-10 修复若干\n说明\n:::\n',
    thumbnailSvg: thumb.stepsTimeline(),
  },
]
