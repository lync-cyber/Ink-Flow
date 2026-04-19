#!/usr/bin/env node
/**
 * wx-md 本地静态服务器
 *
 * 服务 app/dist/ 到 http://127.0.0.1:7788
 * 127.0.0.1 被浏览器视为 secure context，Clipboard API 可用（file:// 不行）。
 * 零外部依赖，只用 Node 18+ 自带的 http / fs / url 模块。
 */

import http from 'node:http'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec, spawnSync } from 'node:child_process'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const APP = resolve(HERE, 'app')
const DIST = resolve(APP, 'dist')
const SRC = resolve(APP, 'src')
const HOST = '127.0.0.1'
const PORT = Number(process.env.WX_MD_PORT ?? 7788)

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
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

if (!existsSync(DIST)) {
  console.error(`[wx-md] dist 目录不存在：${DIST}`)
  console.error('[wx-md] 请先运行：cd framework/tools/typeset/app && npm install && npm run build')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 过期产物检测：源码 mtime 比 dist/index.html 新 → 自动重建
//
// 为什么放在 serve.mjs 而不是 launcher.{bat,command}：
//   两个 launcher 脚本首次构建后只看 "dist/index.html 是否存在"，
//   升级框架或 git pull 后源码变了但 dist 存在，会一直跑陈旧产物。
//   过期检测写在 Node 里两端共用，不必维护两份 shell 逻辑。
//
// 开关：环境变量 WX_MD_SKIP_REBUILD=1 可跳过（调试/离线场景用）
// ---------------------------------------------------------------------------
function latestMtime(dir) {
  let max = 0
  const stack = [dir]
  while (stack.length) {
    const cur = stack.pop()
    let stat
    try { stat = statSync(cur) } catch { continue }
    if (stat.isDirectory()) {
      let entries
      try { entries = readdirSync(cur) } catch { continue }
      for (const name of entries) {
        // 跳过 node_modules / dist 自身
        if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue
        stack.push(join(cur, name))
      }
    } else if (stat.isFile()) {
      if (stat.mtimeMs > max) max = stat.mtimeMs
    }
  }
  return max
}

function maybeRebuild() {
  if (process.env.WX_MD_SKIP_REBUILD === '1') return
  const distStamp = resolve(DIST, 'index.html')
  if (!existsSync(distStamp)) return // 首次：launcher 已经构建过，或即将
  const distMtime = statSync(distStamp).mtimeMs
  const srcMtime = Math.max(
    latestMtime(SRC),
    fileMtime(resolve(APP, 'package.json')),
    fileMtime(resolve(APP, 'vite.config.ts')),
    fileMtime(resolve(APP, 'index.html')),
    fileMtime(resolve(APP, 'tsconfig.json')),
  )
  if (srcMtime <= distMtime) return
  console.log('[wx-md] 检测到源码更新，正在重建（npm run build）…')
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const result = spawnSync(npmCmd, ['run', 'build'], {
    cwd: APP,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    console.error('[wx-md] 重建失败。保留现有 dist/ 继续启动；手动修复后重启即可。')
  } else {
    console.log('[wx-md] 重建完成。')
  }
}

function fileMtime(p) {
  try { return statSync(p).mtimeMs } catch { return 0 }
}

maybeRebuild()

function safeResolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0])
  const rel = normalize(clean.replace(/^\/+/, ''))
  const full = resolve(DIST, rel)
  // 防越界：必须仍在 DIST 下
  if (!full.startsWith(DIST)) return null
  return full
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' })
  res.end(body)
}

const server = http.createServer((req, res) => {
  if (!req.url) return send(res, 400, 'bad request')

  let target = safeResolve(req.url === '/' ? '/index.html' : req.url)
  if (!target) return send(res, 403, 'forbidden')

  // 路径是目录则指向 index.html
  if (existsSync(target) && statSync(target).isDirectory()) {
    target = join(target, 'index.html')
  }

  if (!existsSync(target)) {
    // SPA 兜底：未匹配的路由回到 index.html
    target = join(DIST, 'index.html')
    if (!existsSync(target)) return send(res, 404, 'not found')
  }

  const ext = extname(target).toLowerCase()
  const type = MIME[ext] ?? 'application/octet-stream'
  try {
    const buf = readFileSync(target)
    send(res, 200, buf, type)
  } catch (err) {
    send(res, 500, `read failed: ${err.message}`)
  }
})

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/`
  console.log(`[wx-md] 已启动：${url}`)
  console.log('[wx-md] 按 Ctrl+C 停止')
  openBrowser(url)
})

function openBrowser(url) {
  const platform = process.platform
  const cmd =
    platform === 'darwin' ? `open "${url}"`
    : platform === 'win32' ? `start "" "${url}"`
    : `xdg-open "${url}"`
  exec(cmd, (err) => {
    if (err) console.log(`[wx-md] 自动打开浏览器失败，请手动访问：${url}`)
  })
}
