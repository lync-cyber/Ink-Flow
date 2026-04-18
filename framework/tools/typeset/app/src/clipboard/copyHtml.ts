/**
 * 剪贴板写入（Step 1 版：execCommand 降级占位）
 *
 * Step 8 将完整实现：
 *   - Clipboard API：同时写 text/html 和 text/plain
 *   - Safari 兼容：同步路径内构造 ClipboardItem，Blob 作为 Promise 传入
 *   - 非 secure context / 权限被拒 → 自动降级 execCommand
 *
 * Step 1 只保证：点击复制能把富文本写入剪贴板（尽力而为）。
 */

export interface CopyResult {
  ok: boolean
  mode: 'clipboard-api' | 'exec-command' | 'failed'
  error?: string
}

export async function copyHtmlToClipboard(html: string, plain: string): Promise<CopyResult> {
  // 首选 Clipboard API
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof ClipboardItem !== 'undefined'
  ) {
    try {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      })
      await navigator.clipboard.write([item])
      return { ok: true, mode: 'clipboard-api' }
    } catch (err) {
      // 继续尝试降级
      // eslint-disable-next-line no-console
      console.warn('[copyHtml] Clipboard API failed, fallback to execCommand:', err)
    }
  }

  // 降级：execCommand('copy') —— 需要先选中一个 contenteditable 节点
  try {
    const container = document.createElement('div')
    container.setAttribute('contenteditable', 'true')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.innerHTML = html
    document.body.appendChild(container)

    const range = document.createRange()
    range.selectNodeContents(container)
    const selection = window.getSelection()
    if (!selection) throw new Error('no selection')
    selection.removeAllRanges()
    selection.addRange(range)

    const ok = document.execCommand('copy')
    selection.removeAllRanges()
    document.body.removeChild(container)

    if (!ok) throw new Error('execCommand copy returned false')
    return { ok: true, mode: 'exec-command' }
  } catch (err) {
    return { ok: false, mode: 'failed', error: String(err) }
  }
}
