# 验证规则参考

编排器在每个阶段完成后，从 `styles/default/stage-contracts.yaml`（通过 `.inkflow.yaml` 的 `contract_ref` 指向合约名）读取规则并独立校验输出文件。校验与 agent 上下文完全隔离——agent 不感知评判标准，避免"应试"行为污染输出质量。

## 8 种验证类型

> 字段名与 `stage-contracts.yaml` 中的合约定义一致。

### a. required_headings
- 对列表中每个标题名，用 Grep 检查输出文件是否包含 `^#+\s*{heading}`
- 不存在 → 记录 violation

### b. optional_headings
- 解析 skip_if 条件（格式: "brief.field == value"）
- 从 articles/{slug}/brief.md frontmatter 读取对应字段
- 条件成立 → 跳过该 heading
- 条件不成立 → 按 required_headings 检查

### c. required_per_section
- 仅适用于 outline 阶段：检查每个 `## Section` 块是否包含所有必需子项
- 对列表中每个子项名（如"论点"、"预估字数"），检查该 section 块内是否包含对应文本
- 缺失 → 记录 violation（附 section 标题和缺失子项）

### d. word_count
- 用 `wc -m < output_file` 统计字符数（中文准确）
- 低于 min 或高于 max → 记录 violation

### e. required_patterns
- 对列表中每个正则，用 Grep -E 检查输出文件
- 无匹配 → 记录 violation

### f. forbidden_patterns
- 对列表中每个正则，用 Grep -nE 检查输出文件
- 有匹配 → 记录 violation（附行号和前 3 处匹配）

### g. forbidden_patterns_from_rules
- 对列表中每个 rule 文件路径，读取该 rule 的 .md 正文
- 从引号内提取中文禁用词汇列表
- 对输出文件逐词检查（用 Grep -F）
- 有匹配 → 记录 violation（附来源 rule 和行号）

### h. platform_checks
- **css_safety**: 从 `tools/markdown-lint/lint-config.yaml` 的 `rules.css_safety.forbidden_css` 读取禁用列表（单一事实来源），用 Grep 检查输出文件
- **heading_level**: 用 Grep 提取所有 `^#` 行，验证标题级别在 allowed 列表中
- **image_width**: 用 Grep 提取 width 属性值，验证不超过 max_width

## 校验结果处理

- 0 violations → 写入 `stages.{name}.validation = { "passed": true, "violations": [] }`，标记 completed
- >0 violations → 写入 `stages.{name}.validation = { "passed": false, "violations": [...] }`，每条 violation 包含 `type`（a-g 类型标识）、`detail`（人类可读描述）、`source`（可选，规则来源文件）；进入错误处理（见 error-handling.md）

> 完整 validation 对象结构见 `pipeline-state-schema.md`。
