# wx-md · 微信公众号 Markdown 排版工具

**InkFlow 自研的纯前端 Markdown → 微信公众号富文本编辑器。**

- 左编辑（CodeMirror 6）· 右 375px 移动端实时预览
- 一键复制富文本到公众号后台（Clipboard API + execCommand 降级）
- 内置主题 + 容器扩展语法（`::: tip` / `::: quote-card` / ...）
- 所有样式自动 juice 内联化 + 兼容性补丁后处理
- 预览与剪贴板共享同一份 HTML（原则 1：保真）

## 当前开发进度

- [x] **Step 1** 端到端最小链路 · Vite + Vue 3 + TS + markdown-it + juice/client
- [x] **Step 2** 预览保真 & 防抖渲染
- [x] **Step 3** 兼容性补丁层（wxPatch · id/font-family/forbidden tags/SVG 白底替换…）
- [x] **Step 4** 容器扩展语法（19 个容器 + 行内 highlight/wavy/emphasis）
- [x] **Step 5** 主题设计系统升级（tokens + elements + containers + assets + templates + inline）
- [x] **Step 6** 4 套内置风格包（tech-geek / life-aesthetic / business-finance / literary-humanism，
      每套 ≥ 11 个专属 SVG 资产 + ≥ 3 个模板 + 全容器示例 md）
- [x] **Step 7** 配色生成器 + 自定义面板（10 个预设 + chroma-js LCH 推导 + WCAG 对比度）
- [x] **Step 8** 多草稿 CRUD + 模板市场 + 导出（HTML / Markdown / 长图懒加载）+ 快捷键

手动验收清单详见 [docs/TESTING.md](docs/TESTING.md)。

## 快速开始

### 双击启动（推荐）

```bash
# Windows
framework/tools/typeset/launcher.bat

# macOS / Linux
framework/tools/typeset/launcher.command
```

首次双击会自动：

1. 检测 Node.js（需要 Node 18+）
2. `cd app && npm install`（~1-2 分钟）
3. `npm run build`（~30-60 秒）
4. 启 `127.0.0.1:7788`，自动打开浏览器

之后双击直接启动服务。

### 手动开发

```bash
cd framework/tools/typeset/app

# 开发模式（热更新，端口 5173）
npm install
npm run dev

# 生产构建 + 本地 serve
npm run build
node ../serve.mjs         # 端口 7788
```

## 为什么必须跑 `127.0.0.1` 而不是 `file://`

`navigator.clipboard.write(ClipboardItem)` 要求 secure context。
`file://` 协议下 `window.isSecureContext === false`，Clipboard API 不可用，
会降级到 `document.execCommand('copy')`——这个路径在某些浏览器上会丢失富文本、
粘贴到公众号只剩纯文本。`127.0.0.1` / `localhost` 被浏览器视为 secure，
Clipboard API 完整可用。这是浏览器规范，不是工具的限制。

## 架构

```
framework/tools/typeset/
├── app/                       # Vite + Vue 3 + TS 工程
│   ├── src/
│   │   ├── App.vue            # 三栏布局：Toolbar / Editor / Preview
│   │   ├── components/
│   │   │   ├── Editor.vue     # CodeMirror 6 包装
│   │   │   ├── Preview.vue    # iframe srcdoc, viewport 锁 375px
│   │   │   └── Toolbar.vue
│   │   ├── pipeline/
│   │   │   ├── index.ts       # render(md, theme) -> html
│   │   │   ├── markdown.ts    # markdown-it + 容器 + 内联插件
│   │   │   ├── themeCSS.ts    # Theme → <style> 字符串（含 font-family 守卫）
│   │   │   ├── highlight.ts   # highlight.js（已剔除 font-family）
│   │   │   ├── juiceInline.ts # juice/client 封装
│   │   │   └── wxPatch/       # (Step 3) 兼容性补丁层
│   │   ├── themes/
│   │   │   ├── types.ts       # Theme 接口 + ThemeAuthoringError
│   │   │   ├── default/       # 默认主题（Step 1 占位）
│   │   │   └── index.ts       # 主题注册表
│   │   ├── clipboard/copyHtml.ts
│   │   └── storage/drafts.ts
│   ├── tests/                 # (Step 3+) vitest 单测
│   ├── vite.config.ts         # node-polyfills + alias juice → juice/client
│   ├── tsconfig.json          # strict: true
│   └── package.json
├── serve.mjs                  # 零依赖静态服务器（Node 内置 http）
├── launcher.bat               # Windows 双击启动
├── launcher.command           # macOS / Linux 双击启动
├── docs/
│   ├── theme-authoring.md     # 第三方主题开发指南
│   └── container-syntax.md    # 容器语法使用文档
└── README.md
```

## 渲染管线（单向数据流）

```
md 源文本
  └─► [1] markdown-it（容器 / mark / ins / footnote / task-lists）
        └─► [2] 容器渲染器：容器节点 → 带 SVG 装饰的 section 结构  (Step 4)
              └─► [3] 包 <section class="markdown-body"> + 注入主题 <style>
                    └─► [4] highlight.js 处理 <pre><code>
                          └─► [5] juice/client 内联化：<style> → 元素 style
                                └─► [6] wxPatch 兼容性补丁层        (Step 3)
                                      └─► [7] 最终 HTML
                                            ├─► 预览 iframe srcdoc
                                            └─► 剪贴板 text/html + text/plain
```

**关键不变量**：
1. 预览与剪贴板共享同一份 html（保真）
2. 视觉质感载体是内联 SVG 资产 + 设计令牌（美学）
3. 容器扩展语法是一等公民（表达力）

## 开发文档

- [容器语法使用文档](docs/container-syntax.md)
- [第三方主题开发指南](docs/theme-authoring.md)

## 已知限制

- **微信语音 `<mpvoice>`**：只能在公众号后台编辑器内从素材库插入，用户粘贴富文本无法保留。`::: mpvoice` 容器渲染为占位提示卡。
- **微信视频 `<mpvideo>`**：官方视频同上；腾讯视频（`qqvid`）可渲染为 `v.qq.com` iframe。
- **外链 `<a>`**：公众号对外链有限制，不作为视觉关键元素。
- **Safari 剪贴板**：必须在用户手势同步路径内构造 `ClipboardItem`，异步路径会失败。
- **`file://` 协议**：Clipboard API 不可用，必须走 `127.0.0.1`。
- **自定义字体**：微信客户端会用系统字体覆盖 `font-family`，主题声明 font-family 会被 themeCSS 生成器直接 throw。

## 升级 / 清理

```bash
# 清构建产物
rm -rf framework/tools/typeset/app/dist
rm -rf framework/tools/typeset/app/node_modules

# 重新构建
cd framework/tools/typeset/app && npm install && npm run build
```
