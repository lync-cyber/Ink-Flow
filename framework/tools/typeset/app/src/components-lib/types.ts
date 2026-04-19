/**
 * 组件库条目类型
 *
 * 每条 = 一段"可一键插入 markdown 的成品 fence + 缩略图 + 元数据"。
 * 用户在右侧抽屉里浏览、点击，片段被插到光标位置；
 * 也可被"替换为..."流程：在编辑器选中一个现有容器块 → 选替换对象 → attrs.variant 字段回写。
 *
 * 设计不做的事：
 *   - 不存主题 CSS（主题是独立维度；同一组件可跨主题）
 *   - 不存 Vue 节点（UI 只消费 markdownSnippet + thumbnailSvg）
 *   - 不强制 kind 一对一（存在 intro / author / footer-cta 等 kind=none 的自由组件）
 */

import type { VariantKind } from '../themes/types'

export type ComponentKind = VariantKind | 'none'

export interface ComponentEntry {
  /** 全局稳定 id，如 'admonition-tip-terminal' / 'quote-frame-brackets' */
  id: string
  /** 显示名（短）：Terminal Tip / 票根 Warning */
  name: string
  /** 一句话说明（≤30 字） */
  description: string
  /** 哪个容器类，决定在抽屉里的分类 tab */
  kind: ComponentKind
  /**
   * 所对应的 variant id（admonition/quote/compare/... 的具体骨架）。
   * kind='none' 的自由组件（intro/author/footer-cta 等）此字段为 undefined。
   */
  variantId?: string
  /**
   * 推荐主题 id 列表（UI 用来显示"推荐"徽章）。空数组/undefined 等价于全兼容。
   * 兼容只是推荐，不强制——用户把 terminal 放进文学主题也允许。
   */
  themeCompat?: string[]
  /**
   * 可直接插入 markdown 的 fence 片段。需自带换行收尾。
   * 占位文本用"{标题}/{正文}"等花括号 token；UI 不做模板替换，直接原文插入
   * 让用户自己改（避免"魔法替换"带来的歧义）。
   */
  markdownSnippet: string
  /**
   * 75×75 缩略图。首选 inline SVG 字符串（符合主题的零外链硬约束）；
   * UI 直接 v-html 渲染。避免 canvas / PNG，让组件库打包为纯文本。
   */
  thumbnailSvg: string
}

export interface UserComponent extends ComponentEntry {
  /** 用户创建组件时自动填入的时间戳，用于排序与删除 */
  createdAt: number
  /** 原始选区文本（便于"溯源"展示） */
  sourceMarkdown?: string
}
