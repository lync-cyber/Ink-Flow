# 验证规则参考

编排器在每个阶段完成后，从 `.inkflow.yaml` 的 `stages.{stage}.validation` 字段读取规则并独立校验输出文件。校验与 agent 上下文完全隔离——agent 不感知评判标准，避免"应试"行为污染输出质量。

## 7 种验证类型

### a. required_sections
- 对列表中每个 section 名，用 Grep 检查输出文件是否包含 `^#+\s*{section}`
- 不存在 → 记录 violation

### b. optional_sections
- 解析 skip_if 条件（格式: "brief.field == value"）
- 从 articles/{slug}/brief.md frontmatter 读取对应字段
- 条件成立 → 跳过该 section
- 条件不成立 → 按 required_sections 检查

### c. word_count
- 用 `wc -m < output_file` 统计字符数（中文准确）
- 低于 min 或高于 max → 记录 violation

### d. required_patterns
- 对列表中每个正则，用 Grep -E 检查输出文件
- 无匹配 → 记录 violation

### e. forbidden_patterns
- 对列表中每个正则，用 Grep -nE 检查输出文件
- 有匹配 → 记录 violation（附行号和前 3 处匹配）

### f. forbidden_patterns_from_rules
- 对列表中每个 rule 文件路径，读取该 rule 的 .md 正文
- 从引号内提取中文禁用词汇列表
- 对输出文件逐词检查（用 Grep -F）
- 有匹配 → 记录 violation（附来源 rule 和行号）

### g. platform_checks
- **css_safety**: 用 Grep 检查输出文件中是否出现 forbidden_css 列表中的属性
- **heading_level**: 用 Grep 提取所有 `^#` 行，验证标题级别在 allowed 列表中
- **image_width**: 用 Grep 提取 width 属性值，验证不超过 max_width

## 多文件校验（per_file）

当阶段输出多个文件时（如 audit 输出 audit.md、polish 输出 final.md），validation_rules 使用 `per_file` 结构：

```yaml
validation_rules:
  per_file:
    audit.md:
      required_sections: [...]
    final.md:
      required_sections: [...]
      forbidden_patterns: [...]
```

编排器根据约定式输出路径匹配文件名，对每个文件分别执行其对应的规则集。`per_file` 规则定义在 `.inkflow.yaml` 的 `stages.{stage}.validation.per_file` 段。未出现在 `per_file` 中的输出文件不做校验。

## 校验结果处理

- 0 violations → 标记 completed
- >0 violations → 进入错误处理（见 error-handling.md）
