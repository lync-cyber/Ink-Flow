#!/usr/bin/env node
/**
 * InkFlow 本地排版工具初始化脚本。
 *
 * 从 Docker Hub 拉 doocs/md:<tag>-assets 镜像，抽 /app/assets 静态产物，
 * rewrite index.html 的 base 路径，注入 3 行 bootstrap script。
 *
 * 依赖：Node ≥ 18、系统 tar。
 */
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pullImageAssets } from './pull-doocs-assets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DOOCS = join(__dirname, 'dist', 'doocs');
const BOOTSTRAP_SRC = join(__dirname, 'bootstrap.js');

const IMAGE = process.env.DOOCS_MD_IMAGE || 'doocs/md';
const TAG = process.env.DOOCS_MD_TAG || '2.1.0-assets';
const INNER = process.env.DOOCS_MD_INNER || '/app/assets';

// doocs GH Pages 部署的 base 前缀（构建产物里 index.html 绝对路径的形式）。
// 我们 rewrite 成 ./，serve.mjs 再加 /md/* 兜底路由，双保险。
const BASE_FROM = '/md/';
const BASE_TO = './';

const MARK_BEGIN = '<!-- InkFlow bootstrap BEGIN -->';
const MARK_END = '<!-- InkFlow bootstrap END -->';

function log(msg) { console.log('[inkflow]', msg); }
function fail(msg) { console.error('[inkflow]', msg); process.exit(1); }

try {
  // ── Step 1-2：拉镜像 + 抽产物 ───────────────────────
  log(`从 Docker Hub 拉取 ${IMAGE}:${TAG}（首次约 30-60 秒，取决于网络）`);
  await pullImageAssets({
    image: IMAGE,
    tag: TAG,
    outDir: DIST_DOOCS,
    innerPath: INNER,
  });

  const htmlPath = join(DIST_DOOCS, 'index.html');
  if (!existsSync(htmlPath)) fail('未在产物里发现 index.html，请检查镜像标签是否正确');

  // ── Step 3：rewrite base 路径 ──────────────────────
  let html = readFileSync(htmlPath, 'utf8');
  if (html.includes(BASE_FROM)) {
    const before = html.length;
    html = html.split(BASE_FROM).join(BASE_TO);
    log(`已 rewrite index.html 内 ${BASE_FROM} → ${BASE_TO}（净变化 ${html.length - before} 字符）`);
  } else {
    log(`index.html 里未发现 ${BASE_FROM} 前缀，跳过 rewrite`);
  }

  // ── Step 4：注入 InkFlow bootstrap ─────────────────
  if (!html.includes(MARK_BEGIN)) {
    if (!html.includes('</head>')) fail('index.html 里找不到 </head>，注入失败');
    const INJECT = [
      MARK_BEGIN,
      '    <script src="./inkflow-themes.js"></script>',
      '    <script src="./inkflow-articles.js"></script>',
      '    <script src="./inkflow-bootstrap.js"></script>',
      '    ' + MARK_END,
    ].join('\n    ');
    html = html.replace('</head>', `    ${INJECT}\n  </head>`);
    log('已注入 3 行 bootstrap <script> 引用');
  } else {
    log('index.html 已注入过 InkFlow bootstrap，跳过');
  }
  writeFileSync(htmlPath, html, 'utf8');

  // ── Step 5：拷 bootstrap + 占位数据文件 ─────────────
  cpSync(BOOTSTRAP_SRC, join(DIST_DOOCS, 'inkflow-bootstrap.js'));
  writeFileSync(join(DIST_DOOCS, 'inkflow-themes.js'), 'window.__INKFLOW_THEMES__ = {};\n');
  writeFileSync(join(DIST_DOOCS, 'inkflow-articles.js'), 'window.__INKFLOW_ARTICLES__ = {};\n');

  log('完成！下一步：双击 framework/tools/typeset.bat / framework/tools/typeset.command');
  log('或直接：node framework/tools/typeset/serve.mjs');
} catch (e) {
  fail(`setup 失败：${e.message}`);
}
