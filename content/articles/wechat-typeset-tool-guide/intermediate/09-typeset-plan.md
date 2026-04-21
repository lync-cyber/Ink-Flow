---
slug: wechat-typeset-tool-guide
platform: wechat
adapter: wechat-typeset
adapter_version: unknown  # health 降级：sibling repo dist/api/capabilities.json 缺失
contract_version: "1.0"
generated_at: 2026-04-21
---

# 排版方案 · wechat-typeset-tool-guide

## 适配器健康状态

- `python framework/tools/_adapters/cli.py health` 返回 `ok=false`：sibling repo（`C:/Users/hlin/LocalWork/GitRepo/wechat-typeset/`）已 clone 且存在 `dist/`，但 `dist/api/capabilities.json` 尚未生成。
- 降级路径：本方案的 variants/components id 均从源码 `src/variants/registry.ts`、`src/themes/*/persona.spec.ts`、`src/components-lib/registry.ts` 静态推断，所有 id 与 v1 契约保持一致。
- 用户需补跑：`cd ../wechat-typeset && npm run build`（或让该 repo 在 build 期产出 `dist/api/capabilities.json`）后再执行 `conform` 自检。

## 主题

- **id**: `tech-explainer`（技术教程指南）
- **候选对比**:
  - `tech-geek`：深色终端签名过重，与"科普+推广"、"非技术读者"的定位冲突。
  - `tech-explainer`：基调克制、教程向，`codeBlock=header-bar` 对 clone 命令展示清晰、`divider=rule` 不抢戏、标题层级节奏感强。
  - `default`：合格但无记忆点，缺乏"工具教程"的气质标识。
- **结论**: 选 `tech-explainer`。它在"工具化、功能性优先"的要求与"保留一点 tech 气质"之间做了最好的折中。

## 签名元素（全文唯一"最亮眼视觉"）

- **kind**: `admonition`
- **variant**: `terminal`（黑底绿字 manpage 终端风）
- **作用点**: `> [!IMPORTANT]`（Section 4 的"硬纪律"一句）。
- **理由**: 这是全文唯一需要"一眼记住"的断言——"预览所见即粘贴所得"。用 terminal variant 让它成为视觉锚点，同时在 `tech-explainer` 主题下也自然延续"这是个开发者工具"的底色。
- **同账号/同栏目撞车检查**: 本栏目（tech）此前无已排版文章，本签名为首次占位，后续同栏目应避免再次使用 `admonition=terminal` 作为签名。

## Variant 组合（6 类）

| kind | variant | 选择理由（why） |
|------|---------|---------|
| admonition | `terminal`（签名）/ `accent-bar`（非签名默认） | 签名点用 terminal；TIP / NOTE 用主题默认 accent-bar，不抢戏 |
| quote | `classic` | 大纲签名候选；文内 2 处 `:::quoteCard` 都是"一句话金句"场景，classic 的居中 bgSoft 最贴这种用途；避免 frame-brackets 在非技术受众里显得过分造作 |
| compare | `ledger` | 大纲签名候选；竞品 4 行 × 3 列本就是账表型对比，ledger 的横向分隔最克制，不盖过文字 |
| steps | `timeline-dot` | 大纲签名候选；Section 5 的"三步上手"是时间线而非编号选择题，timeline-dot 的圆点 + 连线比 number-circle 更匹配"依次完成" |
| divider | `rule`（主题默认） | tech-explainer 默认；3 处 `---` 都是节间断点，不应该被花纹分隔抢走注意力 |
| codeBlock | `header-bar`（主题默认） | Section 5 的 clone 命令需要显式告诉读者"这是 bash 命令"——header-bar 的语言标签正好 |

## 组件库预设

以下 id 均来自 sibling repo 源码；`admonition-terminal` 对应 `src/variants/admonition/terminal.ts`、`admonition-accent-bar` 对应 `accent-bar.ts`，其余类推。

- `admonition-terminal`（签名 · `> [!IMPORTANT]`）
- `admonition-accent-bar`（默认 · `> [!TIP]` / `> [!NOTE]`）
- `quote-classic`（2 处 `::: quoteCard`）
- `compare-ledger`（Section 5 竞品对比表）
- `steps-timeline-dot`（Section 5 三步上手）
- `divider-rule`（3 处 `---`，由主题默认供给，无需显式标注）
- `codeBlock-header-bar`（Section 5 bash 代码块，主题默认）

## 改写点索引（逐行定位）

以 `export/08-wechat-publish.md` 行号为锚。annotated 版本仅增加容器标签与 `<!-- variant=... -->` 注释，不改动任何正文字。

| # | 原文行号 | 原文骨架 | annotated 改写 |
|---|---------|---------|----------------|
| 1 | 20-22 | `::: quoteCard` ... `:::` | 包装不变，前置 `<!-- variant=classic -->` |
| 2 | 50-51 | `> [!TIP]` ... | 转换为 `::: admonition {variant="accent-bar" kind="tip"}` ... `:::` |
| 3 | 79-81 | `::: quoteCard` ... `:::` | 包装不变，前置 `<!-- variant=classic -->` |
| 4 | 95-96 | `> [!IMPORTANT]` ... | 转换为 `::: admonition {variant="terminal" kind="important"}` ... `:::`（**签名点**） |
| 5 | 112-117 | Section 5 三步 + bash 代码块 | 在 `**第一步**` 到 `**第三步**` 三段外层包 `::: steps {variant="timeline-dot"}` ... `:::`；bash 代码块保留原状（主题默认 header-bar 自动应用） |
| 6 | 129-134 | 竞品对比 `\| table \|` | 外层包 `::: compare {variant="ledger"}` ... `:::` |
| 7 | 140-141 | `> [!NOTE]` ... | 转换为 `::: admonition {variant="accent-bar" kind="note"}` ... `:::` |
| 8 | 32 / 53 / 83 / 106 / 143 / 157 / 165 | 7 处 `---` | 不改（divider-rule 由主题默认应用） |

## Constraints 自检（手工）

- [x] 所有引用 id 存在于 sibling repo 源码（等价于能力清单）：themes `tech-explainer` ✓；variants `admonition/terminal,accent-bar`、`quote/classic`、`compare/ledger`、`steps/timeline-dot`、`divider/rule`、`codeBlock/header-bar` ✓
- [x] 签名唯一：全文只有 Section 4 `> [!IMPORTANT]` 使用 `admonition=terminal`；其他 2 处 admonition 走默认 `accent-bar`
- [x] 纯 GFM 产物不污染：改写只落到 `export/08-typeset/wechat/annotated.md`，`export/08-wechat-publish.md` 不变
- [x] 字数不动：annotated 与 publish 版本正文逐段字数一致，差异仅在 `:::` 容器行与 `<!-- -->` 注释
- [x] 微信硬约束：无新增段落超 120 字；无 `<style>`/`<script>`；无 `position:`/`@keyframes`
