#!/usr/bin/env node
/**
 * apply-overlay.mjs
 * ============================================================
 * 把 overlay/theme-css/*.css 注入 doocs/md submodule，并重写
 * upstream 里的 themeMap / themeOptions，让四个 InkFlow 栏目出现
 * 在顶栏主题下拉里。
 *
 * 策略（幂等，无手工 patch）：
 *   1. 把 overlay/theme-css/*.css 复制到 upstream 主题目录
 *   2. 扫描 upstream 主题目录，把文件分为「upstream 原生」+「InkFlow 覆盖层」
 *      （依据：overlay/columns.json 记录的 css 文件名）
 *   3. 完整重写 upstream 的 theme-css/index.ts 和 configs/theme.ts
 *      —— 每次运行生成确定输出，保证可回溯
 *
 * Usage:
 *   node scripts/apply-overlay.mjs           # 写入 upstream
 *   node scripts/apply-overlay.mjs --check   # 只校验不写，drift 时返回 1
 *   node scripts/apply-overlay.mjs --clean   # 从 upstream 移除覆盖层
 *
 * 依赖：node >= 18
 * ============================================================
 */
import { readFile, writeFile, copyFile, mkdir, access, rm, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

const OVERLAY_DIR = join(ROOT, 'overlay')
const UPSTREAM_THEME_DIR = join(
  ROOT,
  'upstream/packages/shared/src/configs/theme-css',
)
const UPSTREAM_THEME_CONFIG = join(
  ROOT,
  'upstream/packages/shared/src/configs/theme.ts',
)
const MANIFEST = join(OVERLAY_DIR, 'columns.json')

// upstream 原生主题（不会被覆盖层移除）
// 若 upstream 新增主题，需同步更新此清单
const UPSTREAM_BUILTIN_THEMES = [
  { id: 'default', label: '经典', desc: '' },
  { id: 'grace', label: '优雅', desc: '@brzhang' },
  { id: 'simple', label: '简洁', desc: '@okooo5km' },
]

const args = new Set(process.argv.slice(2))
const CHECK = args.has('--check')
const CLEAN = args.has('--clean')

async function exists(p) {
  try { await access(p, constants.F_OK); return true } catch { return false }
}

async function ensureUpstream() {
  if (!(await exists(UPSTREAM_THEME_DIR))) {
    console.error(
      `✗ 未找到 upstream/。请先运行:\n` +
      `    git submodule update --init --recursive`,
    )
    process.exit(1)
  }
}

async function readManifest() {
  const raw = await readFile(MANIFEST, 'utf8')
  const obj = JSON.parse(raw)
  if (!Array.isArray(obj.columns) || obj.columns.length === 0) {
    throw new Error('columns.json 必须包含非空 columns 数组')
  }
  // 运行时校验
  for (const c of obj.columns) {
    if (!c.id || !c.css || !c.label) {
      throw new Error(`栏目 ${JSON.stringify(c)} 缺少 id/css/label`)
    }
    if (!c.id.startsWith('ink-')) {
      throw new Error(`栏目 id 必须以 'ink-' 开头：${c.id}`)
    }
  }
  return obj.columns
}

async function copyThemes(columns) {
  await mkdir(UPSTREAM_THEME_DIR, { recursive: true })
  for (const col of columns) {
    const src = join(OVERLAY_DIR, 'theme-css', col.css)
    const dst = join(UPSTREAM_THEME_DIR, col.css)
    if (!(await exists(src))) {
      throw new Error(`覆盖层 CSS 不存在: ${src}`)
    }
    if (CHECK) {
      const a = await readFile(src, 'utf8')
      const dstExists = await exists(dst)
      const b = dstExists ? await readFile(dst, 'utf8') : ''
      if (a !== b) return drift(`theme CSS drift: ${col.css} (${dstExists ? 'content diff' : 'missing in upstream'})`)
    } else {
      await copyFile(src, dst)
      console.log(`  · copied theme-css/${col.css}`)
    }
  }
}

function renderIndexTs(columns) {
  const imports = [
    `import baseCSS from './base.css?raw'`,
    ...UPSTREAM_BUILTIN_THEMES.map(
      (t) => `import ${camel(t.id)}CSS from './${t.id}.css?raw'`,
    ),
    '',
    '// ===== InkFlow overlay imports =====',
    ...columns.map(
      (c) => `import ${camel(c.id)}CSS from './${c.css}?raw'`,
    ),
  ].join('\n')

  const mapEntries = [
    ...UPSTREAM_BUILTIN_THEMES.map(
      (t) => `  ${t.id}: ${camel(t.id)}CSS,`,
    ),
    ...columns.map(
      (c) => `  '${c.id}': ${camel(c.id)}CSS,`,
    ),
  ].join('\n')

  return [
    '/**',
    ' * CSS 主题导出（InkFlow 覆盖层生成，请勿手动编辑）',
    ' * 源：apps/web/src/…，覆盖层：tools/typesetter/overlay/',
    ' * 再次生成：node tools/typesetter/scripts/apply-overlay.mjs',
    ' */',
    '',
    imports,
    '',
    '/**',
    ' * 基础样式 CSS',
    ' */',
    'export const baseCSSContent = baseCSS',
    '',
    '/**',
    ' * CSS 主题映射表（upstream builtin + InkFlow overlay）',
    ' */',
    'export const themeMap = {',
    mapEntries,
    '} as const',
    '',
    'export type ThemeName = keyof typeof themeMap',
    '',
  ].join('\n')
}

function renderThemeTs(columns) {
  const builtinOpt = UPSTREAM_BUILTIN_THEMES.map(
    (t) =>
      `  {\n` +
      `    label: \`${t.label}\`,\n` +
      `    value: \`${t.id}\`,\n` +
      `    desc: \`${t.desc}\`,\n` +
      `  },`,
  ).join('\n')

  const builtinMap = UPSTREAM_BUILTIN_THEMES.map(
    (t) =>
      `  ${t.id}: {\n` +
      `    label: \`${t.label}\`,\n` +
      `    value: \`${t.id}\`,\n` +
      `    desc: \`${t.desc}\`,\n` +
      `  },`,
  ).join('\n')

  const overlayOpt = columns.map(
    (c) =>
      `  {\n` +
      `    label: \`${c.label}\`,\n` +
      `    value: \`${c.id}\`,\n` +
      `    desc: \`${c.desc || c.author || ''}\`,\n` +
      `  },`,
  ).join('\n')

  const overlayMap = columns.map(
    (c) =>
      `  '${c.id}': {\n` +
      `    label: \`${c.label}\`,\n` +
      `    value: \`${c.id}\`,\n` +
      `    desc: \`${c.desc || c.author || ''}\`,\n` +
      `  },`,
  ).join('\n')

  return [
    '/**',
    ' * 主题选项（InkFlow 覆盖层生成，请勿手动编辑）',
    ' * 再次生成：node tools/typesetter/scripts/apply-overlay.mjs',
    ' */',
    "import type { IConfigOption } from '../types'",
    "import type { ThemeName } from './theme-css'",
    '',
    "export { baseCSSContent, themeMap, type ThemeName } from './theme-css'",
    '',
    'export const themeOptionsMap = {',
    builtinMap,
    '  // ===== InkFlow overlay =====',
    overlayMap,
    '}',
    '',
    'export const themeOptions: IConfigOption<ThemeName>[] = [',
    builtinOpt,
    '  // ===== InkFlow overlay =====',
    overlayOpt,
    ']',
    '',
  ].join('\n')
}

function camel(id) {
  // ink-academic → inkAcademic；default → defaultTheme（避免 JS 保留字）
  if (id === 'default') return 'defaultTheme'
  return id
    .split('-')
    .map((p, i) => (i === 0 ? p : p[0].toUpperCase() + p.slice(1)))
    .join('')
}

function drift(msg) {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

async function writeFileIfDiff(target, content, label) {
  if (CHECK) {
    const cur = (await exists(target)) ? await readFile(target, 'utf8') : ''
    if (cur !== content) return drift(`drift: ${label}`)
  } else {
    await writeFile(target, content, 'utf8')
    console.log(`  · wrote ${label}`)
  }
}

async function clean(columns) {
  for (const col of columns) {
    const dst = join(UPSTREAM_THEME_DIR, col.css)
    if (await exists(dst)) {
      await rm(dst)
      console.log(`  · removed theme-css/${col.css}`)
    }
  }
  // 重建 index.ts / theme.ts 只含 upstream builtin
  await writeFile(
    join(UPSTREAM_THEME_DIR, 'index.ts'),
    renderIndexTs([]),
    'utf8',
  )
  await writeFile(UPSTREAM_THEME_CONFIG, renderThemeTs([]), 'utf8')
  console.log('  · restored upstream theme files (builtin only)')
  console.log(
    '\n注意：此操作会把 upstream 的 index.ts / theme.ts 恢复到 "仅 builtin" 状态。\n' +
      '如需还原为 submodule 原始版本，在 upstream/ 中运行 git checkout -- .',
  )
}

// ---- main ----
;(async () => {
  await ensureUpstream()
  const columns = await readManifest()

  console.log(
    CHECK
      ? '→ 校验 overlay 与 upstream 同步状态…'
      : CLEAN
        ? '→ 从 upstream 移除 InkFlow 覆盖层…'
        : `→ 将 ${columns.length} 个栏目注入 upstream…`,
  )

  if (CLEAN) {
    await clean(columns)
  } else {
    await copyThemes(columns)
    const indexTs = renderIndexTs(columns)
    const themeTs = renderThemeTs(columns)
    await writeFileIfDiff(
      join(UPSTREAM_THEME_DIR, 'index.ts'),
      indexTs,
      'theme-css/index.ts',
    )
    await writeFileIfDiff(
      UPSTREAM_THEME_CONFIG,
      themeTs,
      'configs/theme.ts',
    )
  }

  console.log(CHECK ? '✓ 同步正确' : CLEAN ? '✓ 清理完成' : '✓ 注入完成')
  if (!CHECK && !CLEAN) {
    console.log('\n下一步：')
    console.log('  cd tools/typesetter/upstream')
    console.log('  pnpm install && pnpm start    # 注意：upstream 是 start，不是 dev')
    console.log('  → 浏览器打开 http://127.0.0.1:5173 → 主题下拉选 学术/行业/技术/故事')
    console.log('\n或一键启动（自动完成上述步骤）：')
    console.log('  node tools/typesetter/scripts/dev.mjs')
  }
})().catch((err) => {
  console.error('✗', err.message)
  process.exit(1)
})
