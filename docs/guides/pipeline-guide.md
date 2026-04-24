# Pipeline 详解

InkFlow 的写作流水线由 orchestrator 调度，共 8 个阶段、3 个检查点。

<p align="center">
  <img src="../../docs/assets/workflow.svg" alt="从初始化到发布的完整工作流" width="960">
</p>

## 目录

- [总览](#总览)
- [阶段说明](#阶段说明)
- [三个检查点](#三个检查点)
- [跳过条件](#跳过条件)
- [重跑单个阶段](#重跑单个阶段)
- [产物路径速查](#产物路径速查)

---

## 总览

```
brief → research → atoms → outline [CP1] → draft ∥ figures → audit → polish [CP2] → publish [CP3]
```

- **atoms 之前**：平台无关的共用产物
- **outline 起**：按 `brief.target_platforms` 扇出，每平台独立产出
- `draft` 与 `figures` 可并行执行

---

## 阶段说明

### brief · 创作摘要

- **执行者**：orchestrator（直接生成，无独立 subagent）
- **触发方式**：用户说"写一篇关于 X 的文章"
- **产物**：`intermediate/01-brief.md`
- **字段说明**：

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `topic` | 文章主题 | — |
| `content_column` | 栏目（tech / academic / industry / story） | — |
| `target_platforms` | 分发平台列表 | `[wechat]` |
| `opening_style` | 开头风格（auto / pain_point / story / contrast / question / blunt） | `auto` |
| `skip_research` | 跳过调研阶段 | `false` |
| `no_figures` | 跳过配图阶段 | `false` |

---

### research · 调研备忘录

- **执行者**：researcher agent
- **产物**：`intermediate/02-research-memo.md`
- **必须包含**：关键事实、代码片段、对比表格、不确定项
- **跳过条件**：`brief.skip_research == true`

---

### atoms · 内容原子池

- **执行者**：atomizer agent
- **产物**：`intermediate/02-atoms/` 下 9 个文件

| 文件 | 内容 |
|------|------|
| `claims.md` | 核心论点 |
| `evidence-data.md` | 数据证据 |
| `evidence-code.md` | 代码示例 |
| `cases.md` | 案例 |
| `analogies.md` | 类比 |
| `quotes.md` | 引用 |
| `pitfalls.md` | 踩坑 |
| `comparison.md` | 对比 |
| `actions.md` | 行动建议 |

atoms 是分叉点前最后一次平台无关的统一产物，每个 atom 带 `id / type / weight / platforms` 字段，供 outliner 按平台选取。

---

### outline · 大纲 [CP1]

- **执行者**：outliner agent
- **模式**：per_platform，每平台独立生成
- **产物**：`intermediate/03-outline/{platform}.md`
- **检查点**：所有平台大纲生成完毕后，向用户求确认（CP1）

大纲每节包含：论点、引用的 atoms（`atom: evidence-data-01` 格式）、预估字数、视觉断点（`writer:table` / `illustrator:svg-flow` 等 owner 标记）。

---

### draft · 正文草稿

- **执行者**：writer agent
- **模式**：per_platform，逐节生成后合并
- **产物**：
  - `intermediate/04a-draft/{platform}/section-NN.md`（逐节）
  - `intermediate/04a-draft/{platform}/merged-draft.md`（合并稿）
- **排版约束**：writer 按 Profile 的 `typesetting.containers.whitelist` 决定是否写 `:::` 容器；容器决策不在 pipeline 里，在 Profile 里

---

### figures · 配图

- **执行者**：illustrator agent
- **模式**：per_platform，与 draft **并行**执行
- **产物**：`intermediate/04b-figure/{platform}/fig-N.{svg|html|png|md}`
- **跳过条件**：`brief.no_figures == true`

---

### audit · 审校

- **执行者**：auditor agent
- **产物**：`review/05-audit/{platform}.md`
- **审校维度**：事实准确性、论证完整性、AI 味检测、风格偏离、句式问题、传播性评估

---

### polish · 润色 [CP2]

- **执行者**：polisher agent
- **产物**：
  - `review/06-polish/{platform}.md`（含变更溯源表）
  - `export/07-final/{platform}.md`（终稿）
- **检查点**：润色完成后展示终稿，用户确认后进入发布（CP2）

---

### publish · 发布产物 [CP3]

- **执行者**：publisher agent
- **产物**：`export/08-{platform}-publish.md`

| 平台 | 格式特点 |
|------|---------|
| wechat | 含 `:::` 容器语法，粘贴至 wechat-typeset 工具 |
| zhihu | 纯 GFM，直接投递 |
| juejin | 纯 GFM + 代码优先格式 |
| xiaohongshu | ≤500 字 + 话题标签 |

---

## 三个检查点

| 检查点 | 时机 | 你需要判断什么 |
|--------|------|--------------|
| CP1 | outline 完成后 | 论点是否准确？章节顺序合理？有遗漏信息吗？ |
| CP2 | polish 完成后 | 终稿质量是否达标？有无事实错误？ |
| CP3 | publish 完成后 | 发布产物格式是否正确？是否可以发出？ |

每个检查点通过 `AskUserQuestion` 工具向用户求确认，用户回复"继续"推进，回复具体修改意见则重跑对应阶段。

---

## 跳过条件

在 brief 中设置相应字段可跳过特定阶段：

```markdown
---
skip_research: true    # 跳过 research + atoms（你已有素材）
no_figures: true       # 跳过 figures（纯文字文章）
---
```

---

## 重跑单个阶段

在 Claude Code 中说：

```
重跑 outline          # 从 outline 开始重跑
重跑 draft wechat     # 只重跑 wechat 平台的 draft
重跑 polish           # 重跑 polish（从已有 audit 产物开始）
```

orchestrator 从对应阶段恢复，已完成的阶段不重复执行。

---

## 产物路径速查

```
content/articles/{slug}/
  intermediate/
    01-brief.md
    02-research-memo.md
    02-atoms/{claims,evidence-data,evidence-code,cases,...}.md
    03-outline/{platform}.md
    04a-draft/{platform}/section-NN.md
    04a-draft/{platform}/merged-draft.md
    04b-figure/{platform}/fig-N.{svg|html|png|md}
  review/
    05-audit/{platform}.md
    06-polish/{platform}.md
  export/
    07-final/{platform}.md
    08-{platform}-publish.md
    08-teaser-120chars.md     (仅 wechat)
```
