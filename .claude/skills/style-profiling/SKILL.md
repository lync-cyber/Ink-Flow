---
name: style-profiling
description: >
  风格提取 — 分析参考文章，提取七维度结构化风格 DNA，生成 style-profile.md。
  首次使用 InkFlow 或更换写作风格时执行。
  触发条件："分析风格"、"提取风格 DNA"、"创建风格档案"。
  当用户提到风格分析、写作风格、参考文章风格时，应触发此 skill。
argument-hint: "[参考文章路径]"
allowed-tools: Read, Write, Edit, Glob, Grep
---

# 风格提取

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

### 2. 收集参考文章

按优先级查找参考文章：

1. 用户直接指定的文章路径 → 使用指定文章
2. 已有的过往文章 `articles/*/output/final.md` → 扫描并让用户选择 3-5 篇
3. 无可用文章 → 用 AskUserQuestion 引导：

```
AskUserQuestion:
  question: "未找到参考文章。请提供 3-5 篇代表你风格的文章路径，或将文章内容粘贴到对话中。"
  options:
    - "我来指定文章路径"
    - "取消"
```

### 3. 执行风格分析

使用 Agent tool 调用风格分析 subagent，传入所有参考文章内容。

分析输出七维度风格 DNA：

| 维度 | 分析内容 |
|------|---------|
| 句式模式 | 常用句型、句子长度分布、标点习惯 |
| 段落结构 | 段落长度、段间过渡方式、信息密度 |
| 词汇特征 | 用词风格、术语密度、口语/书面比例 |
| 修辞手法 | 比喻、类比、反问等修辞偏好 |
| 文章结构 | 开头模式、结尾模式、论证框架 |
| 反面清单 | 不使用的表达方式、回避的句式 |
| 阅读节奏 | 轻重缓急节奏、视觉断点密度 |

每个维度提取 2-3 条**可执行规则**（"用 X 代替 Y"格式），不输出模糊描述。

### 4. 展示摘要

向用户展示风格 DNA 的关键特征摘要，确认是否满意。

```
AskUserQuestion:
  question: "风格 DNA 已生成，是否满意？"
  options:
    - "满意" — 展示完整结果
    - "重新分析" — 调整参考文章后重跑
    - "保存到文件" — 将结果写入指定路径
```

### 5. 存储路径

风格档案默认保存到 `styles/{profile_name}/style-profile.md`。例如 `styles/default/style-profile.md`。
writer/polisher 的 agent-memory 可引用此文件路径加载风格规则。
