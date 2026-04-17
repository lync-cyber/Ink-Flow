# InkFlow 本地排版工具

基于 [doocs/md](https://github.com/doocs/md) v2.1.0 的本地化封装。把 `content/styles/{slug}/theme.css` 和 `content/articles/{slug}/export/08-wechat-publish.md` 自动注入 doocs/md，在浏览器里预览并一键复制到微信公众号。

**做法**：从 Docker Hub 拉 `doocs/md:2.1.0-assets` 镜像（官方专门抽产物用的单层镜像），通过 Registry HTTP API 拿 layer blob + 系统 `tar` 解压。无需本机 Docker daemon。

## 快速开始

```bash
# 双击即用（首次自动跑 setup，约 3-5 分钟；之后秒启）
framework/tools/typeset.bat       # Windows
framework/tools/typeset.command   # macOS / Linux

# 或手动分步
node framework/tools/typeset/setup.mjs   # 首次初始化
node framework/tools/typeset/serve.mjs   # 启动服务
```

## 为什么必须跑 localhost 而非 file://

`navigator.clipboard.write(ClipboardItem)` 要求 secure context。`file://` 下 `window.isSecureContext === false`，doocs 会降级到 `document.execCommand('copy')`，**HTML 富文本丢失**，粘贴到公众号只剩纯文本。`127.0.0.1` / `localhost` 被视为 secure，Clipboard API 完整可用。这是浏览器规范，不是 doocs 的限制。

## 架构

```
framework/tools/typeset/
├── dist/doocs/                 # 抽取出来的 doocs 预构建 SPA（.gitignore）
│   ├── index.html              # 已 rewrite /md/→./ + 注入 3 行 bootstrap <script>
│   ├── inkflow-bootstrap.js    # 读 URL query → 写 localStorage
│   ├── inkflow-themes.js       # serve 启动时重建（window.__INKFLOW_THEMES__）
│   ├── inkflow-articles.js    # serve 启动时重建（window.__INKFLOW_ARTICLES__）
│   └── assets/...              # doocs 原生 JS/CSS/静态资源
├── launcher/index.html         # 栏目/文章选择器（首页）
├── bootstrap.js                # 注入脚本源（setup 时拷到 dist）
├── pull-doocs-assets.mjs       # Docker Registry API 拉镜像 + tar 解压
├── setup.mjs                   # 一次性：拉镜像 + patch index.html + 拷 bootstrap
├── serve.mjs                   # 静态服务 + 路由 + 自动开浏览器
├── build-themes.mjs            # 扫 content/styles/*/theme.css
├── build-articles.mjs          # 扫 content/articles/*/export/08-wechat-publish.md
└── preflight.mjs               # lint 汇总（不阻塞）
```

**装配式设计 · 单一原则**：Ink-Flow 只做"选栏目 + 选文章 + 写 localStorage"，渲染/juice/剪贴板全交给 doocs。升级 doocs 只需改 `setup.mjs` 顶部的 `TAG`，重跑一次即可。

### 升级到新版本

```bash
# 设环境变量或改 setup.mjs 默认值
DOOCS_MD_TAG=2.2.0-assets node framework/tools/typeset/setup.mjs
```

### serve.mjs 路由

```
GET /             → launcher/index.html
GET /launcher/*   → launcher 静态
GET /doocs/*      → dist/doocs/*（InkFlow 使用的入口）
GET /md/*         → dist/doocs/*（兜底：doocs 产物里可能残留的绝对路径）
GET /api/themes   → 可用栏目清单（调试）
GET /api/articles → 可用文章清单（调试）
```

## 数据流

```
content/styles/tech/theme.css ──┐
                                          ├─> build-*.mjs ─> inkflow-{themes,articles}.js
content/articles/my-slug/export/08-wechat-publish.md ─┘                           │
                                                                          ▼
用户点击 launcher → /doocs/index.html?column=tech&article=my-slug        │
                             │                                            │
                             ▼                                            │
              <head> 里 3 个 <script> 按序执行 ────────────────────────────┘
              1. inkflow-themes.js     → window.__INKFLOW_THEMES__
              2. inkflow-articles.js   → window.__INKFLOW_ARTICLES__
              3. inkflow-bootstrap.js  → 读 URL query，写 localStorage
                                        MD__css_content_config (主题)
                                        MD__posts, MD__current_post_id (文章)
                             │
                             ▼
              doocs main.ts 启动 → useStorage 首次读取即拿到预载值
```

## 使用流程

1. **双击启动**：`framework/tools/typeset.bat` / `framework/tools/typeset.command`（首次自动 setup，需 node ≥18、pnpm ≥9、git）
2. **浏览器自动打开** `http://127.0.0.1:7788/`，显示栏目 + 文章选择器
3. **点击文章** → 跳转到 doocs，主题和正文已预填
4. **编辑/调整** → 点 doocs 的"复制"按钮 → 粘贴到公众号后台

> **运行依赖**：Node ≥ 18（内置 `fetch` 和 `Readable.fromWeb`）+ 系统 `tar`（Windows 10+/macOS/Linux 原生自带）。不需要 pnpm、git、docker。

## 升级 doocs/md

```bash
rm -rf framework/tools/typeset/dist
DOOCS_MD_TAG=2.2.0-assets node framework/tools/typeset/setup.mjs
```

Docker Hub 上的 tag 形如 `<version>-assets`。视觉/排版问题优先改 `content/styles/{slug}/theme.css`，下游改动不要落到 `dist/doocs/`（每次重跑 setup 会被清掉）。

## 故障排查

| 现象 | 原因 / 处理 |
|------|-------------|
| setup 时 `获取 token 失败 403/404` | Docker Hub 可能限流；稍后重试。国内网络可设 `DOOCS_MD_IMAGE` 指向镜像仓库 |
| setup 时 `tar --version` 报错 | Windows 10 以下系统不带 tar。装 Git for Windows 或 Windows 10+ |
| 端口占用 | `INKFLOW_TYPESET_PORT=8899 node framework/tools/typeset/serve.mjs` |
| 浏览器没自动开 | 手动访问终端打印的 URL |
| 栏目/文章为空 | 确认 `content/styles/*/theme.css` 或 `content/articles/*/export/08-wechat-publish.md` 存在 |
| 复制后粘贴到公众号只有纯文本 | 确认你在 `127.0.0.1` 而非 `file://`；DevTools Console 看 `isSecureContext` |
| doocs 页面某些 chunk 404 | 产物里残留 `/md/` 绝对路径而 serve.mjs 的 `/md/*` 兜底未匹配；贴 URL 过来 |
| mermaid/mathjax 渲染失败 | doocs 这些是 CDN 加载，需要网络；离线场景不支持 |
| 刷新 doocs 页面后主题被重置 | bootstrap 已主动清 URL query，不会二次注入。要切换栏目请回 launcher |

## 设计约束（给维护者）

1. **不改 doocs 的 TS/Vue 源码**。只接触 `dist/doocs/index.html`：(a) base 路径 `/md/` → `./`；(b) `<head>` 插入 3 行 `<script>` 引用，用 `<!-- InkFlow bootstrap BEGIN/END -->` 标记。
2. **不做 HTML 清洗或 inline 化**。这是 doocs juice 胶水层的职责（见 commit de3b580 删除 typesetter 的决策）。
3. **数据注入走 localStorage，不走 API/pinia**。pinia store 在 build 后路径被 hash 化，无法 import。
4. **theme.css 里保留 `color-mix()` / 伪元素的原始形态**。doocs 会在复制时通过 juice 处理。
