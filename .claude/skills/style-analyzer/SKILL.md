---
name: style-analyzer
description: >
  分析参考文章，提取七维度结构化风格 DNA，生成 style-profile.md。
  首次使用 InkFlow 或更换写作风格时执行。
  触发条件："分析风格"、"提取风格 DNA"、"创建风格档案"、"/analyze-style"。
  当用户提到风格分析、写作风格、参考文章风格时，应触发此 skill。
---

# 风格分析器

分析 3-5 篇参考文章，提取七维度结构化风格 DNA，生成 `style-profile.md`。

## 执行流程

### 1. 确定风格档案名称

- 默认使用 `default`
- 若用户指定了名称 → 使用指定名称
- 若不确定 → 用 AskUserQuestion 询问：

```
AskUserQuestion:
  question: "风格档案命名？"
  options:
    - "default" — 默认风格
    - "输入自定义名称"
```

### 2. 扫描参考文章

扫描 `styles/{profile}/exemplar-*.md` 文件：

- 找到 3+ 篇 → 继续
- 找到 1-2 篇 → 提醒用户建议补充到 3-5 篇，但可继续
- 找到 0 篇 → 用 AskUserQuestion 引导：

```
AskUserQuestion:
  question: "未找到参考文章。请将 3-5 篇代表性文章放入 styles/{profile}/ 目录，命名为 exemplar-*.md"
  options:
    - "已添加，继续分析"
    - "取消"
```

### 3. 调用 style-analyzer Agent

使用 `.claude/agents/style-analyzer.md` 定义的 subagent，传入所有 exemplar 文件内容。

Agent 输出七维度风格 DNA 到 `styles/{profile}/style-profile.md`：

| 维度 | 分析内容 |
|------|---------|
| 句式模式 | 常用句型、句子长度分布、标点习惯 |
| 段落结构 | 段落长度、段间过渡方式、信息密度 |
| 词汇特征 | 用词风格、术语密度、口语/书面比例 |
| 修辞手法 | 比喻、类比、反问等修辞偏好 |
| 文章结构 | 开头模式、结尾模式、论证框架 |
| 负面清单 | 不使用的表达方式、回避的句式 |
| 阅读节奏 | 轻重缓急节奏、视觉断点密度 |

### 4. 校验输出

运行 `.claude/skills/inkflow/scripts/contract-validator.sh` 校验：
- 七个维度 section 全部存在
- 每个维度有具体规则（非空泛描述）

### 5. 展示摘要

向用户展示风格 DNA 的关键特征摘要，确认是否满意。

```
AskUserQuestion:
  question: "风格 DNA 已生成，是否满意？"
  options:
    - "满意，保存" — 保存 style-profile.md
    - "重新分析" — 调整参考文章后重跑
    - "手动编辑" — 让用户编辑 style-profile.md
```
