/**
 * SVG 字符串工具：压空白（保持单行）并统一去除 id。
 *
 * 主题作者写多行 SVG 方便阅读，过 strip() 后变单行字符串，便于拼进 HTML。
 * wxPatch 会再做一次 id/url 清洗，但主题层先自觉避免 id 和 url 引号，
 * 让 wxPatch 层保持"幂等断言"语义。
 */

export const strip = (s: string): string => s.replace(/\s+/g, ' ').trim()
