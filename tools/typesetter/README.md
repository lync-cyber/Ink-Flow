# InkFlow 微信公众号排版器

> **零构建、零后端、单文件内联数据，双击 `index.html` 即可使用。**
> 输入标准 Markdown + YAML frontmatter，粘贴到公众号后台样式保真度优先。

## 设计原则

1. **file:// 直接可用**：所有运行时数据（SKELETONS / PALETTES / 默认 MD）内联在 `src/config/` 与 `index.html` 中，不依赖 fetch
2. **栏目 = 骨架（结构）+ 色板（颜色）+ 原语（形态）三层解耦**
   - 骨架（`SKELETONS`）只声明差异：bullet 字符、引号字符、HR 装饰、字体族、`primaryMeta(meta)`、`sigText(meta, name)`、`pipeline`
   - 色板（`PALETTES`）只记录主/强调色 6 种独立卡，运行时可下拉切换
   - 原语（`themes/primitives/callout-*.css`）4 种 callout 形态，每个栏目挑一种 + 一组 5 种语义颜色 → 视觉差异化由形态承载，色彩仅决定语义
3. **标准 Markdown + GFM Alert（5 种）+ 可选 frontmatter**：不引入 `:::block` 扩展
4. **内联即兼容**：复制时把 computed style 烘焙为 `style=""`、剥离 class，再走 `wechat-fixes.js` 3 个 pass（合并补丁），公众号后台完整保留
5. **Light / Dark 双主题**：每个栏目都定义了 `.is-dark` 变量覆盖；切换 🌙 直接影响导出 HTML
6. **代码块 catppuccin + highlight.js**：Light 模式走 latte 浅色调色板（不再深块嵌白页），Dark 走 mocha；语法高亮通过 hljs CDN，hljs class 经 `hljs.css` 桥接到栏目色板变量

## 快速使用

双击 `index.html` 在浏览器中打开即可。

### 顶栏控件

| 控件 | 用途 |
|------|------|
| 栏目 pill | 切换 4 个栏目，未编辑过内容会自动载入对应示例 |
| 色板下拉 | 6 种预设色板（靛蓝·赭石 / 松石·琥珀 / 午夜·暗绿 / 赭棕·焦糖 / 玫瑰·橄榄 / 石墨·金）|
| 主色 picker | 进一步微调 primary 色，按 ↺ 恢复 |
| 🌙 / ☀ | Light / Dark 切换。**会影响复制结果** |
| `</>` | 查看生成的 inline-styled HTML |
| 复制富文本 | 写入剪贴板（含 `text/html` + `text/plain` 双 MIME） |

### Spec 栏

**排版组**：字号（13–18px）/ 行高（1.4–2.2）/ 字距（0–2px）

**布局组**：横边距 8–32px / 纵边距 8–40px / 段距 0.6–2em / 章距 1–4em

按「重置参数」恢复栏目默认。

### 可选 HTTP 服务

```bash
python3 -m http.server 8000
# 访问 http://localhost:8000/tools/typesetter/
```

所有数据都已内联，HTTP 服务并非必需。

## 目录结构

```
tools/typesetter/
  index.html              入口；topbar + specbar + 4 份默认 MD 脚本块 + 模块加载顺序
  wechat-fixes.js         WeChat 兼容补丁（3 个 pass：元素级 / 结构变更 / 容器剥壳）

  themes/
    base.css              共享排版 + Light/Dark 兜底变量 + GFM Alert 公共骨架
    tokens.css            工具自身 UI（topbar / specbar / 手机框 / 源码视图）
    primitives/           视觉原语：栏目按需挂载
      callout-banner.css    学术：上下双线 + 浮顶标签头
      callout-card.css      行业：浅米底卡片 + 实色徽章
      callout-window.css    技术：mac IDE 窗口 + 等宽 titlebar
      callout-bare.css      故事：无边框 + 居中斜体
      tag-pill.css          统一高宽的 inline 标签
      ref-list.css          参考文献紧凑样式 + 浏览器滚动
      code-light.css        代码块 catppuccin-latte 调色板
      code-dark.css         代码块 catppuccin-mocha 调色板
      hljs.css              hljs 类映射到栏目语义色变量
    columns/              栏目仅声明差异（继承 base + primitives）
      academic.css          学术前沿
      industry.css          行业趋势
      tech.css              技术专题
      story.css             人物故事

  src/
    parsers/
      frontmatter.js        YAML frontmatter 最小解析
      hr-scanner.js         hr 风格扫描（line / star）
      gfm-alert.js          marked 扩展：GFM Alert → <section class="alert">
    config/
      font-stacks.js        sans / serif / mono 字体栈
      palettes.js           6 个独立色板
      alert-presets.js      5 栏目 × 5 类型的 alert 标题预设
      skeletons.js          SKELETON_BASE + 4 栏目差异 + DEFAULT_PIPELINE
    decorators/             pipeline 注册表 + 12 个独立 decorator
      pipeline.js             registerDecorator + runPipeline
      header.js               H1 + 摘要打包 col-header
      tag-pills.js            industry 头部 tag 列表
      callout.js              注入 .alert-title（含 tech 的 $ 前缀）
      code-block.js           包 .code-block + 头部 + hljs（可选）
      bullets.js              ul/ol 子弹与序号
      hr-deco.js              hr 装饰文字
      blockquote.js           引用大引号
      h2-line.js              story 的 H2 装饰行
      h3-prefix.js            tech 的 › 前缀
      col-label-prefix.js     tech 的 // 注释前缀
      ref-list.js             参考文献包 .ref-list
      footer.js               文章签名
    exporter/
      bake.js                 inline style 烘焙（bakeOne + bakeInlineStyles）
      copy.js                 buildExportHtml + copyRichText
    hljs-adapter.js         highlight.js 适配（CDN 失败安全降级）
    state.js                单一可变状态对象
    render.js               render() + applyStyles()
    main.js                  事件绑定 + 初始化
```

## 三层架构（骨架 + 色板 + 原语）

### 骨架（SKELETONS）

仅声明每个栏目"和别人不一样"的字段。共同基线放在 `SKELETON_BASE`，用 `Object.assign` 浅合并。

| 字段 | 决定 |
|------|------|
| `fontKey` | 字体族（sans / serif / mono） |
| `fontSize / lineHeight / letterSpacing` | 排版基线 |
| `paragraphGap / sectionGap` | 间距基线 |
| `pagePaddingX / pagePaddingY` | 页边距基线 |
| `ulBullet` | 无序列表 bullet 字符（· → ▶ ◦） |
| `olMode` | 序号样式（plain / badge） |
| `hrDeco` | HR 装饰文字（§ / · · · / ✦） |
| `quoteOpen / quoteClose` | 引用块大引号 |
| `h2DecoLine` | H2 下方是否注入 — · — |
| `h3Prefix` | H3 前缀字符（tech 用 ›） |
| `colLabelPrefix` | 头部 label 前缀（tech 用 //） |
| `tagsAsPills` | 是否把 meta.tags 渲染为统一 pill 列表 |
| `codeHead` | `{ dots, lang }` |
| `primaryMeta(meta)` | 函数：决定头部右侧 meta 字符串 |
| `sigText(meta, name)` | 函数：决定底部签名字符串 |
| `pipeline` | 装饰执行顺序（null = `DEFAULT_PIPELINE`） |

### 色板（PALETTES）

6 个独立色卡，仅记录 `primary + accent`。可通过顶栏下拉覆盖任一栏目。

### 原语（primitives/）

视觉差异化的"形状"与"色彩"分开：

- **形状**（callout-banner / card / window / bare）：每个栏目独占一种形态
- **语义色彩**（5 个 `--alert-*-color`）：5 类 alert 共用语义色，CSS 仅切 `--alert-color` 变量
- **代码块**（code-light + code-dark）：catppuccin 双主题，所有栏目共用

## 装饰流水线（pipeline）

`render()` 调用 marked 后，运行 `runPipeline(previewEl, ctx)`。每个 decorator 在自己的文件里 `InkFlow.registerDecorator(name, fn)`。`SKELETON.pipeline` 为 `null` 时用 `DEFAULT_PIPELINE` 顺序：

```
header → tagPills → callout → codeBlock → bullets → hrDeco
       → blockquote → h2Line → h3Prefix → colLabelPrefix
       → refList → footer
```

要新加视觉特性 → 写一个新 decorator + 在 `pipeline` 里插一行，无需触碰其它文件。

## 支持的 Markdown 语法

| 语法 | 效果 |
|------|------|
| `# / ## / ### / ####` | 标题（各栏目差异化渲染） |
| `**bold** *italic* ~~del~~` | 行内格式 |
| `` `code` `` | 行内代码 |
| ` ```lang ` | 代码块（hljs 自动高亮 + 头部样式按骨架） |
| `> text` | 引用（首段被识别为摘要） |
| `> [!NOTE/TIP/IMPORTANT/WARNING/CAUTION] 自定义标题` | GFM Alert（标题按栏目预设；自定义优先） |
| `- / 1.` | 列表（各栏目 bullet 差异化） |
| `[text](url)` | 链接 |
| `![alt](url)` | 图片 |
| `\| col \| col \|` | 表格 |
| `---` / `***` | 分割线（`***` 渲染为 accent 强调风格） |
| YAML frontmatter | `column / issue / date / tags / read_time / difficulty / prerequisites / author` |
| `## 参考文献` + `1.` 列表 | 自动包成紧凑 `.ref-list`（≥ 8 条预览启用滚动；微信端展示完整列表） |

**不支持**（故意丢弃）：
- `:::block` 扩展容器（微信会剥离）
- `<style>` / `<script>` 内联标签
- class-based 样式

## frontmatter 示例

```yaml
---
column: academic          # academic / industry / tech / story
title: "文章标题"
issue: "001"              # academic: 期号 → VOL.001
date: "2026.04.16"        # industry: 显示在徽章右侧
tags: ["融资", "并购"]    # industry: pill 列表；tech: #tag
read_time: "8 分钟"       # tech: metabar；其他栏目: meta-strip
difficulty: "进阶"        # tech: metabar
prerequisites: "Rust 基础" # tech: metabar
author: "李微"            # story: 显示 "by 李微"
---
```

## Alert 标题预设

每个栏目对 5 种 alert 类型定义自己的默认标题，自动差异化：

| 类型 | academic | industry | tech | story |
|------|----------|----------|------|-------|
| NOTE | 注释 | 行业速览 | 技术备注 | 旁白 |
| TIP | 方法说明 | 操盘建议 | 工程经验 | 幕后 |
| IMPORTANT | 关键约束 | 战略信号 | 决策前提 | 转折点 |
| WARNING | 局限 | 监管风险 | 坑点警告 | 阴影面 |
| CAUTION | 反例 | 黑天鹅 | 禁忌操作 | 伤痕 |

文章里写 `> [!IMPORTANT] 自定义标题` 仍然优先级最高（兼容 GFM）。

## 栏目渲染差异速查

| 元素 | academic | industry | tech | story |
|------|----------|----------|------|-------|
| H1 | 左对齐 + 加粗 | 左对齐 + 紧凑 | 左对齐 + 紧凑 | **居中 + 字重 400** |
| H2 | 底线 2px | 实色色块（白字） | 等宽 + 4px 主色竖条 | 居中 + `—·—` 装饰行 |
| H3 | 3px 赭石竖条 | 4px accent 竖条 | `›` 前缀 + 等宽 | 居中斜体 |
| 列表 | `·` + 期刊感 | `→` + 奇数条纹 | `▶` + accent 数字 badge | `◦` 空心点 |
| 分割 | `§` 分节符 | 双细线 | `· · ·` 三点 | `✦` |
| 引用 | 蓝灰底 + 主色边框 | 米底 + accent 边框 | 暗底 + 绿边框 | **居中 + 大引号 + 斜体** |
| Alert | 上下双线 + 浮顶标签 | 实色徽章卡片 | mac IDE 窗口 + `$` | 无边框居中斜体 |
| 代码头 | 浅条 + lang | 浅条 + lang | mac 三圆点 + lang | 浅条 + 斜体 lang |
| 头部 | 4px 主色竖条 + VOL.XXX | 实色 pill + 日期 + tag | `// ` 注释名 + metabar | 居中大字距 + by 作者 |

## Light / Dark 双主题

每个 `columns/X.css` 都为 `.article.col-X` 定义 light 默认色板，并为 `.article.col-X.is-dark` 提供 dark 覆盖。`base.css` 提供 `.article.is-dark` 兜底。

🌙 / ☀ 按钮切换 `.article` 的 `is-dark` class，**触发 re-render → re-bake**，因此**导出 HTML 也是对应深色版**。

## 微信兼容补丁（wechat-fixes.js）

烘焙 inline style 之后、写入剪贴板之前，按 3 个 pass 顺序处理：

1. `passElementPatches` — 全树 1 次遍历，合并：top→translateY、剥 var()、tspan 强 fill、img width/height→style、清噪声 props、清 data-*
2. `passStructure` — SVG 前后插占位 section、嵌套 ul/ol 从 li 中提升
3. `dropScrollContainer` — 剥 max-height / overflow（`.ref-list` 浏览器滚动 → 微信端完整列表）

## 致谢

- 初版 CSS 参考 [doocs/md](https://github.com/doocs/md)（WTFPL），现已大幅重写形成栏目身份
- 微信补丁集思路借鉴 [doocs/md](https://github.com/doocs/md) 多年踩坑实践
- 代码块色板参考 [catppuccin](https://github.com/catppuccin/catppuccin)（MIT）
- GFM Alert 实现思路参考 [marked-alert](https://github.com/bent10/marked-extensions)
