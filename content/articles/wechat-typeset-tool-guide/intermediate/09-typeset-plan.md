---
slug: wechat-typeset-tool-guide
adapter: wechat-typeset
adapter_version: "0.1.0"
contract_version: "2.0"
persona: tech-explainer
signature:
  container: tip
  variant: terminal
variant_overrides:
  - container: quote-card
    variant: classic
  - container: compare
    variant: ledger
  - container: steps
    variant: timeline-dot
generated_at: 2026-04-21
---

# 微信公众号排版神器 wechat-typeset：从排版痛苦到一键美化 · 排版方案

## Persona 选型

| 来源 | persona id | 理由 | 历史：同栏目此前用过几次 |
|---|---|---|---|
| 栏目推荐（columns.yaml primary） | tech-explainer | header-bar 代码块 + accent-bar admonition + see-also 延伸，教程/产品文档类首选；与本文"工具使用指南"气质完全对齐 | 0 |
| 栏目推荐（alternate） | tech-geek | manpage-log / frame-brackets 签名偏重，适合 RFC 评论与架构随笔——本文受众是"非技术读者"，这套过于工程师圈层 | 0 |
| 栏目推荐（alternate） | default | 保守退路，中性家族；缺少"这是个技术工具"的气质标识，记忆点弱 | 0 |

**最终**：选 `tech-explainer`。理由一句话：文章定位是"教非技术读者用一个开发者工具"，`tech-explainer` 的 Stripe Docs / MDN 家族正是这种"手把手跟做"气质——既保留技术工具底色，又不把读者吓跑。与栏目 primary 一致，不需要反转说明。

## 签名元素（唯一）

- **容器**：`tip`
- **变体**：`terminal`（VT220 黑底琥珀字 manpage 终端风，由 admonition 四态共享 variant 清单提供）
- **落点**：Section 04（"粘贴进去，样式永远不会'塌'"）原文第二段的 `> [!IMPORTANT]`——"预览里是什么样，粘贴进去就是什么样。这是工具的硬纪律，不是口号。"
- **为什么是它**：全文唯一需要"一眼记住"的硬断言。tech-explainer 主题的默认 admonition 是 `accent-bar`（克制），此处用 `variant=terminal` 刻意反转成"终端一条命令"式视觉，完成三件事：
  1. 在 accent-bar 的节奏里制造一次强断点，读者目光会停
  2. 与文章主题（一个开发者工具）在视觉气质上共振
  3. 不挤占同栏目未来文章的签名——terminal 在 tech-explainer 里是反常规用法，一次就够
- **撞车检查**：同栏目（tech）此前无已排版文章（`ai-taowa-shidai` 尚未进入 CP3）。本签名为本栏目首次占位；后续同栏目 tech-explainer 稿件应避免再用 `tip=terminal` 作为签名，保持此组合的稀缺性。

## Variant 组合

| 容器 | 变体 | 理由 |
|---|---|---|
| tip (signature) | `terminal` | 见上；仅用于 Section 04 的 IMPORTANT 断言 |
| tip (other) / note / warning / info | `accent-bar`（主题默认，不写 variant） | 非签名 admonition 一律回归主题默认，给 signature 让路；Section 02 的"TIP（pipeline 自动触发）"与 Section 05 的"NOTE（Node.js 版本提示）"均走默认 |
| quote-card | `classic` | 两处金句卡都是"一句话结论"场景；tech-explainer 默认 `column-rule` 偏文档引注，过轻；`classic` 居中大字号 + 引号装饰贴"截图级金句"用途 |
| compare | `ledger`（override 主题默认 `column-card`） | Section 05 的 4 行 × 3 列本就是账表型对比；`ledger` 的横向分隔克制不抢戏，与 tech-explainer 的 docs 气质兼容；`column-card` 会让表格看起来像信息卡片，失焦 |
| steps | `timeline-dot`（override 主题默认 `number-circle`） | Section 05 "三步上手"是"依次完成的时间线"，不是"三选一的编号选择题"；`timeline-dot` 的圆点 + 连线更贴时序 |
| divider | `rule`（主题默认，不写 variant） | 7 处 `---` 都是节间断点，朴素横线即可；花纹（wave/flower）会抢走标题注意力 |
| section-title | `bordered`（主题默认，不写 variant） | H2 节标题在 tech-explainer 下自动套用带边装饰；无需干预 |

## 改写点索引（逐行定位）

以 `export/08-wechat-publish.md` 行号为锚。annotated.md 仅**包**容器，不改动任何正文字数（除新增 `:::` 行外每段字符完全一致）。

| # | publish 行号 | 原骨架 | annotated 改写 |
|---|---|---|---|
| 1 | 20–22 | `::: quoteCard` ... `:::` | 改为 `::: quote-card variant=classic` ... `:::`（修正容器名 camelCase→kebab-case + 显式 variant） |
| 2 | 50–51 | `> [!TIP]` 一段 | 改为 `::: tip` ... `:::`（走主题默认 accent-bar，不写 variant） |
| 3 | 79–81 | `::: quoteCard` ... `:::` | 改为 `::: quote-card variant=classic` ... `:::` |
| 4 | 95–96 | `> [!IMPORTANT]` 一段 | **签名**：改为 `::: tip variant=terminal` ... `:::`（contract 里无 "important" 四态，统一收敛到 tip；variant=terminal 让它成为视觉锚点） |
| 5 | 112–117 | Section 5 三段 `**第N步**` + bash 代码块 | 外层包 `::: steps variant=timeline-dot` ... `:::`（bash 代码块保留在容器内；header-bar 代码块是 persona 默认，自动应用） |
| 6 | 129–134 | 竞品对比表 `\| 工具 \| 收费 \| AI 能力 \|` | 外层包 `:::: compare variant=ledger` ... `::::`（四冒号，容器内仍是 GFM 表格；persona 的 `compare` 为 variantized kind，主题会把表格格式化为账本样式） |
| 7 | 140–141 | `> [!NOTE]` 一段 | 改为 `::: note` ... `:::`（note 是 free kind 容器，无 variant；走主题默认样式） |
| 8 | 32 / 53 / 83 / 106 / 143 / 157 / 165 | 7 处 `---` | 不改（divider=rule 由主题默认自动应用；写 `::: divider` 反而多此一举） |

## 图片 src 策略

annotated.md 内的 4 张图片仍指向相对路径 `../intermediate/04b-figure/wechat/fig-0{1..4}.png`。`conform --markdown` 会报 `image src is a local/relative path`。

处理方式（本次选第 2 条）：
1. ~~上传到 CDN / GitHub / 公众号素材库换 https 链接~~（用户本次未授权上传流程）
2. **粘贴时人工补图**：用户在 wechat-typeset launcher 粘贴 annotated.md 后，在预览里手动插入 4 张图片到对应位置。meta.json 的 `validate.issues` 里留一条 `kind: "local_image_manual_upload"` 备忘，CP3 视为 `degraded` 而非 `failed`。

## 自检

- [ ] conform ok=true （待 ⑥ 跑）
- [ ] validate ok=true（issues: []）（待 ⑦ 跑）
- [x] 全文字数与 publish 相等（除容器行外每段字符逐字相同）
- [ ] 所有图片 src 为 http(s) 或 data: — **本次放行为 degraded**，issues 记 `local_image_manual_upload`
- [x] publish.md 未被改动（annotated 是旁路派生，不污染上游）
