/**
 * useDebouncedRender 契约
 *
 * - immediate=true：挂载后立即出首帧（避免空白）
 * - 快速输入 N 次：只应落地最后一次渲染
 * - flush()：立刻用当前源重跑一次，忽略待触发的 timer
 * - 组件卸载：未触发的 timer 必须被清理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useDebouncedRender } from '../src/composables/useDebouncedRender'
import { defaultTheme } from '../src/themes/default'
import type { RenderInput, RenderOutput } from '../src/pipeline'

// 用 fake timer 精确控制 80ms 防抖窗口
beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

/**
 * 挂载 composable 到一个壳组件上。Vue 的 composable 必须在 setup 内调用，
 * 因此用 defineComponent 包一层；返回的 ref 通过闭包捕获。
 */
function mount(initialInput: RenderInput) {
  let api!: ReturnType<typeof useDebouncedRender>
  const source = ref<RenderInput>(initialInput)

  const Holder = defineComponent({
    setup() {
      api = useDebouncedRender(source, { delayMs: 80, immediate: true })
      return () => h('div')
    },
  })

  const app = (async () => {
    const { createApp } = await import('vue')
    const root = document.createElement('div')
    const instance = createApp(Holder)
    instance.mount(root)
    return { instance, root }
  })()

  return { source, getApi: () => api, app }
}

describe('useDebouncedRender', () => {
  it('immediate=true：挂载后立刻给出一次渲染', async () => {
    const { getApi, app } = mount({ md: '# hi', theme: defaultTheme })
    await app
    // immediate watch 调用的是 schedule()，仍走 timer，需要 tick 一下
    await vi.advanceTimersByTimeAsync(80)
    const out = getApi().rendered.value as RenderOutput
    expect(out.html).toContain('hi')
  })

  it('连续输入只渲染最后一次（防抖后沿）', async () => {
    const { source, getApi, app } = mount({ md: '# a', theme: defaultTheme })
    await app
    await vi.advanceTimersByTimeAsync(80)
    expect(getApi().rendered.value.html).toContain('a')

    source.value = { md: '# b', theme: defaultTheme }
    await vi.advanceTimersByTimeAsync(30)
    source.value = { md: '# c', theme: defaultTheme }
    await vi.advanceTimersByTimeAsync(30)
    source.value = { md: '# d', theme: defaultTheme }
    // 此时距最后一次修改不足 80ms，还不应更新
    expect(getApi().rendered.value.html).toContain('a')

    await vi.advanceTimersByTimeAsync(80)
    // 到期后应直接跳到 d（不经过 b、c）
    const html = getApi().rendered.value.html
    expect(html).toContain('d')
    expect(html).not.toContain('b</h1>')
    expect(html).not.toContain('c</h1>')
  })

  it('flush() 立即用当前 source 重跑并清定时器', async () => {
    const { source, getApi, app } = mount({ md: '# a', theme: defaultTheme })
    await app
    await vi.advanceTimersByTimeAsync(80)

    source.value = { md: '# flushed', theme: defaultTheme }
    // 不推进时间直接 flush，应该立即看到 flushed
    getApi().flush()
    const html = getApi().rendered.value.html
    expect(html).toContain('flushed')
  })
})
