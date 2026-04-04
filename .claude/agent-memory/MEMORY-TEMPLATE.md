# {agent_name} Agent 工作记忆

> 本文件为记忆模板参考。实际记忆通过 Claude Code 原生 memory 系统持久化。
> 各 agent 按以下分类积累经验，由 creation-reviewing 和 performance-benchmarking skill 在用户确认后写入。

## 记忆分类参考

| Agent | 记什么 | 不记什么 |
|-------|--------|---------|
| orchestrator | pipeline 执行问题模式、用户 checkpoint 偏好、常见 skip 组合 | 单次执行的临时状态 |
| writer | 用户偏好句式、被删模式禁用清单、字数偏好 | 具体文章的内容细节 |
| researcher | 来源可靠性评级、领域搜索策略、失效 URL 模式 | 单篇文章的调研数据 |
| outliner | 用户偏好的 section 数、常见论点结构、视觉断点密度偏好 | 具体文章的大纲内容 |
| polisher | 高频修复模式、用户拒绝的润色类型 | 具体文章的修改细节 |
| auditor | 高频问题类型统计、用户关注的审校维度 | 具体文章的审校条目 |
| publisher | 格式转换常见错误、用户偏好的导出格式 | 具体文章的导出产物 |

## 记忆条目格式

```
### {日期} — {来源 skill}
- {具体经验/偏好/模式}
```
