#!/usr/bin/env node
/**
 * design-guard.mjs
 * ============================================================
 * 扫描 overlay/theme-css/*.css，对照 .design-guard.json 的禁用正则报错。
 * 反 AI 设计宪章的可机器校验部分。
 *
 * Usage:
 *   node scripts/design-guard.mjs          # error + warning 全报
 *   node scripts/design-guard.mjs --strict # warning 也按 error 处理
 *   node scripts/design-guard.mjs --quiet  # 成功时不输出
 *
 * Exit:
 *   0 — 无 error（或 --strict 下无 warning）
 *   1 — 命中 forbidden（或 --strict 下命中 cautious）
 * ============================================================
 */
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const args = new Set(process.argv.slice(2))
const STRICT = args.has('--strict')
const QUIET = args.has('--quiet')

async function expandGlobs(patterns) {
  const files = []
  for (const p of patterns) {
    const m = p.match(/^(.+?)\/\*\.(\w+)$/)
    if (m) {
      const dir = resolve(ROOT, m[1])
      const ext = '.' + m[2]
      try {
        const entries = await readdir(dir)
        for (const f of entries) {
          if (f.endsWith(ext)) files.push(join(dir, f))
        }
      } catch {
        // 目录不存在，跳过
      }
    } else {
      files.push(resolve(ROOT, p))
    }
  }
  return files.sort()
}

function scanText(text, rules) {
  const hits = []
  const lines = text.split('\n')
  for (const rule of rules) {
    if (!rule.pattern) continue
    const re = new RegExp(rule.pattern, 'gmi')
    lines.forEach((line, i) => {
      const trimmed = line.trim()
      // 忽略注释行
      if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) return
      re.lastIndex = 0
      const m = re.exec(line)
      if (m) {
        hits.push({
          id: rule.id,
          reason: rule.reason || '',
          line: i + 1,
          snippet: line.trim().slice(0, 120),
        })
      }
    })
  }
  return hits
}

// ---- main ----
;(async () => {
  const cfgPath = resolve(ROOT, '.design-guard.json')
  let guard
  try {
    guard = JSON.parse(await readFile(cfgPath, 'utf8'))
  } catch (e) {
    console.error('✗ 读取 .design-guard.json 失败：', e.message)
    process.exit(1)
  }

  if (!Array.isArray(guard.scan) || guard.scan.length === 0) {
    console.error('✗ .design-guard.json 缺少 scan 数组')
    process.exit(1)
  }

  const files = await expandGlobs(guard.scan)
  if (files.length === 0) {
    console.error('✗ 未找到可扫描的 CSS 文件：', guard.scan)
    process.exit(1)
  }

  let errorCount = 0
  let warnCount = 0

  for (const file of files) {
    const rel = file.replace(ROOT + '/', '')
    const text = await readFile(file, 'utf8')

    const errors = scanText(text, guard.forbidden || [])
    const warnings = scanText(text, guard.cautious || [])

    if (errors.length) {
      console.error(`\n✗ ${rel}`)
      for (const h of errors) {
        console.error(`    L${h.line}  [${h.id}]  ${h.reason}`)
        console.error(`          ${h.snippet}`)
      }
      errorCount += errors.length
    }

    if (warnings.length) {
      if (STRICT) errorCount += warnings.length
      else warnCount += warnings.length
      const icon = STRICT ? '✗' : '⚠'
      const stream = STRICT ? console.error : console.warn
      stream(`\n${icon} ${rel}`)
      for (const h of warnings) {
        stream(`    L${h.line}  [${h.id}]  ${h.reason}`)
        stream(`          ${h.snippet}`)
      }
    }
  }

  if (errorCount > 0) {
    console.error(`\n✗ 命中 ${errorCount} 条禁令。参见 DESIGN-MANIFESTO.md`)
    process.exit(1)
  }

  if (!QUIET) {
    console.log(
      `\n✓ 扫描 ${files.length} 个 CSS 文件${warnCount ? `（${warnCount} warning）` : ''}`,
    )
  }
})().catch((err) => {
  console.error('✗', err.message)
  process.exit(1)
})
