/**
 * themeCSS 全量快照（文件级）
 *
 * 每个主题的 generateThemeCSS() 产出保存在 __snapshots__/themeCSS/{id}.css，
 * 使用 `toMatchFileSnapshot` 让改动可以在 diff 视图里按 CSS 语法阅读（而非嵌进 .snap 里一长串）。
 *
 * 覆盖：
 *   - themeCSS 不抛 ThemeAuthoringError（font-family / position / flex 守卫都守得住）
 *   - 五套主题的 CSS 选择器数、色值、字号稳定；改动一次会被差异清楚摊开
 *
 * 补录快照：npx vitest run tests/themeCSS-snapshot.spec.ts -u
 */

import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { generateThemeCSS } from '../src/pipeline/themeCSS'
import { themeList } from '../src/themes'

// process.cwd() 在 vitest 里等于 app 根目录
const SNAP_DIR = resolve(process.cwd(), 'tests/__snapshots__/themeCSS')

describe('themeCSS 全量快照', () => {
  for (const theme of themeList) {
    it(`${theme.id}`, async () => {
      const css = generateThemeCSS(theme)
      // 快照文件路径稳定化：id.css（- 会被保留）
      await expect(css).toMatchFileSnapshot(
        resolve(SNAP_DIR, `${theme.id}.css`),
      )
    })
  }
})
