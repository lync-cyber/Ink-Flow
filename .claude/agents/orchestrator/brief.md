# orchestrator / brief 模块

## Brief 创建

**快速路径**：用户消息已含主题/栏目/类型时，跳过对应问题，直接填入 brief。例：
"写一篇技术专题，关于 React Hooks 的深度解析" → 直接提取 topic + content_column + content_type，仅确认缺失字段。

**preset 触发词**：用户说"快速写"/"草稿"/"草稿模式"/"quick"/"draft" → 自动选 quick / draft preset，跳过 Step 2 的 Q4。

### Step 0 — preset 选择（决定后续提问深度）

```
IF 用户消息含「快速 / quick / 10 分钟」:
  brief.preset = quick
  跳过 Step 2 Q4（跳过阶段已由 preset 决定）
  跳过 Step 2d（preset 已固定单平台 wechat）
ELIF 用户消息含「草稿 / draft / 跑到 draft」:
  brief.preset = draft
  跳过 Step 2 Q4
ELIF 用户消息无明确提示且不是 content-planning handoff:
  AskUserQuestion:
    question: "选择 pipeline 档位"
    options:
      - "完整 (full · ~30 分钟，9 stage 全跑，3 个 checkpoint)" → preset=full
      - "快速 (quick · ~10 分钟，跳研究/原子/配图，inline 模式，单平台)" → preset=quick
      - "草稿 (draft · ~5 分钟，跑到 draft 停下，用户接手)" → preset=draft
ELSE:
  brief.preset = full
```

### Step 1 — 主题确认（若未直接给出）

```
IF 会话上下文含 content-planning handoff 包（见 content-planning/SKILL.md § 创作选题交接）:
  brief.topic          = handoff.brief_seed.topic
  brief.content_column = handoff.brief_seed.content_column
  brief.publish_date   = handoff.brief_seed.publish_date
  跳过本 Step，直接进入 Step 2（Step 2b 栏目确认可跳过）
ELIF 用户未提供具体主题:
  AskUserQuestion:
    question: "尚未指定主题。"
    options:
      - "查看排期推荐主题" — 触发 content-planning skill；由其 handoff 包注入 brief
      - "我现在告诉你主题" — 等待用户输入
      - "返回"
ELSE:
  直接进入 Step 2
```

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
  读 runtime/profile-resolved/constraints.yaml 的 columns.{content_column}.suggestedPlatforms
  AskUserQuestion:
    question: "推荐的目标平台: {suggestedPlatforms}，确认或调整？"
    options:
      - "采用推荐"
      - "只发 wechat"
      - "自定义组合" — multiSelect 从 [wechat, xiaohongshu, zhihu, juejin] 选
  primary_platform = 最终列表第一个
```

约束：
- `target_platforms` 非空，元素 ∈ `framework/config/artifact-layout.yaml` 的 `platforms`
- 某个 `{platform}` 若当前 Profile 未在 `constraints.columnPlatforms.{col}` 下为其声明配置，fanout 时会跳过并在状态中记录原因——此处不做硬阻断，让用户先定意图。

### Step 3 — 生成 brief

1. 自动生成 slug（中文 pinyin 或英文 kebab-case）
2. 读 `framework/config/inkflow.yaml` 的 `defaults` 填充未指定字段
3. **preset 字段展开**：把 `presets[brief.preset].fields` 合并到 brief；用户显式字段优先，preset 仅填充未指定字段
4. `content_column` 使用英文 ID（academic/industry/tech/story）
5. Frontmatter 模板见 `.claude/agents/orchestrator/references/brief-template.md`
6. 产物路径从 `framework/config/artifact-layout.yaml` 的 `paths.brief` 读取
7. 创建 `content/articles/{slug}/intermediate/` `review/` `export/` 目录结构

preset=quick 展开后的 brief frontmatter：

```yaml
preset: quick
topic: X
# 以下字段由 presets.quick.fields 展开：
skip_research: true
no_figures: true
skip_seo: true
execution_mode: inline
target_platforms: [wechat]
auto_checkpoints: [CP1, CP2]
```

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
    - "运行创作复盘" — creation-reviewing skill
    - "Profile 操作（提取 / 切换 / 叠加）" — profile skill
    - "开始新文章"
```
