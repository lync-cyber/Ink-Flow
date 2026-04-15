import type { ArticleMeta } from "./types";
import type { MdToken } from "./types";
import { parseFrontmatter } from "./frontmatter";
import { parseMarkdown } from "./parseMarkdown";
import { renderTokens, type RenderOptions } from "./renderTokens";
import type { Theme } from "../theme/themes";
import type { TypographySpec } from "../theme/themes";
import { mergeElementConfig, type ElementConfig } from "../config/elements";

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (i === keys.length - 1) {
      cur[k] = value;
    } else {
      const next = cur[k];
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        cur[k] = {};
      }
      cur = cur[k] as Record<string, unknown>;
    }
  }
}

function extractFrontmatterElementOverrides(meta: ArticleMeta): Partial<ElementConfig> {
  const out: Record<string, unknown> = {};
  const jsonRaw = meta.element_config_json;
  if (typeof jsonRaw === "string" && jsonRaw.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(jsonRaw) as Record<string, unknown>;
      Object.assign(out, parsed);
    } catch {
      // ignore invalid json override
    }
  }

  for (const [k, v] of Object.entries(meta)) {
    if (!k.startsWith("element.")) continue;
    const path = k.slice("element.".length);
    if (!path) continue;
    setByPath(out, path, Array.isArray(v) ? v.join(", ") : v);
  }
  return out as Partial<ElementConfig>;
}

export function parseArticle(md: string): { meta: ArticleMeta; tokens: MdToken[] } {
  return { meta: parseFrontmatter(md), tokens: parseMarkdown(md) };
}

export function buildFragmentHtml(
  md: string,
  theme: Theme,
  spec: TypographySpec,
  isDark: boolean,
  metaOverrides?: ArticleMeta,
  options?: RenderOptions
): string {
  const parsedMeta = parseFrontmatter(md);
  const meta: ArticleMeta = { ...parsedMeta, ...metaOverrides };
  const tokens = parseMarkdown(md);
  const articleElementOverrides = extractFrontmatterElementOverrides(meta);
  const mergedElementConfig = mergeElementConfig({
    ...(options?.elementConfig || {}),
    ...(articleElementOverrides || {}),
    divider: {
      ...(options?.elementConfig?.divider || {}),
      ...(articleElementOverrides?.divider || {}),
    },
    footerTaglines: {
      ...(options?.elementConfig?.footerTaglines || {}),
      ...(articleElementOverrides?.footerTaglines || {}),
    },
  });
  return renderTokens(tokens, theme, spec, isDark, meta, {
    ...(options || {}),
    elementConfig: mergedElementConfig,
  });
}

export function wrapArticleHtml(
  fragment: string,
  theme: Theme,
  spec: TypographySpec,
  isDark: boolean
): string {
  const c = isDark ? theme.dark : theme.colors;
  const bgColor = isDark ? c.bg : "#fff";
  return `<div style="padding:${spec.pageMargin}px;background:${bgColor};max-width:100%;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;">${fragment}</div>`;
}
