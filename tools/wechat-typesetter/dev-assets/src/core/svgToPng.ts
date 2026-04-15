const FORCED_FONT = '"Microsoft YaHei","PingFang SC",sans-serif';

export async function svgToPngDataUrl(svgEl: SVGElement, scale = 3): Promise<string> {
  const clonedSvg = svgEl.cloneNode(true) as SVGElement;
  const containers = [clonedSvg].concat(
    Array.prototype.slice.call(clonedSvg.querySelectorAll("g")) as Element[]
  );
  for (let i = 0; i < containers.length; i++) {
    const el = containers[i] as SVGElement;
    el.setAttribute("font-family", FORCED_FONT);
    const style = el.getAttribute("style");
    if (style && /font-family\s*:/i.test(style)) {
      el.setAttribute("style", style.replace(/font-family\s*:\s*[^;]+;?/gi, ""));
    }
  }
  const texts = clonedSvg.querySelectorAll("text");
  for (let i = 0; i < texts.length; i++) {
    texts[i].setAttribute("font-family", FORCED_FONT);
  }
  if (!clonedSvg.getAttribute("xmlns")) {
    clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("svg load fail"));
    img.src = url;
  });
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/png");
}
