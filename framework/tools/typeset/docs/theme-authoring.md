# 第三方主题开发指南

> Step 1 占位文档，完整规范在 Step 5/6 定稿。
> 此处先锁定**硬约束**，供主题作者提前规划。

## 主题 = 设计系统

一个主题不等于一份 CSS，而是：

```ts
interface Theme {
  tokens: ThemeTokens          // 色板 / 字号 / 间距 / 圆角
  elements: ThemeElements      // h1-h3 / p / ul / blockquote / ...
  containers: ThemeContainers  // intro / tip / quoteCard / compare / ...
  assets: ThemeAssets          // SVG 装饰字符串（h2 前缀 / 分割花纹 / 序号徽章）
  templates: ThemeTemplates    // 封面卡 / 作者卡 / 文末 CTA 的 HTML 片段
  inline: ThemeInline          // 高亮 / 波浪 / 着重的 CSS
}
```

主题作者只需提供这一个对象；渲染管线自动：
- 生成 CSS 字符串
- 内嵌 SVG 资产到容器节点
- juice 内联化
- 应用兼容性补丁

## 硬约束（违反即 throw 或被粘贴后丢失）

### 1. 禁止 font-family

**themeCSS 生成器遇到任何 `font-family` 声明直接 `throw ThemeAuthoringError`**。
理由：微信客户端会用系统字体覆盖，写了无效。

```ts
// ❌ 会在构建时 throw
elements: { h1: { 'font-family': 'serif' } }

// ✅
elements: { h1: { 'font-size': '24px', 'font-weight': '700' } }
```

### 2. SVG 资产规范

所有 `assets.*` 的 SVG 字符串必须：

- **不含 `id` 属性**（微信剥离所有 id）
- **不含 `<script>`、`<style>`**
- **`url()` 中不加引号**：`url(#grad)` ✅ / `url('#grad')` ❌
- **不依赖外链资源**（外链图在 SVG 内稳定性差）
- **手写或精选**，拒绝 AI 感、通用素材库刻板素材

### 3. 布局禁用项

- ❌ `position: absolute / relative / fixed`（被剥离）
- ❌ flex 做核心骨架（iOS 旧版差异）
- ❌ flex `gap`（iOS 真机已知失效）
- ❌ `@keyframes` 动画（`<style>` 被过滤后失效；改用 SVG SMIL）
- ❌ `@media` 查询（被过滤）
- ❌ `:hover` / `:active`（被过滤）

### 4. 间距使用 padding 优先

`padding` 在所有元素上的一致性明显好于 `margin`。
纵向段落间距保留 `margin-bottom`，横向留白与容器内边距一律 padding。

## 推荐模式

- **标题层级**：border-bottom + padding-bottom 做分隔线，比 border 更稳定
- **列表符号**：`list-style-type: square` / `circle` / `disc`，或用 `assets.listBullet` SVG 背景
- **容器骨架**：`<table>` 或 `inline-block + vertical-align` 做多栏（见 compare 容器）
- **SVG 装饰**：作为 HTML 节点直接内联，不经过 CSS background

## 调试

```bash
cd framework/tools/typeset/app
npm run test     # 含 themeCSS.spec.ts —— 主题对象的 font-family 守卫
npm run dev      # 热更新预览
```

完整示例在 `src/themes/default/index.ts`。
