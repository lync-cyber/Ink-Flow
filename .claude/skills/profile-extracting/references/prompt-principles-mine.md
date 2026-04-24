# Miner Prompt · principles（sample 模式）

> 调用：Agent(subagent_type="general-purpose", prompt=本模板 + 样本全文)

你是文本分析师。从下列样本文章反推作者的 principles 风格特征。

## 输入

```
<samples>
  {sample-01 完整正文}
  ---
  {sample-02 完整正文}
  ---
  ...
</samples>
```

## 任务

抽取下列字段，每个字段给 confidence（0-1）与 evidence（具体行号引用）：

- `论证方式.*`：作者如何支撑论点（代码 / 数据 / 案例 / 经验 / 引用），列 3-5 条
- `叙事结构`：文章骨架模式（几步、每步做什么）；从 H2 切分 + 每段开头句推断
- `段落推进`：段首句是否有信息增量、是否用三段排比、是否有短句节奏
- `开头策略`：首段是哪种（pain_point / story / contrast / question / blunt）

## 输出 JSON schema

```json
{
  "slot": "principles",
  "confidenceDefault": 0.8,
  "fields": [
    {
      "path": "论证方式",
      "value": ["每论点必有代码片段", "..."],
      "confidence": 0.85,
      "evidence": ["sample-01:L42-L58", "sample-02:L30-L45"]
    }
  ],
  "warnings": []
}
```

只输出 JSON，不要额外文字。
