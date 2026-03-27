# InkFlow 设计改进建议

> 原则：标准化、模块化、关注点分离、可扩展、轻量级、高效敏捷

基于微信公众号文章撰写与运营最佳实践调研，对照 InkFlow 现有设计，提出以下改进建议。

---

## 一、Brief 阶段增强 — 标准化输入契约

### 问题

当前 brief frontmatter 仅含 `topic`、`skip_research`、`no_figures` 三个字段，缺少公众号运营关键决策参数。用户在后续阶段被迫反复补充信息。

### 改进

将 brief 扩展为**标准化写作指令卡**，一次性捕获所有上游决策：

```yaml
---
# === 核心参数 ===
topic: "Agent 执行3小时任务不炸上下文的三层策略"
target_length: 1500          # 目标字数（推荐 800-2000）
content_type: deep_dive      # quick_take | deep_dive | tutorial | opinion
audience: tech_intermediate   # tech_beginner | tech_intermediate | tech_advanced | general

# === 流水线控制 ===
skip_research: false
no_figures: true
skip_seo: false              # 新增：跳过 SEO 优化

# === 公众号运营参数 ===
publish_timing: evening       # morning | noon | evening | custom
series_name: ""              # 系列名称（空=独立文章）
series_index: 0              # 系列序号
cta_type: follow             # follow | comment | share | mini_program | none
cover_style: auto            # auto | custom

# === 风格覆盖 ===
tone_override: ""            # 空=使用 style-profile 默认值
opening_style: ""            # pain_point | story | contrast | question | blunt | auto
---
```

**设计理由**：
- 标准化：所有运营决策集中在一处，消除散落的隐式假设
- 模块化：brief 字段直接驱动各阶段的条件逻辑，无需阶段间传递额外参数
- 轻量级：全部字段都有默认值，最简用法仍然只需 `topic` 一个字段

---

## 二、Research 阶段增强 — SEO + 竞品分析模块

### 问题

当前 researcher agent 只做内容调研，未覆盖微信搜一搜 SEO（月活 8 亿）和竞品内容分析。

### 改进

在 researcher agent 的 output contract 中新增两个**可选 section**：

```yaml
validation_rules:
  required_sections: ["关键事实", "代码片段"]
  optional_sections:                          # 新增
    - name: "SEO 关键词"
      skip_if: "brief.skip_seo == true"
    - name: "竞品分析"
      skip_if: "brief.content_type == 'opinion'"
  # ... 其余不变
```

**SEO 关键词 section 输出格式**：
```markdown
## SEO 关键词
- 主关键词: {term} (搜索热度: 高/中/低)
- 长尾关键词: {term1}, {term2}, {term3}
- 建议标题含关键词: {是/否，及位置建议}
```

**竞品分析 section 输出格式**：
```markdown
## 竞品分析
| 竞品文章 | 角度 | 缺口（我们能补的） |
|----------|------|-------------------|
| {标题1}  | ...  | ...               |
```

**设计理由**：
- 关注点分离：SEO 和竞品分析作为 optional_sections，不影响核心调研流程
- 可扩展：`optional_sections` 机制通用化，未来任何 agent 可声明可选输出
- 高效：通过 `skip_if` 条件跳过，观点类文章无需浪费 token 做竞品分析

---

## 三、Outline 阶段增强 — 移动端阅读结构优化

### 问题

当前 outliner 关注论点和字数，未考虑公众号移动端阅读的结构约束。

### 改进

在 outliner agent 的 Constraints 中注入公众号结构规则（通过 wechat-article skill 包）：

```markdown
## Constraints（新增项）
- 段落不超过 3 行（移动端屏幕高度限制）
- 每 3-5 个段落插入一个视觉断点（图片/表格/引用块/分割线）
- H2 作为主分节，H3 作为子分节，禁止 H1 和 H5+
- 总 section 数控制在 3-7 个（移动端注意力极限）
- 开头 section 必须在 3 秒内抓住注意力（标注 opening_style）
- 结尾 section 必须包含 CTA 类型（从 brief.cta_type 读取）
```

**大纲输出格式增强**：

```markdown
## Section 1: {论点标题}
- 论点: ...
- 关键细节: ...
- 预估字数: 300
- 视觉断点: 代码块 + 对比表格      # 新增
- opening_style: pain_point          # 仅第一个 section
```

**设计理由**：
- 标准化：视觉断点规划纳入大纲，避免 writer 临场发挥导致排版不一致
- 模块化：公众号结构规则封装在 domain skill 中，非公众号 pipeline 不受影响

---

## 四、Writer 阶段增强 — 反 AI 味深化 + 开头策略

### 问题

当前 anti-ai-style skill 主要是"禁用清单"，缺少正面引导策略。公众号"黄金 3 秒"开头是阅读完成率的最大杠杆，需要专门优化。

### 改进

#### 4.1 升级 anti-ai-style skill 为双面规则

```markdown
# anti-ai-style/SKILL.md

## 禁用清单（现有 + 扩展）
- 禁止: "值得注意的是"、"显而易见"、"毋庸置疑"、"不难发现"、"综上所述"
- 禁止: "首先...其次...最后..." 的机械三段式
- 禁止: 代码示例后接"可以看到..."
- 禁止: 定义概念开头 ("X 是一个...")
- 新增禁止: "在...领域"、"随着...的发展"、"众所周知"、"不可否认"
- 新增禁止: 过度使用专业术语而不给出口语化解释

## 正面策略（新增）
- 用"说白了"代替"换言之"
- 用"我踩过的坑是"代替"需要注意的是"
- 用"你可能遇到过这种情况"代替泛泛的问题描述
- 允许适度的逻辑跳跃和口语化表达（模拟真人思维节奏）
- 每篇文章至少 1 处个人经验/观点标注（标记为 `<!-- USER_FILL -->`）
- 句间允许不完美衔接——过于顺滑本身就是 AI 特征
```

#### 4.2 新增 opening-hooks skill

```markdown
# opening-hooks/SKILL.md（新增到 wechat-article domain skill 包）
---
name: opening-hooks
type: context
description: 公众号文章开头策略库，按 brief.opening_style 选择注入
---

## 开头策略

### pain_point（痛点切入）
- SCQA 框架：场景 → 冲突 → 问题 → 答案预告
- 示例模式: "你是不是也遇到过 {痛点}？上周我 {具体场景}，结果 {后果}。"

### story（故事切入）
- 先事件，后道理，3 句话进入主题
- 示例模式: "{时间}，我在 {场景} 做 {事}，{转折}。"

### contrast（对比切入）
- 数据/认知反差制造张力
- 示例模式: "大多数人以为 {常识}，但实际上 {反常识}。"

### question（提问切入）
- 直接抛出读者关心的问题
- 示例模式: "{核心问题}？这个问题我研究了 {时间}，答案比你想的 {方向}。"

### blunt（直给切入）
- 不铺垫，直接给结论
- 示例模式: "结论先说: {核心观点}。以下是 {N} 个理由。"
```

**设计理由**：
- 关注点分离：开头策略独立为 skill，writer agent 按 brief 参数选择性加载
- 可扩展：新开头策略只需在 skill 中追加一个 section，无需改 agent 定义
- 高效：writer 只加载匹配 `brief.opening_style` 的策略段，不浪费 context

---

## 五、新增 Publisher 阶段能力 — 排版 + 运营元数据

### 问题

当前 `/publish` 阶段仅做导出，未覆盖公众号排版适配和运营元数据生成。

### 改进

将 publish 拆分为两个关注点明确的子步骤：

#### 5.1 wechat-format skill 增强

```markdown
# wechat-format/SKILL.md（增强版）

## 排版规则
- 仅使用 inline style（公众号不支持 <style> 块和 class）
- 正文字号: 15px，行高: 1.75-2.0，字间距: 1px
- 段落间距: 15-20px margin
- 禁止首行缩进（移动端显示错位）
- 标题层级: H2-H4（H1 由文章标题占用）
- 代码块指定语言高亮
- 图片宽度限制 640px，必须上传至微信素材库（外链失效）
- 颜色方案: 从 brief 或项目配置读取品牌色（默认 2-3 色）

## CSS 安全属性白名单
- 可用: font-size, color, font-weight, letter-spacing, margin, padding,
        line-height, text-align, border-radius, box-shadow, opacity, border
- 慎用: transform, linear-gradient（iOS/Android 渲染不一致）
- 禁用: position, @media, @keyframes, :hover, :active, float（会逃逸容器）

## SVG 约束
- 禁止 id 属性、<style>、<script>、<a> 标签
- background url() 值不加引号
```

#### 5.2 运营元数据自动生成

在 publish 阶段输出中新增：

```markdown
## 运营元数据
- 摘要: {120 字以内，含主关键词}
- 封面图建议: {场景描述，用于 AI 生图或素材搜索}
- 标签建议: {tag1}, {tag2}, {tag3}
- SEO 标题变体: {变体1} | {变体2}
- 建议发布时间: {根据 brief.publish_timing 和内容类型推荐}
- CTA 文案: {根据 brief.cta_type 生成}
```

**设计理由**：
- 标准化：排版规则和运营元数据都有明确的输出格式
- 模块化：CSS 白名单、SVG 约束封装在 skill 中，换平台只需换 skill
- 轻量级：元数据生成复用 publish 阶段已有的文章上下文，不额外调 agent

---

## 六、Validation 增强 — optional_sections + 平台适配校验

### 问题

当前 contract-validator.sh 只检查 required_sections/word_count/patterns，无法处理条件可选 section 和平台特有约束。

### 改进

#### 6.1 扩展 validation schema

```yaml
validation_rules:
  required_sections: [...]
  optional_sections:                    # 新增
    - name: "SEO 关键词"
      skip_if: "brief.skip_seo == true"
  word_count: { min: N, max: N }
  required_patterns: [...]
  forbidden_patterns: [...]
  platform_checks:                      # 新增
    - type: css_safety
      description: "检查是否使用了禁用 CSS 属性"
      forbidden_css: ["position:", "@media", "@keyframes", ":hover"]
    - type: heading_level
      description: "标题层级限制"
      allowed: ["##", "###", "####"]    # H2-H4
    - type: image_width
      description: "图片宽度检查"
      max_width: 640
```

#### 6.2 contract-validator.sh 增强

新增两个 handler 函数：

```bash
# handler: optional_sections
# 解析 skip_if 条件 → 条件不满足时视为 required → 执行标题检查

# handler: platform_checks
# 按 type 分发: css_safety → grep 禁用属性
#               heading_level → grep 标题行级别
#               image_width → 解析 img 标签 width 属性
```

**设计理由**：
- 可扩展：`platform_checks` 数组式声明，新增平台约束只加配置
- 关注点分离：平台校验与内容校验分层，非公众号 pipeline 不声明 platform_checks
- 零 token：全部在 bash 脚本中完成

---

## 七、Style 系统增强 — 六维 + 移动端阅读体验维度

### 问题

当前风格 DNA 六维度聚焦写作风格，未覆盖公众号特有的移动端阅读体验维度。

### 改进

在 style-analyzer 的六维度基础上新增第七维度：

```markdown
## 维度 7: 阅读节奏（新增）
- 视觉断点密度: 每 N 段一个图/表/引用块
- 段落呼吸感: 平均每段句数、短段落（1-2 句）出现频率
- 信息密度曲线: 开头密（抓注意力）→ 中部松紧交替 → 结尾收（CTA）
- 互动触发点: 反问句、"你觉得呢"类互动语出现位置和频率
```

同时在 style-profile.md 输出中新增：

```markdown
## 阅读节奏规则
- R1: 每 3 段插入一个视觉元素
- R2: 每篇至少 2 处短段落（仅 1 句话）制造节奏变化
- R3: 前 200 字信息密度最高，不铺垫直接进主题
```

**设计理由**：
- 标准化：阅读节奏从主观感觉变为可量化、可校验的规则
- 模块化：作为 style-profile 的一个维度，writer 和 editor 都能引用

---

## 八、Feedback 增强 — 运营数据闭环

### 问题

当前 `/feedback` 只做文本 diff，缺少发布后运营数据的反馈循环。

### 改进

新增 `/feedback-ops` 命令（轻量级，手动触发）：

```markdown
# .claude/commands/feedback-ops.md
---
description: 录入文章发布后的运营数据，更新长期趋势
---

## 执行逻辑

1. 提示用户输入运营数据:
   - 阅读完成率
   - 分享率
   - 评论数
   - 新增关注数
   - 标题点击率（如有 A/B 测试）

2. 追加到 `retro/ops-metrics.csv`:
   run_id, publish_date, read_completion, share_rate, comments, new_followers, ctr

3. 与历史数据对比:
   - 阅读完成率趋势 → 与编辑率交叉分析（编辑少的文章完成率是否更低？）
   - 分享率 → 与开头类型交叉分析（哪种 opening_style 分享最多？）

4. 输出洞察到 retro/{run_id}-ops.md

5. 若连续 3 篇文章某维度趋势明确 → 建议更新对应 agent memory
```

**设计理由**：
- 关注点分离：`/feedback` 管内容质量，`/feedback-ops` 管运营效果，互不干扰
- 轻量级：纯 CSV 追加 + 简单统计，不引入外部分析工具
- 高效敏捷：手动输入 5 个数字即可触发分析，不依赖 API 对接

---

## 九、Pipeline Manifest 增强 — 子步骤 + 并行执行

### 问题

当前 pipeline 每个 stage 是原子的，无法表达"refine 内部先审校后润色"或"draft 和 figures 可并行"。

### 改进

#### 9.1 子步骤声明

```yaml
stages:
  - name: refine
    agent: editor
    command: /refine
    checkpoint: true
    sub_steps:                          # 新增
      - name: audit
        description: "五维审校"
      - name: polish
        description: "去 AI 味润色"
    requires: [draft]
```

子步骤在 agent 内部按序执行，状态追踪在 pipeline-state.json 中：

```json
"refine": {
  "status": "in_progress",
  "sub_steps": {
    "audit": "completed",
    "polish": "in_progress"
  }
}
```

#### 9.2 并行执行声明

```yaml
stages:
  - name: draft
    agent: writer
    command: /draft
    requires: [outline]

  - name: figures
    agent: illustrator
    command: /figures
    requires: [outline]               # 改为依赖 outline 而非 draft
    parallel_with: [draft]            # 新增: 可与 draft 并行
    skip_if: "brief.no_figures == true"
```

编排器 `/run` 检测到 `parallel_with` 时，同时调度两个 agent。

**设计理由**：
- 标准化：子步骤和并行关系在 manifest 中显式声明，不藏在 agent 实现里
- 高效敏捷：figures 和 draft 并行执行可节省 3-5 分钟等待
- 可扩展：`parallel_with` 和 `sub_steps` 是通用机制，适用于任何 pipeline

---

## 十、Domain Skill 包架构 — 标准化 Skill 接口

### 问题

当前 skill 有三种类型（Rule/Transform/Context），但缺少统一的接口声明标准。

### 改进

标准化 skill frontmatter 接口：

```yaml
---
name: {skill-name}
type: rule | transform | context
description: {一行描述}
domain: core | wechat-article | tech-docs | ...
version: 1.0.0

# Rule Skill: 声明注入时机
inject_at: [draft, refine]            # 在哪些 stage 注入
inject_mode: always | conditional      # always = 每次注入; conditional = 按条件
inject_condition: "brief.content_type != 'opinion'"

# Transform Skill: 声明 I/O
input: "{stage_output}"               # 接收的输入
output: "{transformed_output}"         # 产出的输出
transform_order: 1                     # 多个 transform 的执行顺序

# Context Skill: 声明加载方式
context_source: "styles/style-profile.md"
context_selector: "按 section 主题选最相关段落"
---
```

并在 pipeline manifest 的 skills 声明中支持条件加载：

```yaml
skills:
  global: [fact-check]
  stages:
    draft:
      - name: anti-ai-style
      - name: style-reference
      - name: opening-hooks
        condition: "stage.section_index == 0"    # 仅第一个 section
    refine: [fact-check, de-ai-polish]
    publish:
      - name: wechat-format
      - name: seo-optimize                       # 新增
        condition: "brief.skip_seo != true"
```

**设计理由**：
- 标准化：所有 skill 遵循统一 frontmatter schema，框架可自动解析和调度
- 模块化：skill 自描述注入时机和条件，pipeline manifest 只做引用
- 可扩展：新增 skill 只需创建文件 + 在 manifest 中引用

---

## 十一、导出链路增强 — 多格式 + 预览

### 问题

当前只支持 Markdown → Markdown Nice → 公众号。实际运营中常需多渠道分发。

### 改进

在 wechat-format skill 中定义导出适配器接口：

```yaml
# publish 阶段可选输出
exports:
  - format: wechat_md
    description: "Markdown Nice 适配格式（默认）"
    output: "output/{topic}-wechat.md"

  - format: plain_md
    description: "纯净 Markdown（用于知乎/掘金等）"
    output: "output/{topic}-plain.md"

  - format: html
    description: "内联样式 HTML（可直接粘贴公众号编辑器）"
    output: "output/{topic}.html"
    tool: "pandoc 或内置 Markdown→HTML"

  - format: summary
    description: "短摘要版（用于朋友圈/社群分发）"
    output: "output/{topic}-summary.md"
    word_limit: 200
```

`/publish` 命令默认输出 `wechat_md`，用户可通过参数选择额外格式：

```bash
/publish                    # 默认: wechat_md
/publish --formats all      # 全部格式
/publish --formats wechat_md,html  # 指定格式
```

**设计理由**：
- 模块化：每种导出格式封装为独立适配器，新增平台只加配置
- 高效敏捷：多格式导出一次完成，避免重复执行 publish
- 轻量级：summary 格式复用已有文章内容做截取，不额外调 agent

---

## 十二、记忆系统增强 — 运营知识图谱

### 问题

当前 agent memory 只记录写作偏好，缺少跨文章的运营知识积累。

### 改进

新增项目级运营记忆（与 agent memory 平级）：

```
.claude/agent-memory/
  ├── writer/MEMORY.md
  ├── outliner/MEMORY.md
  ├── researcher/MEMORY.md
  ├── editor/MEMORY.md
  └── ops/MEMORY.md           # 新增：运营记忆
```

`ops/MEMORY.md` 记录内容：

```markdown
## 最佳发布时间
- 深度技术文: 周二/周四 20:00-21:00（完成率最高）
- 观点快评: 周一 12:00-13:00（分享率最高）

## 标题模式
- 含数字标题平均 CTR 比无数字高 23%
- 问句标题在技术领域表现不如 "X 的 N 个策略" 模式

## 开头效果
- pain_point 开头完成率: 62%（N=5）
- contrast 开头分享率: 12%（N=3）

## 系列文章
- "AI 工程实践" 系列平均新增关注: 15/篇
```

`/retro` 和 `/feedback-ops` 自动更新此文件。

**设计理由**：
- 关注点分离：运营记忆独立于写作记忆，不污染 agent 的创作上下文
- 可扩展：作为 MEMORY.md 标准格式，可被任何 command 读写
- 高效敏捷：简单的 key-value + 统计，不需要数据库

---

## 十三、实现优先级建议

按照**价值/成本比**排序，建议分三批实现：

### 第一批（核心增量，立即可做）

| 改进项 | 改动范围 | 预期效果 |
|--------|----------|----------|
| Brief 标准化扩展 | 1 个 frontmatter schema | 消除后续阶段的信息缺口 |
| anti-ai-style 双面规则 | 1 个 skill 文件 | 显著提升文章人味 |
| opening-hooks skill | 新增 1 个 skill 文件 | 提升开头质量和阅读完成率 |
| wechat-format 增强 | 1 个 skill 文件 | 减少排版返工 |
| 大纲视觉断点规划 | outliner agent 约束 | 移动端阅读体验系统化 |

### 第二批（流程优化，有实际文章后做）

| 改进项 | 改动范围 | 预期效果 |
|--------|----------|----------|
| optional_sections 机制 | validator + agent schema | 灵活的条件输出 |
| platform_checks 校验 | validator 脚本 | 零 token 的平台适配校验 |
| 运营元数据自动生成 | publish 阶段输出 | 减少手动填写运营信息 |
| skill 接口标准化 | skill frontmatter schema | 统一 skill 调度机制 |

### 第三批（数据驱动，5+ 篇文章后做）

| 改进项 | 改动范围 | 预期效果 |
|--------|----------|----------|
| /feedback-ops 运营反馈 | 新增 1 个 command | 打通写作→发布→数据闭环 |
| 运营记忆系统 | ops/MEMORY.md | 跨文章运营知识积累 |
| 并行执行机制 | manifest schema + 编排器 | 缩短 pipeline 执行时间 |
| 多格式导出 | publish 适配器 | 支持多渠道分发 |
| 阅读节奏维度 | style-analyzer | 风格分析覆盖移动端体验 |
| 子步骤追踪 | manifest schema + state | 更细粒度的可观测性 |

---

## 十四、不建议改动的部分

以下现有设计已经很好，无需修改：

- **7 阶段 + 3 检查点**的 pipeline 结构 — 节奏合理
- **RCCF agent 结构** — 清晰且自文档化
- **四层错误处理** — L1-L4 分层完备
- **两级记忆 + 用户晋升** — 防止规则失控的关键机制
- **contract-validator.sh 数据驱动** — 零 token 校验，扩展性好
- **声明式 pipeline manifest** — YAML 驱动，解耦良好
- **section-by-section 写作** — 控制上下文、提升质量

---

## 附录：微信公众号关键运营参数速查

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| 文章长度 | 800-2000 字 | 完成率最优区间 |
| 段落长度 | ≤ 3 行（移动端） | 减少阅读压力 |
| 正文字号 | 15px | 行业标准 |
| 行高 | 1.75-2.0 | 舒适阅读 |
| 字间距 | 1-2px | 移动端可读性 |
| 图文比 | 每 3-5 段 1 个视觉元素 | 打破文字墙 |
| 封面尺寸 | 900×500px（头条）/ 900×383px（次条） | 平台规范 |
| 内图宽度 | 640px | 最佳适配 |
| 发布时间 | 20:00-22:00（首选）| 职场人群高峰 |
| 更新频率 | ≥ 3 篇/周（深度）+ 2 短内容 | 防止推荐权重衰减 |
| 更新断档 | < 7 天 | 超过 7 天推荐权重下降 |
| 目标 CTR | ≥ 15% | 健康指标 |
| 目标完成率 | ≥ 50% | 内容质量指标 |
| 目标分享率 | ≥ 8% | 传播力指标 |
| 摘要长度 | ≤ 120 字 | 公众号截断限制 |
| H 标签 | H2-H4 only | H1 被标题占用，H5+ 无样式 |
