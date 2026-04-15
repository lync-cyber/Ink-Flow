import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "index.html"), "utf8").replace(/\r\n/g, "\n");

const blocks = [
  [
    "academic",
    "const DEFAULT_MDS = \\{\\s*\\nacademic: `([\\s\\S]*?)`,\\s*\\n\\s*industry:",
  ],
  ["industry", "industry: `([\\s\\S]*?)`,\\s*\\n\\s*tech:"],
  ["tech", "tech: `([\\s\\S]*?)`,\\s*\\n\\s*story:"],
  ["story", "story: `([\\s\\S]*?)`,\\s*\\n\\s*};"],
];
const outDir = path.join(root, "src", "content");
fs.mkdirSync(outDir, { recursive: true });

for (const [key, reStr] of blocks) {
  const re = new RegExp(reStr);
  const m = src.match(re);
  if (!m) throw new Error("no match " + key);
  const rawBody = m[1].replace(/\\`\\`\\`/g, "```");
  fs.writeFileSync(path.join(outDir, `${key}.md`), rawBody, "utf8");
  console.log(key, rawBody.length);
}
