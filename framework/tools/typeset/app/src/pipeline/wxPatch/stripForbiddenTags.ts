/**
 * stripForbiddenTags：移除粘贴到公众号会被剥离的危险标签。
 *
 * 移除：
 *   - <style>  （juice 之后理论上应该为空；这里兜底）
 *   - <script>
 *   - <noscript>
 *   - <link> / <meta>
 *
 * 保留：
 *   - <iframe>  仅当 src 指向 v.qq.com（mpvideo 容器产出），其余剥离
 *
 * 为什么不连同内容一起剥：
 *   <style> 必须丢内容；<script>/<noscript>/<iframe(非白名单)> 也是——它们的内容
 *   要么是 JS，要么是元信息，保留会在公众号里显示为乱码文本。
 */

import { parseFragment, serializeFragment } from './utils'

const HARD_REMOVE_TAGS = new Set(['style', 'script', 'noscript', 'link', 'meta'])

const IFRAME_SRC_ALLOW = [/^https?:\/\/v\.qq\.com\//i]

export function stripForbiddenTags(html: string): string {
  const { container } = parseFragment(html)

  // 收集后再删，避免改动中结构
  const toRemove: Element[] = []

  const all = container.getElementsByTagName('*')
  for (let i = 0; i < all.length; i++) {
    const el = all[i]
    const tag = el.tagName.toLowerCase()
    if (HARD_REMOVE_TAGS.has(tag)) {
      toRemove.push(el)
      continue
    }
    if (tag === 'iframe') {
      const src = el.getAttribute('src') ?? ''
      const allowed = IFRAME_SRC_ALLOW.some((re) => re.test(src))
      if (!allowed) toRemove.push(el)
    }
  }

  for (const el of toRemove) el.remove()

  return serializeFragment(container)
}
