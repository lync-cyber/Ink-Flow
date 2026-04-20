/**
 * 在 jsdom 环境下挂载 Vue 组件。
 * 不引入 @vue/test-utils，直接用 createApp——减少依赖，够用。
 */

import { createApp, h, type Component } from 'vue'

export interface MountResult {
  root: HTMLElement
  unmount: () => void
}

export async function mount<P extends Record<string, unknown>>(
  component: Component,
  props?: P,
): Promise<MountResult> {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const app = createApp({
    render: () => h(component, props ?? {}),
  })
  app.mount(root)
  // 等一个 microtask，让模板 + computed 完成首帧
  await Promise.resolve()
  return {
    root,
    unmount: () => {
      app.unmount()
      root.remove()
    },
  }
}
