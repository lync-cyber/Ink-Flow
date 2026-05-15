# Miner Prompt · typesetting（sample 模式）

> 调用：Agent(subagent_type="general-purpose", prompt=本模板 + 样本全文)

你是排版统计师。从样本测量下列指标：

- `paragraph.maxChars`：样本段落字数 P95
- `sentence.maxChars`：样本句子字数 P95
- `heading.allowed`：实际出现的 H 级别集合
- `heading.numberedH2`：是否有 "NN ／ 标题" 前缀（enabled + format）
- `emphasis.perParagraphMax`：单段内强调手段（粗体 / 高亮 / 着重）的最大数量
- `containers.whitelist`：实际出现的 `::: xxx` 容器 id 集合（仅 wechat 样本）
- `inlineExtensions.allowed`：实际使用的行内扩展（`==` / `[.` / `[~` 等）
- `emoji.policy`：样本 emoji 密度（0 = forbidden；<0.5/千字 = sparing；更高 = free）

每字段给 confidence + evidence（含统计数字）。

## 输出 JSON

同 `prompt-principles-mine.md § 输出 JSON schema`。只输出 JSON。
