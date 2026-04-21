# profile 模式（自己文章 → 风格 DNA）

> 本文件为 style-learning skill 的 progressive-disclosure 子文档；主 SKILL.md 在
> 模式判定结果为 profile 时 Read 本文。

## 1. 风格档案命名

默认 `default`；用户可指定。`content/styles/{profile_name}/` 不存在则自动创建。

## 2. 收集参考文章

优先级：
1. 用户直接指定路径
2. 扫描 `content/articles/*/export/07-final/*.md`（per-platform 终稿，按平台分文件），
   让用户选 3-5 篇；同一篇文章的不同平台版本可并入一个样本集以提取跨平台共有风格
3. 无可用文章 → 提示用户提供

## 3. 调用 style-analyzer

`Agent tool → style-analyzer`，传入所有参考文章内容。
分析七维度（句式、段落、词汇、修辞、结构、反面清单、节奏 + 视觉节奏），
每维度提取 2-3 条**可执行规则**（"用 X 代替 Y"），不输出模糊描述。

## 4. 确认并存储

展示摘要 → 用户确认 → 写入 `content/styles/{profile_name}/style-profile.md`。
writer/polisher 在 draft/polish 阶段会优先使用此文件的规则。
