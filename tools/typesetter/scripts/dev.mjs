#!/usr/bin/env node
/**
 * dev.mjs — InkFlow × doocs/md 一键启动
 * ============================================================
 * 自动完成：
 *   1. 校验 Node 版本（≥ 22.16，upstream 要求）
 *   2. 校验 pnpm 是否安装
 *   3. 初始化 git submodule（若 upstream/ 为空）
 *   4. 注入 4 栏目 overlay（apply-overlay）
 *   5. 在 upstream 跑 pnpm install（首次或 lockfile 变了才跑）
 *   6. 启动 pnpm start（即 pnpm web dev → vite）
 *
 * 跨平台：Linux / macOS / Windows（cmd & PowerShell 均可）
 *
 * Usage:
 *   node tools/typesetter/scripts/dev.mjs
 *   node tools/typesetter/scripts/dev.mjs --reinstall  # 强制重装
 *   node tools/typesetter/scripts/dev.mjs --no-overlay # 跳过 overlay 注入
 *
 * 依赖：node >= 18（脚本本身），git，pnpm
 * ============================================================
 */
import { spawn } from 'node:child_process'
import { access, stat, readFile, writeFile, mkdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { createHash } from 'node:crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TYPESETTER_DIR = resolve(__dirname, '..')
const REPO_ROOT = resolve(TYPESETTER_DIR, '../..')
const UPSTREAM_DIR = join(TYPESETTER_DIR, 'upstream')
const APPLY_OVERLAY = join(__dirname, 'apply-overlay.mjs')
const STATE_DIR = join(TYPESETTER_DIR, '.dev-state')
const LOCKFILE = join(UPSTREAM_DIR, 'pnpm-lock.yaml')
const LOCKFILE_HASH = join(STATE_DIR, 'lockfile.sha256')

const args = new Set(process.argv.slice(2))
const REINSTALL = args.has('--reinstall')
const NO_OVERLAY = args.has('--no-overlay')
const IS_WINDOWS = process.platform === 'win32'

// ---------- 工具 ----------
async function exists(p) {
  try { await access(p, constants.F_OK); return true } catch { return false }
}

function log(msg) { console.log(msg) }
function step(n, total, msg) { console.log(`\n[${n}/${total}] ${msg}`) }
function ok(msg) { console.log(`  ✓ ${msg}`) }
function info(msg) { console.log(`  · ${msg}`) }
function fail(msg) { console.error(`\n✗ ${msg}\n`); process.exit(1) }

function run(cmd, args, opts = {}) {
  return new Promise((resolveFn, rejectFn) => {
    const child = spawn(cmd, args, {
      stdio: opts.captureOutput ? ['inherit', 'pipe', 'pipe'] : 'inherit',
      shell: IS_WINDOWS,
      ...opts,
    })
    let out = ''
    let err = ''
    if (opts.captureOutput) {
      child.stdout?.on('data', (d) => { out += d })
      child.stderr?.on('data', (d) => { err += d })
    }
    child.on('error', rejectFn)
    child.on('exit', (code) => {
      if (code === 0) resolveFn({ stdout: out, stderr: err })
      else rejectFn(new Error(`${cmd} ${args.join(' ')} exited with ${code}\n${err}`))
    })
  })
}

async function which(cmd) {
  try {
    const probe = IS_WINDOWS ? 'where' : 'which'
    const { stdout } = await run(probe, [cmd], { captureOutput: true })
    return stdout.trim().split(/\r?\n/)[0] || null
  } catch { return null }
}

async function fileSha256(p) {
  const buf = await readFile(p)
  return createHash('sha256').update(buf).digest('hex')
}

// ---------- 步骤 ----------
async function checkNode() {
  const m = process.version.match(/^v(\d+)\.(\d+)/)
  if (!m) fail(`无法识别 Node 版本：${process.version}`)
  const major = +m[1], minor = +m[2]
  if (major < 22 || (major === 22 && minor < 16)) {
    fail(
      `Node 版本过低：${process.version}\n` +
      `  upstream (doocs/md) 要求 Node ≥ 22.16.0\n` +
      `  推荐用 nvm/fnm/volta 切到 22.16+`,
    )
  }
  ok(`Node ${process.version} OK`)
}

async function checkPnpm() {
  const pnpmPath = await which('pnpm')
  if (!pnpmPath) {
    fail(
      `未找到 pnpm。安装方式之一：\n` +
      `  npm i -g pnpm\n` +
      `  corepack enable && corepack prepare pnpm@latest --activate`,
    )
  }
  try {
    const { stdout } = await run('pnpm', ['--version'], { captureOutput: true })
    ok(`pnpm ${stdout.trim()} (${pnpmPath})`)
  } catch {
    ok(`pnpm 已安装 (${pnpmPath})`)
  }
}

async function ensureSubmodule() {
  const upstreamMarker = join(UPSTREAM_DIR, 'package.json')
  if (await exists(upstreamMarker)) {
    ok('upstream submodule 已就绪')
    return
  }
  info('upstream 为空，初始化 submodule…')
  await run('git', ['submodule', 'update', '--init', '--recursive'], {
    cwd: REPO_ROOT,
  })
  if (!(await exists(upstreamMarker))) {
    fail('git submodule update 完成但 upstream/package.json 仍不存在')
  }
  ok('submodule 初始化完成')
}

async function applyOverlay() {
  if (NO_OVERLAY) { info('跳过 overlay 注入（--no-overlay）'); return }
  await run(process.execPath, [APPLY_OVERLAY])
}

async function pnpmInstallIfNeeded() {
  if (!(await exists(LOCKFILE))) {
    fail(`upstream 缺少 pnpm-lock.yaml：${LOCKFILE}`)
  }
  await mkdir(STATE_DIR, { recursive: true })
  const currentHash = await fileSha256(LOCKFILE)
  const recordedHash = (await exists(LOCKFILE_HASH))
    ? (await readFile(LOCKFILE_HASH, 'utf8')).trim()
    : ''
  const nodeModules = join(UPSTREAM_DIR, 'node_modules')

  const needInstall = REINSTALL ||
    !(await exists(nodeModules)) ||
    currentHash !== recordedHash

  if (!needInstall) {
    ok('node_modules 已是最新（lockfile 哈希匹配，跳过 pnpm install）')
    return
  }

  if (REINSTALL) info('--reinstall 强制重装')
  else if (!(await exists(nodeModules))) info('首次安装依赖')
  else info('lockfile 变了，重新安装依赖')

  await run('pnpm', ['install'], { cwd: UPSTREAM_DIR })
  await writeFile(LOCKFILE_HASH, currentHash, 'utf8')
  ok('pnpm install 完成')
}

async function startDev() {
  log('\n→ 启动 upstream dev server (pnpm start → pnpm web dev → vite)')
  log('  浏览器访问 http://127.0.0.1:5173')
  log('  顶栏主题下拉：学术前沿 / 行业趋势 / 技术专题 / 人物故事')
  log('  Ctrl+C 退出\n')
  const child = spawn('pnpm', ['start'], {
    cwd: UPSTREAM_DIR,
    stdio: 'inherit',
    shell: IS_WINDOWS,
  })
  child.on('exit', (code) => process.exit(code ?? 0))
  process.on('SIGINT', () => child.kill('SIGINT'))
  process.on('SIGTERM', () => child.kill('SIGTERM'))
}

// ---------- main ----------
;(async () => {
  console.log('═══ InkFlow × doocs/md 一键启动 ═══')
  step(1, 5, '校验 Node 版本')
  await checkNode()
  step(2, 5, '校验 pnpm')
  await checkPnpm()
  step(3, 5, '确保 submodule 就绪')
  await ensureSubmodule()
  step(4, 5, '注入 InkFlow overlay')
  await applyOverlay()
  step(5, 5, 'pnpm install（按需）')
  await pnpmInstallIfNeeded()
  await startDev()
})().catch((err) => {
  console.error('\n✗ 启动失败：', err.message)
  process.exit(1)
})
