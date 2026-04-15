/**
 * Best-effort HTML → Markdown for local .html imports.
 * Strips scripts/styles; preserves headings, paragraphs, lists, links, images, blockquote, pre.
 */
export function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, noscript").forEach((el) => el.remove());
  const root = doc.body || doc.documentElement;
  const parts: string[] = [];
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent?.replace(/\s+/g, " ").trim();
      if (t) parts.push(t);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (tag === "br") {
      parts.push("\n");
      return;
    }
    if (tag === "h1") {
      parts.push("\n# ", el.textContent?.trim() || "", "\n\n");
      return;
    }
    if (tag === "h2") {
      parts.push("\n## ", el.textContent?.trim() || "", "\n\n");
      return;
    }
    if (tag === "h3") {
      parts.push("\n### ", el.textContent?.trim() || "", "\n\n");
      return;
    }
    if (tag === "p") {
      parts.push("\n", el.textContent?.trim() || "", "\n\n");
      return;
    }
    if (tag === "blockquote") {
      const text = (el.textContent || "").trim().split(/\n+/).join("\n> ");
      parts.push("\n> ", text, "\n\n");
      return;
    }
    if (tag === "ul") {
      el.querySelectorAll(":scope > li").forEach((li) => {
        parts.push("- ", (li.textContent || "").trim(), "\n");
      });
      parts.push("\n");
      return;
    }
    if (tag === "ol") {
      let n = 1;
      el.querySelectorAll(":scope > li").forEach((li) => {
        parts.push(`${n}. `, (li.textContent || "").trim(), "\n");
        n++;
      });
      parts.push("\n");
      return;
    }
    if (tag === "pre") {
      const code = el.textContent || "";
      parts.push("\n```\n", code.trim(), "\n```\n\n");
      return;
    }
    if (tag === "img") {
      const src = el.getAttribute("src") || "";
      const alt = el.getAttribute("alt") || "";
      parts.push(`\n![${alt}](${src})\n\n`);
      return;
    }
    if (tag === "a") {
      const href = el.getAttribute("href") || "";
      parts.push(`[${el.textContent?.trim() || ""}](${href})`);
      return;
    }
    el.childNodes.forEach(walk);
  }
  root.childNodes.forEach(walk);
  return parts.join("").replace(/\n{3,}/g, "\n\n").trim();
}
