#!/usr/bin/env node
/**
 * 扫 content/styles/* /theme.css, 生成 dist/doocs/inkflow-themes.js
 * 产物形态：window.__INKFLOW_THEMES__ = { "tech": "<css>", ... };
 * 目录里没有 theme.css 的子目录（如只放 style-profile.md 的 default/）会跳过。
 *
 * 被 serve.mjs 启动时调用；也可独立运行：node framework/tools/typeset/build-themes.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..');
const SRC = join(ROOT, 'content', 'styles');
const OUT = join(__dirname, 'dist', 'doocs', 'inkflow-themes.js');

function scan() {
  if (!existsSync(SRC)) return {};
  const themes = {};
  for (const slug of readdirSync(SRC)) {
    const dir = join(SRC, slug);
    if (!statSync(dir).isDirectory()) continue;
    const css = join(dir, 'theme.css');
    if (!existsSync(css)) continue;
    themes[slug] = readFileSync(css, 'utf8');
  }
  return themes;
}

export function build() {
  const themes = scan();
  mkdirSync(dirname(OUT), { recursive: true });
  const payload = 'window.__INKFLOW_THEMES__ = ' + JSON.stringify(themes) + ';\n';
  writeFileSync(OUT, payload, 'utf8');
  return themes;
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('build-themes.mjs');
if (isMain) {
  const themes = build();
  const keys = Object.keys(themes);
  console.log('[inkflow] themes:', keys.length ? keys.join(', ') : '(none)');
}
