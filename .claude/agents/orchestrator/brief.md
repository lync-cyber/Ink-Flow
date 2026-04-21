# orchestrator / brief 模块

## Brief 创建

**快速路径**：用户消息已含主题/栏目/类型时，跳过对应问题，直接填入 brief。例：
"写一篇技术专题，关于 React Hooks 的深度解析" → 直接提取 topic + content_column + content_type，仅确认缺失字段。

### Step 1 — 主题确认（若未直接给出）

### Step 2 — 参数采集（AskUserQuestion 最多 4 题并发）

```
Q1 文章类型: [深度解析, 快速观点, 教程, 观点评论]
Q2 目标读者: [技术初学者, 技术中级, 技术高级, 通用读者]
Q3 开头风格: [痛点切入, 故事开头, 对比反差, 设问, 开门见山, 自动]
Q4 跳过阶段: multiSelect [跳过调研, 不生成配图, 跳过 SEO]
```

### Step 2b — 栏目确认

```
Q: "这篇文章属于哪个栏目？"
  - academic — 学术前沿
  - industry — 行业趋势
  - tech — 技术专题
  - story — 人物故事
```

### Step 2c — 选题快速评估（可选）

用 WebSearch 做 1-2 次验证；输出一句话评估 + 差异化角度。不阻塞流程。

### Step 2d — 目标平台确认（按用户指定优先，未指定则按栏目推荐）

```
IF 用户消息显式指定 target_platforms（如"写给公众号 + 知乎"）:
  直接填入 brief.target_platforms
  primary_platform = 列表第一个
ELSE:
  读 framework/config/columns.yaml 的 columns.{content_column}.suggested_platforms
  AskUserQuestion:
    question: "推荐的目标平台: {suggested_platforms}，确认或调整？"
    options:
      - "采用推荐"
      - "只发 wechat"
      - "自定义组合" — multiSelect 从 [wechat, xiaohongshu, zhihu, juejin] 选
  primary_platform = 最终列表第一个
```

约束：
- `target_platforms` 非空，元素 ∈ `framework/config/artifact-layout.yaml` 的 `platforms`
- 某个 `{platform}` 若在 `columns.{col}.platforms_config` 里声明 `applicable: conditional` 且
  `applicable_if` 不满足，fanout 时会跳过——此处不做硬阻断，让用户先定意图。

### Step 3 — 生成 brief

1. 自动生成 slug（中文 pinyin 或英文 kebab-case）
2. 读 `framework/config/inkflow.yaml` 的 `defaults` 填充未指定字段
3. `content_column` 使用英文 ID（academic/industry/tech/story）
4. Frontmatter 模板见 `.claude/skills/pipeline-orchestrating/references/brief-template.md`
5. 产物路径从 `framework/config/artifact-layout.yaml` 的 `paths.brief` 读取
6. 创建 `content/articles/{slug}/intermediate/` `review/` `export/` 目录结构

### Step 4 — 确认

```
Q: "Brief 已生成，请确认"（附 frontmatter 摘要）
  - 确认并开始 pipeline
  - 修改参数
  - 手动编辑文件
```

### 初始化 state

写入 `runtime/pipeline-states/{slug}.json`：
- 从 `framework/config/inkflow.yaml` 的 stages 列表动态生成，不硬编码
- 每 stage 默认 `{"status":"pending"}`；brief 标记 completed

## Pipeline 完成后建议

```
AskUserQuestion:
  question: "Pipeline 已完成！接下来做什么？"
  options:
    - "查看发布清单" — publish-preparing skill
    - "运行创作复盘" — creation-reviewing skill
    - "分析写作风格" — style-learning skill（profiling 分支）
    - "学习参考材料" — style-learning skill（studying 分支）
    - "开始新文章"
```
