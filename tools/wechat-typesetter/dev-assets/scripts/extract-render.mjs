import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "index.html");
const raw = fs.readFileSync(htmlPath, "utf8");
const src = raw.replace(/\r\n/g, "\n");

const start = src.indexOf("function renderTokens(");
const endAnchor = '\n}\n\n// ============================================================\n// DEFAULT MARKDOWN CONTENT';
const end = src.indexOf(endAnchor, start);
if (start < 0 || end < 0 || end <= start) {
  console.error("Could not locate renderTokens bounds", { start, end });
  process.exit(1);
}

let body = src.slice(start, end + 1);

const header = `import type { ArticleMeta } from "./types";
import type { Theme } from "../theme/themes";
import type { TypographySpec } from "../theme/themes";
import type { MdToken } from "./types";
import { escapeHtml } from "./escapeHtml";
import { highlightCode } from "./highlightCode";
import { inlineFormat } from "./inlineFormat";

export interface RenderOptions {
  showDevHints?: boolean;
  codeHighlight?: boolean;
  imageBorderRadius?: number;
  imageShadow?: boolean;
}

`;

body = body.replace(
  /^function renderTokens\(tokens, theme, spec, isDark, meta, options\)/m,
  `export function renderTokens(
  tokens: MdToken[],
  theme: Theme,
  spec: TypographySpec,
  isDark: boolean,
  meta: ArticleMeta,
  options?: RenderOptions
)`
);
body = body.replace(
  /const highlighted = highlightCode\(escaped, tok\.lang\);/,
  "const highlighted = options?.codeHighlight === false ? escaped : highlightCode(escaped, tok.lang);"
);

const outPath = path.join(root, "src", "core", "renderTokens.ts");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, header + body, "utf8");
console.log("Wrote", outPath);
