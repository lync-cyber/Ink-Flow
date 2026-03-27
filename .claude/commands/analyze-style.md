---
description: 分析参考文章，提取七维度结构化风格 DNA，生成 style-profile.md
---

## 执行逻辑

### 1. 前置检查
- 读取 style_profile 参数（默认 "default"）
- 扫描 `styles/{style_profile}/` 目录下的 `exemplar-*.md` 文件
- 至少需要 1 篇参考文章（推荐 3-5 篇）
- 若无参考文章 → 提示用户将"就是这个味道"的文章放入 `styles/{style_profile}/` 目录

### 2. 调用 Style-Analyzer Agent
- 使用 `.claude/agents/style-analyzer.md` 定义的 style-analyzer subagent
- 输入: `styles/{style_profile}/` 目录下所有 exemplar-*.md 文件
- Agent 分析七个维度:
  1. 句式偏好
  2. 段落结构
  3. 词汇特征
  4. 修辞手法
  5. 结构特征
  6. 反面清单
  7. 阅读节奏（移动端体验）

### 3. 校验输出
- 运行 contract-validator.sh 校验
- 检查: 七个维度 section 都存在
- 检查: 每个维度有 2-3 条可执行规则

### 4. 输出
- 写入 `styles/{style_profile}/style-profile.md`
- 展示风格 DNA 摘要
- 提示: "风格 DNA 已提取。后续写作阶段将自动注入这些规则。"

### 5. 使用建议
- 首次使用 InkFlow 前执行一次
- 更换参考文章后重新执行
- 风格 DNA 是 writer 和 editor agent 的核心约束来源
