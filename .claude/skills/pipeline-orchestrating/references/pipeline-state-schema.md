# Pipeline State Schema

`runtime/pipeline-states/{slug}.json` 的完整结构定义。编排器在各阶段写入状态时遵循此 schema。

## 设计原则

- **足够但不冗余**: 记录"发生了什么 + 花了多久 + 结果如何"，不记录实现细节
- **可审计**: 复盘 skill 可从 state 读取阶段耗时、校验结果、重试次数，无需回溯对话
- **可恢复**: 中断恢复逻辑所需的全部信息自包含在 state 中

## 顶层结构

```json
{
  "slug": "react-hooks-deep-dive",
  "created_at": "2026-04-04T10:00:00Z",
  "meta": { ... },
  "stages": {
    "brief":    { ... },
    "research": { ... },
    "atoms":    { ... },
    "outline":  { "per_platform": true, "platforms": { ... }, "overall_status": "..." },
    "draft":    { "per_platform": true, "platforms": { ... }, "overall_status": "..." },
    "figures":  { "per_platform": true, "platforms": { ... }, "overall_status": "..." },
    "audit":    { "per_platform": true, "platforms": { ... }, "overall_status": "..." },
    "polish":   { "per_platform": true, "platforms": { ... }, "overall_status": "..." },
    "publish":  { "per_platform": true, "platforms": { ... }, "overall_status": "..." }
  }
}
```

`per_platform: true` 的阶段不再持有扁平状态字段，状态下沉到
`stages.{stage}.platforms.{platform}`。`overall_status ∈
{all_completed, partial, failed}`（来自 `orchestrator/fanout.md` § 状态存储）。

## meta — 全局元数据

Brief 阶段确定后一次写入，后续阶段只读。

```json
"meta": {
  "topic": "React Hooks 深度解析",
  "content_column": "tech",
  "content_type": "deep_dive",
  "audience": "tech_intermediate",
  "target_length": 1500,
  "opening_style": "pain_point",
  "series_name": "",
  "series_index": 0,
  "topic_assessment": {
    "search_heat": "高",
    "differentiation": "中",
    "column_fit": "高",
    "verdict": "推荐",
    "suggestion": "聚焦 useEffect 清理陷阱，市面文章多讲用法少讲原理"
  }
}
```

| 字段 | 来源 | 说明 |
|------|------|------|
| `topic` | 用户输入 | 文章主题 |
| `content_column` | Step 2b 确认 | 栏目 ID（academic/industry/tech/story） |
| `content_type` | Step 2 采集 | 文章类型 |
| `audience` | Step 2 采集 | 目标读者 |
| `target_length` | brief 默认值或用户指定 | 目标字数 |
| `opening_style` | Step 2 采集或 auto | 开头策略（auto 时记录最终解析值） |
| `series_name` | 系列规划 | 空字符串表示独立文章 |
| `series_index` | 系列规划 | 0 表示非系列 |
| `topic_assessment` | Step 2c 选题评估 | 选题可行性评估结果（skip_research=true 时省略） |

### topic_assessment 字段

| 字段 | 值域 | 说明 |
|------|------|------|
| `search_heat` | 高/中/低 | 近 3 个月相关内容量 |
| `differentiation` | 大/中/小 | 现有内容饱和度 |
| `column_fit` | 高/中/低 | 主题与栏目调性匹配度 |
| `verdict` | 推荐/可行/风险 | 综合判断 |
| `suggestion` | 自由文本 | 建议差异化角度 |

## 阶段通用字段

每个**非 per_platform** 阶段共享以下字段结构：

```json
"{stage_name}": {
  "status": "completed",
  "started_at": "2026-04-04T10:05:00Z",
  "completed_at": "2026-04-04T10:08:30Z",
  "agent": "researcher",
  "skipped_reason": null,
  "validation": {
    "passed": true,
    "violations": []
  },
  "retries": []
}
```

**per_platform** 阶段的结构（outline / draft / figures / audit / polish / publish）：

```json
"{stage_name}": {
  "per_platform": true,
  "overall_status": "all_completed",
  "agent": "writer",
  "started_at": "...",
  "completed_at": "...",
  "platforms": {
    "wechat":      { "status": "completed", "started_at": "...", "completed_at": "...", "validation": {...}, "retries": [...] },
    "zhihu":       { "status": "completed", ... },
    "xiaohongshu": { "status": "failed",    "violations": [...], "retries": [...] },
    "juejin":      { "status": "skipped",   "reason": "applicable_if 不满足" }
  }
}
```

- `overall_status` 由 fanout 根据各平台状态聚合：
  - `all_completed`：所有 effective_platforms = completed
  - `partial`：部分 completed，其他 skipped，无 failed
  - `failed`：任一平台 failed
- Checkpoint 若挂在 per_platform 阶段（如 CP1@outline / CP2@polish），直接写在该阶段顶层的 `checkpoint` 字段，
  决策含"是否允许部分平台未完成就放行"由 orchestrator/checkpoints.md 决定。

| 字段 | 类型 | 何时写入 | 说明 |
|------|------|----------|------|
| `status` | enum | 每次状态变更 | pending / in_progress / completed / skipped / failed |
| `started_at` | ISO 8601 | 标记 in_progress 时 | 阶段开始时间 |
| `completed_at` | ISO 8601 | 标记 completed/failed 时 | 阶段结束时间 |
| `agent` | string | 初始化时 | 执行该阶段的 agent 名称 |
| `skipped_reason` | string \| null | 标记 skipped 时 | skip_if 条件表达式（如 "brief.skip_research == true"） |
| `validation` | object | 校验完成后 | 校验结果 |
| `retries` | array | 每次重试时追加 | 重试记录 |

### validation 对象

```json
"validation": {
  "passed": false,
  "violations": [
    {
      "type": "forbidden_patterns",
      "detail": "发现禁用句式「随着 X 的发展」（第 12 行）",
      "source": ".claude/rules/domains/wechat-article/redline.md"
    }
  ]
}
```

- `passed`: boolean — 是否通过全部校验
- `violations`: array — 未通过的校验项，每项包含 `type`（验证类型之一）、`detail`（人类可读描述）、`source`（可选，规则来源文件）

### retries 数组

```json
"retries": [
  {
    "attempt": 1,
    "level": "L2",
    "reason": "forbidden_patterns violation",
    "started_at": "2026-04-04T10:09:00Z",
    "completed_at": "2026-04-04T10:12:00Z",
    "resolved": true
  }
]
```

- `attempt`: 重试序号（从 1 开始）
- `level`: 错误处理层级（L1/L2/L3/L4）
- `reason`: 触发重试的原因（简短描述）
- `started_at` / `completed_at`: 重试时间窗口
- `resolved`: 该次重试是否解决了问题

## 阶段特有字段

### brief

Brief 是用户输入阶段，不经过 agent，无 validation。记录用户交互决策。

```json
"brief": {
  "status": "completed",
  "started_at": "2026-04-04T10:00:00Z",
  "completed_at": "2026-04-04T10:04:00Z",
  "agent": null,
  "decisions": {
    "column_source": "user_selected",
    "opening_source": "auto_from_column",
    "outline_review": "adopted",
    "user_overrides": ["target_length: 2000"]
  }
}
```

| 字段 | 说明 |
|------|------|
| `column_source` | 栏目确定方式：`user_selected`（Step 2b 选择）/ `extracted`（快速路径从消息提取）/ `inherited`（系列继承） |
| `opening_source` | 开头策略来源：`user_selected` / `auto_from_column` / `auto_from_content_type` |
| `outline_review` | 用户大纲审查结果：`adopted`（采纳建议）/ `partial`（部分采纳）/ `kept`（保持原样）/ `null`（用户未提供大纲） |
| `user_overrides` | 用户覆盖了默认值的字段列表（格式："field: value"），空数组表示全部使用默认值 |

### draft（per_platform）

Draft 在 per_platform 结构下把 `sections` 下沉到每个平台：

```json
"draft": {
  "per_platform": true,
  "overall_status": "partial",
  "agent": "writer",
  "started_at": "2026-04-04T10:30:00Z",
  "platforms": {
    "wechat": {
      "status": "in_progress",
      "started_at": "2026-04-04T10:30:00Z",
      "sections": [
        { "index": 1, "title": "一句话结论", "status": "completed",
          "started_at": "2026-04-04T10:30:00Z",
          "completed_at": "2026-04-04T10:33:00Z",
          "artifact": "intermediate/04a-draft/wechat/section-01.md",
          "word_count": 320 },
        { "index": 2, "title": "问题定义", "status": "in_progress",
          "started_at": "2026-04-04T10:33:30Z",
          "artifact": "intermediate/04a-draft/wechat/section-02.md",
          "word_count": null }
      ],
      "merged_word_count": null,
      "validation": null,
      "retries": []
    },
    "zhihu": { "status": "completed", "sections": ["..."], "merged_word_count": 3200 }
  }
}
```

| 字段 | 说明 |
|------|------|
| `platforms.{p}.sections[].title` | section 标题（从该平台 outline 提取，便于日志可读性） |
| `platforms.{p}.sections[].word_count` | 该 section 字符数（completed 后写入） |
| `platforms.{p}.merged_word_count` | 该平台 merged-draft.md 总字符数（全部 section 完成后写入） |

### audit

```json
"audit": {
  "status": "completed",
  "started_at": "2026-04-04T11:00:00Z",
  "completed_at": "2026-04-04T11:05:00Z",
  "agent": "auditor",
  "summary": {
    "fact_issues": 2,
    "ai_tone_issues": 5,
    "style_deviations": 1,
    "sentence_issues": 3,
    "severity_high": 1,
    "severity_medium": 3,
    "severity_low": 4
  },
  "validation": { "passed": true, "violations": [] },
  "retries": []
}
```

| 字段 | 说明 |
|------|------|
| `summary.fact_issues` | 事实准确性问题数 |
| `summary.ai_tone_issues` | AI 味问题数 |
| `summary.style_deviations` | 风格偏离数 |
| `summary.sentence_issues` | 句式问题数 |
| `summary.severity_high/medium/low` | 按严重性分级统计 |

### polish

```json
"polish": {
  "status": "completed",
  "started_at": "2026-04-04T11:10:00Z",
  "completed_at": "2026-04-04T11:18:00Z",
  "agent": "polisher",
  "high_severity_resolved": 1,
  "high_severity_rejected": 0,
  "validation": { "passed": true, "violations": [] },
  "retries": []
}
```

| 字段 | 说明 |
|------|------|
| `high_severity_resolved` | 高严重性条目已处理数 |
| `high_severity_rejected` | 高严重性条目被拒绝数（需用户在 CP2 确认） |

### checkpoint 记录

Checkpoint 不是独立阶段，而是附属于其前序阶段。记录在对应阶段的 `checkpoint` 字段中。

```json
"outline": {
  "status": "completed",
  "checkpoint": {
    "id": "CP1",
    "decision": "approved",
    "modifications": ["合并 section 3 和 4", "删除不确定项 X"],
    "decided_at": "2026-04-04T10:25:00Z"
  }
}
```

```json
"polish": {
  "checkpoint": {
    "id": "CP2",
    "decision": "approved_with_edits",
    "modifications": ["用户手动编辑了第 3 节"],
    "decided_at": "2026-04-04T11:25:00Z"
  }
}
```

CP3 现挂在 `publish` 阶段（发布确认），示例：

```json
"publish": {
  "per_platform": true,
  "overall_status": "all_completed",
  "agent": "publisher",
  "platforms": { "...": "..." },
  "checkpoint": {
    "id": "CP3",
    "decision": "approved",
    "modifications": [],
    "decided_at": "2026-04-04T11:35:00Z"
  }
}
```

| 字段 | 说明 |
|------|------|
| `id` | CP1 / CP2 / CP3 |
| `decision` | `approved`（直接通过）/ `approved_with_edits`（修改后通过）/ `rejected`（打回重做）/ `returned`（返回前序阶段） |
| `modifications` | 用户在 checkpoint 做的调整（简短描述列表），无调整则为空数组 |
| `decided_at` | 用户做出决策的时间 |

## 完整示例（per-platform · 目标平台 = wechat + zhihu）

一次成功 pipeline 运行产生的最终 state 文件（字段省略号表示与"阶段通用字段"相同，不再重复）：

```json
{
  "slug": "react-hooks-deep-dive",
  "created_at": "2026-04-04T10:00:00Z",
  "meta": {
    "topic": "React Hooks 深度解析",
    "content_column": "tech",
    "target_platforms": ["wechat", "zhihu"],
    "primary_platform": "wechat",
    "...": "..."
  },
  "stages": {
    "brief":    { "status": "completed", "agent": null, "decisions": { "...": "..." } },
    "research": { "status": "completed", "agent": "researcher", "validation": { "passed": true } },
    "atoms":    { "status": "completed", "agent": "atomizer",  "validation": { "passed": true } },

    "outline": {
      "per_platform": true, "overall_status": "all_completed", "agent": "outliner",
      "platforms": {
        "wechat": { "status": "completed", "validation": { "passed": true } },
        "zhihu":  { "status": "completed", "validation": { "passed": true } }
      },
      "checkpoint": { "id": "CP1", "decision": "approved", "modifications": [], "decided_at": "..." }
    },

    "draft": {
      "per_platform": true, "overall_status": "all_completed", "agent": "writer",
      "platforms": {
        "wechat": {
          "status": "completed",
          "sections": [
            { "index": 1, "title": "一句话结论", "status": "completed",
              "artifact": "intermediate/04a-draft/wechat/section-01.md", "word_count": 280 },
            "..."
          ],
          "merged_word_count": 1630,
          "validation": { "passed": true }
        },
        "zhihu": { "status": "completed", "sections": ["..."], "merged_word_count": 3200 }
      }
    },

    "figures": {
      "per_platform": true, "overall_status": "all_completed", "agent": "illustrator",
      "platforms": { "wechat": { "status": "completed" }, "zhihu": { "status": "completed" } }
    },

    "audit": {
      "per_platform": true, "overall_status": "all_completed", "agent": "auditor",
      "platforms": {
        "wechat": { "status": "completed",
                    "summary": { "fact_issues": 1, "ai_tone_issues": 3, "severity_high": 0 },
                    "validation": { "passed": true } },
        "zhihu":  { "status": "completed", "summary": { "...": "..." } }
      }
    },

    "polish": {
      "per_platform": true, "overall_status": "all_completed", "agent": "polisher",
      "platforms": {
        "wechat": { "status": "completed", "high_severity_resolved": 0, "validation": { "passed": true } },
        "zhihu":  { "status": "completed", "high_severity_resolved": 0 }
      },
      "checkpoint": { "id": "CP2", "decision": "approved", "modifications": [] }
    },

    "publish": {
      "per_platform": true, "overall_status": "all_completed", "agent": "publisher",
      "platforms": {
        "wechat": { "status": "completed", "validation": { "passed": true } },
        "zhihu":  { "status": "completed", "validation": { "passed": true } }
      },
      "checkpoint": { "id": "CP3", "decision": "approved", "modifications": [] }
    }
  }
}
```

单平台场景（仅 wechat）同上——`platforms` 对象只有 `wechat` 一个键。

## 写入规则

| 时机 | 写入内容 |
|------|----------|
| Brief 完成 | `slug`、`created_at`、`meta`（含 topic_assessment）、初始化全部 stages 为 pending、brief 标记 completed |
| 阶段开始前 | `stages.{name}.status = "in_progress"`、`started_at` |
| 阶段完成后 | `completed_at`、`validation`（含 violations 详情） |
| 校验失败 | `validation.passed = false`、追加 `retries[]` |
| 重试完成 | 更新 `retries[]` 末项的 `completed_at` 和 `resolved` |
| skip_if 命中 | `status = "skipped"`、`skipped_reason` |
| Checkpoint 通过 | `checkpoint` 对象（含 decision、modifications） |
| Draft section | 更新 `sections[]` 对应项的 status/时间/word_count |
| Audit 完成 | `summary` 对象（从 `review/05-audit/{platform}.md` 提取统计数字，多平台逐平台合并） |
| Polish 完成 | `high_severity_resolved/rejected`（从变更溯源表统计） |

