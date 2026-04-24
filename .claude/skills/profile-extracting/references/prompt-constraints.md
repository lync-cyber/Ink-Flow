# Prompt · constraints slot（goal 模式）

> 调用：Agent(subagent_type="general-purpose", prompt=本模板 + 下文 `<inputs>`)

你是约束清单编辑。基于下列输入生成 `profiles/{id}/constraints.yaml`。

```
<inputs>
column: {Q3}
platform: {Q1}
kpi: {Q5}
hard_bans: {Q6}
</inputs>
```

## 硬约束

- yaml 顶部：`slot: constraints` + `version: 1.0.0`
- `forbidden.phraseReplacements` 给 5-10 条"错误 → 正确"映射（AI 味词的正向替换）
- `length.{target, min, max, softFactor: 1.1, hardFactor: 1.2}` 必填
- 若 column 是标准四栏目之一，在 `columns.{column}` 下填 `defaultOpening / defaultCta / numberedH2 / kpiTargets`（从 inputs 的 kpi 摘取）
- 若 hard_bans 非空，转换为 `forbidden.phrases` 列表或 `forbidden.patterns` 正则

## 输出格式

```yaml
slot: constraints
version: 1.0.0

forbidden:
  phraseReplacements:
    "换言之": "说白了"
    # ...

length:
  target: ...
  min: ...
  max: ...
  softFactor: 1.1
  hardFactor: 1.2

columns:
  {column}:
    name: ...
    defaultOpening: pain_point | story | contrast | question | blunt
    defaultCta: follow | comment | share | bookmark
    numberedH2: true | false
    kpiTargets: { ... }
    titleGuidance: ...
```

只输出 yaml 内容。
