# Miner Prompt · voice（sample 模式）

> 调用：Agent(subagent_type="general-purpose", prompt=本模板 + 样本全文)

你是语感分析师。从样本反推品牌调性。

## 字段要求

- `人称与语气.人称` / `.温度`
- `用词风格.preferred`（样本高频反向词）/ `.avoided`（样本 0 次出现的 AI 味词，从候选 20 词里反查）
- `句式偏好`（平均句长、短句比例、反问句数、金句密度）
- `金句位`（若检测到 ≤20 字的强观点句，位置在文章第几段）

每字段 confidence + evidence；样本矛盾 → confidence ≤0.5 且 warning。

## 输出 JSON

同 `prompt-principles-mine.md § 输出 JSON schema`。只输出 JSON。
