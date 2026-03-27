# InkFlow Skill 类型系统

本文档定义 InkFlow 中 Skill 的类型分类、注入机制和 frontmatter 规范。编排器按此合约执行 skill 注入。

## 类型定义

InkFlow skill 分为 4 种类型：

| Type | 注入点 | 注入方式 | 用途 | 代表 Skill |
|------|--------|---------|------|-----------|
| `rule` | Agent **Constraints** 段 | 作为约束条目追加到 agent prompt 的 Constraints 部分 | 禁用词汇/句式/模式清单 | anti-ai-style |
| `context` | Agent **Context** 段 | 作为上下文信息追加，可包含 few-shot 示例 | 写作策略、风格参考、开头模式 | writing-strategy, style-reference, opening-hooks |
| `transform` | Agent 输出**之后** | 按 `transform_order` 顺序对 stage 产出物执行变换 | 去 AI 味润色、格式导出 | de-ai-polish, wechat-format |
| `orchestration` | 主会话 | 直接在主会话中运行，驱动 pipeline 或独立工作流 | pipeline 编排、风格分析、反馈闭环 | inkflow, style-analyzer, feedback-loop |

## 注入时序

```
                     ┌─── rule skill ──────> Agent Constraints
                     │
Pipeline Stage ──────┼─── context skill ───> Agent Context
                     │
                     └─── Agent 执行 ───────> 产出物
                                               │
                                          transform skill(s)
                                          (按 transform_order)
                                               │
                                          最终产出物
```

## Frontmatter 规范

### 通用必填字段

所有 skill 必须包含：

```yaml
---
name: {skill-name}          # 唯一标识，kebab-case
type: {rule|context|transform|orchestration}
description: {一行描述}       # 触发匹配和文档用
---
```

### 按类型的额外字段

#### rule 类型

```yaml
---
name: anti-ai-style
type: rule
description: ...
domain: wechat-article       # 所属领域（core 表示跨领域通用）
inject_at: [draft, refine]   # 注入到哪些 pipeline stage
---
```

**正文约定**：以条目化清单形式列出禁用词汇/句式/模式。编排器提取正文全文作为 Constraints 追加。contract-validator 的 `forbidden_patterns_from_skills` 从中提取引号内的中文模式进行自动校验。

#### context 类型

```yaml
---
name: style-reference
type: context
description: ...
domain: wechat-article
context_source: "styles/{style_profile}/style-profile.md"  # 上下文数据来源
context_selector: "按 topic 相似度选最相关 exemplar"         # 可选：部分注入策略
inject_at: [draft]           # 可选：覆盖 pipeline YAML 调度
---
```

**正文约定**：描述注入策略和选择逻辑。编排器按 `context_source` 加载数据，按 `context_selector`（若有）筛选，将结果追加到 agent 的 Context 段。

#### transform 类型

```yaml
---
name: de-ai-polish
type: transform
description: ...
domain: core
input: "{stage_output}"      # 输入（通常为 stage 产出物）
output: "{polished_output}"  # 输出
transform_order: 1           # 同 stage 多 transform 时的执行顺序（数字越小越先）
inject_at: [refine]
---
```

**正文约定**：以操作步骤形式描述变换规则。编排器在 agent 产出物生成后，按 `transform_order` 顺序应用 transform skill。

#### orchestration 类型

```yaml
---
name: inkflow
description: ...
# orchestration 类型无 type 字段（由 Claude Code 直接作为 user-invocable skill 加载）
# 无 inject_at（不被 pipeline 注入，而是驱动 pipeline）
---
```

**正文约定**：描述完整的编排逻辑，包含初始化、stage 执行算法、checkpoint 交互、错误处理等。

## Pipeline YAML 与 Skill 的关系

Pipeline YAML 在 `skills.stages` 中声明各 stage 需要注入的 skill：

```yaml
skills:
  stages:
    draft:
      - name: anti-ai-style       # rule → 注入 Constraints
      - name: writing-strategy     # context → 注入 Context
      - name: style-reference      # context → 注入 Context
      - name: opening-hooks        # context → 注入 Context
        condition: "stage.section_index == 0"
    refine: [de-ai-polish]         # transform → 产出物后变换
    publish:
      - name: wechat-format        # transform → 格式导出
```

编排器按以下顺序处理：
1. 收集当前 stage 的所有 skill（从 `skills.global` + `skills.stages.{stage}`）
2. 评估 `condition`（若有），过滤不满足条件的 skill
3. 按 type 分组：rule → 追加 Constraints，context → 追加 Context
4. Spawn agent
5. Agent 完成后，按 `transform_order` 执行 transform skill

## Skill 开发清单

创建新 skill 时确认：
- [ ] frontmatter 包含 `name`、`type`、`description`
- [ ] `type` 为 `rule`/`context`/`transform`/`orchestration` 之一
- [ ] 领域 skill 声明 `domain` 字段
- [ ] transform skill 声明 `transform_order`
- [ ] `inject_at` 与 pipeline YAML 中的调度一致
- [ ] 附带 ≥ 2 个测试用例（`tests/evals/{skill-name}/evals.json`）
- [ ] 已注册到对应 `domain.yaml` 的 skills 列表中（领域 skill）
