---
name: style-studying
description: >
  外部学习 — 分析用户提供的第三方参考材料（模范文章、流行模板、风格指南），
  与现有规则对比，输出可操作的改进建议并按确认写入对应文件。
  触发条件："学习这篇文章"、"参考这个模板"、"进修"、"对标这篇"、"学习"。
  当用户提供外部参考材料或要求改善现有规则时，应触发此 skill。
---

# 外部学习

分析第三方参考材料，与 InkFlow 现有规则/风格对比，输出改进建议。

> 与 style-profiling 的区别：
> - **style-profiling**: 分析**自己的**文章 → 描述现有风格 DNA
> - **style-studying**: 分析**外部**材料 → 对比差距，提出改进

---

## 材料来源

按优先级查找参考材料：

1. 用户直接指定路径或粘贴内容
2. `references/` 目录下的文件（子目录：`articles/`、`templates/`、`style-guides/`）
3. 用户提供的 URL → 用 WebFetch 获取

```
AskUserQuestion:
  question: "学习材料来源？"
  options:
    - "扫描 references/ 目录" — 读取已放置的参考材料
    - "我来指定路径或粘贴内容"
    - "从 URL 获取"
```

---

## 分析维度

对每份参考材料，从以下维度与现有配置对比：

| 维度 | 对比目标 | 输出 |
|------|---------|------|
| 写作风格 | `styles/{profile}/style-profile.md` | 风格 DNA 差异（哪些维度参考材料做得更好） |
| 句式质量 | `quality-redline.md` + `writing-guiding` skill | 新的正向替换规则或禁用模式 |
| 排版手法 | `platform-base.md` + `wechat-platform.md` rules | 排版技巧（段落节奏、视觉断点密度等） |
| 结构模板 | `article-structuring` skill 的栏目骨架 | 骨架调整建议（section 顺序、开头策略等） |
| 视觉设计 | `columns.yaml` 色板 + `visual-theming` skill | 组件搭配改进 |

---

## 执行流程

### Step 1 — 读取材料

- 读取参考材料全文
- 识别材料类型：文章 / 排版模板 / 风格指南 / 其他
- 若为文章，提取栏目类型（学术/行业/技术/故事/通用）

### Step 2 — 对比分析

读取 InkFlow 当前配置文件：
- `styles/default/style-profile.md`（若存在）
- `styles/default/columns.yaml`
- `.claude/rules/domains/wechat-article/quality-redline.md`
- `.claude/skills/domains/wechat-article/writing-guiding/SKILL.md`
- `.claude/skills/domains/wechat-article/article-structuring/SKILL.md`

逐维度输出对比结果，每条建议标注：
- **发现**: 参考材料中的具体做法（附原文引用）
- **差距**: 与 InkFlow 当前规则的差异
- **建议**: 可操作的改动（精确到文件和字段）
- **影响范围**: 该改动会影响哪些 agent/skill

### Step 3 — 用户确认

```
AskUserQuestion:
  question: "以下是对比分析结果，请确认要采纳哪些建议"
  options:
    - "全部采纳" — 按建议写入对应文件
    - "逐条选择" — 批量勾选
    - "仅保存报告" — 不修改任何文件，报告存入 retro/
```

### Step 4 — 写入变更

用户确认的建议按类型写入对应文件：
- 风格规则 → `styles/{profile}/style-profile.md` 对应维度
- 正向替换 → `writing-guiding/SKILL.md` 替换表
- 禁用模式 → `lint-config.yaml` 的 `forbidden_patterns.words`
- 骨架调整 → `article-structuring/SKILL.md` 对应栏目
- 视觉建议 → `columns.yaml` 对应栏目段

每次写入前用 Read 确认文件当前内容，用 Edit 精确修改（不全量覆盖）。

### Step 5 — 输出报告

将完整分析报告写入 `retro/study-reports/{date}-{slug}.md`，包含：
- 参考材料摘要
- 逐维度对比结果
- 采纳/跳过的建议及原因

---

## 约束

- 不自动修改任何文件 — 所有变更必须经用户确认
- 建议必须具体到"改 X 文件的 Y 字段为 Z"，不给模糊建议
- 参考材料的风格特征需要与 InkFlow 的目标读者匹配才建议采纳
- 若参考材料质量不高（套话多、结构散），应如实指出而非强行提取规则
