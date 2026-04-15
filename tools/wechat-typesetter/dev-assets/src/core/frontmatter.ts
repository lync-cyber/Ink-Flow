import type { ArticleMeta } from "./types";

export function parseFrontmatter(md: string): ArticleMeta {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const meta: ArticleMeta = {};
  m[1].split("\n").forEach((line) => {
    const kv = line.match(/^([A-Za-z_][\w.-]*):\s*(.*)/);
    if (!kv) return;
    let val: string | string[] = kv[2].trim().replace(/^["']|["']$/g, "");
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
    }
    meta[kv[1]] = val;
  });
  return meta;
}
