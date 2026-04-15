/** Strip attributes and tags that WeChat often rejects or rewrites unpredictably. */
export function sanitizeForWechat(htmlStr: string): string {
  return htmlStr
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\s+id="[^"]*"/gi, "")
    .replace(/\s+class="[^"]*"/gi, "");
}
