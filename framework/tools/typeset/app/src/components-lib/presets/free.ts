/**
 * kind='none' 自由组件：intro / author / cover / highlight / footer-cta / recommend / qrcode / mpvoice / mpvideo
 * 无 variant 分派，一条预设即可。
 */

import type { ComponentEntry } from '../types'
import { thumb } from '../thumbnail'

export const freePresets: ComponentEntry[] = [
  {
    id: 'free-intro',
    name: '开场导语',
    description: '文章开头的引子卡，独立视觉',
    kind: 'none',
    markdownSnippet:
      '::: intro\n一段用来承载"本文将讨论什么"的导语。\n:::\n',
    thumbnailSvg: thumb.intro(),
  },
  {
    id: 'free-author',
    name: '作者栏',
    description: '姓名 + 角色 + 一句话',
    kind: 'none',
    markdownSnippet:
      '::: author 张三 role=主笔\n一段作者自述或背景。\n:::\n',
    thumbnailSvg: thumb.author(),
  },
  {
    id: 'free-cover',
    name: '封面卡',
    description: '标题 + 一张图 + 一行描述',
    kind: 'none',
    markdownSnippet:
      '::: cover 本期封面\n![封面图](https://placehold.co/1200x630)\n\n_一句描述_\n:::\n',
    thumbnailSvg: thumb.intro(),
  },
  {
    id: 'free-highlight',
    name: '重点高亮块',
    description: '整段荧光底色',
    kind: 'none',
    markdownSnippet:
      '::: highlight\n这一段将被整段高亮，用来压重点。\n:::\n',
    thumbnailSvg: thumb.highlight(),
  },
  {
    id: 'free-footer-cta',
    name: '文末 CTA',
    description: '标题 + 描述 + 按钮胶囊',
    kind: 'none',
    markdownSnippet:
      '::: footer-cta 觉得有用？ cta=点此关注\n如果这篇对你有启发，欢迎关注。\n:::\n',
    thumbnailSvg: thumb.footerCTA(),
  },
  {
    id: 'free-recommend',
    name: '推荐阅读',
    description: '列表形式的相关链接',
    kind: 'none',
    markdownSnippet:
      '::: recommend 推荐阅读\n- [文章 A](#)\n- [文章 B](#)\n:::\n',
    thumbnailSvg: thumb.intro(),
  },
  {
    id: 'free-qrcode',
    name: '二维码卡',
    description: '说明文字 + 一张二维码图',
    kind: 'none',
    markdownSnippet:
      '::: qrcode 扫码关注\n![二维码](https://placehold.co/240x240)\n:::\n',
    thumbnailSvg: thumb.intro(),
  },
  {
    id: 'free-mpvoice',
    name: '音频占位',
    description: '<mpvoice> 无法粘贴，此为占位',
    kind: 'none',
    markdownSnippet:
      '::: mpvoice 本期播客\n粘贴后在公众号后台从素材库重新插入。\n:::\n',
    thumbnailSvg: thumb.highlight(),
  },
  {
    id: 'free-mpvideo-qq',
    name: '腾讯视频',
    description: '直接渲染 v.qq.com iframe',
    kind: 'none',
    markdownSnippet:
      '::: mpvideo qqvid=v326875u4ek\n视频标题\n:::\n',
    thumbnailSvg: thumb.highlight(),
  },
]
