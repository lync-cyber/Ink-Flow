---
name: style-learning
description: >
  风格学习 — 统一入口，支持两种模式：
  （1）profile：分析自己的文章，提取风格 DNA，生成 style-profile.md；
  （2）study：分析外部参考材料（本地路径 / references/ / 微信公众号 URL），
  与现有规则对比，输出改进建议并按确认写入。
  触发条件："分析风格"、"提取风格 DNA"、"创建风格档案"、
  "学习这篇文章"、"参考这个模板"、"进修"、"对标"。
argument-hint: "[profile | study] [参考材料路径或 URL]"
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, Bash, WebFetch, AskUserQuestion
---

# 风格学习（Style Learning）

单一入口，两种模式。

| 模式 | 目标 | 输出 |
|---|---|---|
| **profile** | 分析**自己的**文章 → 描述现有风格 DNA | `styles/{profile_name}/style-profile.md` |
| **study**   | 分析**外部**材料 → 对比差距，提出改进 | `retro/study-reports/{date}-{slug}.md` + 按确认修改规则文件 |

## 模式判定

```
AskUserQuestion（若命令未显式指定模式）:
  question: "学习哪种材料？"
  options:
    - "profile — 从我自己的文章提取风格"
    - "study — 学习外部参考材料"
```

---

## 模式 A: profile（自己文章 → 风格 DNA）

### 1. 风格档案命名

默认 `default`；用户可指定。`styles/{profile_name}/` 不存在则自动创建。

### 2. 收集参考文章

优先级：
1. 用户直接指定路径
2. 扫描 `articles/*/export/final.md`（兼容老文件名 `_final.md`），让用户选 3-5 篇
3. 无可用文章 → 提示用户提供

### 3. 调用 style-analyzer

`Agent tool → style-analyzer`，传入所有参考文章内容。
分析七维度（句式、段落、词汇、修辞、结构、反面清单、节奏 + 视觉节奏），
每维度提取 2-3 条**可执行规则**（"用 X 代替 Y"），不输出模糊描述。

### 4. 确认并存储

展示摘要 → 用户确认 → 写入 `styles/{profile_name}/style-profile.md`。
writer/polisher 在 draft/polish 阶段会优先使用此文件的规则。

---

## 模式 B: study（外部材料 → 改进建议）

### Step 1 — 选择材料来源

```
AskUserQuestion:
  question: "学习材料来源？"
  options:
    - "扫描 references/ 目录"
    - "指定本地路径或粘贴内容"
    - "从微信公众号 URL 抓取"
    - "从其他 URL 抓取（WebFetch）"
```

### Step 2a — 微信公众号 URL（推荐）

确定性链路，由 `tools/fetch/wechat.py` 负责抓取与清洗：

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
python tools/fetch/wechat.py "<URL>" --out references/articles -v

# 批量（URL 清单文件，每行一个）
python tools/fetch/wechat.py --list <path-to-urls.txt> --out references/articles -v
```

脚本会：
- 用移动端微信 UA 抓取 HTML
- 抽取 `#js_content` 正文，剥离关注卡 / 分享栏 / 相关阅读 / 二维码
- `<img data-src>` → 标准 Markdown 图片
- 抓取标题、作者、公众号、发布时间写入 frontmatter
- 统计视觉节奏指标（字数 / 段落 / 图片密度 / 主色）写入 `visual_metrics`
- 落地到 `references/articles/wechat-{yyyymmdd}-{title-slug}.md`

**抓取失败处理（L4 人工介入）**：

| 错误 | 判断 | 动作 |
|---|---|---|
| HTTP 403 / host_not_allowed | 网络或反爬 | 建议用户本地运行脚本，或改用 WebFetch 流程 |
| 正文为空 | 页面结构变更或登录墙 | 提示用户粘贴正文；或换 URL |
| 中文乱码 | 编码问题 | 手动指定 `--out` 后检查 frontmatter 的 `content_hash` |

### Step 2b — 其他 URL / WebFetch 兜底

对非微信 URL（知乎专栏 / 博客等），或上面 Bash 失败时，用 WebFetch：

```
WebFetch(url=<URL>, prompt="Return the full article body as plain Markdown,
preserving headings, paragraphs and quotes. Omit navigation, footer, and
related-posts sections.")
```

将返回内容以相同命名规范手写落地到 `references/articles/{slug}.md`（frontmatter 仅写 source_url + title + fetched_at）。

### Step 3 — 读本地参考 + 调用分析

分析维度（对比现有配置）：

| 维度 | 对比目标 | 输出 |
|---|---|---|
| 写作风格 | `styles/{profile}/style-profile.md` | 风格 DNA 差异 |
| 句式质量 | `config/columns.yaml` 的 `phrase_replacements` + `rules/data/forbidden-phrases.yaml` + `redline.md` | 新替换规则或禁用模式 |
| 排版手法 | `rules/core/platform-base.md` + `domains/wechat-article/platform.md` | 排版改进 |
| 结构模板 | `config/columns.yaml` 的 `columns.{col}.skeleton` | 骨架调整 |
| 视觉设计 | `config/columns.yaml` 的色板 + `suggested_components` + 新抓取文章的 `visual_metrics` | 组件搭配 |

**执行流程：**

1. Read 所有目标 Markdown（来自 `references/articles/` 或用户指定路径），识别类型（文章 / 模板 / 风格指南），提取栏目
2. Read InkFlow 当前配置：
   - `styles/default/style-profile.md`（若存在）
   - `config/columns.yaml`
   - `.claude/rules/data/forbidden-phrases.yaml`
   - `.claude/rules/domains/wechat-article/redline.md`
3. 逐维度输出，每条含：
   - **发现**：原文引用（附来源文件路径）
   - **差距**：与现有规则的差异
   - **建议**：精确到"改 X 文件的 Y 字段为 Z"
   - **影响范围**：涉及的 agent/skill

### Step 4 — 用户确认

```
AskUserQuestion:
  question: "以下分析结果，要采纳哪些？"
  options:
    - "全部采纳"
    - "逐条选择"
    - "仅保存报告，不改文件"
```

### Step 5 — 写入变更

| 建议类型 | 目标文件 |
|---|---|
| 风格规则 | `styles/{profile}/style-profile.md` |
| 正向替换 | `config/columns.yaml` 的 `phrase_replacements` |
| 禁用模式 | `.claude/rules/data/forbidden-phrases.yaml` 对应分组 |
| 骨架调整 | `config/columns.yaml` 的 `columns.{col}.skeleton` |
| 视觉建议 | `config/columns.yaml` 的 `colors` / `suggested_components` |

每次写入前 Read 确认当前内容，用 Edit 精确修改。

### Step 6 — 完整报告

落地到 `retro/study-reports/{yyyymmdd}-{slug}.md`，包含：
- 本次学习的材料清单（含 source_url）
- 每条建议的采纳状态
- 涉及的文件变更列表（git diff 风格摘要）

---

## 约束

- **不自动修改文件** — 所有变更经用户确认
- **建议必须具体到文件/字段** — 不能只说"建议调整风格"
- **参考材料质量不高时应如实指出** — 不强行提取
- **URL 抓取失败不阻塞流程** — 优雅降级到粘贴正文模式
- **缓存** — `references/articles/` 里已有同 URL（按 `source_url` 精确匹配 frontmatter）则直接复用，询问是否重抓

## 依赖

- `tools/fetch/wechat.py`（微信 URL 抓取）
- `requests`、`beautifulsoup4`（首次使用需 `pip install -e .` 或 `pip install requests beautifulsoup4`）
