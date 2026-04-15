/**
 * SVG → PNG rasterization for WeChat paste channel.
 *
 * Why we do this: WeChat's paste channel drops inline <svg>. The only stable
 * image path is <img src="data:image/png;base64,...">. We rasterize on the
 * client right before copy so the user pastes a PNG the editor will accept.
 *
 * Bugs fixed vs. v1 (addresses "SVG 文字与图形重叠"):
 *   1. Wait for document.fonts.ready — Chrome used to measure text width with
 *      the fallback sans-serif, producing wider glyphs than the design used,
 *      which pushed text across nearby geometry.
 *   2. Cover <tspan> as well as <text>/<g>/<svg> when forcing the font stack.
 *   3. Auto-wrap long Chinese text when author sets data-wrap="N" on <text>.
 *   4. Guarantee viewBox so canvas drawImage doesn't stretch.
 *   5. Clamp scaled width to ≤1080px (WeChat recompresses anything wider).
 */

const FONT_STACK = '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
const MAX_OUTPUT_WIDTH = 1080;

function forceFontOn(node: Element): void {
  node.setAttribute("font-family", FONT_STACK);
  const style = node.getAttribute("style");
  if (style && /font-family\s*:/i.test(style)) {
    node.setAttribute(
      "style",
      style.replace(/font-family\s*:\s*[^;]+;?/gi, "") + `font-family:${FONT_STACK};`,
    );
  }
}

function autoWrapText(t: SVGTextElement): void {
  const raw = (t.textContent || "").trim();
  if (!raw) return;
  const wrap = Number(t.getAttribute("data-wrap")) || 12;
  const lineHeight =
    Number(t.getAttribute("data-line-height")) ||
    Number(t.getAttribute("font-size")) * 1.4 ||
    20;
  const x = t.getAttribute("x") || "0";
  t.textContent = "";
  for (let i = 0, line = 0; i < raw.length; i += wrap, line++) {
    const ts = t.ownerDocument!.createElementNS("http://www.w3.org/2000/svg", "tspan");
    ts.setAttribute("x", x);
    ts.setAttribute("dy", line === 0 ? "0" : String(lineHeight));
    ts.textContent = raw.slice(i, i + wrap);
    t.appendChild(ts);
  }
}

export async function svgToPngDataUrl(svgEl: SVGElement, scale = 2): Promise<string> {
  // 1. Block on font loading so measurement is stable.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docFonts = (document as any).fonts;
  if (docFonts && typeof docFonts.ready?.then === "function") {
    try {
      await docFonts.ready;
    } catch {
      /* non-fatal */
    }
  }

  const cloned = svgEl.cloneNode(true) as SVGElement;

  // 2. Force font on every text-bearing node (incl. <tspan>).
  cloned
    .querySelectorAll("text, tspan, g, foreignObject")
    .forEach((n) => forceFontOn(n as Element));
  forceFontOn(cloned);

  // 3. Auto-wrap any <text data-wrap="N">.
  cloned
    .querySelectorAll<SVGTextElement>("text[data-wrap]")
    .forEach((t) => autoWrapText(t));

  // 4. Guarantee viewBox.
  if (!cloned.getAttribute("viewBox")) {
    const w = cloned.getAttribute("width") || "680";
    const h = cloned.getAttribute("height") || "400";
    cloned.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }
  if (!cloned.getAttribute("xmlns")) {
    cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  // 5. Load the SVG as an Image.
  const svgData = new XMLSerializer().serializeToString(cloned);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("svg load fail"));
    img.src = url;
  });

  // 6. Compute final canvas size from viewBox (authoritative), clamp to 1080.
  const vb = cloned.getAttribute("viewBox")!.split(/[\s,]+/).map(Number);
  const vw = vb[2] || img.naturalWidth || img.width || 680;
  const vh = vb[3] || img.naturalHeight || img.height || 400;
  const safeScale = Math.min(scale, MAX_OUTPUT_WIDTH / vw);
  const effScale = Math.max(1, safeScale);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vw * effScale);
  canvas.height = Math.round(vh * effScale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error("no canvas context");
  }
  ctx.imageSmoothingEnabled = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx as any).imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/png");
}
