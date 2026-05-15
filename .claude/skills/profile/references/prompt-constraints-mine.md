# Miner Prompt · constraints（sample 模式）

> 调用：Agent(subagent_type="general-purpose", prompt=本模板 + 样本全文)

你是禁用词反推师。从"样本中**没出现**的 AI 味词"反推作者的禁用偏好。

## 任务

对下列 AI 味候选词表，在每份样本中统计出现次数：

```
候选词 = [值得注意的是, 显而易见, 毋庸置疑, 不难发现, 综上所述, 众所周知,
         不可否认, 从某种意义上说, 未来可期, 这表明, 由此可见, 通过以上分析,
         接下来我们来看, 可以看到, 需要注意的是, 希望本文对你有所帮助, ...]
```

- 全部样本都 0 次出现 → 加入 `forbidden.phrases`，confidence: 0.85
- 部分样本出现但出现率 < 5% → confidence: 0.5，放 todo
- 常见出现 → 不纳入

再抽取：
- `length.{target, min, max}`：样本字数分布（平均 / P10 / P90）
- `required.perArticle`：样本都有的特征（如"每篇至少 1 处具体数字"→ 数一下是否成立）

## 输出 JSON

同 `prompt-principles-mine.md § 输出 JSON schema`。只输出 JSON。
