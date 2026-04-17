# InkFlow × doocs/md 排版器（覆盖层模式）

> **架构**：doocs/md 作为 git submodule 提供全部编辑器能力（CodeMirror 编辑 / 预览 / 复制富文本 / Mermaid / PlantUML / 图床 / AI 助手 / Light & Dark），
> InkFlow 只维护 4 份栏目主题 CSS + 一个注入脚本。**不修改 upstream 任何行为**。

## 设计立场

见 [DESIGN-MANIFESTO.md](./DESIGN-MANIFESTO.md)。核心：

1. 拒绝 2026 年 AI 模板通病（渐变紫蓝 / 玻璃拟态 / 霓虹描边 / 过度圆角 / 多层阴影）
2. 编辑质感 = 线 + 字距 + 留白，不是阴影 + 圆角
3. 四栏目必须有独立编辑部身份，不是"换色版"

可机器校验的子集在 [.design-guard.json](./.design-guard.json)，
`node scripts/design-guard.mjs` 扫描 `overlay/theme-css/*.css` 并报错。

## 目录结构

```
tools/typesetter/
├── upstream/                      # git submodule → doocs/md（只读，不手改）
├── overlay/
│   ├── columns.json               # 4 栏目元数据清单
│   ├── theme-css/
│   │   ├── ink-academic.css       # 学术前沿
│   │   ├── ink-industry.css       # 行业趋势
│   │   ├── ink-tech.css           # 技术专题
│   │   └── ink-story.css          # 人物故事
│   └── examples/                  # 4 份示例 Markdown（开发自测用）
├── scripts/
│   ├── apply-overlay.mjs          # 把覆盖层注入 upstream
│   └── design-guard.mjs           # 反 AI 设计宪章校验
├── DESIGN-MANIFESTO.md
├── .design-guard.json
└── README.md                      # 本文件
```

## 快速开始

```bash
# 一键启动：初始化 submodule → 注入 overlay → pnpm install → 启动 dev
node tools/typesetter/scripts/dev.mjs
# → 浏览器访问 http://127.0.0.1:5173
# → 顶栏主题下拉选择：学术前沿 / 行业趋势 / 技术专题 / 人物故事
```

需 Node ≥ 22.16 + pnpm。脚本是**幂等**的：第二次运行会跳过已完成的步骤，直接 `pnpm start`。

如需手动分步：

```bash
git submodule update --init --recursive            # 初次拉取
node tools/typesetter/scripts/apply-overlay.mjs    # 注入栏目
cd tools/typesetter/upstream
pnpm install
pnpm start                                         # 注意：是 start，不是 dev
```

> upstream 的 root `package.json` 用 `start` 而非 `dev`（`pnpm start` 内部转发到 `pnpm web dev`）。

## 日常工作流

| 场景 | 命令 |
|---|---|
| 改 CSS | 直接编辑 `overlay/theme-css/*.css`，保存后 `apply-overlay.mjs` 同步到 upstream |
| 新增栏目 | `overlay/columns.json` 加一条 + `overlay/theme-css/` 加一个 CSS 文件 |
| 校验反 AI 宪章 | `node scripts/design-guard.mjs`（CI 也跑） |
| 校验 overlay 与 upstream 一致 | `node scripts/apply-overlay.mjs --check` |
| 从 upstream 移除 overlay | `node scripts/apply-overlay.mjs --clean` |
| 升级 upstream | `cd upstream && git pull origin main && cd .. && node scripts/apply-overlay.mjs` |

## 主题 CSS 写作规范

每个 `overlay/theme-css/*.css` 必须：

1. **使用 upstream 的 CSS 变量**：`var(--md-primary-color)` / `var(--md-font-size)` /
   `hsl(var(--foreground))` / `var(--blockquote-background)` —— 让用户顶栏调节主色可覆盖
2. **不要 `<style>` 嵌套**、不要 `@media` / `@keyframes` / `position: absolute`（微信剥离）
3. **首字符以 `ink-` 命名**（如 `ink-academic.css`）—— 避免与 upstream 冲突
4. **通过 `node scripts/design-guard.mjs`**

详细约束参见 DESIGN-MANIFESTO.md 第 2、3 节。

## 为什么不 fork 整个仓库

方案 A（fork 整个仓库）的代价：

- 升级 doocs/md 要手工解 merge 冲突
- 主题逻辑和 upstream 代码混在一起，责任模糊
- 提交历史里"我们的改动"和"上游改动"交织

本仓库（方案 B）的保证：

- `upstream/` 是干净的 submodule，**可随时 `git pull` 升级**
- `overlay/` 是唯一的改动来源（自己的资产）
- `apply-overlay.mjs` 是确定性幂等生成，出 drift 时 `--check` 能定位

## 与 InkFlow 主 pipeline 的集成

`publisher` agent 产出的 `articles/{slug}/export/wechat.md` 可直接粘贴进 upstream 编辑器左侧。
栏目和主题选择由文章 frontmatter 的 `column` 字段驱动（`academic` → `ink-academic`，依此类推）。

未来可扩展：
- `tools/typesetter/scripts/render-wechat.mjs` —— 命令行渲染，不启动浏览器
- `config/columns.yaml` 和 `overlay/columns.json` 的 schema 对齐（同一份栏目定义）

这两条在当前覆盖层 MVP 里**未实现**，作为后续增量。

## 已知约束

- **Node ≥ 22.16**（upstream 要求），不再支持 file:// 直接使用
- **pnpm 必需**（upstream workspace 依赖）
- 启动命令多一步（`pnpm install && pnpm start`），相比原 InkFlow zero-build 实现更重

这是"依赖 doocs/md"的明确代价，对应 DESIGN-MANIFESTO 第 1 节的价值主张。

## 版权与许可

- upstream（doocs/md）：WTFPL（见 `upstream/LICENSE`）
- overlay 覆盖层（本目录其他文件）：遵循 InkFlow 仓库顶层许可
