import type { MdToken } from "./types";

export function parseMarkdown(md: string): MdToken[] {
  const lines = md.split("\n");
  const tokens: MdToken[] = [];
  let i = 0;
  if (lines[0] && lines[0].trim() === "---") {
    i = 1;
    while (i < lines.length && lines[i].trim() !== "---") i++;
    if (i < lines.length) i++;
  }
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (line.trim().startsWith(":::")) {
      const type = line.trim().slice(3).trim();
      const content: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(":::")) {
        content.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      tokens.push({ type: "custom", block: type, content: content.join("\n").trim() });
      continue;
    }
    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      tokens.push({ type: "code", lang, content: code.join("\n") });
      continue;
    }
    const hm = line.match(/^(#{1,6})\s+(.*)/);
    if (hm) {
      tokens.push({ type: "heading", level: hm[1].length, content: hm[2] });
      i++;
      continue;
    }
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      tokens.push({ type: "hr" });
      i++;
      continue;
    }
    if (line.trimStart().startsWith(">")) {
      const bq: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        bq.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      tokens.push({ type: "blockquote", content: bq.join("\n") });
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /\|[\s-:]+\|/.test(lines[i + 1])) {
      const headers = line.split("|").map((s) => s.trim()).filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map((s) => s.trim()).filter(Boolean));
        i++;
      }
      tokens.push({ type: "table", headers, rows });
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      tokens.push({ type: "ul", items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      tokens.push({ type: "ol", items });
      continue;
    }
    const imgm = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgm) {
      tokens.push({ type: "image", alt: imgm[1], src: imgm[2] });
      i++;
      continue;
    }
    const imgTag = line.match(/^<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (imgTag) {
      const altM = line.match(/alt=["']([^"']*?)["']/i);
      tokens.push({ type: "image", alt: altM ? altM[1] : "", src: imgTag[1] });
      i++;
      continue;
    }
    if (line.trimStart().startsWith("<svg")) {
      const svgLines = [line];
      if (!line.includes("</svg>")) {
        i++;
        while (i < lines.length && !lines[i].includes("</svg>")) {
          svgLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) {
          svgLines.push(lines[i]);
          i++;
        }
      } else {
        i++;
      }
      tokens.push({ type: "svg", content: svgLines.join("\n") });
      continue;
    }
    const para = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].trimStart().startsWith(">") &&
      !lines[i].trimStart().startsWith("```") &&
      !lines[i].trimStart().startsWith(":::") &&
      !/^[-*_]{3,}\s*$/.test(lines[i].trim()) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].match(/^!\[/) &&
      !lines[i].match(/^<img\s/i) &&
      !lines[i].trimStart().startsWith("<svg")
    ) {
      para.push(lines[i]);
      i++;
    }
    tokens.push({ type: "paragraph", content: para.join(" ") });
  }
  return tokens;
}
