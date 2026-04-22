# 微信公众号容器语法（作者契约）

> **source**: `../wechat-typeset/docs/container-syntax.md` + `docs/writer-contract.md`
> **仅在 `{platform}==wechat` 时加载**。其他平台不支持 `:::` 容器。
>
> 本文件是 writer / auditor / polisher / publisher 的**单一事实来源**。
> 白名单机器可读版本在 `.claude/rules/domains/wechat-article/containers.yaml`（lint.py 消费）。

---

## 契约承诺

作者只要把内容写进下列 25 个容器 + 5 个行内扩展 + 标准 GFM Markdown，wechat-typeset 保证：

- 9 套主题间切换**不塌版**
- 复制到公众号**不丢样**
- 主题 / variant 切换是**运行时用户动作**（在 wechat-typeset 本地编辑器里做），**不由 LLM 决策**

超出契约的写法（手写 HTML / class / style）不在保护范围内。

---

## 25 个合法容器（顶层允许 23 + 嵌套 2）

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

**总计 25 个 id**，其中 21 个参与主题 CSS 签名（带 ★）。`pros` / `cons` / `divider` / `free` 是结构位，不参与人格签名。

**白名单硬约束**：容器 id 必须**精确匹配**上表，不得新增、不得拼写变形。不在白名单的 `:::xxx` 一律 lint 报 error。

---

## 5 个行内扩展

| 语法 | 效果 | 说明 |
|---|---|---|
| `==高亮==` | 荧光笔底色 | markdown-it-mark |
| `~~删除~~` | 删除线 | GFM 原生 |
| `++插入++` | 插入标记 | markdown-it-ins |
| `[.着重.]` | 着重号（点在字下） | 中文排版传统 |
| `[~波浪~]` | 波浪下划线 | 中文排版传统 |

**一段内强调手段 ≤ 2 种**（`**粗体**` / `==高亮==` / `[.着重.]` 挑两种用；三种以上等于无强调）。

---

## 通用语法

```
::: name 标题文字 key=value key2="带空格的值"
任意 Markdown 正文（可含列表、图片、强调、行内扩展）
:::
```

- **name**：容器 id（上表 25 个之一，kebab-case）
- **标题**：`name` 之后、首个 `key=` 之前的空格串，被收为 `info.title`（各容器按需使用）
- **键值对**：`key=value` 或 `key="v with space"`，**仅在 open 行生效**。正文里写 `key: v`（YAML 风格）会被当作普通段落
- **正文**：两行 fence 之间仍是完整 Markdown

### `variant=` 属性

部分容器支持用 `variant=X` 覆盖默认骨架。合法 variant id 以运行时 `runtime/typeset-capabilities.json` 为准（由 `python framework/tools/_adapters/cli.py capabilities --cache` 刷新）。常见值：

| 容器 kind | 合法 variant 举例 |
|---|---|
| `admonition`（tip/warning/info/danger/note） | `accent-bar` / `pill-tag` / `ticket-notch` / `card-shadow` / `minimal-underline` / `terminal` / `dashed-border` / `double-border` / `top-bottom-rule` |
| `quote-card` | `classic` / `column-rule` / `frame-brackets` / `magazine-dropcap` |
| `compare` | `column-card` / `ledger` / `stacked-row` |
| `steps` | `number-circle` / `ribbon-chain` / `timeline-dot` |
| `divider` | `rule` / `wave` / `dots` / `flower` / `glyph` |
| `section-title` | `bordered` / `cornered` |

**writer 阶段默认不写 `variant=`**（沿用主题默认骨架）；只在内容明确要求"不同骨架"时才写。写了就必须在 capabilities.json 的 variants 白名单内。

---

## 嵌套规则

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

**唯一强制嵌套**：`pros` / `cons` 必须在 `:::: compare` 内。直接顶层 `::: pros` 会 lint 报 error。

其他容器可选嵌套（如 `::: free` 内嵌 `::: tip`），按需。

---

## 写作建议（非硬约束）

- **不要每段都加戏**：一篇文章**一个签名容器**足矣。三个 quote-card + 两个 compare + 四个 tip = AI slop。
- **默认骨架优先**：不写 `variant=` 就会用主题的默认值；`variant=` 只在"有具体视觉意图"时用。
- **能用标准 Markdown 就别用容器**：短提示用一句话，不用 `::: tip`；简单列表用 `-`，不用 `::: steps`。
- **footer-cta 的 href**：只有白名单协议（`https://mp.weixin.qq.com/s/*` / `weixin://dl/*` / `tel:` / `mailto:` / `#` 锚点）复制到公众号后可点；普通站外链会被平台渲染为灰色不可点文字。真正的站外跳转走公众号后台"阅读原文"位。
- **mpvoice / mpvideo**：只是占位，粘贴到公众号后仍需在后台编辑器"@素材库"插入原生节点。

---

## 常见错误

| 症状 | 原因 |
|---|---|
| `::: tip key: value` 被当作正文 | 键值对必须写在 open 行，不是正文 YAML 风格 |
| 嵌套容器没生效 | 外层冒号数没严格 > 内层（`::: compare` + `::: pros` 会冲突，外层必须 `::::`） |
| `::: free` 里样式"失灵" | `free` 定位就是不施加样式，需要装饰请换具名容器 |
| `variant=xxx` 被忽略 | 该容器不支持 variant 覆盖，或 `xxx` 不在 capabilities.json 合法清单内 |
| lint 报 "unknown container 'xxx'" | 容器 id 不在 25 个白名单内，拼写错误或自造新容器 |

---

## 与非 wechat 平台的差异

| 平台 | `:::` 容器 | 行内扩展 | 处理方式 |
|---|---|---|---|
| wechat | ✅ 允许（本清单 25 个） | ✅ 允许（5 个） | 直接由 writer 产出，发布后粘贴到 wechat-typeset 本地工具即可切主题复制 |
| zhihu | ❌ 禁止 | ❌ 禁止 | writer 仅用标准 GFM + `> [!TIP]` Alerts |
| juejin | ❌ 禁止 | ❌ 禁止 | 同上 |
| xiaohongshu | ❌ 禁止 | ❌ 禁止 | 同上，额外禁止代码块 |

writer 按 per-platform 派发，每次调用只处理一个平台。wechat 分支加载本文件，其他平台不加载。
