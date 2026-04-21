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

## 平台配置加载（渐进披露）

1. 读 `framework/config/columns.yaml`，定位 `columns.{column}`
2. 读 `columns.{column}.platforms_config` 字段（形如 `framework/config/columns/{column}.platforms.yaml`）
3. 读那份子文件，定位 `platforms.{platform}`，拿本轮要用的字段：

| 字段 | 含义 | 主要消费 agent |
|------|------|-----------------|
| `skeleton` | 平台专属骨架（带 atom 引用） | outliner |
| `tone.voice` | 平台专属语气一句话 | writer / polisher |
| `tone.rules` | 平台专属"禁止 X → 改为 Y" | writer / polisher / auditor |
| `kpi_targets` | 平台 KPI 数值 | auditor（传播性评分的对齐基准） |
| `atom_selection` | 允许引用的 atom type 白名单 | outliner |
| `length_limit` | 总字数硬上限 | writer / polisher（字数控制）/ auditor（越界判 error） |
| `figure_spec` | 平台图像规格（比例/格式/封面要求） | illustrator |
| `applicable` / `applicable_if` | 可选：平台是否适用 | orchestrator 过滤 target_platforms |

**未定义字段的回退规则**：
- `platforms.{platform}` 不存在 → agent 报错「本栏目未配置 {platform} 适配」
- 字段缺失 → 回退到 `columns.{column}.{field}`（顶层栏目默认值）
- 仍缺失 → 用 `framework/config/inkflow.yaml` 的 defaults 或常量

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

## 平台适用性过滤

`platforms.{p}.applicable: conditional` + `applicable_if: "<表达式>"` 用于声明「本平台只在特定条件下处理该栏目」。orchestrator 在派发前求值，不满足则该平台跳过，不占用一次 per_platform 调用。示例见 `story.platforms.yaml` 的 `juejin` 段。

## 校验基线

所有 per-platform agent 在自己的 Exit Criteria 里额外满足：

- 产物路径含正确的 `{platform}` 目录/后缀
- 遵守 `columns.{column}.platforms.{platform}.tone.rules` 的禁止项（至少不新引入违规）
- 字数 ≤ `length_limit × length_hard_factor`（硬上限弹性，从 `.claude/rules/data/platform-limits.yaml` 的 `platforms.{platform}.length_hard_factor` 读取；超出仅允许用于必要完整性）

## 与 lint 的接口

涉及平台差异的格式校验（CSS 安全/图片规格/段落长度）由 `quality-linting` skill 的 `lint.py --platform {platform}` 完成。各 agent 产物落盘后，orchestrator 按平台调用 lint，不在 agent 内做重复校验。
