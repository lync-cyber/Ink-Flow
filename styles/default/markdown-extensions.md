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

```markdown
:::note
这是一条提示信息，会显示为带左侧色条的 💡 提示块。
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

使用标准上标引用 `[N]` 标记文内引用，文末用有序列表汇总：

```markdown
近年来，无监督异常检测展现出了突破性潜力[1]。

---

1. Zhang et al., "Industrial Anomaly Detection via Transformer", CVPR 2025
2. Li et al., "EfficientAD: Accurate Visual Anomaly Detection", NeurIPS 2024
```

academic 栏目应始终包含文末引用列表。

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
