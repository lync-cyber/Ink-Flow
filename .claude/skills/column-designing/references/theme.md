# doocs/md 主题 CSS 生成指南

SKILL.md §5 触发后读此文件。内容：doocs 选择器详表、参数化 CSS 骨架、InkFlow 宪章硬约束、
微信落地排错。

---

## 一、doocs/md 选择器完整清单

**统一使用 doocs 特殊选择器**——产物既是 InkFlow 覆盖层主题，也能直接粘进 doocs/md 的
"自定义 CSS"。写 `img` 或 `.markdown h1` 全部无效。

### 核心必写（所有栏目通用）

| 选择器 | 对应 | 要点 |
|---|---|---|
| `container` | 顶层容器 | 全局 `line-height` / 字体 / 默认颜色；**不是 `body`** |
| `h1`–`h4` | 四级标题 | 本 skill 正文常用到 h1–h4 |
| `p` | 段落 | **不含**引用块内的段落 |
| `blockquote` | 引用块容器 | 边框 / 背景 / padding |
| `blockquote_p` | 引用块内段落 | **必须单独写**，`p` 样式不继承进来 |
| `strong` | 粗体 | 推荐用主色强调 |
| `codespan` | 行内代码 `` `x` `` | **不是 `code`** |
| `code` | 代码**块**文字 | `pre` 内部 |
| `link` | 普通链接 | 微信会转尾注 |
| `wx_link` | `mp.weixin.qq.com` 链接 | 保留可点击，可与 `link` 合写 |
| `image` | 图片 | **不是 `img`** |
| `hr` | 分隔线 | |
| `ul` / `ol` / `li` | 列表 | |

### 扩展选择器（文章用到则必须写，避免回落默认样式）

| 选择器 | 对应 | 何时需要 |
|---|---|---|
| `h5` | 五级标题 | 复杂结构文章或附录层级用到时 |
| `em` | 斜体（inline） | 标注英文术语 / 论文名 / 函数签名（⚠️ 某些 doocs 版本用于图注，必要时改走 `.caption` class） |
| `del` | 删除线 | "之前 → 现在"对比、废弃方案、版本升级前后 |
| `code_pre` | 代码**块**外层容器 | 控制 pre 的 padding / background / border |
| `blockquote_note` | GFM `> [!NOTE]` | 补充说明类 callout（主色左竖条 + 浅底） |
| `blockquote_tip` | GFM `> [!TIP]` | 操作提示类 callout（墨色左竖条 + 浅底） |
| `table` / `thead` / `td` | 表格 | 参数对比、benchmark、红线清单（技术栏目高频） |
| `footnote` | 脚注区 | 引论文 / RFC / 国标的正文末尾脚注清单 |
| `listitem` | li 别名 | 某些 doocs 版本在嵌套列表使用，可和 `li` 合写 |

### 上游可用 CSS 变量（必须用）

```css
var(--md-primary-color)        /* 主色，用户可改 */
var(--md-font-size)            /* 字号基数 */
hsl(var(--foreground))         /* 前景，自动深浅模式 */
hsl(var(--background))         /* 背景，自动深浅模式 */
var(--blockquote-background)   /* 引用底色，上游已约定 */
```

辅助色全部用 `color-mix(in srgb, var(--md-primary-color) N%, transparent)` 推导。
**禁硬编码 hex**，除主色本身和浅/深色底板外。

---

## 二、微信落地兼容性

doocs 本地渲染正常但复制到微信**可能失效**的特性：

| 特性 | 风险 | 降级方案 |
|---|---|---|
| `::before` / `::after` 伪元素 | 高概率被剥离 | 装饰改用 `border-image` / `radial-gradient` |
| `::marker` | 颜色丢失 | 列表符号用字符前缀 `· ` |
| `:hover` / `:focus` | 完全无效 | 删除 |
| `@keyframes` / `animation` | 失效 | 删除（宪章 5） |
| 外链 `@font-face` / Google Fonts | 失效且是 AI slop 签名 | 只用系统字体栈 |
| `counter-increment` 自动编号 | 状态丢失 | MD 里手写编号 |
| 多层 `box-shadow` | 简化或变灰 | 只用 `0 1px 3px rgba(0,0,0,.04)` 这种极浅的 |
| `position: fixed / absolute / sticky` | 失效 | 正常流布局（宪章 5） |
| `@media` | 失效 | 删除 |
| `-webkit-background-clip: text` | 文本渐变，AI slop 签名 | 用 `color: var(--md-primary-color)` |

**保留完好**：具体 hex、`color-mix()`（预计算为 hex）、CSS 变量（内联）、
`border` / `padding` / `margin` / `background-color` / `linear-gradient` /
`radial-gradient` / `letter-spacing` / `font-size` 全部族。

**注意**：`linear-gradient` 本身不禁，但**禁用 violet / purple / indigo 段**（宪章 1 反 AI slop 签名）。

---

## 三、参数化 CSS 骨架

以下骨架覆盖 doocs/md 全部 13 种选择器，所有视觉参数用 `{{...}}` 占位。**按 SKILL.md §3/§4
用户确认的方向把占位全部填实**。不要从零写。

```css
/**
 * InkFlow · {{栏目中文名}}（ink-{{slug}}）
 * {{主色名}} · {{意象 1}} · {{意象 2}}
 *
 * 设计立场（遵循 SKILL.md 编辑部宪章）：
 *   - 线 + 字距 + 留白承担层级，不靠阴影或圆角
 *   - primary 饱和度 ≤ 60%
 *   - 签名元素：{{本栏目签名元素}}
 *   - 禁用：{{本栏目明确不做的反例}}
 *
 * 使用 upstream CSS 变量：
 *   --md-primary-color      主色（用户可覆盖）
 *   --md-font-size          字号基数
 *   hsl(var(--foreground))  主文本色
 *   var(--blockquote-background)  引用背景
 *
 * 格式化快捷键：Alt/Option + Shift + F
 */

/* ==================== 全局 ==================== */
container {
  text-align: left;
  line-height: {{1.85 严肃 | 1.75 轻快}};
  font-size: {{16 严肃 | 15 轻快}}px;
  color: hsl(var(--foreground));
  font-family: {{
    ① ③  -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB",
          "Microsoft YaHei", sans-serif
    ②    "Songti SC", "Source Han Serif SC", Georgia, serif（标题用）+ 正文同 ①
    ④    -apple-system, "PingFang SC", sans-serif（Medium 字重）
  }};
  letter-spacing: 0.03em;
}

/* ==================== H1 主标题 ==================== */
h1 {
  display: block;
  font-size: calc(var(--md-font-size) * {{1.5 严肃 | 1.45 轻快}});
  font-weight: {{700 严肃 | 600 轻快}};
  line-height: 1.4;
  color: hsl(var(--foreground));
  margin: 2em 0 0.5em;
  {{
    H1 装饰，四选一（对应 §3.4 装饰家族）：
    - 下短色条：padding-bottom:0.4em; border-bottom:2px solid var(--md-primary-color);
      width: fit-content;
    - 上下双细线：padding:0.5em 0; border-top:0.5px solid; border-bottom:0.5px solid;
    - 色块底：不推荐（容易落入 AI slop 签名，需要强 context 支持才用）
    - 纯留白：无装饰，margin-bottom 拉到 1em
  }}
}

/* ==================== H2 章节标题 ==================== */
h2 {
  display: block;
  font-size: calc(var(--md-font-size) * {{1.22 严肃 | 1.15 轻快}});
  font-weight: 600;
  line-height: 1.5;
  color: hsl(var(--foreground));
  margin: {{3em 严肃 | 2.5em 轻快}} 0 1em;
  letter-spacing: 0.05em;
  {{
    H2 装饰，四选一：
    - 左 3–4px 竖条：padding-left:12px; border-left:3px solid var(--md-primary-color);
    - 编号前缀：用 MD 手写 `01 · 章节名`，这里只负责 color / letter-spacing
    - 符号前缀：用 MD 手写 `§ 章节名`
    - 纯字重：无线无色块，只靠 font-weight + letter-spacing
  }}
}

/* ==================== H3 小节标题 ==================== */
h3 {
  display: block;
  font-size: calc(var(--md-font-size) * 1.06);
  font-weight: 600;
  line-height: 1.5;
  color: {{var(--md-primary-color) 主色强调 | hsl(var(--foreground)) 纯字重}};
  margin: 2em 0 0.75em;
  {{可选：padding-bottom + border-bottom 0.5px 的 hairline}}
}

/* ==================== H4 段内小标题 ==================== */
h4 {
  display: block;
  font-size: var(--md-font-size);
  font-weight: {{600 | 500}};
  line-height: 1.5;
  margin: 1.5em 0 0.5em;
  color: {{hsl(var(--foreground)) | color-mix(in srgb, hsl(var(--foreground)) 75%, transparent)}};
}

/* ==================== 正文段落 ==================== */
p {
  margin: 0 0 {{1.5em 严肃 | 1.2em 轻快}};
  font-size: var(--md-font-size);
  line-height: {{1.85 严肃 | 1.75 轻快}};
  color: hsl(var(--foreground));
  letter-spacing: 0.03em;
  text-align: {{justify 叙事 story | left 其他}};
}

/* ==================== 粗体 ==================== */
strong {
  color: {{var(--md-primary-color) 主色强调 | hsl(var(--foreground)) 只字重不换色}};
  font-weight: 600;
}

/* ==================== 行内代码（codespan，不是 code！） ==================== */
codespan {
  padding: 2px 6px;
  margin: 0 2px;
  font-size: 0.9em;
  font-family: "SF Mono", Menlo, Consolas, "Courier New", monospace;
  color: var(--md-primary-color);
  background: color-mix(in srgb, var(--md-primary-color) 8%, transparent);
  border-radius: {{3 严肃 | 4 轻快}}px;
}

/* ==================== 代码块（code 在 pre 内部） ==================== */
code {
  font-size: 0.9em;
  line-height: 1.7;
  font-family: "SF Mono", Menlo, Consolas, "Courier New", monospace;
  color: hsl(var(--foreground));
}

/* ==================== 链接（普通 + 微信站内） ==================== */
link, wx_link {
  color: var(--md-primary-color);
  text-decoration: none;
  border-bottom: {{0.5 严肃 | 1}}px {{solid | dotted}}
                 color-mix(in srgb, var(--md-primary-color) 40%, transparent);
}

/* ==================== 引用块容器 ==================== */
blockquote {
  margin: {{1.5em 严肃 | 1.2em 轻快}} 0;
  padding: {{16 严肃 | 18 轻快}}px 20px;
  background: {{var(--blockquote-background) | transparent 无底}};
  border-left: {{3px solid var(--md-primary-color) 左竖条 | none 无边框}};
  border-radius: {{0 严肃 | 8 轻快}}px;   /* 禁 ≥ 24px */
}

/* ==================== 引用内段落（必须单独写！） ==================== */
blockquote_p {
  margin: 0;
  font-size: {{0.95em 严肃 | 0.92em 轻快}};
  line-height: 1.8;
  color: hsl(var(--foreground));
  font-style: normal;
  letter-spacing: 0.04em;
  {{可选签名（② 文学典型）：font-family 切衬线，和正文无衬线拉出声音差}}
}

/* ==================== 分隔线 ==================== */
hr {
  border: none;
  margin: {{32 严肃 | 48 轻快}}px auto;
  {{
    四选一：
    A. 纯留白：height: 0; margin: 64px 0;
    B. 短线：height: 1px; width: 40px;
       background: var(--md-primary-color); opacity: 0.5;
    C. 点线（签名推荐）：height: 24px; width: 80px;
       background-image: radial-gradient(circle,
         color-mix(in srgb, var(--md-primary-color) 50%, transparent) 1px, transparent 1px);
       background-size: 16px 100%; background-repeat: repeat-x; background-position: center;
    D. 全宽细线：border-top: 0.5px solid
       color-mix(in srgb, var(--md-primary-color) 30%, transparent);
  }}
}

/* ==================== 图片（image，不是 img！） ==================== */
image {
  display: block;
  max-width: 100%;
  margin: 1.5em auto 0.5em;
  border-radius: {{0 严肃 | 6 轻快}}px;   /* 禁 ≥ 24px */
}

/* 图注：MD 里紧跟图片下方的 em 会被 doocs 当图注渲染 */
em {
  display: block;
  text-align: center;
  font-size: 0.85em;
  color: color-mix(in srgb, hsl(var(--foreground)) 65%, transparent);
  font-style: normal;
  margin: 0 auto 1.5em;
  letter-spacing: 0.05em;
}

/* ==================== 列表 ==================== */
ul, ol {
  margin: {{1em 严肃 | 0.8em 轻快}} 0 1.5em;
  padding-left: 1.5em;
}

ul {
  list-style-type: {{square 方块 ① | disc 圆 ② | none 破折号/编号 ③④}};
}

li {
  margin: {{0.4em 严肃 | 0.3em 轻快}} 0;
  line-height: {{1.85 严肃 | 1.75 轻快}};
  color: hsl(var(--foreground));
}

ul li::marker,
ol li::marker {
  color: var(--md-primary-color);
  {{严肃象限可加 font-weight: 600，让序号锚点更强}}
}

/* ==================== 扩展选择器（文章用到则必写）==================== */

/* H5 */
h5 {
  font-size: calc(var(--md-font-size) * 0.88);
  font-weight: 600;
  color: color-mix(in srgb, hsl(var(--foreground)) 78%, transparent);
  letter-spacing: 0.06em;
  margin: 1.5em 0 0.5em;
}

/* 斜体 · inline 用（英文术语 / 论文名） */
em {
  font-style: italic;
  color: inherit;
}

/* 删除线 · 对比 / 废弃 */
del {
  color: color-mix(in srgb, hsl(var(--foreground)) 55%, transparent);
  text-decoration: line-through;
  text-decoration-color: var(--md-primary-color);
  text-decoration-thickness: 1px;
}

/* 代码块外层容器（code_pre 独立于 code 文字） */
code_pre {
  margin: 1.4em 0;
  padding: 16px 20px;
  background: color-mix(in srgb, var(--md-primary-color) 5%, hsl(var(--background)));
  border: 1px solid color-mix(in srgb, var(--md-primary-color) 18%, transparent);
  border-radius: 3px;
  overflow-x: auto;
}

/* GFM Callout · note（`> [!NOTE]`）· 语义：补充说明 */
blockquote_note {
  margin: 1.4em 0;
  padding: 14px 16px 14px 18px;
  background: color-mix(in srgb, var(--md-primary-color) 6%, transparent);
  border-left: 3px solid var(--md-primary-color);
  border-radius: 0;
  font-size: 0.93em;
  line-height: 1.75;
  color: hsl(var(--foreground));
}

/* GFM Callout · tip（`> [!TIP]`）· 语义：操作提示 */
blockquote_tip {
  margin: 1.4em 0;
  padding: 14px 16px 14px 18px;
  background: color-mix(in srgb, hsl(var(--foreground)) 4%, transparent);
  border-left: 3px solid hsl(var(--foreground));
  border-radius: 0;
  font-size: 0.93em;
  line-height: 1.75;
  color: hsl(var(--foreground));
}

/* 表格 · 参数对比 / benchmark / 红线清单 */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.4em 0;
  font-size: 0.93em;
  line-height: 1.7;
}
thead {
  border-bottom: 2px solid var(--md-primary-color);
}
thead th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: hsl(var(--foreground));
}
td {
  padding: 10px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--md-primary-color) 18%, transparent);
  color: color-mix(in srgb, hsl(var(--foreground)) 88%, transparent);
  vertical-align: top;
}

/* 脚注区 · 引论文 / RFC / 国标的正文末尾清单 */
footnote {
  font-size: 0.83em;
  line-height: 1.75;
  color: color-mix(in srgb, hsl(var(--foreground)) 70%, transparent);
}
```

---

## 四、自定义辅助 class 骨架（主题级组件钩子）

写文章会用到但 MD 原生没有的结构——**金句 / 导语卡 / 文末 CTA / 标签行**——由主题 CSS 提供
class 钩子，writer 在 MD 里通过内联 HTML 启用。**这些钩子是主题 CSS 的职责**（不是
writer 硬编码 inline style），因此在 §5 生成 CSS 时必须一并输出。

doocs/md 的复制机制会把 class 规则内联化到元素 `style` 属性，粘到微信仍生效。

```css
/* 金句 · 居中 mono + 字距铭刻 · 上方 40px 主色短线（linear-gradient 保微信兼容） */
.pullquote {
  display: block;
  margin: 1.8em auto;
  padding: 18px 0 4px;
  max-width: 560px;
  text-align: center;
  font-family: "SF Mono","JetBrains Mono",Menlo,Consolas,
               "PingFang SC","Microsoft YaHei",monospace;
  font-size: 1.03em;
  font-weight: 500;
  letter-spacing: 0.06em;
  line-height: 1.75;
  color: hsl(var(--foreground));
  background-image: linear-gradient(var(--md-primary-color), var(--md-primary-color));
  background-size: 40px 1px;
  background-repeat: no-repeat;
  background-position: center top 4px;
}

/* 导语卡 TL;DR · 文章开头摘要 */
.lede {
  margin: 0 0 2em;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--md-primary-color) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--md-primary-color) 22%, transparent);
  font-size: 0.93em;
  line-height: 1.75;
  color: hsl(var(--foreground));
}
.lede-tag {
  display: inline-block;
  font-size: 0.78em; font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--md-primary-color);
  margin-right: 10px;
}

/* 文末 CTA 卡 · 关注 / 阅读原文 / 下期预告 */
.cta {
  margin: 2.6em 0 0;
  padding: 18px 20px;
  border: 1px solid var(--md-primary-color);
  font-size: 0.93em;
  line-height: 1.75;
  color: hsl(var(--foreground));
}
.cta-head {
  display: block;
  font-size: 0.78em; font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--md-primary-color);
  margin-bottom: 6px;
}

/* 标签行 · 文章头 #tag */
.tags { margin: 0 0 1.2em; font-size: 0.82em;
        color: var(--md-primary-color); letter-spacing: 0.04em; }
.tags span { margin-right: 14px; }

/* 图注 · 避免和 inline em 冲突 */
.caption {
  display: block; text-align: center;
  font-size: 0.82em;
  color: color-mix(in srgb, hsl(var(--foreground)) 65%, transparent);
  margin: 0.4em auto 1.6em;
  letter-spacing: 0.04em;
  font-style: normal;
}

/* 键盘键 kbd · 淡底细边 + 下边加粗模拟按键厚度（如用到） */
kbd {
  display: inline-block; padding: 1px 6px;
  font-family: "SF Mono",Menlo,Consolas,monospace; font-size: 0.82em;
  color: hsl(var(--foreground));
  background: color-mix(in srgb, var(--md-primary-color) 6%, hsl(var(--background)));
  border: 1px solid color-mix(in srgb, var(--md-primary-color) 22%, transparent);
  border-bottom-width: 2px; border-radius: 2px;
}
```

> 金句 / 导语 / CTA 视觉参数按栏目气质调整，但**装饰家族必须和主文（hr、列表、callout）
> 同家**（宪章 3），不另起一套。

---

## 五、Writer 手写 fallback 规范（微信兼容的写作约定）

有些视觉效果 CSS 做不到稳定落地微信——必须靠 writer 在 MD 里手写实现。§5 生成的
theme.css 顶部注释**必须**声明本栏目采用的 fallback 清单（把下面适用项抄进去）。

| 视觉需求 | CSS 做不到的原因 | Writer MD 写法 |
|---|---|---|
| H2 编号前缀（`01 ／ 02 ／`） | `counter-increment` 状态在微信丢失，`::before` 被剥离 | `## 01 ／ 章节名` |
| 任务列表勾选 | GFM `- [x]` 的 `<input type="checkbox">` 在微信被剥离 | `- ✅ 已完成` / `- ☐ 未完成` |
| 脚注引用上标 | `.footnote-ref::before/::after` 伪元素在微信被剥离 | `<sup class="footnote-ref">[1]</sup>` |
| H1 下短色条 | `::after` 伪元素不稳定（若设计选该签名） | 改用 `padding-bottom + border-bottom: 2px; width: fit-content` |
| `hr` 点线装饰 | `::before` 装饰被剥离 | 改用 `background-image: radial-gradient(...)` |
| 主题级辅助组件 | `.pullquote` / `.lede` / `.cta` / `.tags` / `.caption` | `<p class="pullquote">金句</p>` 等 HTML 内联 |
| callout 语义化 | — | `> [!NOTE]` / `> [!TIP]` GFM 语法 |

主原则：**CSS 做结构 + 颜色 + 字距**，writer 做**字符前缀和语义 HTML 内联**。

---

## 六、组件覆盖自检

写完 CSS 后对照**核心必写**清单，缺一项该组件会走 doocs 默认样式：

```
☐ container  ☐ h1   ☐ h2   ☐ h3  ☐ h4
☐ p          ☐ strong       ☐ codespan   ☐ code
☐ link       ☐ wx_link      ☐ blockquote ☐ blockquote_p
☐ hr         ☐ image        ☐ ul/ol/li
```

再对照**扩展清单**（本文章用到的必须都写）：

```
☐ h5         ☐ em   ☐ del
☐ code_pre                    ☐ blockquote_note  ☐ blockquote_tip
☐ table / thead / td          ☐ footnote         ☐ listitem（按需）
```

再对照**自定义辅助 class**（用到的必须都写，见 §四）：

```
☐ .pullquote（有金句则必写）
☐ .lede / .lede-tag（有 TL;DR 卡则必写）
☐ .cta / .cta-head（有文末 CTA 卡则必写）
☐ .tags（有标签行则必写）
☐ .caption（有图注则必写）
☐ kbd（有键盘键则必写）
```

**Writer fallback 声明**（§5 填入 theme.css 文件头）：

```
☐ 已在 theme.css 文件头注释里声明本栏目 fallback 约定（§五表格对应项抄进去）
```

**规则核对**（微信兼容 + 反 AI slop，与 SKILL.md §6.3 / §6.4 呼应）：

```
☐ container 有 line-height、font-family
☐ blockquote_p 和 p 分开写了（否则引用块字体会错乱）
☐ codespan 和 code 分开写了
☐ link 和 wx_link 都存在（或合并成一个选择器写）
☐ image 不是 img（否则样式不生效）
☐ 辅助色都走 color-mix，除 --md-primary-color / 浅深色底板外无硬编码 hex
☐ 没有 :hover / @keyframes / @font-face / @media / position:fixed/absolute
☐ 没有 linear-gradient(... violet/purple/indigo ...)
☐ 没有 backdrop-filter
☐ border-radius 全部 < 24px
☐ box-shadow 单层且 rgba alpha ≤ 0.12
☐ 伪元素装饰有 fallback（写进 §5 Writer fallback 清单）
```

---

## 七、三套参考起点（非终点）

下面三组**参数组合**各代表一种完整立场，可作为 §4 填骨架的起点。**不是抄答案**——主色按
§3.1 用户话题推导，装饰细节按 §4 用户反馈调整。

### 起点 A：衬线编辑部（② 文学杂志典型）

```
H1:  font-family 衬线 + 700 + 下 2px 短色条（width: fit-content）
H2:  左 3px 实线竖条 + padding-left: 14px
H3:  主色 + border-bottom 0.5px hairline
引用:左竖条 + var(--blockquote-background) + blockquote_p 切衬线字体（签名）
粗体:主色 + 600
列表:ul 方块 list-style:square, ::marker 主色
hr:  80px 宽 radial-gradient 点线
行高:1.85, 段距: 1.5em
```

### 起点 B：Mono 极简（③ 科技博客典型）

```
H1:  无衬线 700 + 无装饰，纯字号立标题
H2:  无衬线 600 + 左 4px 主色粗条 + padding-left: 12px
H3:  主色 + 纯字重，无线（签名：H3 前缀 ›）
引用:var(--blockquote-background) + border-radius: 6px + 单层轻阴影
粗体:主色 + 600
列表:ul ::marker 主色，整体紧凑
hr:  全宽 0.5px 细线，opacity 0.4
行高:1.75, 段距: 1.2em
```

### 起点 C：留白随笔（④ 生活 / ② 文学偏极简）

```
H1:  无衬线 600 + 无装饰 + margin-bottom: 48px（签名：章节间纯留白）
H2:  无衬线 600 + 上 margin: 64px 纯留白
H3:  纯字重，同正文色
引用:无边框 + 左右缩进 padding: 0 24px + blockquote_p 字号降一档
粗体:只字重不换色
列表:ul 用字符前缀破折号（MD 手写 `— 项`）
hr:  height: 0 + margin: 64px 0（纯留白）
行高:1.85, 段距: 1em
```

---

## 八、使用与排错

最终产物给用户的说明：

```
1. 本地预览
   浏览器打开 workspace/column-design/{slug}/preview.html

2. 粘到 doocs/md（自部署或在线）
   打开你的 doocs/md 实例（或 https://md.doocs.org）
   右上角主题下拉 → 自定义 → 粘贴 workspace/column-design/{slug}/theme.css 内容
   Alt / Option + Shift + F 格式化
   左侧 MD 编辑，右侧实时预览

3. 落地微信
   点"复制" → 粘贴到公众号后台草稿
   手机扫码预览，确认引用竖条 / hr / 列表符号颜色都保留
```

**常见问题**：
- 样式不生效 → 检查选择器名（`image` 不是 `img`、`codespan` 不是 `code`、`blockquote_p` 必须单独写）
- 引用块字体错乱 → 漏写 `blockquote_p`
- 色盘换色无反应 → 硬编码了 hex 而不是 `var(--md-primary-color)`
- 深色模式文字看不清 → 写死了 `#1A1A1A`，应换成 `hsl(var(--foreground))`
- 微信里伪元素装饰丢失 → 改用 `border` / `background-image`，或 MD 里手写字符前缀
