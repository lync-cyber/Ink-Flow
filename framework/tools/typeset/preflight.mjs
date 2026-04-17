#!/usr/bin/env node
/**
 * 启动前对可见文章跑 .claude/skills/quality-linting/scripts/lint.py，不阻塞启动，仅在终端汇总 error/warn 计数。
 * 目标：让用户在打开排版工具前看到文章是否有 lint 问题，不替代 publisher 阶段的强校验。
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..');
const LINT = join(ROOT, 'framework', 'tools', 'lint', 'lint.py');

function pickPython() {
  for (const candidate of ['python3', 'python']) {
    const r = spawnSync(candidate, ['-V'], { stdio: 'ignore' });
    if (r.status === 0) return candidate;
  }
  return null;
}

export function preflight({ articles }) {
  if (!existsSync(LINT)) return;
  const slugs = Object.keys(articles);
  if (slugs.length === 0) return;
  const py = pickPython();
  if (!py) {
    console.log('[inkflow] 未检测到 python，跳过 lint preflight');
    return;
  }
  let errCnt = 0;
  let warnCnt = 0;
  for (const slug of slugs) {
    const md = join(ROOT, 'content', 'articles', slug, 'export', '08-wechat-publish.md');
    if (!existsSync(md)) continue;
    const r = spawnSync(py, [LINT, md], { stdio: 'ignore' });
    if (r.status === 1) errCnt++;
    else if (r.status === 2) warnCnt++;
  }
  if (errCnt || warnCnt) {
    console.log(`[inkflow] lint preflight: ${errCnt} 篇 error, ${warnCnt} 篇 warn（仅提示）`);
  } else {
    console.log('[inkflow] lint preflight: 全部通过');
  }
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('preflight.mjs');
if (isMain) {
  // 独立运行：扫描真实 articles
  const { build } = await import('./build-articles.mjs');
  preflight({ articles: build() });
}
