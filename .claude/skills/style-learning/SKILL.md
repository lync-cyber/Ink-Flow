---
name: style-learning
description: >
  风格学习 — 统一入口，支持两种模式：
  （1）profile：分析自己的文章，提取风格 DNA，生成 style-profile.md；
  （2）study：分析外部参考材料，与现有规则对比，输出改进建议并按确认写入。
  触发条件："分析风格"、"提取风格 DNA"、"创建风格档案"、
  "学习这篇文章"、"参考这个模板"、"进修"、"对标"。
argument-hint: "[profile | study] [参考材料路径或 URL]"
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, WebFetch, AskUserQuestion
---

# 风格学习（Style Learning）

单一入口，两种模式。

| 模式 | 目标 | 输出 |
|---|---|---|
| **profile** | 分析**自己的**文章 → 描述现有风格 DNA | `styles/{profile_name}/style-profile.md` |
| **study** | 分析**外部**材料 → 对比差距，提出改进 | `retro/study-reports/{date}-{slug}.md` + 按确认修改规则文件 |

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

默认 `default`；用户可指定。

### 2. 收集参考文章

优先级：
1. 用户直接指定路径
2. 扫描 `articles/*/export/_final.md`，让用户选 3-5 篇
3. 无可用文章 → 提示用户提供

### 3. 调用 style-analyzer

`Agent tool → style-analyzer`，传入所有参考文章内容。
分析七维度（句式、段落、词汇、修辞、结构、反面清单、节奏），
每维度提取 2-3 条**可执行规则**（"用 X 代替 Y"），不输出模糊描述。

### 4. 确认并存储

展示摘要 → 用户确认 → 写入 `styles/{profile_name}/style-profile.md`。
writer/polisher 在 draft/polish 阶段会优先使用此文件的规则。

---

## 模式 B: study（外部材料 → 改进建议）

### 1. 材料来源

```
AskUserQuestion:
  question: "学习材料来源？"
  options:
    - "扫描 references/ 目录"
    - "指定路径或粘贴内容"
    - "从 URL 获取（WebFetch）"
```

### 2. 分析维度（对比现有配置）

| 维度 | 对比目标 | 输出 |
|---|---|---|
| 写作风格 | `styles/{profile}/style-profile.md` | 风格 DNA 差异 |
| 句式质量 | `config/columns.yaml` 的 `phrase_replacements` + `rules/data/forbidden-phrases.yaml` + `redline.md` | 新替换规则或禁用模式 |
| 排版手法 | `rules/core/platform-base.md` + `domains/wechat-article/platform.md` | 排版改进 |
| 结构模板 | `config/columns.yaml` 的 `columns.{col}.skeleton` | 骨架调整 |
| 视觉设计 | `config/columns.yaml` 的色板 + `suggested_components` | 组件搭配 |

### 3. 执行流程

**Step 1** 读材料，识别类型（文章/模板/风格指南），提取栏目。

**Step 2** 读 InkFlow 当前配置：
- `styles/default/style-profile.md`（若存在）
- `config/columns.yaml`
- `.claude/rules/data/forbidden-phrases.yaml`
- `.claude/rules/domains/wechat-article/redline.md`

逐维度输出，每条含：
- **发现**：原文引用
- **差距**：与现有规则的差异
- **建议**：精确到"改 X 文件的 Y 字段为 Z"
- **影响范围**：涉及的 agent/skill

**Step 3** 用户确认：

```
AskUserQuestion:
  question: "以下分析结果，要采纳哪些？"
  options:
    - "全部采纳"
    - "逐条选择"
    - "仅保存报告，不改文件"
```

**Step 4** 写入变更（按类型落到对应文件）：

| 建议类型 | 目标文件 |
|---|---|
| 风格规则 | `styles/{profile}/style-profile.md` |
| 正向替换 | `config/columns.yaml` 的 `phrase_replacements` |
| 禁用模式 | `.claude/rules/data/forbidden-phrases.yaml` 对应分组 |
| 骨架调整 | `config/columns.yaml` 的 `columns.{col}.skeleton` |
| 视觉建议 | `config/columns.yaml` 的 `colors` / `suggested_components` |

每次写入前 Read 确认当前内容，用 Edit 精确修改。

**Step 5** 完整报告 → `retro/study-reports/{date}-{slug}.md`

## 约束

- 不自动修改文件——所有变更经用户确认
- 建议必须具体到文件/字段
- 参考材料质量不高时应如实指出，不强行提取
