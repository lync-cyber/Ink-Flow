# Atoms Index · wechat-typeset-tool-guide

## 平台白名单（从 columns.yaml + tech.platforms.yaml 读取）

| platform | atom_selection |
|----------|---------------|
| wechat | claims, evidence-data, evidence-code, cases, pitfalls, comparison, actions |

> 说明：brief `target_platforms: [wechat]`，为唯一目标平台。`quotes` 和 `analogies` 类型不在 wechat 白名单内，已写出文件但 `platforms: []`（零平台命中），供潜在多平台扩展备用。

---

## 原子清单

| id | type | weight | platforms | length_chars | 摘要 |
|----|------|--------|-----------|-------------|------|
| claim-01 | claim | primary | [wechat] | 40 | 公众号排版平均耗时 45 分钟/篇，样式调整占 70% |
| claim-02 | claim | primary | [wechat] | 46 | wechat-typeset 用"主题人格+一键复制富文本"颠覆排版工作流 |
| claim-03 | claim | supporting | [wechat] | 44 | 微信硬约束是 2013 年遗留问题，现有工具大多绕过而非根治 |
| claim-04 | claim | supporting | [wechat] | 38 | "主题人格"是独立色板+字距+SVG motif+variant 的整体视觉身份 |
| claim-05 | claim | supporting | [wechat] | 34 | "预览=剪贴板"是硬纪律，任何粘贴后塌的分支都是 bug |
| evidence-data-01 | evidence-data | primary | [wechat] | 72 | 排版耗时 45 分钟/篇，样式调整占 70%（2025 数据） |
| evidence-data-02 | evidence-data | supporting | [wechat] | 48 | 运营者 35% 工作时间耗在排版等基础操作（2025 数据） |
| evidence-data-03 | evidence-data | supporting | [wechat] | 62 | 工具技术参数：TypeScript 78.9%，Node.js ≥ 18，v0.1.0 MIT |
| evidence-data-04 | evidence-data | supporting | [wechat] | 88 | 竞品规模：mdnice 4.6k stars，doocs/md 12.3k stars，壹伴 400 万用户 |
| evidence-data-05 | evidence-data | supporting | [wechat] | 44 | 9 套主题人格，每套含 11 个 hex token + 字距律动 + SVG motif |
| evidence-data-06 | evidence-data | supporting | [wechat] | 38 | admonition 15+ 种样式，quote 4 种，6 类 variant 可组合 |
| evidence-code-01 | evidence-code | primary | [wechat] | 398 | juiceInline.ts：CSS 内联化消除微信剥离 class 的副作用 |
| evidence-code-02 | evidence-code | primary | [wechat] | 440 | copyHtml.ts：Clipboard API 写富文本，自动降级 execCommand |
| evidence-code-03 | evidence-code | supporting | [wechat] | 198 | 四态提示块容器语法（tip/warning/info/danger） |
| evidence-code-04 | evidence-code | supporting | [wechat] | 185 | 嵌套冒号语法写 pros/cons 对比块 |
| evidence-code-05 | evidence-code | supporting | [wechat] | 98 | 步骤卡容器语法自动生成带编号徽章的教程步骤 |
| evidence-code-06 | evidence-code | supporting | [wechat] | 130 | 本地快速启动命令（git clone + npm ci + npm run dev） |
| evidence-code-07 | evidence-code | supporting | [wechat] | 212 | 新增自定义主题三步流程（复制骨架+编辑 spec+校验预览） |
| case-01 | case | primary | [wechat] | 118 | 创作者在 mdnice 重复调样式，45 分钟排版，所有文章同一风格 |
| case-02 | case | supporting | [wechat] | 116 | InkFlow pipeline 通过 skill 包驱动全自动排版产物 |
| case-03 | case | supporting | [wechat] | 110 | flex+gap 预览正常但 Android 塌陷，wxPatch 自动降级解决 |
| analogy-01 | analogy | supporting | [] | 86 | 着装类比主题人格：同一气质的不同场合着装 |
| analogy-02 | analogy | supporting | [] | 70 | 扫描成 PDF 类比 CSS 内联化：样式随元素走 |
| analogy-03 | analogy | optional | [] | 74 | 建筑验线类比构造期校验：不等建完再拆违章 |
| quote-01 | quote | primary | [] | 18 | "预览 = 剪贴板。任何预览好看、粘贴后塌的分支都是 bug。" |
| quote-02 | quote | supporting | [] | 19 | "排版是最消耗精力、却最没有创造价值的环节。" |
| quote-03 | quote | supporting | [] | 20 | "主题人格不是换皮肤，是整体视觉身份的差异化。" |
| pitfall-01 | pitfall | primary | [wechat] | 116 | SVG `#ffffff` 粘贴后变透明 → 改为 `#fefefe` |
| pitfall-02 | pitfall | primary | [wechat] | 100 | flex+gap Android 塌陷 → 用 wxPatch 或改 display:block |
| pitfall-03 | pitfall | primary | [wechat] | 94 | position/float 粘贴后消失 → 改用 block+margin/padding |
| pitfall-04 | pitfall | supporting | [wechat] | 80 | 一键复制无响应 → 需要 secure context（localhost/https） |
| pitfall-05 | pitfall | supporting | [wechat] | 58 | SVG 字号 12px 手机糊 → 正文 ≥14px，主标题 ≥18px |
| comparison-01 | comparison | primary | [wechat] | 720 | wechat-typeset vs mdnice vs doocs/md vs 壹伴助手全维度对比 |
| comparison-02 | comparison | supporting | [wechat] | 340 | 六类 variant 可选样式与适用场景对比表 |
| action-01 | action | primary | [wechat] | 138 | 技术创作者：下篇文章用 wechat-typeset 替换现有排版工具 |
| action-02 | action | supporting | [wechat] | 100 | 建立栏目视觉规范：不同题材绑定不同主题人格 |
| action-03 | action | supporting | [wechat] | 90 | InkFlow 用户：pipeline 中触发 typeset-authoring skill |
| action-04 | action | supporting | [wechat] | 86 | 排版异常自查：检查禁用属性 + validate:spec |

---

## 原子覆盖检查

### wechat（唯一目标平台）

必选 type 列表：`claims, evidence-data, evidence-code, cases, pitfalls, comparison, actions`

| 类型 | 命中数 | 状态 |
|------|--------|------|
| claims | 5 条（含 2 条 primary） | ✓ |
| evidence-data | 6 条（含 1 条 primary） | ✓ |
| evidence-code | 7 条（含 2 条 primary） | ✓ |
| cases | 3 条（含 1 条 primary） | ✓ |
| pitfalls | 5 条（含 3 条 primary） | ✓ |
| comparison | 2 条（含 1 条 primary） | ✓ |
| actions | 4 条（含 1 条 primary） | ✓ |

**最少产量检查：**
- `claims.md` 至少 1 个 weight: primary → 命中 2 条 ✓
- `evidence-data + evidence-code + cases` 合计 ≥3 → 合计 16 条 ✓

**零平台命中的类型（仅备用，不影响 wechat 覆盖）：**
- `quotes`：3 条，platforms: []，原因：tech 栏目 wechat 白名单不含 quotes 类型
- `analogies`：3 条，platforms: []，原因：tech 栏目 wechat 白名单不含 analogies 类型
