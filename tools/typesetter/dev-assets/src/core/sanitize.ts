/**
 * Whitelist-based DOM sanitizer for WeChat Official Account paste channel.
 *
 * Rationale (see .claude/rules/data/css-safety.yaml):
 * - Paste channel strips <style>/<script>/id/class and unknown attrs.
 * - Paste channel rewrites some CSS values (position, url() with quotes,
 *   translate%, -webkit-*). We drop them before export so preview matches post-paste.
 * - <a href=> only clickable on whitelisted domains; otherwise downgrade to <span>
 *   so the reader doesn't see a dead-looking link.
 */

// Mirrors allowed_tags in .claude/rules/data/css-safety.yaml
const ALLOWED_TAGS = new Set([
  "p","section","div","span","h1","h2","h3","h4","h5","h6",
  "strong","b","em","i","u","br","hr",
  "ul","ol","li","blockquote","a","img",
  "table","thead","tbody","tr","th","td",
  "code","pre","sub","sup","mpvoice","mpvideo",
]);

// Both stable + fragile (fragile still emitted; WeChat may ignore some).
const ALLOWED_CSS = new Set([
  "font-size","font-weight","font-style","font-family","color",
  "background","background-color","line-height","letter-spacing",
  "text-align","text-decoration","text-indent","vertical-align",
  "padding","padding-top","padding-right","padding-bottom","padding-left",
  "margin","margin-top","margin-right","margin-bottom","margin-left",
  "border","border-top","border-right","border-bottom","border-left",
  "border-radius","border-color","border-style","border-width",
  "box-shadow","opacity",
  "width","height","max-width","min-width","max-height","min-height",
  "display","word-break","word-wrap","white-space",
  "overflow","overflow-x","overflow-y","border-collapse",
  // fragile (still allowed through; paste-side may drop them):
  "flex","flex-grow","flex-shrink","flex-wrap","flex-basis","flex-direction",
  "justify-content","align-items","align-self","align-content","gap",
  // SVG / misc commonly emitted by the renderer:
  "fill","stroke","stroke-width","object-fit",
  // fragile transform — only non-% translates kept (see FORBIDDEN_VALUE_PATTERNS)
  "transform",
]);

const FORBIDDEN_VALUE_PATTERNS: RegExp[] = [
  /position\s*:\s*(absolute|fixed|relative|sticky)/i,
  /url\(\s*['"]/i,
  /transform\s*:[^;]*%/i,
  /-webkit-[a-z-]+/i,
  /@media/i,
  /@keyframes/i,
  /animation\s*:/i,
];

// Mirrors forbidden_attrs in yaml + common event handlers.
const FORBIDDEN_ATTRS = /^(id|class|on[a-z]+)$/i;

const A_HREF_WHITELIST: RegExp[] = [
  /^https:\/\/mp\.weixin\.qq\.com\//i,
  /^https:\/\/mmbiz\.qpic\.cn\//i,
  /^https:\/\/channels\.weixin\.qq\.com\//i,
  /^https:\/\/res\.wx\.qq\.com\//i,
  /^weixin:\/\//i,
];

function filterStyle(styleStr: string): string {
  // Fast reject: whole style contains an @ rule or a forbidden value pattern
  // on a declaration level we still keep safe siblings, so parse per-decl.
  return styleStr
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .map((decl) => {
      const ci = decl.indexOf(":");
      if (ci < 0) return "";
      const prop = decl.slice(0, ci).trim().toLowerCase();
      const value = decl.slice(ci + 1).trim();
      if (!ALLOWED_CSS.has(prop)) return "";
      if (FORBIDDEN_VALUE_PATTERNS.some((re) => re.test(decl))) return "";
      return `${prop}:${value}`;
    })
    .filter(Boolean)
    .join(";");
}

function isWhitelistedHref(href: string): boolean {
  return A_HREF_WHITELIST.some((re) => re.test(href));
}

function walk(el: Element, doc: Document): void {
  // Drop forbidden tags wholesale.
  const tag = el.tagName.toLowerCase();

  // Recurse first (children may need rescue before we re-parent them).
  Array.from(el.children).forEach((child) => walk(child, doc));

  if (!ALLOWED_TAGS.has(tag)) {
    // Replace unknown tag with <span> that keeps children — preserves text flow.
    const replacement = doc.createElement("span");
    while (el.firstChild) replacement.appendChild(el.firstChild);
    el.parentNode?.replaceChild(replacement, el);
    return;
  }

  // <a href>: downgrade non-whitelisted to <span>.
  if (tag === "a") {
    const href = (el.getAttribute("href") || "").trim();
    if (!href || !isWhitelistedHref(href)) {
      const replacement = doc.createElement("span");
      const style = el.getAttribute("style");
      if (style) replacement.setAttribute("style", filterStyle(style));
      while (el.firstChild) replacement.appendChild(el.firstChild);
      el.parentNode?.replaceChild(replacement, el);
      return;
    }
  }

  // Strip forbidden attrs; filter style; keep whitelisted attrs as-is.
  const attrNames = el.getAttributeNames();
  for (const name of attrNames) {
    if (FORBIDDEN_ATTRS.test(name)) {
      el.removeAttribute(name);
      continue;
    }
    if (name === "style") {
      const cleaned = filterStyle(el.getAttribute("style") || "");
      if (cleaned) el.setAttribute("style", cleaned);
      else el.removeAttribute("style");
    }
  }
}

export function sanitizeForWechat(htmlStr: string): string {
  // Prefer DOM walker when DOMParser is available (browser + jsdom).
  if (typeof DOMParser === "undefined") {
    // Minimal regex fallback (tests cover the DOMParser path).
    return htmlStr
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/\s+id="[^"]*"/gi, "")
      .replace(/\s+class="[^"]*"/gi, "")
      .replace(/\s+on[a-z]+="[^"]*"/gi, "");
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__root">${htmlStr}</div>`, "text/html");
  const root = doc.getElementById("__root");
  if (!root) return htmlStr;
  Array.from(root.children).forEach((child) => walk(child, doc));
  return root.innerHTML;
}
