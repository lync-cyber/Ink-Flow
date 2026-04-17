#!/usr/bin/env node
/**
 * 扫 content/articles/* /export/08-wechat-publish.md, 生成 dist/doocs/inkflow-articles.js
 * 产物形态：window.__INKFLOW_ARTICLES__ = { "<slug>": "<md>", ... };
 *
 * 剥 frontmatter：publisher 保留的 YAML frontmatter 是为知乎/掘金准备的；
 * doocs 不理解 frontmatter，会把第二行 `---` 当成 hr、把 YAML 当成空段落，
 * 污染预览与摘要引言布局。这里统一剥掉。
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..');
const SRC = join(ROOT, 'content', 'articles');
const OUT = join(__dirname, 'dist', 'doocs', 'inkflow-articles.js');

// 匹配文件开头的 YAML frontmatter（--- ... ---），保留后续正文
const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

function stripFrontmatter(md) {
  return md.replace(FRONTMATTER_RE, '');
}

function scan() {
  if (!existsSync(SRC)) return {};
  const articles = {};
  for (const slug of readdirSync(SRC)) {
    const dir = join(SRC, slug);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
    const md = join(dir, 'export', '08-wechat-publish.md');
    if (!existsSync(md)) continue;
    articles[slug] = stripFrontmatter(readFileSync(md, 'utf8'));
  }
  return articles;
}

export function build() {
  const articles = scan();
  mkdirSync(dirname(OUT), { recursive: true });
  const payload = 'window.__INKFLOW_ARTICLES__ = ' + JSON.stringify(articles) + ';\n';
  writeFileSync(OUT, payload, 'utf8');
  return articles;
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('build-articles.mjs');
if (isMain) {
  const articles = build();
  console.log('[inkflow] articles:', Object.keys(articles).length, '篇');
}
