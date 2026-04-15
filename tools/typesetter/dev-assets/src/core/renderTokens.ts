import type { ArticleMeta } from "./types";
import type { Theme } from "../theme/themes";
import type { TypographySpec } from "../theme/themes";
import type { MdToken } from "./types";
import { escapeHtml } from "./escapeHtml";
import { highlightCode } from "./highlightCode";
import { inlineFormat } from "./inlineFormat";
import { mergeElementConfig, type ElementConfig } from "../config/elements";

export interface RenderOptions {
  showDevHints?: boolean;
  codeHighlight?: boolean;
  imageBorderRadius?: number;
  imageShadow?: boolean;
  elementConfig?: Partial<ElementConfig>;
}

function getPathValue(input: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = input;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function applyTemplate(input: string, ctx: Record<string, unknown>): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_m, key) => {
    const v = getPathValue(ctx, key);
    if (v === undefined || v === null) return "";
    if (typeof v === "string" || typeof v === "number") return String(v);
    return "";
  });
}

export function renderTokens(
  tokens: MdToken[],
  theme: Theme,
  spec: TypographySpec,
  isDark: boolean,
  meta: ArticleMeta,
  options?: RenderOptions
) {
  const showDevHints = options && options.showDevHints;
  const elementConfig = mergeElementConfig(options?.elementConfig);
  const nowYear = new Date().getFullYear();
  const templateContext: Record<string, unknown> = {
    brand: {
      name: elementConfig.brandName,
      qrcodeLabel: elementConfig.qrLabel,
    },
    footer: {
      contactText: elementConfig.footerContactText,
    },
    year: nowYear,
    ...meta,
  };
  const resolvedMeta: ArticleMeta = {};
  Object.entries(meta || {}).forEach(([k, v]) => {
    if (typeof v === "string") {
      resolvedMeta[k] = applyTemplate(v, templateContext);
    } else if (Array.isArray(v)) {
      resolvedMeta[k] = v.map((item) => applyTemplate(item, templateContext));
    } else {
      resolvedMeta[k] = v;
    }
  });
  const resolvedTokens: MdToken[] = tokens.map((tok) => {
    if (tok.type === "heading" || tok.type === "paragraph" || tok.type === "blockquote" || tok.type === "svg") {
      return { ...tok, content: applyTemplate(tok.content, templateContext) };
    }
    if (tok.type === "ul" || tok.type === "ol") {
      return { ...tok, items: tok.items.map((item) => applyTemplate(item, templateContext)) };
    }
    if (tok.type === "code") {
      return { ...tok, content: applyTemplate(tok.content, templateContext) };
    }
    if (tok.type === "table") {
      return {
        ...tok,
        headers: tok.headers.map((h) => applyTemplate(h, templateContext)),
        rows: tok.rows.map((r) => r.map((cell) => applyTemplate(cell, templateContext))),
      };
    }
    if (tok.type === "image") {
      return {
        ...tok,
        alt: applyTemplate(tok.alt, templateContext),
        src: applyTemplate(tok.src, templateContext),
      };
    }
    if (tok.type === "custom") {
      return { ...tok, content: applyTemplate(tok.content, templateContext) };
    }
    return tok;
  });
  const c = isDark ? theme.dark : theme.colors;
  const lc = theme.colors; // always-light colors for reference
  const bgColor = isDark ? c.bg : "#fff";
  const parts: string[] = [];
  let isFirstH1 = true;

  const storyLH = theme.id === "story" ? 2.0 : spec.lineHeight;
  const pStyle = `font-size:${spec.fontSize}px;line-height:${storyLH};color:${c.text};letter-spacing:${spec.letterSpacing}px;text-align:justify;margin:0 0 ${Math.round(spec.fontSize * 1.1)}px;`;

  for (let ti = 0; ti < resolvedTokens.length; ti++) {
    const tok = resolvedTokens[ti];
    switch (tok.type) {
      case "heading": {
        if (tok.level === 1) {
          // ===== P0: HEADER AREA — per-theme column identity =====
          if (isFirstH1) {
            isFirstH1 = false;
            if (theme.id === "academic") {
              const acIssue = resolvedMeta && resolvedMeta.issue ? `VOL.${String(resolvedMeta.issue).padStart(3, "0")}` : "";
              parts.push(`<div style="display:flex;align-items:center;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid ${c.border};"><div style="width:4px;height:28px;background:${c.primary};border-radius:2px;"></div><span style="font-size:12px;color:${c.primary};letter-spacing:4px;font-weight:500;margin-left:10px;">${theme.name}</span>${acIssue ? `<span style="font-size:10px;color:${c.textTer || c.textSec};margin-left:auto;font-family:monospace;">${acIssue}</span>` : ""}</div>`);
              parts.push(`<h1 style="font-size:22px;font-weight:700;line-height:1.5;color:${c.text};margin:0 0 16px;padding:0;">${inlineFormat(tok.content, theme, isDark)}</h1>`);
              // Check if next token is a blockquote (used as abstract)
              if (ti + 1 < resolvedTokens.length && resolvedTokens[ti + 1].type === "blockquote") {
                ti++;
                const absTok = resolvedTokens[ti];
                if (absTok.type === "blockquote") {
                  parts.push(
                    `<p style="font-size:13px;color:${c.textSec};line-height:1.8;margin:0 0 16px;padding-left:12px;border-left:2px solid ${c.accent};">${inlineFormat(absTok.content, theme, isDark)}</p>`
                  );
                }
              }
            } else if (theme.id === "industry") {
              const indDate = resolvedMeta && resolvedMeta.date ? resolvedMeta.date : "";
              parts.push(`<div style="display:flex;align-items:center;margin-bottom:16px;"><div style="background:${c.primary};color:#fff;font-size:11px;padding:4px 12px;border-radius:2px;font-weight:600;letter-spacing:2px;">${theme.name}</div><div style="height:1px;flex:1;background:${c.border};margin-left:8px;"></div>${indDate ? `<span style="font-size:10px;color:${c.textTer || c.textSec};margin-left:8px;">${indDate}</span>` : ""}</div>`);
              parts.push(`<h1 style="font-size:20px;font-weight:700;line-height:1.5;color:${c.text};margin:0 0 12px;padding:0;">${inlineFormat(tok.content, theme, isDark)}</h1>`);
              // Inject tag pills from frontmatter
              const indTags = resolvedMeta && resolvedMeta.tags ? (Array.isArray(resolvedMeta.tags) ? resolvedMeta.tags : [resolvedMeta.tags]) : [];
              if (indTags.length > 0) {
                const pillsHtml = indTags.map(function(t) { return `<span style="font-size:11px;padding:2px 10px;background:${isDark ? c.surface : lc.bg};color:${c.primary};border-radius:2px;margin:0 6px 6px 0;">${t}</span>`; }).join("");
                parts.push(`<div style="display:flex;flex-wrap:wrap;margin-bottom:16px;">${pillsHtml}</div>`);
              }
            } else if (theme.id === "tech") {
              const metaTags = resolvedMeta && resolvedMeta.tags ? (Array.isArray(resolvedMeta.tags) ? resolvedMeta.tags : [resolvedMeta.tags]).map(function(t) { return "#" + t; }).join(" ") : "";
              parts.push(`<div style="display:flex;align-items:center;margin-bottom:16px;"><span style="font-family:Consolas,'Courier New','Liberation Mono',monospace;font-size:12px;color:${c.primary};font-weight:600;">// ${theme.name}</span>${metaTags ? `<span style="font-size:10px;color:${c.textTer || c.textSec};font-family:Consolas,'Courier New','Liberation Mono',monospace;margin-left:8px;">${metaTags}</span>` : ""}</div>`);
              parts.push(`<h1 style="font-size:20px;font-weight:700;line-height:1.5;color:${c.text};margin:0 0 12px;padding:0;">${inlineFormat(tok.content, theme, isDark)}</h1>`);
              const metaParts: string[] = [];
              if (resolvedMeta && resolvedMeta.read_time) metaParts.push(`<strong style="color:${c.text};">${resolvedMeta.read_time}</strong>`);
              if (resolvedMeta && resolvedMeta.difficulty) metaParts.push(`难度 ${resolvedMeta.difficulty}`);
              if (resolvedMeta && resolvedMeta.prerequisites) metaParts.push(`前置：${resolvedMeta.prerequisites}`);
              if (metaParts.length > 0) {
                parts.push(`<div style="background:${isDark ? c.surface : lc.bg};border-left:3px solid ${c.primary};padding:10px 14px;font-size:12px;color:${c.textSec};line-height:1.7;margin-bottom:16px;">${metaParts.join(" · ")}</div>`);
              }
            } else {
              // story
              parts.push(`<div style="font-size:11px;color:${c.accent};letter-spacing:6px;margin-bottom:20px;font-weight:500;">${theme.name}</div>`);
              parts.push(`<h1 style="font-size:24px;font-weight:400;line-height:1.7;color:${c.text};margin:0 0 20px;padding:0;">${inlineFormat(tok.content, theme, isDark)}</h1>`);
              // Check if next token is an italic paragraph (subtitle)
              if (
                ti + 1 < tokens.length &&
                resolvedTokens[ti + 1].type === "paragraph" &&
                resolvedTokens[ti + 1].content.startsWith("*") &&
                resolvedTokens[ti + 1].content.endsWith("*")
              ) {
                ti++;
                const subTok = resolvedTokens[ti];
                if (subTok.type === "paragraph") {
                  const subtitleText = subTok.content.slice(1, -1);
                  parts.push(
                    `<p style="font-size:14px;color:${c.textSec};line-height:2;margin:0 0 16px;font-style:italic;">${inlineFormat(subtitleText, theme, isDark)}</p>`
                  );
                }
              }
            }
          } else {
            parts.push(`<h1 style="font-size:22px;font-weight:700;line-height:1.5;color:${c.text};margin:0 0 16px;padding:0;">${inlineFormat(tok.content, theme, isDark)}</h1>`);
          }
        } else if (tok.level === 2) {
          if (theme.id === "academic") {
            parts.push(`<h2 style="display:inline-block;font-size:18px;font-weight:700;color:${c.text};margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid ${c.primary};">${inlineFormat(tok.content, theme, isDark)}</h2>`);
          } else if (theme.id === "industry") {
            parts.push(`<h2 style="display:inline-block;font-size:17px;font-weight:700;color:#fff;margin:28px 0 12px;padding:8px 16px;border-radius:2px;background:${c.primary};">${inlineFormat(tok.content, theme, isDark)}</h2>`);
          } else if (theme.id === "tech") {
            parts.push(`<h2 style="font-size:17px;font-weight:700;color:${c.text};margin:28px 0 12px;font-family:Consolas,'Courier New','Liberation Mono',monospace;border-left:3px solid ${c.primary};padding-left:12px;">${inlineFormat(tok.content, theme, isDark)}</h2>`);
          } else {
            // story: centered + decorative divider below
            // NOTE: block-level `text-align:center` survives WeChat paste (flex doesn't),
            // so we use inline-block + vertical-align:middle instead of flex justify-center.
            parts.push(`<h2 style="font-size:20px;font-weight:400;color:${c.text};margin:28px 0 0;text-align:center;">${inlineFormat(tok.content, theme, isDark)}</h2><p style="text-align:center;margin:8px 0 12px;line-height:0;"><span style="display:inline-block;width:20px;height:1.5px;background:${c.border};vertical-align:middle;"></span><span style="display:inline-block;width:4px;height:4px;background:${c.accent};border-radius:50%;margin:0 6px;vertical-align:middle;"></span><span style="display:inline-block;width:20px;height:1.5px;background:${c.border};vertical-align:middle;"></span></p>`);
          }
        } else {
          if (theme.id === "tech") {
            parts.push(`<h3 style="font-size:14px;font-weight:600;color:${c.textSec};margin:20px 0 10px;font-family:Consolas,'Courier New','Liberation Mono',monospace;display:flex;align-items:center;"><span style="display:inline-block;width:6px;height:6px;background:${c.accent};border-radius:50%;margin-right:8px;flex-shrink:0;"></span>${inlineFormat(tok.content, theme, isDark)}</h3>`);
          } else if (theme.id === "academic") {
            parts.push(`<h3 style="font-size:15px;font-weight:600;color:${c.primary};margin:20px 0 10px;padding-left:12px;border-left:3px solid ${c.accent};">${inlineFormat(tok.content, theme, isDark)}</h3>`);
          } else if (theme.id === "industry") {
            parts.push(`<h3 style="font-size:15px;font-weight:600;color:${c.primary};margin:20px 0 10px;display:flex;align-items:center;"><span style="display:inline-block;width:6px;height:6px;background:${c.accent};border-radius:50%;margin-right:8px;"></span>${inlineFormat(tok.content, theme, isDark)}</h3>`);
          } else {
            // story: italic centered
            parts.push(`<h3 style="font-size:15px;font-weight:400;color:${c.primary};margin:20px 0 10px;font-style:italic;text-align:center;">${inlineFormat(tok.content, theme, isDark)}</h3>`);
          }
        }
        break;
      }
      case "paragraph":
        parts.push(`<p style="${pStyle}">${inlineFormat(tok.content, theme, isDark)}</p>`);
        break;
      case "blockquote": {
        const bqBg = isDark ? c.surface : lc.bg;
        const content = tok.content;
        // Story: detect quote + attribution pattern (line ending with ——)
        if (theme.id === "story") {
          const lines = content.split("\n");
          const attrLine = lines.find(l => l.includes("——"));
          if (attrLine) {
            const quoteText = lines.filter(l => !l.includes("——")).join(" ");
            parts.push(`<blockquote style="margin:0 0 16px;padding:20px 24px;text-align:center;"><div style="font-size:28px;color:${c.border};line-height:1;margin-bottom:8px;">"</div><p style="font-size:16px;color:${c.text};line-height:2;margin:0;font-style:italic;">${inlineFormat(quoteText, theme, isDark)}</p><div style="margin-top:12px;font-size:12px;color:${c.textSec};">${inlineFormat(attrLine, theme, isDark)}</div></blockquote>`);
          } else {
            parts.push(`<blockquote style="margin:0 0 16px;padding:20px 24px;text-align:center;"><p style="font-size:16px;color:${c.text};line-height:2;margin:0;font-style:italic;">${inlineFormat(content, theme, isDark)}</p></blockquote>`);
          }
        } else if (theme.id === "tech" && (content.includes("💡") || content.includes("提示"))) {
          // Tech: tip block with badge
          const tipText = content.replace(/^💡\s*提示[：:]\s*/, "").replace(/^💡\s*/, "");
          parts.push(`<blockquote style="margin:0 0 16px;padding:12px 16px;background:${bqBg};border-left:3px solid ${c.primary};border-radius:0 2px 2px 0;"><p style="font-size:13px;color:${c.textSec};line-height:1.7;margin:0;"><span style="font-family:Consolas,'Courier New','Liberation Mono',monospace;font-size:12px;color:${c.primary};font-weight:600;">提示</span>&nbsp; ${inlineFormat(tipText, theme, isDark)}</p></blockquote>`);
        } else {
          const bqBorder = theme.id === "industry" ? c.accent : c.primary;
          parts.push(`<blockquote style="margin:0 0 16px;padding:14px 18px;background:${bqBg};border-left:3px solid ${bqBorder};border-radius:0 2px 2px 0;"><p style="font-size:13px;color:${c.textSec};line-height:1.8;margin:0;text-align:justify;">${inlineFormat(content, theme, isDark)}</p></blockquote>`);
        }
        break;
      }
      case "ul": {
        const items = tok.items.map((item, idx) => {
          if (theme.id === "story") {
            // Hollow circle with border
            return `<div style="display:flex;margin-bottom:14px;align-items:flex-start;"><span style="width:8px;height:8px;border:1.5px solid ${c.accent};border-radius:50%;flex-shrink:0;margin-top:8px;"></span><span style="font-size:${spec.fontSize}px;line-height:1.8;color:${c.text};text-align:justify;margin-left:10px;">${inlineFormat(item, theme, isDark)}</span></div>`;
          } else if (theme.id === "industry") {
            const itemBg = idx % 2 === 0 ? `background:${isDark ? c.surface : lc.bg};` : "";
            return `<div style="display:flex;margin-bottom:8px;${itemBg}border-radius:2px;padding:6px 12px;align-items:flex-start;"><span style="color:${c.accent};flex-shrink:0;font-weight:700;">→</span><span style="font-size:${spec.fontSize}px;line-height:1.8;color:${c.text};text-align:justify;margin-left:10px;">${inlineFormat(item, theme, isDark)}</span></div>`;
          } else if (theme.id === "academic") {
            return `<div style="display:flex;margin-bottom:8px;align-items:flex-start;"><span style="color:${c.primary};flex-shrink:0;font-size:8px;margin-top:7px;">■</span><span style="font-size:${spec.fontSize}px;line-height:1.8;color:${c.text};text-align:justify;margin-left:10px;">${inlineFormat(item, theme, isDark)}</span></div>`;
          } else {
            // tech
            return `<div style="display:flex;margin-bottom:8px;align-items:flex-start;"><span style="color:${c.primary};flex-shrink:0;font-size:13px;">▸</span><span style="font-size:${spec.fontSize}px;line-height:1.8;color:${c.text};text-align:justify;margin-left:10px;">${inlineFormat(item, theme, isDark)}</span></div>`;
          }
        }).join("");
        parts.push(`<div style="margin:0 0 16px;">${items}</div>`);
        break;
      }
      case "ol": {
        const items = tok.items.map((item, idx) => {
          if (theme.id === "tech") {
            return `<div style="display:flex;margin-bottom:10px;align-items:flex-start;"><span style="font-family:Consolas,'Courier New','Liberation Mono',monospace;font-size:11px;color:#fff;background:${c.primary};border-radius:2px;padding:2px 7px;flex-shrink:0;font-weight:600;">${idx + 1}</span><span style="font-size:${spec.fontSize}px;line-height:1.8;color:${c.text};text-align:justify;margin-left:12px;">${inlineFormat(item, theme, isDark)}</span></div>`;
          }
          return `<div style="display:flex;margin-bottom:8px;align-items:flex-start;"><span style="color:${c.primary};font-weight:600;flex-shrink:0;font-size:14px;">${idx + 1}.</span><span style="font-size:${spec.fontSize}px;line-height:1.8;color:${c.text};text-align:justify;margin-left:10px;">${inlineFormat(item, theme, isDark)}</span></div>`;
        }).join("");
        parts.push(`<div style="margin:0 0 16px;">${items}</div>`);
        break;
      }
      case "hr": {
        const dividerStyle = elementConfig.divider.style;
        if (dividerStyle === "line") {
          parts.push(`<div style="height:1px;background:${c.border};margin:16px 0;"></div>`);
        } else if (dividerStyle === "dot") {
          parts.push(`<div style="text-align:center;margin:12px 0 16px;line-height:1;color:${c.border};font-size:14px;"><span style="margin:0 6px;">·</span><span style="margin:0 6px;">·</span><span style="margin:0 6px;">·</span></div>`);
        } else if (dividerStyle === "text") {
          parts.push(`<div style="text-align:center;margin:12px 0 16px;font-size:12px;color:${c.textSec};">${elementConfig.divider.text}</div>`);
        } else if (theme.id === "academic") {
          // Flex "thin line | dot | thin line" — rebuilt with inline-block +
          // vertical-align:middle so it survives WeChat stripping flex children.
          parts.push(`<p style="text-align:center;padding:12px 0;margin:0 0 16px;line-height:0;"><span style="display:inline-block;width:40%;max-width:120px;height:1px;background:${c.border};vertical-align:middle;"></span><span style="display:inline-block;font-size:10px;color:${c.textTer || c.textSec};font-family:monospace;margin:0 12px;vertical-align:middle;line-height:1;">·</span><span style="display:inline-block;width:40%;max-width:120px;height:1px;background:${c.border};vertical-align:middle;"></span></p>`);
        } else if (theme.id === "industry") {
          parts.push(`<p style="height:2px;background:${c.primary};border-radius:1px;margin:16px 0;opacity:0.5;line-height:0;font-size:0;">&nbsp;</p>`);
        } else if (theme.id === "tech") {
          // Block centering + per-span margin both survive paste; redundancy
          // guarantees at least one path produces centered dots.
          parts.push(`<p style="text-align:center;margin:12px 0 16px;line-height:1;color:${c.border};font-size:14px;"><span style="margin:0 6px;">·</span><span style="margin:0 6px;">·</span><span style="margin:0 6px;">·</span></p>`);
        } else {
          // Default / story: center inline-block "line · line" without flex.
          parts.push(`<p style="text-align:center;padding:16px 0;margin:0 0 16px;line-height:0;"><span style="display:inline-block;width:24px;height:1px;background:${c.border};vertical-align:middle;"></span><span style="display:inline-block;width:5px;height:5px;background:${c.accent};border-radius:50%;margin:0 8px;vertical-align:middle;"></span><span style="display:inline-block;width:24px;height:1px;background:${c.border};vertical-align:middle;"></span></p>`);
        }
        break;
      }
      case "image": {
        const captionAlign = theme.id === "story" ? "right" : "center";
        const captionStyle = theme.id === "story" ? "font-style:italic;" : "";
        const devHint = showDevHints ? `<div style="font-size:9px;color:${c.textTer || c.textSec};text-align:center;margin-top:4px;padding:4px 8px;background:${isDark ? '#2a2a2a' : '#f9f9f9'};border-radius:2px;line-height:1.5;">⚠ 使用透明底PNG，避免深色模式白边</div>` : "";
        const imgRadius = options?.imageBorderRadius ?? 2;
        const imgShadow =
          options?.imageShadow === false ? "" : "box-shadow:0 2px 8px rgba(0,0,0,0.08);";
        parts.push(
          `<div style="margin:0 0 20px;text-align:center;"><img src="${tok.src}" alt="${tok.alt}" style="max-width:100%;border-radius:${imgRadius}px;${imgShadow}" />${tok.alt ? `<p style="font-size:11px;color:${c.textTer || c.textSec};margin:8px 0 0;text-align:${captionAlign};${captionStyle}">${tok.alt}</p>` : ""}${devHint}</div>`
        );
        break;
      }
      case "svg": {
        // Inline SVG — preview and post-copy share the same scaling behavior:
        // wrap the raw SVG in a max-width:100% block so the 640-wide viewBox
        // is already visually shrunk to the 375px preview, matching how the
        // post-copy PNG (scale=3) is shown on mobile. This removes the
        // phantom horizontal scrollbar that only existed in preview before.
        // Add a data-wechat-svg marker so handleCopy knows to replace the SVG
        // with a rasterized PNG while the surrounding block styling stays put.
        const scaledSvg = tok.content
          .replace(/<svg\b/i, '<svg style="max-width:100%;height:auto;display:block;margin:0 auto;" data-wechat-svg="1"');
        parts.push(`<div style="margin:0 0 16px;text-align:center;">${scaledSvg}</div>`);
        break;
      }
      case "code": {
        // Mermaid code blocks — render as diagram placeholder with preview hint
        if (tok.lang === "mermaid") {
          const mermaidId = `mermaid-${Math.random().toString(36).slice(2, 8)}`;
          parts.push(`<div style="margin:0 0 16px;border:1px solid ${c.border};border-radius:2px;overflow:hidden;"><div style="background:${c.primary};padding:6px 14px;"><span style="font-size:11px;color:rgba(255,255,255,0.7);font-family:Consolas,'Courier New','Liberation Mono',monospace;">mermaid</span></div><div id="${mermaidId}" class="mermaid-pending" style="padding:16px;background:${isDark ? '#1a1d23' : '#fff'};min-height:60px;text-align:center;">${escapeHtml(tok.content)}</div><div style="font-size:9px;color:${c.textTer || c.textSec};padding:5px 14px;background:${isDark ? '#222' : '#f5f5f5'};border-top:1px solid ${c.border};">💡 Mermaid 图表 — 导出到微信前需转为 SVG</div></div>`);
          break;
        }
        const headerBg = theme.id === "tech" ? c.primary : "#2c3e50";
        const escaped = escapeHtml(tok.content);
        const highlighted = options?.codeHighlight === false ? escaped : highlightCode(escaped, tok.lang);
        const codeHint = "✅ Markdown兼容：" + "```" + (tok.lang || "code") + " 自动映射此样式";
        parts.push(`<div style="border-radius:2px;overflow:hidden;border:1px solid ${c.border};margin:0 0 16px;"><div style="background:${headerBg};padding:6px 14px;display:flex;justify-content:space-between;"><span style="font-size:11px;color:rgba(255,255,255,0.7);font-family:Consolas,'Courier New','Liberation Mono',monospace;">${tok.lang || "code"}</span><span style="font-size:10px;color:rgba(255,255,255,0.4);">复制</span></div><pre style="background:#1a1d23;padding:14px 16px;margin:0;overflow-x:auto;"><code style="font-family:Consolas,'Courier New','Liberation Mono',monospace;font-size:12px;line-height:1.8;color:#e2e8f0;white-space:pre;">${highlighted}</code></pre><div style="font-size:9px;color:${c.textTer || c.textSec};padding:5px 14px;background:${isDark ? '#222' : '#f5f5f5'};border-top:1px solid ${c.border};">${codeHint}</div></div>`);
        break;
      }
      case "table": {
        const colCount = tok.headers.length;
        const tFontSize = colCount > 3 ? '11px' : '12px';
        const tCellPad = colCount > 3 ? '5px 6px' : '7px 10px';
        const tThPad = colCount > 3 ? '6px 8px' : '8px 10px';
        const thStyle = `padding:${tThPad};font-weight:600;text-align:left;font-size:${tFontSize};color:#fff;background:${c.primary};`;
        const ths = tok.headers.map(h => `<th style="${thStyle}">${h}</th>`).join("");
        const trs = tok.rows.map((row, ri) => {
          const rowBg = ri % 2 === 0 ? bgColor : (isDark ? c.surface : lc.bg);
          const tds = row.map((cell, ci) => {
            const isLast = ci === colCount - 1;
            const isFirst = ci === 0;
            const cellColor = isLast ? c.accent : c.text;
            const cellWeight = isFirst ? 'font-weight:600;white-space:nowrap;' : '';
            const cellFont = !isFirst ? "font-family:Consolas,'Courier New','Liberation Mono',monospace;" : '';
            return `<td style="padding:${tCellPad};border-top:1px solid ${c.border};font-size:${tFontSize};color:${cellColor};${cellWeight}${cellFont}">${inlineFormat(cell, theme, isDark)}</td>`;
          }).join("");
          return `<tr style="background:${rowBg};">${tds}</tr>`;
        }).join("");
        parts.push(`<div style="margin:0 0 16px;border:1px solid ${c.border};border-radius:2px;overflow-x:auto;-webkit-overflow-scrolling:touch;"><table style="width:100%;border-collapse:collapse;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`);
        break;
      }
      case "custom": {
        const blockType = tok.block.toLowerCase();
        const cardBg = isDark ? c.surface : lc.bg;

        // ===== P1: Rich rendering for custom blocks =====
        if (blockType === "media") {
          // Audio player + video card visual
          const contentLines = tok.content ? tok.content.split(/[/／]/).map(s => s.trim()) : [];
          const audioTitle = contentLines[0] || "音频内容";
          const videoTitle = contentLines[1] || "视频内容";
          parts.push(`<div style="margin:0 0 16px;">` +
            // Audio player
            `<div style="border:1px solid ${c.border};border-radius:2px;padding:12px 16px;background:${isDark ? c.surface : '#fff'};margin-bottom:12px;display:flex;align-items:center;"><div style="width:40px;height:40px;border-radius:50%;background:${isDark ? c.surface : lc.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="color:${c.primary};font-size:16px;">▶</span></div><div style="flex:1;margin-left:12px;"><div style="font-size:13px;font-weight:600;color:${c.text};">${audioTitle}</div><div style="font-size:11px;color:${c.textTer || c.textSec};margin-top:4px;display:flex;align-items:center;"><span style="display:inline-block;width:55%;height:3px;background:${isDark ? c.border : lc.bgDeep};border-radius:2px;"></span><span style="margin-left:8px;">03:42</span></div></div></div>` +
            // Video card
            `<div style="border:1px solid ${c.border};border-radius:2px;overflow:hidden;background:#1a1a1a;"><div style="height:80px;display:flex;align-items:center;justify-content:center;"><div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;"><span style="color:#fff;font-size:16px;margin-left:2px;">▶</span></div></div><div style="padding:8px 12px;background:${isDark ? c.surface : '#fff'};border-top:1px solid ${c.border};"><div style="font-size:12px;color:${c.text};">${videoTitle}</div></div></div>` +
            `<div style="font-size:9px;color:${c.textTer || c.textSec};margin-top:6px;text-align:center;">使用 &lt;mpvoice&gt; / &lt;mpvideo&gt; 标签嵌入 · 请在公众号后台插入</div></div>`);
        } else if (blockType === "miniapp") {
          // Miniapp card with icon
          const contentParts = tok.content ? tok.content.split(/[—–-]/).map(s => s.trim()) : [];
          const appName = contentParts[0] || "小程序";
          const appDesc = contentParts[1] || "";
          const icons = { academic: "📊", industry: "🗺", tech: "💻", story: "👤" };
          parts.push(`<div style="margin:0 0 16px;border:1px solid ${c.border};border-radius:2px;padding:14px 16px;background:${isDark ? c.surface : '#fff'};display:flex;align-items:center;"><div style="width:44px;height:44px;border-radius:8px;background:${isDark ? c.surface : lc.bg};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${icons[theme.id] || "📱"}</div><div style="flex:1;margin-left:12px;"><div style="font-size:13px;font-weight:600;color:${c.text};">${appName}</div>${appDesc ? `<div style="font-size:11px;color:${c.textSec};margin-top:2px;">${appDesc}</div>` : ""}</div><div style="font-size:10px;color:${c.textTer || c.textSec};flex-shrink:0;"><div>小程序</div><div style="margin-top:2px;text-align:right;">→</div></div></div>`);
        } else if (blockType === "vote") {
          // Vote UI with options
          const lines = tok.content ? tok.content.split(/[/／]/).map(s => s.trim()) : [];
          // First line may contain the question (before ？ or ?)
          let question = "请投票";
          let opts = lines;
          if (lines.length > 0 && (lines[0].includes("？") || lines[0].includes("?"))) {
            const qParts = lines[0].split(/[？?]/);
            question = qParts[0] + "？";
            const remainOpts = qParts.slice(1).join("").trim();
            opts = remainOpts ? [remainOpts, ...lines.slice(1)] : lines.slice(1);
          } else if (lines.length > 1) {
            question = lines[0];
            opts = lines.slice(1);
          }
          const optHtml = opts.map((opt, oi) => {
            const selected = oi === 0;
            const optBg = selected ? (isDark ? c.surface : lc.bg) : "transparent";
            const borderColor = selected ? c.primary : c.border;
            return `<div style="margin-bottom:8px;padding:8px 14px;border-radius:2px;border:1px solid ${c.border};font-size:13px;color:${c.text};display:flex;align-items:center;background:${optBg};"><span style="width:16px;height:16px;border-radius:50%;border:2px solid ${borderColor};flex-shrink:0;display:flex;align-items:center;justify-content:center;">${selected ? `<span style="width:8px;height:8px;border-radius:50%;background:${c.primary};"></span>` : ""}</span><span style="margin-left:10px;">${opt}</span>${selected ? `<span style="margin-left:auto;font-size:11px;color:${c.primary};font-weight:600;">42%</span>` : ""}</div>`;
          }).join("");
          parts.push(`<div style="margin:0 0 16px;border:1px solid ${c.border};border-radius:2px;padding:16px;background:${isDark ? c.surface : '#fff'};"><div style="font-size:14px;font-weight:600;color:${c.text};margin-bottom:14px;line-height:1.6;">${question}</div>${optHtml}<div style="font-size:10px;color:${c.textTer || c.textSec};margin-top:8px;">微信原生投票 · 328人参与</div></div>`);
        } else if (blockType === "collection") {
          // Collection list with current highlight
          const lines = tok.content ? tok.content.split(/[/／]/).map(s => s.trim()) : [];
          let title = "合集";
          let items = lines;
          if (lines.length > 0 && lines[0].includes("：")) {
            const titleParts = lines[0].split("：");
            title = titleParts[0];
            const rest = titleParts.slice(1).join("：").trim();
            items = rest ? [rest, ...lines.slice(1)] : lines.slice(1);
          }
          const itemsHtml = items.map((item, ii) => {
            const isCurrent = item.includes("本篇");
            const itemBg = isCurrent ? (isDark ? c.surface : lc.bg) : "transparent";
            return `<div style="padding:10px 16px;border-bottom:${ii < items.length - 1 ? `1px solid ${c.border}` : 'none'};display:flex;align-items:center;background:${itemBg};"><span style="font-size:13px;color:${isCurrent ? c.primary : c.text};font-weight:${isCurrent ? 600 : 400};flex:1;">${item}</span>${isCurrent ? `<span style="font-size:10px;color:${c.primary};">当前</span>` : ""}</div>`;
          }).join("");
          parts.push(`<div style="margin:0 0 16px;border:1px solid ${c.border};border-radius:2px;overflow:hidden;background:${isDark ? c.surface : '#fff'};"><div style="background:${isDark ? c.surface : lc.bg};padding:10px 16px;border-bottom:1px solid ${c.border};display:flex;align-items:center;"><span style="font-size:12px;font-weight:600;color:${c.primary};">📚 ${title}</span><span style="font-size:10px;color:${c.textTer || c.textSec};margin-left:auto;">${items.length}篇</span></div>${itemsHtml}</div>`);
        } else if (blockType === "hashtag") {
          // Colored tag group
          let tags = tok.content ? tok.content.split(/\s+/).filter((t) => t.startsWith("#")) : [];
          if (tags.length === 0 && tok.content) {
            tags = tok.content.split(/\s+/);
          }
          const tagsHtml = tags.map(t => `<span style="font-size:13px;color:${c.primary};margin:0 8px 8px 0;">${t}</span>`).join(" ");
          parts.push(`<div style="margin:0 0 16px;"><div style="display:flex;flex-wrap:wrap;">${tagsHtml}</div><div style="font-size:9px;color:${c.textTer || c.textSec};margin-top:8px;padding:4px 8px;background:${isDark ? '#222' : '#f9f9f9'};border-radius:2px;">话题标签可被微信搜索索引，提升分发触达</div></div>`);
        } else if (blockType === "card") {
          // Info card per-theme — parse "key: value" lines or free-form content
          const lines = tok.content ? tok.content.split("\n").map(s => s.trim()).filter(Boolean) : [];
          if (theme.id === "academic") {
            // Academic: data comparison card with title header + metric columns + footnote
            // Format: first line = title, then "label value" pairs separated by /, last line starting with * = footnote
            const title = lines[0] || "数据对比";
            const footnote = lines.find(l => l.startsWith("*"));
            const dataLine = lines.find(l => l.includes("/") && !l.startsWith("*") && l !== title);
            let metricsHtml = "";
            if (dataLine) {
              const metrics = dataLine.split(/[/／]/).map(s => s.trim());
              metricsHtml = metrics.map(m => {
                const parts = m.split(/\s+/);
                const value = parts.pop();
                const label = parts.join(" ");
                const isHighlight = m.includes("本文") || m.includes("本方法") || m.includes("★");
                return `<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:${isHighlight ? c.accent : c.primary};">${value}</div><div style="font-size:11px;color:${c.textSec};margin-top:4px;">${label}</div></div>`;
              }).join("");
            }
            parts.push(`<div style="margin:0 0 16px;border:1px solid ${c.border};border-radius:2px;overflow:hidden;background:${isDark ? c.surface : '#fff'};"><div style="background:${isDark ? c.surface : lc.bg};padding:10px 16px;border-bottom:1px solid ${c.border};"><span style="font-size:12px;font-weight:600;color:${c.primary};">${title}</span></div><div style="padding:16px;">${metricsHtml ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;">${metricsHtml}</div>` : ""}${footnote ? `<div style="font-size:11px;color:${c.textTer || c.textSec};border-top:1px solid ${c.border};padding-top:8px;">${footnote}</div>` : ""}</div></div>`);
          } else if (theme.id === "industry") {
            // Industry: news card with tag + date + title + description
            const tag = lines[0] || "动态";
            const date = lines.find(l => /^\d/.test(l)) || "";
            const title = lines.find((l, i) => i > 0 && !(/^\d/.test(l)) && !l.startsWith("*")) || "";
            const desc = lines.slice(lines.indexOf(title) + 1).filter(l => !(/^\d/.test(l))).join(" ");
            parts.push(`<div style="margin:0 0 16px;border:1px solid ${c.border};border-radius:2px;padding:16px;background:${isDark ? c.surface : lc.bg};"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="font-size:11px;padding:2px 8px;background:${c.primary};color:#fff;border-radius:2px;">${tag}</span>${date ? `<span style="font-size:11px;color:${c.textTer || c.textSec};">${date}</span>` : ""}</div>${title ? `<div style="font-size:15px;font-weight:600;color:${c.text};margin-bottom:8px;line-height:1.5;">${title}</div>` : ""}${desc ? `<div style="font-size:13px;color:${c.textSec};line-height:1.7;text-align:justify;">${desc}</div>` : ""}</div>`);
          } else if (theme.id === "tech") {
            // Tech: spec/requirements card with key-value pairs
            // Format: first line = header, then "key: value" or "key value" pairs
            const header = lines[0] || "环境要求";
            const kvLines = lines.slice(1);
            const kvHtml = kvLines.map(l => {
              const sep = l.includes("：") ? "：" : l.includes(":") ? ":" : " ";
              const idx = l.indexOf(sep);
              const k = idx > 0 ? l.slice(0, idx).trim() : l;
              const v = idx > 0 ? l.slice(idx + sep.length).trim() : "";
              return `<div style="display:flex;font-size:13px;margin-bottom:6px;"><span style="font-family:Consolas,'Courier New','Liberation Mono',monospace;color:${c.primary};font-weight:600;width:70px;flex-shrink:0;">${k}</span><span style="color:${c.text};">${v}</span></div>`;
            }).join("");
            parts.push(`<div style="margin:0 0 16px;border:1px solid ${c.border};border-radius:2px;overflow:hidden;background:${isDark ? c.surface : '#fff'};"><div style="background:${isDark ? c.surface : lc.bg};padding:8px 16px;border-bottom:1px solid ${c.border};"><span style="font-family:Consolas,'Courier New','Liberation Mono',monospace;font-size:12px;color:${c.primary};font-weight:600;">${header}</span></div><div style="padding:12px 16px;">${kvHtml}</div></div>`);
          } else {
            // Story: profile card
            const label = lines[0] || "人物档案";
            const contentLines = lines.slice(1);
            const contentHtml = contentLines.map((l, i) => {
              if (i === 0) return `<strong>${l}</strong>`;
              return `<div style="font-size:13px;color:${c.textSec};${i > 1 ? 'margin-top:4px;' : ''}">${l}</div>`;
            }).join("");
            parts.push(`<div style="margin:0 0 16px;background:${isDark ? c.surface : lc.bg};border-radius:2px;padding:20px 24px;"><div style="font-size:11px;color:${c.accent};letter-spacing:2px;margin-bottom:12px;">${label}</div><div style="font-size:15px;color:${c.text};line-height:2;">${contentHtml}</div></div>`);
          }
        } else if (blockType === "cta") {
          // CTA per-theme — multi-line: line1=title, line2=url, line3=button text
          //
          // Clickability contract (addresses "阅读原文不是链接"):
          //   - If ctaUrl matches WeChat's in-app URL whitelist (mp.weixin.qq.com /
          //     channels.weixin.qq.com / weixin://), wrap visual button in <a href>.
          //   - Otherwise emit pure visual + a "点击左下角『阅读原文』" hint below.
          //     WeChat blocks external-link <a> at render time; the "阅读原文" slot
          //     in the article backend is the only stable way to send readers out.
          const ctaLines = (tok.content || "").split("\n").filter(l => l.trim());
          const ctaTitle = ctaLines[0] || null;
          const ctaUrl = ctaLines[1] || null;
          const ctaBtn = ctaLines[2] || null;
          const WL = [
            /^https:\/\/mp\.weixin\.qq\.com\//i,
            /^https:\/\/channels\.weixin\.qq\.com\//i,
            /^weixin:\/\//i,
          ];
          const isClickable = !!ctaUrl && WL.some(re => re.test(ctaUrl.trim()));
          const btnText = ctaBtn || elementConfig.ctaDefaultText;
          const readmoreHint = `<p style="text-align:center;margin:4px 0 8px;font-size:11px;color:${c.textTer || c.textSec};">点击左下角「阅读原文」跳转</p>`;
          const wrap = (visual: string) => isClickable
            ? `<a href="${ctaUrl}" style="text-decoration:none;color:inherit;">${visual}</a>`
            : visual;

          if (theme.id === "story") {
            const btn = `<span style="display:inline-block;padding:10px 32px;border:1px solid ${c.primary};color:${c.primary};font-size:13px;border-radius:2px;letter-spacing:2px;">${btnText}</span>`;
            parts.push(`<p style="text-align:center;padding:20px 0 4px;margin:0;">${ctaTitle ? `<span style="display:block;font-size:14px;color:${c.textSec};margin-bottom:16px;">${ctaTitle}</span>` : ""}${wrap(btn)}</p>${isClickable ? '' : readmoreHint}`);
          } else if (theme.id === "industry") {
            // Single-column block instead of flex row: title stacked above button.
            const btn = `<span style="display:inline-block;margin-top:12px;padding:8px 22px;background:#fff;color:${c.primary};font-size:12px;border-radius:2px;font-weight:600;">${btnText}</span>`;
            const inner = `<p style="margin:0;font-size:14px;color:#fff;font-weight:600;text-align:center;">${ctaTitle || "订阅更新"}</p>${ctaUrl && !isClickable ? `<p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.75);text-align:center;word-break:break-all;">${ctaUrl}</p>` : ""}<p style="text-align:center;margin:0;">${wrap(btn)}</p>`;
            parts.push(`<section style="background:${c.primary};border-radius:2px;padding:16px 20px;margin:0 0 ${isClickable ? '16' : '4'}px;">${inner}</section>${isClickable ? '' : readmoreHint}`);
          } else if (theme.id === "tech") {
            const btn = `<span style="display:inline-block;padding:6px 18px;background:${c.primary};color:#fff;font-size:12px;border-radius:2px;">⭐ ${btnText}</span>`;
            parts.push(`<section style="border:1px solid ${c.border};border-radius:2px;padding:14px 18px;margin:0 0 ${isClickable ? '16' : '4'}px;">${ctaTitle ? `<p style="font-family:Consolas,'Courier New','Liberation Mono',monospace;font-size:13px;font-weight:600;color:${c.primary};margin:0 0 10px;letter-spacing:0.5px;">${ctaTitle}</p>` : ""}${ctaUrl ? `<p style="background:${isDark ? c.surface : lc.bg};padding:8px 14px;border-radius:2px;font-family:Consolas,'Courier New','Liberation Mono',monospace;font-size:12px;color:${c.primary};word-break:break-all;margin:0 0 12px;">${ctaUrl}</p>` : ""}<p style="text-align:center;margin:0;">${wrap(btn)}</p></section>${isClickable ? '' : readmoreHint}`);
          } else {
            // academic
            const btn = `<span style="display:inline-block;padding:8px 28px;background:${c.primary};color:#fff;font-size:13px;border-radius:2px;">${btnText}</span>`;
            parts.push(`<p style="text-align:center;padding:16px 0 4px;margin:0;">${ctaTitle ? `<span style="display:block;font-size:12px;color:${c.textSec};margin-bottom:12px;">${ctaTitle}</span>` : ""}${wrap(btn)}</p>${isClickable ? '' : readmoreHint}`);
          }
        } else if (blockType === "footer") {
          // Footer — single-column block layout.
          //
          // v1 used display:flex for "QR on right, brand/tagline on left", and an
          // <img onerror="..."> fallback. WeChat paste strips flex children axis
          // rules *and* all on* event handlers, so the v1 footer visually
          // collapsed post-paste (QR on top, text squished).
          //
          // v2 rules:
          //   - Single-column stack, everything center-aligned (text-align:center)
          //   - QR image sized as a block-level img (no object-fit, no onerror)
          //   - If qrImageUrl is not a mmbiz.qpic.cn URL we still render the img
          //     but show a dev-hint advising upload to WeChat asset library
          const brandName = String(resolvedMeta.author || resolvedMeta.brand_name || elementConfig.brandName);
          const tagline = elementConfig.footerTaglines[theme.id] || "";
          const qrImageUrl = String(
            resolvedMeta.qr_image_url || resolvedMeta.qrImageUrl || elementConfig.qrImageUrl || ""
          ).trim();
          const copyrightText = elementConfig.footerCopyrightTemplate
            .replace(/\{year\}/g, String(nowYear))
            .replace(/\{brand\}/g, brandName)
            .replace(/\{contact\}/g, elementConfig.footerContactText);

          const qrIsWechatAsset = /^https:\/\/mmbiz\.qpic\.cn\//i.test(qrImageUrl);
          const qrHint = showDevHints && qrImageUrl && !qrIsWechatAsset
            ? `<p style="font-size:9px;color:${c.textTer || c.textSec};margin:4px 0 0;text-align:center;">⚠ 二维码建议上传到公众号素材库后使用 mmbiz.qpic.cn 链接</p>`
            : "";
          const qrBlock = qrImageUrl
            ? `<p style="text-align:center;margin:0 0 10px;"><img src="${qrImageUrl}" alt="${elementConfig.qrLabel}" style="width:120px;height:120px;border:1px solid ${c.border};border-radius:4px;display:inline-block;" /></p>${qrHint}`
            : `<p style="text-align:center;margin:0 0 10px;"><span style="display:inline-block;width:120px;height:120px;border:1px dashed ${c.border};border-radius:4px;line-height:120px;font-size:11px;color:${c.textTer || c.textSec};">${elementConfig.qrLabel}</span></p>`;

          parts.push(
            `<section style="border-top:1px solid ${c.border};padding-top:20px;margin:24px 0 0;text-align:center;">` +
              qrBlock +
              `<p style="margin:6px 0 2px;font-size:13px;font-weight:600;color:${c.text};">${brandName}</p>` +
              (tagline ? `<p style="margin:2px 0;font-size:11px;color:${c.textSec};">${tagline}</p>` : "") +
              (tok.content ? `<p style="margin:10px 0 0;font-size:11px;color:${c.textSec};line-height:1.7;">${inlineFormat(tok.content, theme, isDark)}</p>` : "") +
              `<p style="margin:10px 0 0;font-size:10px;color:${c.textTer || c.textSec};">${copyrightText}</p>` +
            `</section>`
          );
        } else if (blockType === "readmore") {
          // Readmore per-theme
          const readmoreTexts = {
            tech: { main: "点击下方「阅读原文」查看更多", sub: null },
            academic: { main: "点击「阅读原文」获取补充材料", sub: null },
            industry: { main: "阅读原文查看完整报告", sub: null },
            story: { main: "点击「阅读原文」了解更多", sub: null },
          };
          const rm = readmoreTexts[theme.id] || readmoreTexts.academic;
          const customText = tok.content ? tok.content.trim() : null;
          const mainText = customText || elementConfig.readmoreDefaultText || rm.main;
          parts.push(`<div style="text-align:center;padding:16px 0 8px;border-top:1px solid ${c.border};margin:0 0 16px;"><div style="font-size:13px;color:${c.text};margin-bottom:6px;${theme.id === 'story' ? 'font-style:italic;' : ''}">${theme.id === 'tech' ? `<span style="font-family:monospace;color:${c.primary};">→ </span>` : ''}${mainText}</div>${rm.sub ? `<div style="font-size:11px;color:${theme.id === 'tech' ? (c.textTer || c.textSec) : c.accent};${theme.id === 'tech' ? 'font-family:monospace;' : ''}">${rm.sub}</div>` : `<div style="width:${theme.id === 'story' ? 30 : 40}px;height:${theme.id === 'story' ? 1 : 2}px;background:${theme.id === 'story' ? c.accent : c.primary};margin:6px auto 0;border-radius:1px;"></div>`}</div>`);
        } else if (blockType === "label") {
          // Section label — matches JSX fullpage mode labels
          const labelText = tok.content ? tok.content.trim() : "";
          const isNew = labelText.includes("[N]");
          const cleanLabel = labelText.replace("[N]", "").trim();
          parts.push(`<div style="font-size:9px;color:${isDark ? '#555' : '#bbb'};letter-spacing:2px;margin:20px 0 8px;display:flex;align-items:center;">${cleanLabel}${isNew ? '<span style="font-size:7px;padding:0 3px;background:#e74c3c;color:#fff;border-radius:2px;font-weight:600;line-height:14px;margin-left:4px;">N</span>' : ''}</div>`);
        } else if (blockType === "note") {
          // Note/tip — supports multi-line content with optional title
          const noteLines = (tok.content || "").split("\n").filter(l => l.trim());
          let noteHtml = `<div style="display:flex;align-items:center;margin-bottom:${noteLines.length > 1 ? '8px' : '0'};"><span style="font-family:Consolas,'Courier New','Liberation Mono',monospace;font-size:12px;color:${c.primary};font-weight:600;margin-right:6px;">${elementConfig.noteLabel}</span>`;
          if (noteLines.length <= 1) {
            noteHtml += `<span style="font-size:13px;color:${c.textSec};line-height:1.7;">${noteLines[0] ? inlineFormat(noteLines[0], theme, isDark) : ""}</span></div>`;
          } else {
            // First line as title
            noteHtml += `<span style="font-size:13px;font-weight:600;color:${c.text};line-height:1.7;">${inlineFormat(noteLines[0], theme, isDark)}</span></div>`;
            // Remaining lines as individual paragraphs
            noteHtml += noteLines.slice(1).map(l =>
              `<p style="font-size:13px;color:${c.textSec};line-height:1.7;margin:4px 0 0;">${inlineFormat(l, theme, isDark)}</p>`
            ).join("");
          }
          parts.push(`<blockquote style="margin:0 0 16px;padding:12px 16px;background:${cardBg};border-left:3px solid ${c.primary};border-radius:0 2px 2px 0;">${noteHtml}</blockquote>`);
        } else if (blockType === "references") {
          // References — compact bibliography block.
          // WeChat normalizes outer <div> → <section> and drops background/border-top
          // on paste, then regularizes inner <div style="display:flex"> back into
          // paragraph defaults, which destroys flex-based numbering alignment.
          // To survive WeChat's rewrite: use <section> as the outer shell with a
          // left accent border (survives when background doesn't), and emit each
          // entry as a <p> with a leading colored <strong> number — no flex.
          const refLines = (tok.content || "").split("\n").filter(l => l.trim());
          const refsHtml = refLines.map(l => {
            const m = l.match(/^(\d+)[.、]\s*(.*)/);
            const num = m ? m[1] : "";
            const text = m ? m[2] : l.trim();
            const formatted = inlineFormat(text, theme, isDark);
            const numHtml = num ? `<strong style="color:${c.accent};font-weight:600;margin-right:6px;">[${num}]</strong>` : "";
            return `<p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:${c.textSec};word-break:break-word;">${numHtml}${formatted}</p>`;
          }).join("");
          const titleHtml = `<p style="font-size:11px;color:${c.textTer || c.textSec};letter-spacing:2px;margin:0 0 10px;font-weight:500;">参考文献</p>`;
          parts.push(`<section style="margin:16px 0;padding:14px 16px 14px 14px;border-left:3px solid ${c.accent};border-top:1px solid ${c.border};background:${isDark ? c.surface : lc.bgDeep || lc.bg};">${titleHtml}${refsHtml}</section>`);
        } else if (blockType === "timeline") {
          // Timeline — vertical timeline with date markers
          const tlLines = (tok.content || "").split("\n").filter(l => l.trim());
          const tlHtml = tlLines.map((l, idx) => {
            const m = l.match(/^(\S+)\s+(.*)/);
            const date = m ? m[1] : "";
            const desc = m ? m[2] : l.trim();
            const isLast = idx === tlLines.length - 1;
            return `<div style="display:flex;position:relative;"><div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:16px;"><div style="width:8px;height:8px;border-radius:50%;background:${idx === 0 ? c.accent : c.primary};margin-top:4px;flex-shrink:0;"></div>${!isLast ? `<div style="width:1px;flex:1;background:${c.border};margin:4px 0;"></div>` : ""}</div><div style="padding-bottom:${isLast ? '0' : '12px'};margin-left:12px;"><div style="font-size:12px;font-weight:600;color:${c.primary};font-family:Consolas,'Courier New','Liberation Mono',monospace;">${date}</div><div style="font-size:13px;color:${c.text};line-height:1.6;margin-top:2px;">${inlineFormat(desc, theme, isDark)}</div></div></div>`;
          }).join("");
          parts.push(`<div style="margin:0 0 16px;padding:16px;background:${cardBg};border-radius:2px;">${tlHtml}</div>`);
        } else if (blockType === "steps") {
          // Steps — numbered step indicators
          const stLines = (tok.content || "").split("\n").filter(l => l.trim());
          const stHtml = stLines.map((l, idx) => {
            const m = l.match(/^(?:Step\s*)?(\d+)[.:：]?\s*(.*)/i);
            const num = m ? m[1] : String(idx + 1);
            const text = m ? m[2] : l.trim();
            // Split on first : or ： for title:description
            const sep = text.includes("：") ? "：" : text.includes(":") ? ":" : null;
            const titlePart = sep ? text.slice(0, text.indexOf(sep)).trim() : text;
            const descPart = sep ? text.slice(text.indexOf(sep) + 1).trim() : "";
            return `<div style="display:flex;align-items:flex-start;margin-bottom:${idx < stLines.length - 1 ? '12px' : '0'};"><div style="width:24px;height:24px;border-radius:50%;background:${c.primary};color:#fff;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${num}</div><div style="flex:1;padding-top:2px;margin-left:12px;"><div style="font-size:14px;font-weight:600;color:${c.text};line-height:1.5;">${inlineFormat(titlePart, theme, isDark)}</div>${descPart ? `<div style="font-size:13px;color:${c.textSec};line-height:1.6;margin-top:2px;">${inlineFormat(descPart, theme, isDark)}</div>` : ""}</div></div>`;
          }).join("");
          parts.push(`<div style="margin:0 0 16px;padding:16px;background:${cardBg};border-radius:2px;">${stHtml}</div>`);
        } else {
          // Fallback: generic custom block
          const label = tok.block;
          const hint = elementConfig.fallbackHint;
          parts.push(`<div style="margin:0 0 16px;padding:14px 18px;background:${cardBg};border:1px dashed ${c.border};border-radius:2px;"><div style="font-size:13px;font-weight:600;color:${c.primary};margin-bottom:6px;">${label}</div>${tok.content ? `<div style="font-size:13px;color:${c.text};line-height:1.6;margin-bottom:8px;">${inlineFormat(tok.content, theme, isDark)}</div>` : ""}<div style="font-size:11px;color:${c.textSec};font-style:italic;">${hint}</div></div>`);
        }
        break;
      }
      default: break;
    }
  }
  return parts.join("\n");
}
