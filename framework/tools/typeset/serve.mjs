#!/usr/bin/env node
/**
 * 启动静态文件服务器 + 自动打开浏览器。
 *
 * 为什么必须 localhost 而非 file://：
 *   doocs 用 navigator.clipboard.write(ClipboardItem) 写 text/html MIME 到剪贴板，
 *   规范要求 secure context。file:// 下 isSecureContext===false，富文本会丢失，
 *   粘贴到微信公众号只剩纯文本。127.0.0.1/localhost 被浏览器视为 secure。
 *
 * 路由：
 *   GET /             → launcher 选择器页
 *   GET /launcher/*   → launcher 静态文件
 *   GET /doocs/*      → doocs 构建产物
 *   GET /api/themes   → 栏目主题字典（调试用）
 *   GET /api/articles → 文章字典（调试用）
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { build as buildThemes } from './build-themes.mjs';
import { build as buildArticles } from './build-articles.mjs';
import { preflight } from './preflight.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DOOCS = join(__dirname, 'dist', 'doocs');
const LAUNCHER = join(__dirname, 'launcher');

const HOST = process.env.INKFLOW_TYPESET_HOST || '127.0.0.1';
const PORT = Number(process.env.INKFLOW_TYPESET_PORT || 7788);

if (!existsSync(join(DIST_DOOCS, 'index.html'))) {
  console.error('[inkflow] 未发现 doocs 构建产物');
  console.error('[inkflow] 请先运行：node framework/tools/typeset/setup.mjs');
  process.exit(1);
}

// ── 启动时重建主题/文章数据 ──
const themes = buildThemes();
const articles = buildArticles();
try { preflight({ articles }); } catch (e) { console.warn('[inkflow] preflight 异常:', e.message); }

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

function safeJoin(root, rel) {
  const full = resolve(root, '.' + rel);
  if (!full.startsWith(resolve(root))) return null;
  return full;
}

function serveFile(res, file, req) {
  if (existsSync(file) && statSync(file).isDirectory()) {
    file = join(file, 'index.html');
  }
  if (!existsSync(file)) {
    console.log(`[serve] 404 ${req?.method || 'GET'} ${req?.url || '?'} → ${file}`);
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`not found: ${file}`);
    return;
  }
  const mime = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  console.log(`[serve] 200 ${req?.method || 'GET'} ${req?.url || '?'}`);
  res.writeHead(200, {
    'content-type': mime,
    'cache-control': 'no-store',
  });
  res.end(readFileSync(file));
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === '/api/themes') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(Object.keys(themes).reduce((a, k) => (a[k] = themes[k].length, a), {})));
      return;
    }
    if (pathname === '/api/articles') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      const slim = {};
      for (const k of Object.keys(articles)) {
        slim[k] = { preview: (articles[k] || '').slice(0, 80).replace(/\s+/g, ' ') };
      }
      res.end(JSON.stringify(slim));
      return;
    }

    if (pathname === '/' || pathname === '/launcher' || pathname === '/launcher/') {
      serveFile(res, join(LAUNCHER, 'index.html'), req);
      return;
    }
    // 调试入口：列 dist/doocs 目录内容
    if (pathname === '/debug/ls-doocs') {
      const { readdirSync } = await import('node:fs');
      try {
        const entries = readdirSync(DIST_DOOCS).sort();
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(`DIST_DOOCS = ${DIST_DOOCS}\n\n` + entries.join('\n'));
      } catch (e) {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(String(e));
      }
      return;
    }
    if (pathname.startsWith('/launcher/')) {
      const file = safeJoin(LAUNCHER, pathname.slice('/launcher'.length));
      if (!file) { res.writeHead(403); res.end('forbidden'); return; }
      serveFile(res, file, req);
      return;
    }
    if (pathname.startsWith('/doocs/')) {
      const file = safeJoin(DIST_DOOCS, pathname.slice('/doocs'.length) || '/index.html');
      if (!file) { res.writeHead(403); res.end('forbidden'); return; }
      serveFile(res, file, req);
      return;
    }
    // 兜底：/md/* 是 doocs 官方产物的默认 base 前缀（GH Pages 部署路径）。
    // setup.mjs 已在 index.html 做了 /md/ → ./ 的 rewrite，但运行时动态 import
    // 的 chunk 里可能仍带 /md/ 绝对路径，这里做最终兜底。
    if (pathname.startsWith('/md/')) {
      const file = safeJoin(DIST_DOOCS, pathname.slice('/md'.length));
      if (!file) { res.writeHead(403); res.end('forbidden'); return; }
      serveFile(res, file, req);
      return;
    }
    // 再兜底：未匹配路径直接落到 doocs 根。
    const file = safeJoin(DIST_DOOCS, pathname);
    if (!file) { res.writeHead(403); res.end('forbidden'); return; }
    serveFile(res, file, req);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(String(e));
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[inkflow] 端口 ${PORT} 已被占用。设 INKFLOW_TYPESET_PORT=<port> 环境变量换端口。`);
  } else {
    console.error('[inkflow] 服务异常:', err);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/`;
  console.log(`[inkflow] 排版工具已启动：${url}`);
  console.log(`[inkflow] 栏目：${Object.keys(themes).join(', ') || '(无)'}`);
  console.log(`[inkflow] 文章：${Object.keys(articles).length} 篇`);
  console.log('[inkflow] Ctrl+C 退出；关闭终端窗口也会停止服务');
  openBrowser(url);
});

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      spawn('cmd', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore', shell: false }).unref();
    } else if (platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (e) {
    console.log('[inkflow] 自动打开浏览器失败，请手动访问：' + url);
  }
}
