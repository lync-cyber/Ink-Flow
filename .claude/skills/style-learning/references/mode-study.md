# study 模式（外部材料 → 改进建议）

> 本文件为 style-learning skill 的 progressive-disclosure 子文档；主 SKILL.md 在
> 模式判定结果为 study 时 Read 本文。

## Step 1 — 选择材料来源

```
AskUserQuestion:
  question: "学习材料来源？"
  options:
    - "扫描 content/references/ 目录"
    - "指定本地路径或粘贴内容"
    - "从微信公众号 URL 抓取"
    - "从其他 URL 抓取（WebFetch）"
```

## Step 2a — 微信公众号 URL（推荐）

确定性链路，由 `.claude/skills/style-learning/scripts/wechat.py` 负责抓取与清洗：

```
AskUserQuestion:
  question: "提供 URL 方式？"
  options:
    - "输入 1 个 URL"
    - "输入多个 URL（逐行粘贴或给出 URL 清单文件路径）"
```

**执行命令（Bash 工具）：**

```bash
# 单篇
python .claude/skills/style-learning/scripts/wechat.py "<URL>" --out content/references/articles -v

# 批量（URL 清单文件，每行一个）
python .claude/skills/style-learning/scripts/wechat.py --list <path-to-urls.txt> --out content/references/articles -v
```

脚本会：
- 用移动端微信 UA 抓取 HTML
- 抽取 `#js_content` 正文，剥离关注卡 / 分享栏 / 相关阅读 / 二维码
- `<img data-src>` → 标准 Markdown 图片
- 抓取标题、作者、公众号、发布时间写入 frontmatter
- 统计视觉节奏指标（字数 / 段落 / 图片密度 / 主色）写入 `visual_metrics`
- 落地到 `content/references/articles/wechat-{yyyymmdd}-{title-slug}.md`

**抓取失败处理（L4 人工介入）**：

| 错误 | 判断 | 动作 |
|---|---|---|
| HTTP 403 / host_not_allowed | 网络或反爬 | 建议用户本地运行脚本，或改用 WebFetch 流程 |
| 正文为空 | 页面结构变更或登录墙 | 提示用户粘贴正文；或换 URL |
| 中文乱码 | 编码问题 | 手动指定 `--out` 后检查 frontmatter 的 `content_hash` |

## Step 2b — 其他 URL / WebFetch 兜底

对非微信 URL（知乎专栏 / 博客等），或上面 Bash 失败时，用 WebFetch：

```
WebFetch(url=<URL>, prompt="Return the full article body as plain Markdown,
preserving headings, paragraphs and quotes. Omit navigation, footer, and
related-posts sections.")
```

将返回内容以相同命名规范手写落地到 `content/references/articles/{slug}.md`
（frontmatter 仅写 source_url + title + fetched_at）。

## Step 3 — 读本地参考 + 调用分析

分析维度（对比现有配置）：

| 维度 | 对比目标 | 输出 |
|---|---|---|
| 写作风格 | `content/styles/{profile}/style-profile.md` | 风格 DNA 差异 |
| 句式质量 | `framework/config/columns.yaml` 的 `phrase_replacements` + `rules/data/forbidden-phrases.yaml` + `redline.md` | 新替换规则或禁用模式 |
| 排版手法 | `rules/core/platform-base.md` + `domains/wechat-article/platform.md` | 排版改进 |
| 结构模板 | `framework/config/columns.yaml` 的 `columns.{col}.skeleton` | 骨架调整 |
| 视觉设计 | `framework/config/columns.yaml` 的色板 + `suggested_components` + 新抓取文章的 `visual_metrics` | 组件搭配 |

**执行流程：**

1. Read 所有目标 Markdown（来自 `content/references/articles/` 或用户指定路径），
   识别类型（文章 / 模板 / 风格指南），提取栏目
2. Read InkFlow 当前配置：
   - `content/styles/default/style-profile.md`（若存在）
   - `framework/config/columns.yaml`
   - `.claude/rules/data/forbidden-phrases.yaml`
   - `.claude/rules/domains/wechat-article/redline.md`
3. 逐维度输出，每条含：
   - **发现**：原文引用（附来源文件路径）
   - **差距**：与现有规则的差异
   - **建议**：精确到"改 X 文件的 Y 字段为 Z"
   - **影响范围**：涉及的 agent/skill

## Step 4 — 用户确认

```
AskUserQuestion:
  question: "以下分析结果，要采纳哪些？"
  options:
    - "全部采纳"
    - "逐条选择"
    - "仅保存报告，不改文件"
```

## Step 5 — 写入变更

| 建议类型 | 目标文件 |
|---|---|
| 风格规则 | `content/styles/{profile}/style-profile.md` |
| 正向替换 | `framework/config/columns.yaml` 的 `phrase_replacements` |
| 禁用模式 | `.claude/rules/data/forbidden-phrases.yaml` 对应分组 |
| 骨架调整 | `framework/config/columns.yaml` 的 `columns.{col}.skeleton` |
| 视觉建议 | `framework/config/columns.yaml` 的 `colors` / `suggested_components` |

每次写入前 Read 确认当前内容，用 Edit 精确修改。

## Step 6 — 完整报告

落地到 `content/retrospectives/study-reports/{yyyymmdd}-{slug}.md`，包含：
- 本次学习的材料清单（含 source_url）
- 每条建议的采纳状态
- 涉及的文件变更列表（git diff 风格摘要）
