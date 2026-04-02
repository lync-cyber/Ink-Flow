# Markdown 扩展语法参考

> Writer 输出与 typesetter 渲染共用一套语法。
> 标准 Markdown + `:::block` 扩展块语法。
> Typesetter（`tools/wechat-typesetter/index.html`）为排版引擎。

---

## 标准 Markdown 元素

typesetter 会根据栏目主题自动应用不同样式（颜色、标记符号、布局方式）。

| 元素 | 语法 | 栏目差异化 |
|------|------|-----------|
| H1 标题 | `# title` | 首个 H1 渲染为栏目标识+标题区（每栏目布局不同） |
| H2 标题 | `## heading` | academic=底线, industry=色块, tech=`##`前缀, story=居中装饰 |
| H3 标题 | `### heading` | academic=左边框, industry=圆点, tech=`###`前缀, story=斜体居中 |
| 段落 | 自然段落 | story 行高 2.0，其余 1.75 |
| 引用 | `> text` | story=居中大引号, tech=提示块（含💡时）, 其余=左侧色条 |
| 无序列表 | `- item` | academic=■, industry=→+交替背景, tech=▸, story=空心圆 |
| 有序列表 | `1. item` | tech=编号徽章，其余=数字加点 |
| 代码块 | ` ```lang ``` ` | tech 头栏用 primary 色，其余用 #2c3e50 |
| 表格 | `\| col \| col \|` | 表头 primary 背景，末列 accent 色 |
| 分割线 | `---` | academic=§, industry=色条, tech=· · ·, story=圆点装饰 |
| 图片 | `![caption](url)` | story 图注右对齐+斜体，其余居中 |

### 内联格式

| 语法 | 渲染效果 |
|------|---------|
| `**bold**` | 加粗，文字色=primary |
| `*italic*` | 斜体 |
| `` `code` `` | 等宽背景色块，文字色=primary |
| `~~text~~` | accent 色虚下划线 |
| `[text](url)` | accent 色链接+底线 |
| `[1]` | accent 色上标引用 `[1]` |

---

## 摘要区（TL;DR）

首个 H1 后紧跟的 blockquote 自动渲染为文章摘要（academic 栏目左侧 accent 色条，其他栏目各有样式）。

```markdown
# 文章标题

> 这段会被渲染为摘要/导语，而非普通引用。
```

story 栏目不使用 TL;DR（无摘要区）。

---

## `:::block` 扩展块语法

以 `:::type` 开始，`:::` 结束，中间为内容。

### :::card — 信息卡片

每个栏目渲染为不同卡片类型：

**academic**（数据对比卡）— 第1行=标题，数据行用 `/` 分隔指标，`*` 开头=脚注：

```markdown
:::card
表1：主流方法性能对比
PatchCore 99.1% / EfficientAD 98.8% / ★本文方法 99.6%
* AUROC指标，15类缺陷加权平均
:::
```

**industry**（新闻卡）— 第1行=标签，数字行=日期，后续=标题+描述：

```markdown
:::card
融资
2025.12.15
XX公司完成B轮2亿融资
专注工业AI视觉检测，估值达15亿
:::
```

**tech**（环境/需求卡）— 第1行=标题，后续为 key: value 键值对：

```markdown
:::card
⚙️ 环境要求
Python: ≥3.10
PyTorch: ≥2.0
GPU: RTX 3060+
:::
```

**story**（人物档案卡）— 第1行=标签，后续为人物信息：

```markdown
:::card
人物档案
张工，38岁
某汽车零部件厂质检主管
从业15年，经历3次产线升级
:::
```

### :::cta — 行动引导

每栏目不同 CTA 样式：

```markdown
:::cta
可选的自定义文本（如 GitHub 仓库 URL）
:::
```

- academic: 「阅读原文」居中按钮
- industry: 「订阅周报」+ 关注按钮
- tech: 开源仓库展示 + Star 按钮
- story: 「分享给 TA」边框按钮

### :::footer — 文末区

```markdown
:::footer
公众号名称
:::
```

自动注入栏目 tagline、二维码位、往期推荐、版权声明。

### :::media — 音视频嵌入

```markdown
:::media
音频标题 / 视频标题
:::
```

渲染为音频播放器 + 视频卡片占位。实际发布需在公众号后台插入 `<mpvoice>` / `<mpvideo>`。

### :::miniapp — 小程序卡片

```markdown
:::miniapp
小程序名称 — 简短描述
:::
```

每栏目不同图标（academic=📊, industry=🗺, tech=💻, story=👤）。

### :::vote — 投票

```markdown
:::vote
你更看好哪种方案？选项A / 选项B / 选项C
:::
```

用 `？`或 `?` 分隔问题与选项，选项用 `/` 分隔。

### :::collection — 合集导航

```markdown
:::collection
系列名称：第1篇标题 / 第2篇（本篇）/ 第3篇标题
:::
```

含"本篇"的条目自动高亮为当前文章。

### :::hashtag — 话题标签

```markdown
:::hashtag
#工业AI #视觉检测 #边缘部署
:::
```

### :::readmore — 阅读原文引导

```markdown
:::readmore
可选的自定义提示文本
:::
```

不填则使用栏目默认文案。

### :::note — 提示/注释

单行提示：

```markdown
:::note
这是一条提示信息，会显示为带左侧色条的 💡 提示块。
:::
```

多行提示（第一行加粗为标题，后续行各自独立渲染）：

```markdown
:::note
常见误解 vs 真相
"调了 cancel() 就停了" — 多数框架只标记状态，不终止执行中的 LLM 调用。
"超时会自动清理资源" — 超时触发后，已发出的 API 请求仍在运行。
:::
```

### :::references — 引用文献

紧凑排版的文末引用区，12px 字号、accent 色编号、浅色背景。替代普通有序列表，提升移动端阅读体验。

```markdown
:::references
1. Zhang et al. (2025). "Paper Title". *Journal Name*.
2. [文章标题](https://url). 来源, 日期.
3. Li et al. (2024). "Paper Title". *Conference*.
:::
```

学术引用格式：`作者 (年份). "标题". *期刊/会议*.`
网页引用格式：`[标题](URL). 来源, 日期.`

### :::timeline — 时间轴

纵向时间轴，每行格式为 `日期 描述`：

```markdown
:::timeline
2024-03 项目立项，完成技术选型
2024-06 v1.0 发布，支持基础检测
2024-12 v2.0 发布，引入 AI 模型
:::
```

### :::steps — 步骤条

编号步骤卡片，每行格式为 `Step N 标题: 描述`（或 `N. 标题: 描述`）：

```markdown
:::steps
Step 1 环境准备: 安装 Python 3.10+ 和 PyTorch
Step 2 数据导入: 将训练数据放入 data/ 目录
Step 3 模型训练: 运行 train.py 启动训练
:::
```

### :::label — 区段标签（开发模式）

```markdown
:::label
文章头部区 [N]
:::
```

仅在 typesetter 预览中可见，用于标注区段。`[N]` 显示为红色新标记。

---

## 引用文献

使用标准上标引用 `[N]` 标记文内引用，文末用 `:::references` 块汇总（紧凑排版）：

```markdown
近年来，无监督异常检测展现出了突破性潜力[1]。

:::references
1. Zhang et al. (2025). "Industrial Anomaly Detection via Transformer". *CVPR 2025*.
2. Li et al. (2024). "EfficientAD: Accurate Visual Anomaly Detection". *NeurIPS 2024*.
3. [边缘AI部署实战](https://example.com/edge-ai). TechBlog, 2025-01.
:::
```

academic 栏目必须包含文末引用列表。引用统一使用 `:::references` 而非普通有序列表。

---

## 数据指标展示

使用 `:::card` 块展示数据指标。academic 栏目的 card 会自动解析 `/` 分隔的指标行为并排数据展示。

需高亮的指标加 `★` 前缀。

---

## 栏目特有约定

| 栏目 | 特有约定 |
|------|---------|
| academic | 必须有文末引用列表；H1 后 blockquote 作为摘要 |
| industry | 通常 ≤3 sections；card 用于新闻/事件 |
| tech | 代码块是核心元素；card 用于环境需求 |
| story (story) | 无 TL;DR；行高 2.0；引号居中显示；card 用于人物档案 |
