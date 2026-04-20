/**
 * applyWxPatches：wxPatch 主入口
 *
 * 顺序（每步都是纯函数 html → html）：
 *   1. patchListWrap            外包 section，保住列表外边距
 *   2. stripForbiddenAttrs      全局删 id + 定位声明
 *   3. stripForbiddenTags       删 <style>/<script>/<noscript>/<link>/<meta>/非白名单 iframe
 *   4. stripFontFamily          剥所有 inline font-family
 *   5. patchSvgUrlQuotes        SVG 子树内 url("x") → url(x)
 *   6. patchSvgIds              SVG 子树内删所有 id（冗余保险）
 *   7. patchFlexToFallback      display:flex → display:block（data-wx-keep-flex 例外）
 *   8. patchSvgWhiteBg          opts.svgWhiteBg 开启时生效（默认关）
 *
 * 幂等：每个 patch 内部都具备"看到已处理标记则跳过"或"目标集合为空则无改动"
 *       的性质。连续两次 applyWxPatches 不应改变结果。
 */

import { patchListWrap } from './patchListWrap'
import { stripForbiddenAttrs } from './stripForbiddenAttrs'
import { stripForbiddenTags } from './stripForbiddenTags'
import { stripFontFamily } from './stripFontFamily'
import { patchSvgUrlQuotes } from './patchSvgUrlQuotes'
import { patchSvgIds } from './patchSvgIds'
import { patchFlexToFallback } from './patchFlexToFallback'
import { patchSvgWhiteBg } from './patchSvgWhiteBg'

export interface WxPatchOptions {
  /**
   * SVG 纯白填充替换为 #fefefe（规避公众号把 #fff 光栅化为透明的问题）。
   * 默认开启：主题作者即便漏掉也能兜住；显式传 false 可关闭（如主题预览纸需要纯白对比）。
   */
  svgWhiteBg?: boolean
}

export function applyWxPatches(html: string, opts: WxPatchOptions = {}): string {
  let out = html
  out = patchListWrap(out)
  out = stripForbiddenAttrs(out)
  out = stripForbiddenTags(out)
  out = stripFontFamily(out)
  out = patchSvgUrlQuotes(out)
  out = patchSvgIds(out)
  out = patchFlexToFallback(out)
  if (opts.svgWhiteBg !== false) out = patchSvgWhiteBg(out)
  return out
}

export {
  patchListWrap,
  stripForbiddenAttrs,
  stripForbiddenTags,
  stripFontFamily,
  patchSvgUrlQuotes,
  patchSvgIds,
  patchFlexToFallback,
  patchSvgWhiteBg,
}
