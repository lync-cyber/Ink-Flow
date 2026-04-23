---
name: writing-contract
description: 作者契约 — 合法产出物长什么样。writer/auditor/polisher/publisher 共享的单一事实来源。
schemaVersion: "1.0"
compatibleWith:
  wechat-typeset: ">=0.2.0,<0.3.0"
consumers:
  - .claude/agents/writer.md
  - .claude/agents/auditor.md
  - .claude/agents/polisher.md
  - .claude/agents/publisher.md
related:
  - framework/contracts/wechat-typeset.schema.json     # machine-readable 能力契约
  - .claude/rules/domains/wechat-article/containers.yaml  # lint.py 消费的白名单（本契约的机器投影）
---

> 本契约独立于 agent 升级。下游 wechat-typeset 发版新增/删除容器时，改本文件 + `compatibleWith.wechat-typeset` 版本号即可，不动任何 agent。
>
> 写作**工艺**（逐 section 推进、字数控制、衔接）在 `.claude/agents/writer.md`；本文件只定义"产出物该长什么样"。

---

## 1 · 跨平台 Markdown 基线（所有平台）

writer 在任一平台都可使用下列元素。非 wechat 平台**仅限这些**：

1. 标题 H1/H2/H3/H4（H1 全篇唯一）
2. 段落 / `**加粗**` / `*斜体*` / `~~删除~~` / `` `行内代码` ``
3. 代码块（必标语言） ` ```python ... ``` `（xiaohongshu 除外 — 改为截图占位）
4. 普通引用 `> text` — 用于作者旁白或 H1 后的摘要引言
5. **GFM Alerts**（5 种）：
   ```
   > [!NOTE]       补充说明
   > [!TIP]        建议
   > [!IMPORTANT]  重要信息
   > [!WARNING]    潜在风险
   > [!CAUTION]    红线 / 不可逆
   ```
6. 有序/无序列表
7. 表格（用于 2-5 行结构化数据）
8. 图片 `![caption](url)` / 链接 `[text](url)`
9. 分割线 `---`
10. `[N]` 上标引用标记（正文）+ 文末 H3 "参考文献" + 标准有序列表

---

## 2 · wechat 独占元素（25 容器 + 5 行内扩展）

`{platform}==wechat` 时额外允许下列元素。其他平台严格禁止（`:::` 出现 → lint A1 error）。

### 2.1 契约承诺

作者只要把内容写进下列 **25 个容器 + 5 个行内扩展 + 标准 GFM**，wechat-typeset 保证：

- 9 套主题间切换**不塌版**
- 复制到公众号**不丢样**
- 主题 / variant 切换是**运行时用户动作**（在 wechat-typeset 本地编辑器里做），**不由 LLM 决策**

超出契约的写法（手写 HTML / class / style）不在保护范围。

### 2.2 25 个合法容器（顶层允许 23 + 嵌套 2）

| 组 | id | ★ 签名 | 用途 |
|---|---|:-:|---|
| 文章结构 | `intro` | ★ | 导语卡（浅底 + 色条 + 小字） |
|  | `cover` | ★ | 封面卡（封面图 + 题头） |
|  | `author` | ★ | 作者栏（头像 + 名字 + 日期） |
|  | `section-title` | ★ | 章节标题块（比 H2 更强势） |
|  | `abstract` | ★ | TL;DR 摘要卡（business/industry 推荐） |
| 提示 | `tip` | ★ | 正向提示 |
|  | `warning` | ★ | 风险提醒 |
|  | `info` | ★ | 中性补充 |
|  | `danger` | ★ | 高风险警告 |
|  | `note` | ★ | 中性补注（参考资料/版本说明） |
| 内容 | `quote-card` | ★ | 大段金句卡 |
|  | `highlight` | ★ | 整段高亮底色块 |
|  | `compare` | ★ | 双列对比（**外层 4 冒号**包 pros/cons） |
|  | `pros` | — | compare 的正面列（**必须嵌在 `:::: compare` 内**） |
|  | `cons` | — | compare 的反面列（同上） |
|  | `steps` | ★ | 编号步骤列表 |
|  | `key-number` | ★ | 大数字 + 说明（研究报告风） |
| 导航 | `divider` | — | 装饰分隔线 |
|  | `footer-cta` | ★ | 文末 CTA 块（支持 `href=` 属性） |
|  | `recommend` | ★ | 推荐阅读列表 |
|  | `see-also` | ★ | 相关阅读链接 |
| 媒体 | `qrcode` | ★ | 二维码块 |
|  | `mpvoice` | ★ | 公众号语音占位 |
|  | `mpvideo` | ★ | 公众号视频占位（支持 `qqvid=` 渲染腾讯视频 iframe） |
| 兜底 | `free` | — | 不施加主题样式（编辑部补注等） |

**总计 25 个 id**，21 个参与主题 CSS 签名（带 ★）。`pros` / `cons` / `divider` / `free` 是结构位，不参与人格签名。

**白名单硬约束**：容器 id 必须**精确匹配**上表，不得新增、不得拼写变形。不在白名单的 `:::xxx` 一律 lint 报 error（W1）。

### 2.3 5 个行内扩展

| 语法 | 效果 | 说明 |
|---|---|---|
| `==高亮==` | 荧光笔底色 | markdown-it-mark |
| `~~删除~~` | 删除线 | GFM 原生 |
| `++插入++` | 插入标记 | markdown-it-ins |
| `[.着重.]` | 着重号（点在字下） | 中文排版传统 |
| `[~波浪~]` | 波浪下划线 | 中文排版传统 |

**一段内强调手段 ≤ 2 种**（`**粗体**` / `==高亮==` / `[.着重.]` 挑两种用；三种以上等于无强调）。

### 2.4 通用语法

```
::: name 标题文字 key=value key2="带空格的值"
任意 Markdown 正文（可含列表、图片、强调、行内扩展）
:::
```

- **name**：容器 id（上表 25 个之一，kebab-case）
- **标题**：`name` 之后、首个 `key=` 之前的空格串，被收为 `info.title`（各容器按需使用）
- **键值对**：`key=value` 或 `key="v with space"`，**仅在 open 行生效**。正文里写 `key: v`（YAML 风格）会被当作普通段落
- **正文**：两行 fence 之间仍是完整 Markdown

### 2.5 `variant=` 属性

部分容器支持用 `variant=X` 覆盖默认骨架。合法 variant id 以运行时 `runtime/typeset-capabilities.json` 为准（由 `python framework/tools/_adapters/cli.py capabilities --cache` 刷新）。常见值：

| 容器 kind | 合法 variant 举例 |
|---|---|
| `admonition`（tip/warning/info/danger/note） | `accent-bar` / `pill-tag` / `ticket-notch` / `card-shadow` / `minimal-underline` / `terminal` / `dashed-border` / `double-border` / `top-bottom-rule` |
| `quote-card` | `classic` / `column-rule` / `frame-brackets` / `magazine-dropcap` |
| `compare` | `column-card` / `ledger` / `stacked-row` |
| `steps` | `number-circle` / `ribbon-chain` / `timeline-dot` |
| `divider` | `rule` / `wave` / `dots` / `flower` / `glyph` |
| `section-title` | `bordered` / `cornered` |

**writer 默认不写 `variant=`**（沿用主题默认骨架）；只在内容明确要求"不同骨架"时才写。写了就必须在 capabilities.json 的 variants 白名单内（W2）。

### 2.6 嵌套规则

不同长度的冒号标记区分层级，**外层严格多于内层**。常用"外 4 内 3"：

```
:::: compare
::: pros 优点
- 项目 1
- 项目 2
:::
::: cons 缺点
- 项目 1
- 项目 2
:::
::::
```

**唯一强制嵌套**：`pros` / `cons` 必须在 `:::: compare` 内（W3）。直接顶层 `::: pros` → lint error。

### 2.7 硬约束速查（lint W1-W4 对应）

| 规则 | 条款 | lint |
|---|---|:-:|
| id 在 25 白名单内；拼写错误或自造容器禁止 | W1 | error |
| `variant=X` 必须在 capabilities / containers.yaml 白名单内 | W2 | error |
| `pros` / `cons` 必须嵌在 `:::: compare` 内 | W3 | error |
| 冒号配对闭合（外严格多于内） | W4 | error |
| 禁 `<style>` / `<script>` / `class=` / `id=` | — | error |

### 2.8 写作建议（非硬约束）

- **不要每段都加戏**：一篇文章**一个签名容器**足矣。三个 quote-card + 两个 compare + 四个 tip = AI slop。
- **默认骨架优先**：不写 `variant=` 就会用主题的默认值；`variant=` 只在"有具体视觉意图"时用。
- **能用标准 Markdown 就别用容器**：短提示用一句话，不用 `::: tip`；简单列表用 `-`，不用 `::: steps`。
- **footer-cta 的 href**：只有白名单协议（`https://mp.weixin.qq.com/s/*` / `weixin://dl/*` / `tel:` / `mailto:` / `#` 锚点）复制到公众号后可点；普通站外链会被平台渲染为灰色不可点文字。真正的站外跳转走公众号后台"阅读原文"位。
- **mpvoice / mpvideo**：只是占位，粘贴到公众号后仍需在后台编辑器"@素材库"插入原生节点。

### 2.9 常见错误

| 症状 | 原因 |
|---|---|
| `::: tip key: value` 被当作正文 | 键值对必须写在 open 行，不是正文 YAML 风格 |
| 嵌套容器没生效 | 外层冒号数没严格 > 内层（`::: compare` + `::: pros` 会冲突，外层必须 `::::`） |
| `::: free` 里样式"失灵" | `free` 定位就是不施加样式，需要装饰请换具名容器 |
| `variant=xxx` 被忽略 | 该容器不支持 variant 覆盖，或 `xxx` 不在 capabilities.json 合法清单内 |
| lint 报 "unknown container 'xxx'" | 容器 id 不在 25 个白名单内，拼写错误或自造新容器 |

---

## 3 · GFM Alert 使用原则（内容驱动）

5 种类型权威清单（lint.py `GFM_ALERT_TYPES` + `platform-lint-rules.yaml.allowed_types` 均以此为准）：`NOTE` / `TIP` / `IMPORTANT` / `WARNING` / `CAUTION`。

### 3.1 用法映射

| 场景 | 用哪个 |
|------|--------|
| 非主线补充、历史背景、相关链接 | `[!NOTE]` |
| 最佳实践、快捷写法 | `[!TIP]` |
| 必读的前置条件 | `[!IMPORTANT]` |
| 常见陷阱、性能坑 | `[!WARNING]` |
| 数据丢失 / 不可逆 / 红线 | `[!CAUTION]` |

### 3.2 约束

- 每篇文章 Alert 总数 ≤ 4；每类 Alert 内容 ≤ 3 行
- **不可替代原则**：Alert 只用在"正文顺序讲解会打断节奏"的场景；正文已讲清的不要再放 Alert
- 不嵌套 Alert
- 首行后可选自定义标题：`> [!TIP] 我的建议`
- **wechat 平台优先用 `::: tip` / `::: warning` 容器**（视觉更强，主题化渲染）；GFM Alerts 留给跨平台共享内容

---

## 4 · Section 结构契约

### 4.1 Section 间分隔

- 每个 `## {Section}` 之前（除第一个）必须 `---` 分割线（章节切换的视觉信号）

### 4.2 H2 章节编号（栏目主题约定）

部分栏目在 theme.css 约定 H2 由 writer 手写数字前缀（CSS counter 在微信复制时状态丢失，不可靠）。格式：

```markdown
## 01 ／ 章节名
## 02 ／ 章节名
```

数字 + 半角空格 + 全角斜杠 `／` + 半角空格 + 章节名。

**是否采用** — 查 `framework/config/columns.yaml` 的 `columns.{column}.numbered_h2`：
- `true` → 写；按 section 顺序 01/02/... 零填充 2 位
- `false` 或未声明 → 不写

> 历史备注：早期 tech 栏目默认添加，但未在 columns.yaml 声明，导致 writer LLM 从本文件示例推断行为。现已统一：**以 `numbered_h2` 字段为准，缺省视为 false**。

---

## 5 · Format 模板

### 5.1 首 section frontmatter

```yaml
---
column: {content_column}
title: "{title}"
issue: {issue_number}
date: "{date}"
tags: [{tags}]
tldr: "{summary}"   # 可选：story 按需；非 story 建议填（frontmatter 字段名，非正文标签）
---
```

### 5.2 文章开头（摘要引言）

H1 之后可跟一个 blockquote 作摘要。非 story 栏目建议始终有；story 栏目按需（故事直接开场有时更有力）。

**不要在正文里用"TL;DR"这个词** — AI 感强。要打标签就用"核心观点"、"一句话"或类似自然表达，也可直接 blockquote 不加标签。

wechat 平台可用 `::: intro` 容器替代 blockquote（视觉更抢眼）。

```markdown
# {文章标题}

> 一句话核心观点。读者 3 秒内看到的结论。
```

或（仅 wechat）：

```markdown
# {文章标题}

::: intro
一句话核心观点。
:::
```

### 5.3 Section 结构示例（wechat）

```markdown
## {Section 标题}

{正文，文内用 [N] 引用}

| 指标 | Baseline | 本方法 |
|------|----------|--------|
| AUROC | 98.8% | **99.6%** |

{正文}

::: tip 踩坑建议
≤3 行建议
:::

<!-- USER_FILL: {建议补充内容} -->
```

### 5.4 视觉断点协作

大纲每个断点标 `owner`：

| owner | 含义 |
|---|---|
| `(writer:table)` | Markdown 表格 |
| `(writer:alert)` | GFM Alert |
| `(writer:quote)` | 普通引用 |
| `(writer:container:<name>)` | 仅 wechat：`:::` 容器（如 `writer:container:highlight`） |
| `(illustrator:svg-flow)` / `(illustrator:svg-chart)` / `(illustrator:html-table)` / `(illustrator:html-card)` | illustrator 生成（最终都输出 PNG）；writer 仅插占位 `<!-- FIGURE: fig-{NN} -->` |
| `(illustrator:image-prompt)` | illustrator 产出文生图英文提示词，由用户手动生成；writer 仍插 `<!-- FIGURE: fig-{NN} -->`，publisher 会标为 `pending-user` 提醒人工处理 |

### 5.5 参考文献（academic 必须）

```markdown
---

### 参考文献

1. Zhang et al. (2025). "Paper Title". *Journal Name*.
2. [文章标题](https://url). 来源, 日期.
```

即便 `<a>` 被微信剥离，读者从纯文本仍能读出"标题—来源—日期"。禁止只有链接无说明。

### 5.6 文末运营区（所有栏目建议）

```markdown
---

### 阅读原文

{1-2 句引导文案；publisher 会统一包装}

### 关于作者

{公众号介绍 / 下期预告 / 转载说明}
```

wechat 平台可将文末运营区用 `::: footer-cta` + `::: qrcode` 容器承载。publisher 不会二次改写已有容器。

---

## 5.7 栏目特有约定

| 栏目 | 特有约定 |
|------|---------|
| academic | 必须有文末参考文献列表；H1 后必须有摘要引言 blockquote |
| industry | 通常 ≤3 个 section；表格用于事件/数据对比 |
| tech | 如用代码块必标语言；栏目不限于软件技术，不强制必须有代码块 |
| story | 摘要引言按需；行高 2.0；引用用 `> text` 即可 |

---

## 6 · 平台专属写作差异（速查）

| 平台 | 代码块 | 长段落 | 外链/仓库 | 容器 `:::` | 行内扩展 |
|------|--------|--------|-----------|----------|----------|
| wechat | 允许（围栏+语言） | ≤120 字/段 | 白名单协议可跳转；其他灰色不可点 | ✅ 25 容器 | ✅ 5 种 |
| xiaohongshu | **禁止** → 截图建议 | ≤30 字/段 + bullet | 不放外链（原生不支持） | ❌ | ❌ |
| zhihu | 允许（围栏+语言） | 宽松 | 内文可放外链 | ❌ | ❌ |
| juejin | **重度使用**（含版本标） | 技术段落允许长 | 必附 GitHub/文档 | ❌ | ❌ |

详细 `tone.rules` 以 `framework/config/columns/{column}.platforms.yaml` 为准，本表只作路径提示。

---

## 7 · 契约升级流程

1. 下游 wechat-typeset 发新版本（新增/删除容器、variant、扩展语法）
2. 改本文件的相关小节 + `schemaVersion` + `compatibleWith.wechat-typeset`
3. 改 `.claude/rules/domains/wechat-article/containers.yaml`（lint.py 机器消费）
4. 运行 `python framework/tools/_adapters/cli.py capabilities --cache` 刷新 `runtime/typeset-capabilities.json`
5. 四个消费 agent（writer/auditor/polisher/publisher）**不动**；下次调用自动按新契约运行

> 若升级是 breaking change（容器删除/重命名），`schemaVersion` bump；历史文章归档保留旧产物，不追溯重写。
