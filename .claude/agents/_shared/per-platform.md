# Per-Platform Agent 共享契约

> 所有 `per_platform: true` 的 agent（outliner / writer / illustrator / auditor / polisher / publisher）**按需加载本文件**，不再在各自主文件里重复这些规则。

## 运行契约

orchestrator 会用 `per_platform: true` 为同一阶段派发 N 次（N = `brief.target_platforms` 数量），每次在环境中提供：

| 变量 | 来源 | 用途 |
|------|------|------|
| `{slug}` | brief.slug | 文章路径主键 |
| `{platform}` | brief.target_platforms 之一 | 当前这批处理的目标平台 |
| `{column}` | brief.content_column | 栏目 ID，已规范化 |

同一平台的 6 个 per-platform agent（outline → draft → figures → audit → polish → publish）**共享同一 `{platform}` 值**，产物路径用这个值做目录。

## Profile 配置加载（渐进披露）

1. 确认 `runtime/profile-resolved/` 已存在（缺失则先跑 `python framework/tools/profile_resolver.py`）
2. 读 `runtime/profile-resolved/constraints.yaml`，定位下列字段：

| 字段路径 | 含义 | 主要消费 agent |
|------|------|-----------------|
| `length.{target,min,max,softFactor,hardFactor}` | 本篇长度预算与越界弹性 | writer / polisher / auditor |
| `columns.{column}.kpiTargets` | 栏目 KPI 基准 | auditor（传播性评分） |
| `columns.{column}.defaultOpening` | 栏目默认开头策略 | outliner / writer |
| `columns.{column}.defaultCta` | 栏目默认 CTA | outliner / polisher |
| `columns.{column}.numberedH2` | H2 数字前缀约定 | writer / polisher |
| `columns.{column}.titleGuidance` | 标题写作指引 | outliner / polisher |
| `forbidden.phrases` / `forbidden.patterns` / `forbidden.phraseReplacements` | 禁用与替换 | writer / polisher / auditor |
| `compliance.sensitiveWords` | 敏感词扫描（warning-only） | publisher |

3. 读 `runtime/profile-resolved/typesetting.yaml`：

| 字段路径 | 含义 | 消费 agent |
|------|------|-----------|
| `paragraph.maxChars` / `sentence.maxChars` | 段落/句子硬上限 | writer / polisher / auditor |
| `heading.numberedH2` | 数字前缀格式 | writer |
| `containers.whitelist` / `containers.mustNest` / `containers.variants` | 容器语法白名单 | writer / polisher / publisher |
| `inlineExtensions.allowed` | 行内扩展白名单 | writer / polisher |
| `cssSafety.forbiddenProperties` / `forbiddenTags` | CSS / HTML 标签守门 | polisher / publisher |
| `svg.*` | SVG 可读性下限 | illustrator |
| `imageWidth` | 图片适配宽度 | illustrator |

4. 读 `runtime/profile-resolved/voice.md` / `principles.md` 作为风格基线（markdown，整段解读）

**未定义字段的回退规则**：
- `constraints.columns.{column}` 缺失 → agent 报错「当前 Profile 未配置 {column} 栏目」
- 字段缺失 → 用 `framework/contracts/writing-kernel.md § 6 Kernel 默认` 段
- 平台专属字段缺失 → 视为该平台未在当前 Profile 声明，按通用 kernel 默认理解

## 输出路径约定

产物路径从 `framework/config/artifact-layout.yaml` 读取，**凡含 `{platform}` 占位的 key 都要替换**。常用：

| 阶段 | artifact-layout key | 展开示例（platform=wechat） |
|------|---------------------|------------------------------|
| outline | `outline` | `intermediate/03-outline/wechat.md` |
| draft | `draft_merged` / `draft_section` | `intermediate/04a-draft/wechat/merged-draft.md` |
| figures | `figure_index` / `figure_item` | `intermediate/04b-figure/wechat/figure-index.md` |
| audit | `audit` | `review/05-audit/wechat.md` |
| polish | `polish_trace` / `final` | `review/06-polish/wechat.md` + `export/07-final/wechat.md` |
| publish | `publish` | `export/08-wechat-publish.md` |

**绝对禁止硬编码 wechat** —— 写路径时一律用 `{platform}` 占位。

## 跨平台依赖读法

per-platform agent 可以读**同平台**上一阶段的产物（如 writer 读 `03-outline/{platform}.md`），但**不得跨平台读取**（writer 处理 zhihu 时不能读 `04a-draft/wechat/`）。如需"复用 wechat 内容"，orchestrator 会通过 atoms 银行桥接，而不是让 agent 互相耦合。

## 校验基线

所有 per-platform agent 在自己的 Exit Criteria 里额外满足：

- 产物路径含正确的 `{platform}` 目录/后缀
- 遵守 `constraints.forbidden.*` 的禁止项（至少不新引入违规）
- 字数 ≤ `constraints.length.max × constraints.length.hardFactor`（硬上限弹性）

## 与 lint 的接口

涉及平台差异的格式校验（CSS 安全/图片规格/段落长度/容器 W1-W4）由 `quality-linting` skill 的 `lint.py --platform {platform}` 完成。**全流程只跑一次**——在 publisher 终稿守门：

| 调用方 | 输入 | 目的 |
|--------|------|------|
| `publisher` Step 6 | `export/08-{platform}-publish.md` | **唯一**终稿守门：W1-W4 / 通用规则若有 error 直接停止导出 |

**职责分工**：

- `auditor` **不**调 lint —— 只评文学/语义质量（事实/AI 味/风格/句式/标题/传播性），不做机械格式校验。容器合法性如果有显眼问题，会在自由文本中提醒，但不强制纳入维度表。
- `polisher` **不**自行调 lint —— 基于 audit 报告逐条修复，并按 Profile `typesetting.containers.whitelist` 在内存中自检容器 id/variant 是否在白名单内（不调 lint.py）。
- `publisher` 守门是唯一 lint 调用点。如有 error → 走 recovery 回流到 polisher 修。

非 wechat 平台：`--platform {platform}` 只走通用规则（段落/标题/图片宽度/A1 容器剥离）；W1-W4 静默跳过。
