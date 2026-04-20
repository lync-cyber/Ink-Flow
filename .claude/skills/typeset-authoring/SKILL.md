---
name: typeset-authoring
description: >
  wx-md 排版方案设计 — 基于自研排版工具（framework/tools/typeset/app）为单篇文章生成
  "主题 + 6 类 variant 组合 + 组件片段"的排版方案，产出带 `variant=X` 注释的发布稿和一份
  方案解释备忘。
  触发条件："给这篇排版"、"排版方案"、"挑主题"、"选 variant"、"typeset {slug}"、
  "文章视觉"、"换个排版风格"、"wx-md 怎么套"。
  首要原则是微信公众号平台兼容（variant 已全数验证 inline-only 且无 position/float/@media）；
  次要原则是**极端大胆**——同一栏目如果已有视觉基调，就要么贴基调做极致，要么直接相反，
  拒绝"差不多"的中庸微调。
argument-hint: "[文章 slug] [--mode=article|theme]"
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion, Bash
---

# wx-md 排版方案设计（Typeset Authoring）

为**单篇文章**决定用哪个主题、6 类 variant 骨架怎么选、每节用什么组件库片段。
产物是**排版方案 + 改写后的发布稿**，不是新主题 CSS 本身。

> 如果用户要设计**全新主题**（新增 `framework/tools/typeset/app/src/themes/{slug}/index.ts`），
> 切换到 `--mode=theme`，本 SKILL §6 有骨架指引。

**边界**：
- 本 skill 不修改 `framework/tools/typeset/app/src/` 里的渲染器 / variant 代码（那是工具开发的事）
- 本 skill 不生成 doocs/md 主题 CSS（doocs/md 已不在 InkFlow 下游链路上）
- 本 skill 的所有装饰选择**必须落在**现有 23 个 variant 或 50 个内置组件上，额外的视觉需求先提交工具开发、再在本 skill 里使用

---

## 立场宪章（全程遵守）

以下不是建议，是硬边界。违反任何一条都需回到 §2 重来。

### 宪章 1 — 微信兼容为先

变更前先看 `.claude/rules/data/platform-limits.yaml`。硬红线：
- 不得建议 variant 名单之外的骨架（任何"新骨架"提 issue 给工具开发，不在本 skill 里临时造）
- 不得在 markdown 里塞 `<style>` / `<script>` / `class=...` 以外的自定义类（依赖主题 CSS 会被微信剥）
- 不得建议 `position: *` / `float:*` / `@media` / `@keyframes` / `:hover` 驱动的效果
- `img` 宽度必须 ≤ 640（640→375 缩放系数 ≈ 0.586）

### 宪章 2 — 极端大胆，拒绝中庸

**真正的设计来自立场，不是居中**。做选择时问自己：

- 能不能把风格"再推一步"？（温和→克制，活泼→张扬）
- 如果只能留一个视觉签名，是哪个？其它一切装饰都让位于它
- 用户是否会因为"太过"而惊艳？如果答案是"用户可能觉得过头，但我们就是要这样"—— 对味
- 如果方案写出来读起来"都行"、"稳当"、"各占一半"—— 这是中庸，推倒重选

反面清单（发现任一条即是中庸，必返工）：
- admonition 全篇只用 `accent-bar`，其它 5 个 variant 一次没用
- variant 选择完全贴合 DEFAULT_VARIANTS，零覆盖、零对比
- 一段文案里同时出现 ==高亮== + [.着重.] + **加粗** 三种强调（观察等级：三强等于无强）

### 宪章 3 — 一文一签名

全文**只许有一处最亮眼的视觉签名**——要么封面卡做极致，要么 section-title 用 `cornered` + 配独特 sectionCorner SVG，要么 quote 全部 `magazine-dropcap`，不能三个都要。
每个组件都加戏 = AI slop。

### 宪章 4 — context-specific 的 why

每个决策必须能用一句**具体**的话解释：

- ✗ "我选 tech-geek 因为这篇偏技术" — 太泛，换
- ✓ "这篇 80% 的段落是 terminal 命令对齐，tech-geek 的 mono 代码块 + `terminal` admonition 能让读者扫到命令行就知道是要复制"

说不出 context → 是 AI slop，换。

### 宪章 5 — 组件库优先

能用组件库预设解决的，**不要在 markdown 里手写 fence**。组件库 50 条预设和用户自创组件都已走 `BUILTIN_COMPONENTS`，本 skill 产出的排版方案里引用组件应写它的 id（如 `admonition-tip-terminal`），用户在 wx-md 里点一下即可插入。

---

## 流程

```
①入口 → ②强制问询（≥1 轮 AskUserQuestion）→ ③主题选择 → ④ variant 组合 → ⑤组件片段规划 → ⑥改写发布稿 → ⑦自检
```

**禁止 0 交互直通**。即使用户给了完整的文稿和目标，也至少走一次 §2 的 AskUserQuestion 确认"签名元素落在哪"——因为这一项没有唯一正确答案，需要用户选择。

---

## 1. 入口判定

**必需输入**：
- 文章 slug（对应 `content/articles/{slug}/`）
- 或直接一段 markdown 文本（临时场景，不走 slug）

**可选输入**：
- `--mode=article`（默认）：给现有文章做排版方案
- `--mode=theme`：设计新 wx-md 主题（见 §6）

### article 模式

1. `Read content/articles/{slug}/export/08-wechat-publish.md`（如不存在，降级读 `intermediate/04a-draft/merged-draft.md`）
2. `Read framework/config/columns.yaml`，如果文章在某栏目下，读 `columns.{slug}.personality` 和该栏目 tone
3. `Read framework/tools/typeset/app/src/themes/index.ts`，确认当前可用主题 id 清单
4. `Glob content/styles/*/theme.css`，如果该栏目已有独立视觉产物，作为 §3 主题选择的约束

### theme 模式

见 §6。重点：全新主题是**工具开发任务**，本 skill 只能生成 Theme 对象的设计蓝图，真正的代码文件需要手动 Cd 到 `framework/tools/typeset/app/src/themes/{slug}/` 去创建并跑测试。

---

## 2. 问询（AskUserQuestion · 至少 1 轮 · **不可跳过**）

用 AskUserQuestion 把 3 个关键抉择一次发出，让用户显式选择（可多选）。

```
question: "这篇的视觉签名要落在哪里？拒绝中庸，至多选 2 项——三个以上就全无签名。"
options:
  - "封面卡 — cover 容器用大图 + 居中标题承担第一印象"
  - "章节标题 — section-title 用 cornered 骨架 + 不同寻常的 sectionCorner SVG"
  - "金句 — quote-card 全部用 magazine-dropcap（首字下沉）抓眼"
  - "提示块 — admonition 大量用 terminal 或 pill-tag（在本篇首次出现者为准）"
  - "对比 — compare 全部用 ledger（双色账本）"
  - "步骤 — steps 用 timeline-dot，把全文论证做成时间轴"
  - "分隔 — divider 用 glyph 并指定一个本栏目专属字符（❦ / § / ◆ / ❖）"
```

**关键**：用户选 ≥ 2 项时，后面 §3 的提醒里要明确说"签名应唯一，若已选 2 项请告知主次"。

必要时追加第二轮问询（**仅在 article 模式发生、且文章性质模糊时触发**）：

```
question: "这篇最核心的阅读诉求是什么？"
options:
  - "扫读流利度 — 读者 20 秒内要抓到结论（行业快讯 / 产品更新）"
  - "技术准确性 — 代码 / 命令 / 参数很多，结构强于情感（技术长文）"
  - "情感张力 — 金句密度高，情绪节奏重（人物 / 散文 / 书评）"
  - "数据密度 — 表格 / 对比 / 图表多（行业分析 / 复盘）"
```

**不做**象限（理性/感性 × 严肃/轻快）这套分法 —— 经验表明它逼人居中，反而失掉风格。

---

## 3. 主题选择

当前工具内置 5 个主题（详见 `references/themes-catalog.md`）：

| id | 基调一句话 | 极端强项 |
|---|---|---|
| `default` | 中性白底 + 蓝强调 | 稳但最易被"AI slop 化"，非特殊理由不选 |
| `tech-geek` | 深夜代码 + 霓虹 accent | terminal variant / mono 字重搭配 |
| `life-aesthetic` | 暖米 + 衬线留白 | 章节间大留白，金句页面感 |
| `business-finance` | 锐利黑金 + 规整表格 | 数据块、compare/ledger |
| `literary-humanism` | 素雅衬线 + 点状装饰 | 金句 + 引用大量使用 quote variants |

### 选择原则

- **反主流推荐**：如果 §2 里栏目 tone 指向某个主题（比如"技术栏目 → tech-geek"），先问一遍"有没有理由做反向"——比如同一技术栏目用 literary-humanism 可以让教程读起来像散文，这才是"极端大胆"的空间。
- **禁止临时改色**：用户如果想"primary 色换绿"，走 wx-md 里的 ColorCustomizer（运行时叠加层），不在本 skill 里改主题文件。
- **色盘差异**：如果同一账号里其他栏目已用过 tech-geek 的 primary 色，新栏目主题选择必须让 primary 色相差 ≥ 30° 或明度差 ≥ 20%。

---

## 4. Variant 组合

6 类骨架 × 各 3–6 选 = 共 23 个 variant。完整术语表见 `references/variants-dictionary.md`。

### 组合策略

**先定签名**（§2 AskUserQuestion 结果）→ **签名对应的 kind 选最突出 variant** → **其它 5 类 kind 选和签名"合拍"的骨架**，宁可保守也不要抢戏。

示例决策链：
- 签名 = "提示块用 terminal" → admonition: `terminal` → quote: `classic`（不抢）/ compare: `column-card` / steps: `number-circle` / divider: `rule` / section-title: `bordered`
- 签名 = "章节标题用 cornered" → section-title: `cornered` → admonition: `accent-bar`（不抢）/ quote: `column-rule`（与 cornered 的几何感合拍）...
- 签名 = "金句用 magazine-dropcap" → quote: `magazine-dropcap` → 其它 5 类全部默认骨架，把视觉带宽留给金句

### 输出格式

用表格列出 6 类骨架的最终选择，给每一条一句 context-specific 的 why：

```markdown
| kind | variant | why |
|---|---|---|
| admonition | terminal | 本篇 80% 的 tip 都是命令行操作，terminal 能让读者不用读正文就知道"这里要敲键盘" |
| quote | classic | 金句只有 1 处，不抢戏 |
| compare | ledger | 有两组 cost/benefit 对比，账本色能让读者直觉识别 |
| steps | number-circle | 步骤只有 3 个，timeline-dot 会过度 |
| divider | rule | 全文一个签名（terminal）已给足视觉重量 |
| section-title | bordered | 默认骨架 |
```

---

## 5. 组件片段规划

基于 §4 的 variant 组合，列出**本文可以直接用组件库哪些预设**。查阅：

- `framework/tools/typeset/app/src/components-lib/presets/*.ts` — 50 条内置预设
- `content/styles/_typeset/sample-full.md` — 每个 variant 的完整示例（§3–§4 的决策能直接对着抄）

输出形如：

```markdown
**可直接插入的组件库预设**：
- 开篇 → `free-intro`
- 第一段提示块 → `admonition-tip-terminal`
- 中段对比 → `compare-ledger`
- 文末 CTA → `free-footer-cta`
```

用户在 wx-md 编辑器顶部点"组件"按钮打开抽屉，按 id 找到即可插入。

---

## 6. 改写发布稿（article 模式核心产物）

从 `content/articles/{slug}/export/08-wechat-publish.md` 出发，产出：

```
content/articles/{slug}/intermediate/09-typeset-plan.md   ← 排版方案解释
content/articles/{slug}/export/08-wechat-publish.md       ← 同一文件，覆写：
                                                             加上 variant=X 的 attrs、
                                                             把合适段落包进 ::: 容器、
                                                             在每个重要 variant 前插 <!-- variant=X -->
```

**重要**：改写时不得改变**文字内容**（不删句、不重述），只改组织结构与 variant 标记。

### 09-typeset-plan.md 结构

```markdown
# 《{文章标题}》排版方案

**主题**：{theme id}
**签名元素**：{唯一的最亮眼视觉}（来自 §2 选项）
**宪章自检**：通过 {条数}/5（未通过项列在 §尾）

## Variant 组合
（§4 的表格）

## 组件库预设
（§5 的片段清单）

## 改写点索引
按 line 指向 08-wechat-publish.md 的改动：
- L12-18：包进 `::: intro` 容器
- L23：加 `<!-- variant=accent-bar -->` 注释
- L45-60：改写为 `::: compare variant=ledger`
- ...

## 未通过自检（如无则写"无"）
```

### --mode=theme（全新主题蓝图）

用户要加新主题时，本 skill 只产出**设计蓝图**，真正的代码由工具开发执行：

产物：`framework/tools/typeset/app/src/themes/{slug}/BLUEPRINT.md`

结构：
- tokens（色 / 字号 / 间距 / 圆角）一整套值
- elements（h1–h4 / p / blockquote / strong 等）关键属性
- assets（需要新画哪些 SVG，什么视觉语言）
- variants（6 类骨架，从现有 23 个中选 6 个——极端组合 > 全默认）
- templates（3–5 段典型 markdown 片段，用作 getSample(themeId) 的 body）

写完后提示用户：

> 蓝图已写到 `framework/tools/typeset/app/src/themes/{slug}/BLUEPRINT.md`。
> 要把它变成工具内可选主题，需要手动创建 `index.ts` 实现接口、跑 `npx vitest run tests/themes.spec.ts` 验证，并在 `src/themes/index.ts` 注册。
> 工具开发完成后回来告诉我，我再把本栏目的 article 模式排版方案按新主题重算。

---

## 7. 自检清单

### 7.1 微信兼容（宪章 1）

- [ ] 改写稿里所有 variant 名都在 `VARIANT_IDS` 清单中（见 `framework/tools/typeset/app/src/themes/types.ts`）
- [ ] markdown 里无 `<style>` / `<script>` / 自定义 class
- [ ] 所有图 `src` 均为 ≤ 640 宽的占位或真实 URL
- [ ] 代码块未引入非标 language（避免 highlight.js 漏识别）

### 7.2 反中庸（宪章 2）

- [ ] 签名唯一（§2 选择结果中只有一项被"重押注"，其它项保守）
- [ ] 至少 3 个 variant 非 `DEFAULT_VARIANTS`（如全部默认即"零覆盖"——返工）
- [ ] 任何一段正文里强调手段 ≤ 2（`**` / `==` / `[.着重.]` 挑 2 种用）

### 7.3 组件库优先（宪章 5）

- [ ] 能用组件库预设的地方都引用了 id（非手写 fence）
- [ ] 如有手写 fence，给出了"为什么组件库不够"的一句说明

### 7.4 可执行（产物闭环）

- [ ] 09-typeset-plan.md 的"改写点索引"能和最终 08-wechat-publish.md 逐行对上
- [ ] 跑一次 `python .claude/skills/quality-linting/scripts/lint.py content/articles/{slug}/export/08-wechat-publish.md`，error = 0
- [ ] 用户在 wx-md 里粘贴改写稿，375px 预览能完整渲染、无崩版

---

## 扩展资料

| 文件 | 何时读 |
|---|---|
| `references/variants-dictionary.md` | §4 决策时——23 个 variant 的气质 + 适用场景 + 不适用场景 |
| `references/themes-catalog.md` | §3 选主题——5 套主题的极端强项与"不要拿它做 X"的反例 |
| `content/styles/_typeset/sample-full.md` | 每个 variant 实际 markdown 是怎么写的，attrs 怎么传 |
| `framework/tools/typeset/app/src/themes/types.ts` | `VARIANT_IDS` 白名单、`ThemeVariants` 接口定义 |
| `framework/tools/typeset/app/src/components-lib/presets/*.ts` | 50 条内置预设的 id 和场景 |
| `.claude/rules/data/platform-limits.yaml` | 微信排版硬约束的单一事实来源 |

---

