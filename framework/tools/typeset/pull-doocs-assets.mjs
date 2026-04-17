#!/usr/bin/env node
/**
 * 纯 Node 实现的 Docker Hub Registry V2 客户端，用来抽取 doocs/md:<tag>-assets 镜像
 * 里的预构建 SPA（/app/assets）。**无需本机安装 Docker daemon**。
 *
 * 为什么走这条路：
 *   - doocs/md 的 apps/web 源码 build 会撞 @vue/devtools-kit@8 的 localStorage 顶层访问
 *   - doocs 官方 Docker 镜像 `doocs/md:<ver>-assets` 就是专门给下游抽 SPA 用的单层镜像
 *   - 直接走 Registry HTTP API 拿 layer blob (tar.gz)，用系统 `tar` 解压即可
 *
 * 依赖：
 *   - Node ≥ 18（用内置 fetch / Readable.fromWeb）
 *   - 系统 tar 命令（Windows 10+ / macOS / Linux 原生自带）
 *
 * 使用（独立 CLI）：
 *   node pull-doocs-assets.mjs --tag 2.1.0-assets --out ../dist/doocs
 */
import { createWriteStream, existsSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

// ── tar 定位与兼容 ─────────────────────────────────────
// 动机：Windows 上用户可能装了 Git for Windows，其 GNU tar 在 PATH 里靠前，
// 会把 C:\foo 误解成 "scp host:path" 语法（Cannot connect to C:）。
// 策略：
//   1. Windows 优先用 System32\tar.exe（bsdtar，原生理解 C:\ 路径）
//   2. fallback 到 PATH 的 tar；若检测到 GNU tar，自动加 --force-local
let _tarInfo = null;
function getTarInfo() {
  if (_tarInfo) return _tarInfo;

  const candidates = [];
  if (process.platform === 'win32') {
    const sys32 = 'C:\\Windows\\System32\\tar.exe';
    if (existsSync(sys32)) candidates.push(sys32);
  }
  candidates.push('tar');

  for (const cmd of candidates) {
    const r = spawnSync(cmd, ['--version'], { stdio: 'pipe' });
    if (r.error && r.error.code === 'ENOENT') continue;
    if (r.status !== 0) continue;
    const out = (r.stdout ? r.stdout.toString() : '') + (r.stderr ? r.stderr.toString() : '');
    _tarInfo = {
      cmd,
      isGnu: /GNU tar/i.test(out),
      isBsd: /bsdtar/i.test(out),
      versionLine: out.split('\n')[0].trim(),
    };
    return _tarInfo;
  }
  throw new Error('未找到可用的 tar 命令（Windows 10+/macOS/Linux 原生自带，或装 Git for Windows）');
}

const REGISTRY = process.env.DOOCS_MD_REGISTRY || 'https://registry-1.docker.io';
const AUTH = process.env.DOOCS_MD_AUTH || 'https://auth.docker.io';
const NET_TIMEOUT_MS = Number(process.env.DOOCS_MD_TIMEOUT || 30000);

/**
 * 带超时的 fetch。Docker Hub 在国内访问偶尔需要 VPN/代理，
 * 裸 fetch 没超时会挂死终端。30 秒超时 + 明确错误提示。
 */
async function fetchWithTimeout(url, opts = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), NET_TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...opts, signal: ac.signal });
    return r;
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error(`请求超时（${NET_TIMEOUT_MS}ms）：${url}\n可能原因：网络无法访问 Docker Hub。\n解决：(a) 开代理/VPN；(b) 设环境变量 DOOCS_MD_REGISTRY / DOOCS_MD_AUTH 指向国内镜像；(c) 延长 DOOCS_MD_TIMEOUT（毫秒）`);
    }
    throw new Error(`网络错误: ${e.message} — ${url}`);
  } finally {
    clearTimeout(timer);
  }
}

const ACCEPT = [
  'application/vnd.oci.image.index.v1+json',
  'application/vnd.docker.distribution.manifest.list.v2+json',
  'application/vnd.oci.image.manifest.v1+json',
  'application/vnd.docker.distribution.manifest.v2+json',
].join(', ');

function log(msg) { console.log('[pull-doocs-assets]', msg); }

async function getToken(image) {
  const url = `${AUTH}/token?service=registry.docker.io&scope=repository:${image}:pull`;
  const r = await fetchWithTimeout(url);
  if (!r.ok) throw new Error(`获取 token 失败: ${r.status} ${url}`);
  const data = await r.json();
  if (!data.token) throw new Error('Token 响应无 token 字段');
  return data.token;
}

async function getJson(url, headers) {
  const r = await fetchWithTimeout(url, { headers, redirect: 'follow' });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`);
  return await r.json();
}

async function downloadTo(url, headers, dest) {
  // 下载大 blob 用更宽松的超时（不是用 AbortController 就会在首字节后继续 stream）
  // 这里 fetch 本身做连接超时，后续 body stream 由 pipeline 管理
  const r = await fetchWithTimeout(url, { headers, redirect: 'follow' });
  if (!r.ok) throw new Error(`下载失败 ${r.status}: ${url}`);
  await pipeline(Readable.fromWeb(r.body), createWriteStream(dest));
}

function runTar(archive, destDir) {
  const info = getTarInfo();
  const args = ['-xzf', archive, '-C', destDir];
  // GNU tar 对含 ":" 的路径默认按 scp 语法解析 → 需要 --force-local 强制本地
  if (info.isGnu) args.push('--force-local');
  const r = spawnSync(info.cmd, args, { stdio: 'inherit' });
  if (r.error) throw new Error(`tar 调用失败: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`tar 解压失败（退出码 ${r.status}）: ${archive}`);
}

function checkTar() {
  const info = getTarInfo();
  // 可选：调试时可加 log(`[tar] ${info.cmd} — ${info.versionLine}`);
  void info;
}

function pickPlatform(manifests) {
  // 优先 linux/amd64（与 Docker Hub 大多数镜像匹配）
  const order = [
    (m) => m.platform?.os === 'linux' && m.platform?.architecture === 'amd64',
    (m) => m.platform?.os === 'linux' && m.platform?.architecture === 'arm64',
    (m) => m.platform?.os === 'linux',
    () => true,
  ];
  for (const pred of order) {
    const hit = manifests.find(pred);
    if (hit) return hit;
  }
  return manifests[0];
}

/**
 * 拉取 image:tag 镜像，把 innerPath 下的内容拷到 outDir。
 * @param {object} opts
 * @param {string} opts.image      - 如 "doocs/md"
 * @param {string} opts.tag        - 如 "2.1.0-assets"
 * @param {string} opts.outDir     - 目标目录（会被清空重建）
 * @param {string} opts.innerPath  - 镜像内要抽的路径，如 "/app/assets"
 */
export async function pullImageAssets({ image, tag, outDir, innerPath }) {
  if (typeof fetch === 'undefined') {
    throw new Error('Node 版本过低（需要 ≥ 18）');
  }
  checkTar();

  log(`获取 ${image}:${tag} 的匿名拉取 token`);
  const token = await getToken(image);
  const headers = { Authorization: `Bearer ${token}`, Accept: ACCEPT };

  log('获取 manifest');
  let manifest = await getJson(`${REGISTRY}/v2/${image}/manifests/${tag}`, headers);

  // 若是 manifest list / OCI index，进一步解引用
  if (Array.isArray(manifest.manifests)) {
    const chosen = pickPlatform(manifest.manifests);
    log(`manifest list → 选 ${chosen.platform?.os}/${chosen.platform?.architecture}`);
    manifest = await getJson(`${REGISTRY}/v2/${image}/manifests/${chosen.digest}`, headers);
  }

  if (!Array.isArray(manifest.layers) || manifest.layers.length === 0) {
    throw new Error('manifest 无 layers 字段或为空：' + JSON.stringify(manifest).slice(0, 400));
  }
  log(`manifest OK，${manifest.layers.length} 个 layer`);

  const tmpRoot = join(tmpdir(), `inkflow-doocs-pull-${Date.now()}`);
  const rootfs = join(tmpRoot, 'rootfs');
  mkdirSync(rootfs, { recursive: true });

  try {
    // 按顺序下载并解压每个 layer（后层覆盖前层）
    for (let i = 0; i < manifest.layers.length; i++) {
      const layer = manifest.layers[i];
      const sizeMB = (layer.size / 1024 / 1024).toFixed(2);
      log(`下载 layer ${i + 1}/${manifest.layers.length}（${sizeMB} MB）`);
      const blobUrl = `${REGISTRY}/v2/${image}/blobs/${layer.digest}`;
      const archive = join(tmpRoot, `layer-${i}.tar.gz`);
      await downloadTo(blobUrl, { Authorization: `Bearer ${token}` }, archive);
      log(`解压 layer ${i + 1} → rootfs`);
      runTar(archive, rootfs);
    }

    // 抽 innerPath（镜像里是绝对路径如 /app/assets，tar 根目录没前导 /）
    const rel = innerPath.replace(/^\/+/, '');
    const src = join(rootfs, rel);
    if (!existsSync(src)) {
      throw new Error(`镜像里未发现 ${innerPath}（已解到 ${rootfs}，请检查 innerPath）`);
    }

    if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
    mkdirSync(dirname(outDir), { recursive: true });
    cpSync(src, outDir, { recursive: true });
    log(`已抽取 ${innerPath} → ${outDir}`);
  } finally {
    try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
  }
}

// ── CLI 入口 ──────────────────────────────────────────
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('pull-doocs-assets.mjs');
if (isMain) {
  const argv = process.argv.slice(2);
  const get = (k, d) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : d;
  };
  try {
    await pullImageAssets({
      image: get('--image', 'doocs/md'),
      tag: get('--tag', '2.1.0-assets'),
      outDir: get('--out', './dist/doocs'),
      innerPath: get('--inner', '/app/assets'),
    });
  } catch (e) {
    console.error('[pull-doocs-assets] 失败:', e.message);
    process.exit(1);
  }
}
