/**
 * 导出工具（Step 8）
 *
 * - exportHtml: 下载 .html 文件（内含完整 inline 样式 + 主题背景 wrapper）
 * - exportMd: 下载 .md 文件（容器源文本原样）
 * - exportImage: 懒加载 html2canvas 把目标节点截成 long-image
 */

export function downloadBlob(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface ExportHtmlOptions {
  /** 外层 wrapper 背景色（主题 tokens.colors.bg） */
  background?: string
  /** 外层 wrapper 前景色（主题 tokens.colors.text） */
  color?: string
}

export function exportHtml(filename: string, html: string, opts: ExportHtmlOptions = {}): void {
  const title = escapeHtml(stripExt(filename))
  const bg = opts.background ?? '#ffffff'
  const fg = opts.color ?? '#222222'
  const wrapped =
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=375,initial-scale=1">` +
    `<title>${title}</title>` +
    `<style>body{margin:0;padding:24px 0;background:${bg};color:${fg};` +
    `font-family:"PingFang SC","Microsoft YaHei",sans-serif;}` +
    `.wx-md-wrap{max-width:640px;margin:0 auto;padding:0 16px;}</style>` +
    `</head><body><div class="wx-md-wrap">${html}</div></body></html>`
  downloadBlob(filename, wrapped, 'text/html')
}

export function exportMd(filename: string, md: string): void {
  downloadBlob(filename, md, 'text/markdown')
}

export interface ExportImageOptions {
  /** 显式背景色；传 null/undefined 会尝试从目标节点 getComputedStyle 读取 */
  background?: string | null
}

export async function exportImage(
  el: HTMLElement,
  filename: string,
  opts: ExportImageOptions = {},
): Promise<{ ok: boolean; error?: string }> {
  try {
    const mod = await import('html2canvas')
    const html2canvas = (mod as unknown as { default: (el: HTMLElement, cfg: unknown) => Promise<HTMLCanvasElement> }).default
    const resolvedBg = resolveBackground(el, opts.background)
    const canvas = await html2canvas(el, {
      backgroundColor: resolvedBg,
      useCORS: true,
      scale: 2,
      logging: false,
    })
    return await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve({ ok: false, error: 'toBlob 返回 null' })
          return
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        resolve({ ok: true })
      }, 'image/png')
    })
  } catch (err) {
    return {
      ok: false,
      error: (err as Error)?.message ?? '长图导出失败',
    }
  }
}

function resolveBackground(el: HTMLElement, hint: string | null | undefined): string | null {
  if (hint) return hint
  if (hint === null) return null
  try {
    const doc = el.ownerDocument
    const win = doc?.defaultView
    if (!win) return '#ffffff'
    const styles = win.getComputedStyle(el)
    const bg = styles.backgroundColor
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg
    const bodyBg = doc.body ? win.getComputedStyle(doc.body).backgroundColor : ''
    if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') return bodyBg
    return '#ffffff'
  } catch {
    return '#ffffff'
  }
}

/** 去掉文件名最后一个扩展，如 'foo.html' → 'foo' */
function stripExt(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx > 0 ? filename.slice(0, idx) : filename
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
