/**
 * 多媒体容器：mpvoice / mpvideo
 *
 * - mpvoice：公众号音频组件。粘贴到公众号编辑器里微信会识别并补齐真实播放器，
 *   本工具预览时只能给占位卡。attrs.voice_encode_fileid 若提供则透传。
 * - mpvideo：支持两种场景：
 *   1. attrs.qqvid：腾讯视频，渲染为允许的 iframe（v.qq.com 白名单，wxPatch 保留）
 *   2. 其他场景：占位卡，提示用户在公众号后台手动补视频组件
 *
 * 两者都没有有意义的正文；info 作为标题。
 */

import type { ContainerRenderer } from './types'
import { escAttr, escText } from './types'

const PLACEHOLDER_STYLE =
  'text-align:center;padding:16px;background-color:#f7f8fa;border-radius:6px;color:#6a737d'

export const mpvoiceContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim() || '音频'
    const fileid = ctx.attrs.voice_encode_fileid ?? ctx.attrs.fileid
    const hint = fileid
      ? `已携带 fileid=${escText(fileid)}，粘贴到公众号后自动展开`
      : '粘贴到公众号后请手动选择"插入音频"'
    return (
      `<section class="container-mpvoice" style="${PLACEHOLDER_STYLE}">\n` +
      `<section style="font-size:12px;letter-spacing:1px;color:#1a73e8;margin-bottom:6px">[ 音频 ]</section>\n` +
      `<section style="font-weight:700;margin-bottom:6px">${escText(title)}</section>\n` +
      `<section style="font-size:13px">${hint}</section>\n`
    )
  },
  close: '</section>\n',
}

export const mpvideoContainer: ContainerRenderer = {
  open: (ctx) => {
    const title = ctx.info.trim() || '视频'
    const qqvid = ctx.attrs.qqvid ?? ctx.attrs.vid
    if (qqvid) {
      const src = `https://v.qq.com/txp/iframe/player.html?vid=${encodeURIComponent(qqvid)}`
      // 外框 section 容器 + iframe；padding-top:56.25% 保持 16:9 时被公众号剥离
      // 因此直接给一个固定高度占位
      return (
        `<section class="container-mpvideo">\n` +
        `<iframe src="${escAttr(src)}" frameborder="0" ` +
        `width="100%" height="220" allowfullscreen="true" ` +
        `title="${escAttr(title)}"></iframe>\n`
      )
    }
    return (
      `<section class="container-mpvideo" style="${PLACEHOLDER_STYLE}">\n` +
      `<section style="font-size:12px;letter-spacing:1px;color:#1a73e8;margin-bottom:6px">[ 视频 ]</section>\n` +
      `<section style="font-weight:700;margin-bottom:6px">${escText(title)}</section>\n` +
      `<section style="font-size:13px">粘贴到公众号后请手动选择"插入视频"</section>\n`
    )
  },
  close: '</section>\n',
}
