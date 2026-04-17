---
name: column-designing
description: >
  栏目视觉设计 — 为 InkFlow 栏目（新建或改版）合成完整视觉系统：从用户真实话题提取意象推导主色，
  生成两套 HTML 对比预览让用户决策，最终输出 doocs/md 可直接消费的主题 CSS 到
  workspace/column-design/{slug}/theme.css（与 preview.html 同目录）。
  触发条件："新开栏目"、"新栏目视觉"、"给栏目做视觉"、"栏目改版"、"栏目主题"、"栏目配色"、
  "编辑部视觉"、"ink-xxx 主题"、"doocs 主题"、"换一套排版"。
  即使用户只说"我想开个写威士忌品鉴的栏目"或"academic 想换套视觉"，也应立即触发本 skill；
  因为"视觉决策"本身就是复杂的多步骤设计任务，不走本 skill 会变成换色临时拍脑袋。
  产物是中间资产（不进入 columns.yaml），由下游"doocs/md 主题导入"skill 接手落地。
argument-hint: "[new | revise] [column-slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion, Bash
---

# 栏目视觉设计（Column Designing）

为 InkFlow 栏目合成完整视觉系统：**用户内容 → 主色推导 → 双方向 HTML 预览 → 主题 CSS 中间产物**。

**边界**：本 skill 只产出**视觉中间产物**（CSS + 预览 HTML），不写入 `config/columns.yaml`——
columns.yaml 已剥离视觉字段，只保留业务字段（骨架 / tone / 频率 / KPI）。
视觉落地由下游 skill 接管（把 `theme.css` 导入你自部署的 doocs/md 实例作为可选主题）。

**产物位置**：
- `workspace/column-design/{slug}/preview.html` — §4 双方向预览
- `workspace/column-design/{slug}/theme.css` — §5 最终 doocs/md 主题 CSS

---

## 编辑部立场宪章（全程遵守）

以下原则定义"好"的视觉，取代原 `DESIGN-MANIFESTO.md`。它们**不是建议**，是硬边界。

### 宪章 1：反 AI slop

`AI slop` 指一眼能看出由大模型没思考地堆出来的视觉。签名：

- 克莱因蓝 / SaaS 安全蓝 / 紫蓝渐变（Violet→Indigo，`#4F46E5 → #7C3AED` 段）
- 莫兰迪奶白 / 豆沙绿 / 烟灰粉 / 杏色（公众号模板群签名）
- 霓虹青 `#00FFFF` 系、纯紫族（`#8B5CF6` 类）
- 玻璃拟态（`backdrop-filter: blur`）、≥ 3 层堆叠阴影、发光描边（`box-shadow: 0 0 Npx`）
- `border-radius ≥ 24px` 的巨型圆角
- `-webkit-background-clip: text` 文本渐变

看见候选色/装饰落入以上任一 → 换。

### 宪章 2：差异化

同一工作区里多个栏目的主色**必须有可辨识色相差**（≥ 30° HSL hue 偏移）。
否则就是"又一个换色版本"——这是 AI slop 的第二签名。

### 宪章 3：线 + 字距 + 留白承担层级

不靠阴影和圆角撑层级感。优先级顺序：

1. 字号阶梯（最大/最小比 ≥ 1.6）
2. 字重（正文 400 / 强调 600 / 标题 700）
3. 字距（`letter-spacing`）
4. 留白（`margin` / 段距 ≥ 行距 × 1.5）
5. 线（`border`、`hr`）
6. 色块
7. ...（阴影和圆角基本不用）

### 宪章 4：签名元素唯一

读者一眼记住的单点设计，**全文只 1 个**。每个组件都加戏 = AI slop。

### 宪章 5：微信兼容为先

产物要能粘进微信公众号后台且稳定。禁用被微信剥离/改写的一切：
- `position: fixed/absolute/sticky/relative`、`@keyframes`/`animation`/`@media`
- `-webkit-` 前缀
- 伪元素（`::before`/`::after`）承担**关键**装饰（可承担非关键，但必须有 fallback）
- `@font-face` / Google Fonts / Noto Web Font 外链

### 宪章 6：context-specific 的 why

每个视觉决策（主色 / 装饰 / 签名）必须能用一句 context-specific 的话解释：
"因为这账号讲 X，我想到 Y，所以选 Z"。

说不出 → 这是 AI slop，换。

---

## 流程

```
①入口判定 → ②问询 → ③主色+装饰推导 → ④HTML双方向预览 → ⑤生成 theme.css → ⑥自检
```

HTML 预览**不可跳过**——文字描述对视觉决策无感，必须让用户看见两种真实渲染。

---

## 1. 入口判定（new vs revise）

```
AskUserQuestion:
  question: "这次是新建栏目还是给已有栏目改版？"
  options:
    - "new — 新栏目（尚未在 columns.yaml）"
    - "revise — 改已有栏目（academic / industry / tech / story 或其他）"
```

### new 模式

- 问 slug（英文小写 kebab，如 `reviews` / `whisky-notes`）
- Read `config/columns.yaml`，确认 `columns.{slug}` 不存在（存在则提示冲突，问是否改为 revise）
- Glob `workspace/column-design/*/theme.css`，读出其他栏目已有的主色，在 §3 的"色相差 ≥ 30°"
  校验里作为参照

### revise 模式

- Read `config/columns.yaml` 的 `columns.{slug}`（取 `personality`，作为视觉主张的出发点）
- Read `workspace/column-design/{slug}/theme.css`（如已存在 — 可能是历史产物；不存在则从零起）
- 问改版范围：

```
AskUserQuestion:
  question: "要改什么？"
  options:
    - "整体换色 — 保留装饰家族与字号阶梯"
    - "换装饰家族 — 保留主色与字体栈"
    - "完整重做 — 全部推倒，等于 new 流程"
    - "微调某一项（H1 / 引用 / hr / 列表 / …）"
```

**整体换色 / 微调** → 跳过 §2 的象限问询，直接读现有数据 + 针对性问话
**换装饰家族 / 完整重做** → 走完整 §2–§6 流程

---

## 2. 问询（AskUserQuestion 一次发出）

1. **内容类型**：深度长文 / 短快资讯 / 人物故事 / 教程教学 / 商业产品 / 其他
2. **调性象限**：
   |          | 理性·密集      | 感性·留白     |
   |----------|---------------|--------------|
   | 严肃     | ① 学术编辑部  | ② 文学杂志   |
   | 轻快     | ③ 科技博客    | ④ 生活小刊   |
3. **具体话题 + 想避免的方向**：话题越具体越好（"诗歌评论"比"文学"好）；避免方向用"一眼不喜欢的色/风格"举例

**第二轮问询**（独立一次，禁占位符）：

> 请粘贴账号的真实内容——**正文 ≥100 字、1 个小标题、1 段引用（含出处）**。
> 用来渲染 §4 的 HTML 预览。占位符（"Lorem ipsum"、"示例标题"）会让视觉决策失真。

---

## 3. 主色 + 装饰推导

### 3.1 主色（核心立场：禁查表）

**不存在**"象限 → 预设色"的映射表。每次从**用户话题**提取具体意象 → 当场合成颜色。
硬编码预设是 AI slop 的源头。

**意象示例**（示范方法论，不是可抄的答案）：
- 独立音乐评论 → 铜管乐器反光、唱片标签旧纸、黑胶边缘
- 古籍版本学 → 朱砂批注、藏经纸、松烟墨
- 威士忌品鉴 → 琥珀、橡木桶烟、水楢木纹
- 徒步记录 → 岩壁、苔藓、远山霭
- 独立游戏评论 → 像素 CRT 余晖、磁带卷轴、早期 JRPG 配色

### 3.2 主色硬约束（以严者为准）

候选同时满足：

1. **不在宪章 1 黑名单**
2. **HSL 饱和度 ≤ 60%**
3. **明度 25–55%**（深色场景强调）/ 40–60%（浅色强调）
4. 对正文底 WCAG 对比度 **≥ 4.5**（正文强调）/ **≥ 3**（装饰线/边框）
5. 对已有其他栏目主色 **有可辨识色相差**（≥ 30° HSL hue 偏移；参照宪章 2）
6. 能用一句 context-specific 的 why 解释（宪章 6）

### 3.3 辅助色（机械推导）

主色定了，其余全部 `color-mix()` 推导，**禁硬编码 hex**（除主色、浅/深色底板）：

```css
--ink:       hsl(var(--foreground));
--ink-2:     color-mix(in srgb, hsl(var(--foreground)) 65%, transparent);
--hairline:  color-mix(in srgb, var(--md-primary-color) 15%, transparent);
--surface:   color-mix(in srgb, var(--md-primary-color) 8%, transparent);
--paper:     hsl(var(--background));
```

### 3.4 装饰家族（四选一，贯穿全文）

从以下**选一家**贯穿（引用块左饰、`hr`、H2 / H3 前缀、列表符号必须同家族）：

- **编号式**：`01` `02` …（需手写，`counter-increment` 在微信会丢失）
- **符号式**：`§` `·` `—` `›`
- **几何式**：方块、细横条、细竖条
- **极简式**：纯留白 + 字重（宪章最推荐，零装饰负担）

**硬禁**（宪章 1 / 5 的落地）：
- `linear-gradient` 作为 H1/H2 底色（尤其紫蓝段）
- `backdrop-filter: blur`
- ≥ 3 层堆叠阴影 / 发光描边 `box-shadow: 0 0 Npx`
- `border-radius ≥ 24px`
- `@keyframes` / `animation` / `@media`
- `-webkit-background-clip: text` 文本渐变
- 硬编码白底 `#fff` / `white`（破坏 dark mode）

### 3.5 字体栈（系统字体）

按象限：
- ①/③ **学术 / 科技**：无衬线 `-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`
- ② **文学**：衬线标题 `"Songti SC", "Source Han Serif", serif` + 无衬线正文
- ④ **生活**：无衬线 Medium 字重
- **代码语义栏目**：正文 mono `"SF Mono", "Fira Code", monospace`

**禁推荐** Inter / Roboto / Space Grotesk / Noto Web Font 链接——微信必失效且是 AI slop 签名。

### 3.6 签名元素（1 个，只许 1 个）

读者一眼记住的单点设计。常见模式：
- H1 下 32px 短色条（而非全宽下划线）
- 引用块切换衬线字体（和正文无衬线拉出两种声音）
- `hr` 用 80px radial-gradient 点线（而非横贯全宽）
- H2 前缀 `§` / `01` / 裸方块
- 粗体用主色而非加深黑色
- 列表符号方块 / 破折号
- 章节间纯 64px 留白代替线条

**一套一个**。每组件都加戏 = AI slop（宪章 4）。

### 3.7 主题级辅助组件（不是签名，是钩子）

公众号写作会频繁用到、但 MD 原生没有的结构，由**主题 CSS 提供样式钩子**（不归 writer
硬编码 inline style）：

- **金句居中段** `.pullquote`（CLAUDE.md 规定每篇需 1 个"截图级金句"）
- **导语卡 TL;DR** `.lede` / `.lede-tag`
- **文末 CTA 卡** `.cta` / `.cta-head`（关注 / 阅读原文 / 下期预告）
- **标签行** `.tags`（文章头 `#AI工程` `#机器人控制`）
- **图注** `.caption`（避免和 inline `em` 冲突）
- **键盘键** `kbd`（技术栏目偶尔用）

设计参数（字号 / 字距 / 颜色）按栏目气质调整，但**装饰家族必须和主文同家**（宪章 3）。
writer 通过 `<p class="pullquote">...</p>` 等内联 HTML 启用；doocs/md 复制机制会把
class 样式 inline 化到元素 `style`，粘到微信仍生效。

参数化骨架见 `references/theme.md` §四。

---

## 4. HTML 双方向预览

**不跳过**。详细骨架和 14 组件清单见 `references/preview.md`。

**产物路径**：`workspace/column-design/{slug}/preview.html`（创建目录若不存在）

**对比立场，不是参数差异**：两方向在 H1 / H2 / H3 / 引用块 / 分隔线 / 列表 / 粗体 /
行距 **≥ 5 项**系统性站队到不同立场。挑选原则：基于用户象限，选**有张力的相邻气质**
（不跨象限，也不同象限微调）。

**必须覆盖核心 14 种组件**（少一个返工）：

```
H1 / H2 / H3 / H4 / 正文段落 / 粗体 / 行内代码 / 链接
引用块（含出处 cite）/ 无序列表 / 有序列表 / 代码块 / 图片+图注 / 分隔线
```

**扩展组件按栏目取用**（tech / academic 建议全上，story / industry 按需）：

```
H5 / em 斜体 / del 删除线 / 表格 / GFM callout（note/tip）/ 脚注区
金句居中段 / TL;DR 导语卡 / 文末 CTA 卡 / 标签行 / 任务列表
```

预览里渲染了哪些扩展，§5 theme.css 就必须提供对应钩子。清单见 `references/preview.md`
§扩展组件。

HTML 底部附两方向逐项差异对比表。生成后告诉用户：

> 两套完整排版主张已渲染到 `workspace/column-design/{slug}/preview.html`，用的是你提供的真实内容。
> - **A · [气质词]** — [一句话]
> - **B · [气质词]** — [一句话]
>
> 请在浏览器打开该文件。可选 A / B、混合反馈（"A 的引用 + B 的分隔"），或都不喜欢让我换方向。

**反馈处理**：
- "选 A / B" → 进入 §5
- "A 的 X + B 的 Y" → 出第三版预览（覆写同文件），**不要直接写 CSS**
- "都不喜欢" → 回 §3 换两套新的完整排版主张（不是只换色）

---

## 5. 生成 theme.css

### 5.1 写入 `workspace/column-design/{slug}/theme.css`

**选择器体系：统一使用 doocs 特殊选择器**。产物直接粘进 doocs/md 的"自定义 CSS"框，所以
选择器命名按 doocs 上游约定：

| doocs 选择器 | 含义 | 关键要点 |
|---|---|---|
| `container` | 顶层容器 | 全局 `line-height` / 字体 / 默认色，**不是 body** |
| `h1`–`h6` | 六级标题 | 按本 skill 只用到 h1–h4 |
| `p` | 段落 | **不含**引用块内段落 |
| `blockquote` | 引用容器 | 边框 / 背景 / padding |
| `blockquote_p` | 引用内段落 | **必须单独写**，不继承 `p` |
| `strong` | 粗体 | 推荐主色强调 |
| `codespan` | 行内代码 `` `x` `` | **不是 `code`** |
| `code` | 代码**块** | `pre` 内部 |
| `link` | 普通链接 | 微信会转尾注 |
| `wx_link` | `mp.weixin.qq.com` 链接 | 保留可点击，可与 `link` 合写 |
| `image` | 图片 | **不是 `img`** |
| `hr` | 分隔线 | |
| `ul` / `ol` / `li` | 列表 | |

缺任一项 → doocs 会回退到默认样式 → 风格断裂。**13 个核心选择器必写齐**（`link` / `wx_link`
可合并成一个选择器）。

**扩展选择器按文章需求写**（预览里用到了就必须给出样式）：`h5` / `em` / `del` / `code_pre` /
`blockquote_note` / `blockquote_tip` / `table` / `thead` / `td` / `footnote` / `listitem`。

**主题级辅助组件**（§3.7 列出的金句 / 导语卡 / CTA / 标签 / 图注 / kbd）对应 `.pullquote`
/ `.lede` / `.cta` / `.tags` / `.caption` / `kbd` 等 class 钩子，参数化骨架见
`references/theme.md` §四。

**Writer 手写 fallback 清单**（伪元素 / counter / checkbox 等微信不稳定能力的替代约定）见
`references/theme.md` §五，生成 theme.css 时**必须在文件头注释声明本栏目采用的 fallback**。

**上游 CSS 变量**（必须用，让用户色盘/深浅模式生效）：
- `var(--md-primary-color)` — 主色（用户可覆盖）
- `var(--md-font-size)` — 字号基数
- `hsl(var(--foreground))` / `hsl(var(--background))` — 自动深浅模式
- `var(--blockquote-background)` — 引用背景

**文件头注释**强制结构：

```css
/**
 * InkFlow · {栏目中文名}（ink-{slug}）
 * {主色名} · {意象 1} · {意象 2}
 *
 * 设计立场（遵循 SKILL.md 编辑部宪章）：
 *   - 线 + 字距 + 留白承担层级，不靠阴影或圆角
 *   - primary 饱和度 ≤ 60%
 *   - 签名元素：{对应 §3.6 选定的一项}
 *   - 禁用：{本栏目明确不做的反例}
 *
 * 使用 upstream CSS 变量：
 *   --md-primary-color  主色
 *   --md-font-size      字号
 *   hsl(var(--foreground))  主文本
 *   var(--blockquote-background)  引用底
 */
```

参数化骨架、选择器清单、微信兼容性详表见 `references/theme.md`。

### 5.2 不动 `config/columns.yaml`

columns.yaml 已剥离视觉字段，本 skill **不写** columns.yaml。视觉产物完全在
`workspace/column-design/{slug}/` 下。

如果 `revise` 模式下用户要求同步调整 `personality` 文本（比如视觉风格从"克制"变"轻快"），
可以提示用户是否要改 columns.yaml，但 **只改 personality 一项文字**，不碰其他业务字段。

---

## 6. 自检清单

### 6.1 主色与配色

- [ ] 主色 HSL 饱和度 ≤ 60%、不在宪章 1 黑名单、对正文底对比度 ≥ 4.5
- [ ] 主色和其他栏目（`workspace/column-design/*/theme.css` 里已有的）色相差 ≥ 30°
- [ ] 主色一句话 why 说得出 context；下次同类账号不会再选它
- [ ] 辅助色全部 `color-mix()`；除 `--md-primary-color` / 浅深色底板外无硬编码 hex

### 6.2 装饰与排版

- [ ] 有且只有 1 个签名元素；装饰家族一贯（引用 / hr / 列表 / H2 前缀同家）
- [ ] 字号阶梯最大/最小比 ≥ 1.6；中文行高 ≥ 1.7、段距 ≥ leading（line-height-1）×1.5
- [ ] 核心 14 组件全覆盖；预览里出现的扩展组件都有对应 CSS（见 `references/preview.md`）
- [ ] 13 个核心 doocs 选择器写齐；预览里用到的扩展选择器 + 自定义 class 都写齐
      （完整清单和自检格子见 `references/theme.md` §六）

### 6.3 微信兼容（宪章 5）

- [ ] 无 `position: fixed/absolute/sticky/relative`
- [ ] 无 `@keyframes` / `animation` / `@media` / `-webkit-` 前缀
- [ ] 无 `backdrop-filter: blur`
- [ ] `::before` / `::after` 只承担**非关键**装饰；若承担关键装饰（签名、编号、checkbox、
      脚注上标方括号），对应项已在 theme.css 文件头注释里按 `references/theme.md` §五
      声明 Writer 手写 MD fallback
- [ ] 无 `@font-face` / Google Fonts / Noto Web Font 外链
- [ ] `border-radius < 24px`；`box-shadow` 至多单层且 rgba alpha ≤ 0.12

### 6.4 反 AI slop（宪章 1）

- [ ] 无紫蓝渐变 `linear-gradient(... violet/indigo ...)`
- [ ] 无 `-webkit-background-clip: text` 文本渐变
- [ ] 无霓虹描边（`box-shadow: 0 0 Npx`）、无≥ 3 层堆叠阴影
- [ ] 无硬编码 `#fff` / `white` 背景

---

## 输出结构（给用户看的摘要）

1. **设计语言摘要**（2–3 句 DNA 描述 + 签名元素是什么）
2. **视觉原子表**：字号阶梯 / 间距 / 主辅色 / 字体
3. **产物清单**：
   - `workspace/column-design/{slug}/theme.css`（主题 CSS）
   - `workspace/column-design/{slug}/preview.html`（本地双方向预览 + 对比表）
4. **使用方式**：
   ```
   # 本地预览
   在浏览器打开 workspace/column-design/{slug}/preview.html

   # 套进 doocs/md（自部署或在线）
   1. 打开你的 doocs/md 实例 → 主题下拉 → 自定义
   2. 粘贴 workspace/column-design/{slug}/theme.css 内容
   3. Alt/Option + Shift + F 格式化
   4. 左侧粘 08-wechat-publish.md → 右侧看效果
   5. 复制富文本 → 微信公众号后台草稿
   ```
5. **自检结果**：6.1–6.4 未通过项的清单（0 项表示全通过）

---

## 扩展资料

| 文件 | 何时读 |
|---|---|
| `references/preview.md` | §4 生成 HTML 预览时——骨架 + 14 组件 + 对比表 |
| `references/theme.md` | §5 生成 CSS 时——参数化骨架 + 微信兼容排错 |
