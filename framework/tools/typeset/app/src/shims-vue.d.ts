declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'markdown-it-mark'
declare module 'markdown-it-ins'
declare module 'markdown-it-task-lists'
declare module 'markdown-it-footnote'
declare module 'juice/client' {
  export function juiceDocument(doc: Document, options?: Record<string, unknown>): Document
  export function inlineDocument(doc: Document, css: string, options?: Record<string, unknown>): Document
  export function inlineContent(html: string, css: string, options?: Record<string, unknown>): string
}
declare module 'juice' {
  export function juiceDocument(doc: Document, options?: Record<string, unknown>): Document
  export function inlineDocument(doc: Document, css: string, options?: Record<string, unknown>): Document
  export function inlineContent(html: string, css: string, options?: Record<string, unknown>): string
}
