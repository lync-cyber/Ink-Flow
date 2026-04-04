# Pipeline State Schema

`.pipeline-states/{slug}.json` 的完整结构定义。编排器在各阶段写入状态时遵循此 schema。

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
    "brief": { ... },
    "research": { ... },
    "outline": { ... },
    "draft": { ... },
    "figures": { ... },
    "audit": { ... },
    "polish": { ... },
    "publish": { ... }
  }
}
```

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

每个阶段共享以下字段结构：

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
      "source": ".claude/rules/domains/wechat-article/quality-redline.md"
    }
  ]
}
```

- `passed`: boolean — 是否通过全部校验
- `violations`: array — 未通过的校验项，每项包含 `type`（7 种验证类型之一）、`detail`（人类可读描述）、`source`（可选，规则来源文件）

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

### draft

Draft 阶段支持 section 粒度跟踪。

```json
"draft": {
  "status": "in_progress",
  "started_at": "2026-04-04T10:30:00Z",
  "completed_at": null,
  "agent": "writer",
  "sections": [
    {
      "index": 1,
      "title": "一句话结论",
      "status": "completed",
      "started_at": "2026-04-04T10:30:00Z",
      "completed_at": "2026-04-04T10:33:00Z",
      "artifact": "drafts/section-1.md",
      "word_count": 320
    },
    {
      "index": 2,
      "title": "问题定义",
      "status": "in_progress",
      "started_at": "2026-04-04T10:33:30Z",
      "completed_at": null,
      "artifact": "drafts/section-2.md",
      "word_count": null
    }
  ],
  "merged_word_count": null,
  "validation": null,
  "retries": []
}
```

| 字段 | 说明 |
|------|------|
| `sections[].title` | section 标题（从 outline 提取，便于日志可读性） |
| `sections[].word_count` | 该 section 字符数（completed 后写入） |
| `merged_word_count` | 合并后 full.md 总字符数（全部 section 完成后写入） |

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
    "structure_issues": 0,
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
| `summary.ai_tone_issues` | AI 味/句式问题数 |
| `summary.style_deviations` | 风格偏离数 |
| `summary.structure_issues` | 结构/排版问题数 |
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

```json
"publish": {
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

## 完整示例

一次成功的 pipeline 运行产生的最终 state 文件：

```json
{
  "slug": "react-hooks-deep-dive",
  "created_at": "2026-04-04T10:00:00Z",
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
      "suggestion": "聚焦 useEffect 清理陷阱"
    }
  },
  "stages": {
    "brief": {
      "status": "completed",
      "started_at": "2026-04-04T10:00:00Z",
      "completed_at": "2026-04-04T10:04:00Z",
      "agent": null,
      "decisions": {
        "column_source": "user_selected",
        "opening_source": "auto_from_column",
        "outline_review": null,
        "user_overrides": []
      },
      "validation": null,
      "retries": []
    },
    "research": {
      "status": "completed",
      "started_at": "2026-04-04T10:05:00Z",
      "completed_at": "2026-04-04T10:15:00Z",
      "agent": "researcher",
      "validation": { "passed": true, "violations": [] },
      "retries": []
    },
    "outline": {
      "status": "completed",
      "started_at": "2026-04-04T10:16:00Z",
      "completed_at": "2026-04-04T10:22:00Z",
      "agent": "outliner",
      "validation": { "passed": true, "violations": [] },
      "retries": [],
      "checkpoint": {
        "id": "CP1",
        "decision": "approved",
        "modifications": [],
        "decided_at": "2026-04-04T10:25:00Z"
      }
    },
    "draft": {
      "status": "completed",
      "started_at": "2026-04-04T10:26:00Z",
      "completed_at": "2026-04-04T10:50:00Z",
      "agent": "writer",
      "sections": [
        { "index": 1, "title": "一句话结论", "status": "completed", "started_at": "2026-04-04T10:26:00Z", "completed_at": "2026-04-04T10:29:00Z", "artifact": "drafts/section-1.md", "word_count": 280 },
        { "index": 2, "title": "问题定义", "status": "completed", "started_at": "2026-04-04T10:29:30Z", "completed_at": "2026-04-04T10:35:00Z", "artifact": "drafts/section-2.md", "word_count": 350 },
        { "index": 3, "title": "方案详解", "status": "completed", "started_at": "2026-04-04T10:35:30Z", "completed_at": "2026-04-04T10:43:00Z", "artifact": "drafts/section-3.md", "word_count": 520 },
        { "index": 4, "title": "性能验证", "status": "completed", "started_at": "2026-04-04T10:43:30Z", "completed_at": "2026-04-04T10:47:00Z", "artifact": "drafts/section-4.md", "word_count": 280 },
        { "index": 5, "title": "避坑要点", "status": "completed", "started_at": "2026-04-04T10:47:30Z", "completed_at": "2026-04-04T10:50:00Z", "artifact": "drafts/section-5.md", "word_count": 200 }
      ],
      "merged_word_count": 1630,
      "validation": { "passed": true, "violations": [] },
      "retries": []
    },
    "figures": {
      "status": "completed",
      "started_at": "2026-04-04T10:26:00Z",
      "completed_at": "2026-04-04T10:35:00Z",
      "agent": "illustrator",
      "validation": { "passed": true, "violations": [] },
      "retries": []
    },
    "audit": {
      "status": "completed",
      "started_at": "2026-04-04T10:51:00Z",
      "completed_at": "2026-04-04T10:58:00Z",
      "agent": "auditor",
      "summary": {
        "fact_issues": 1,
        "ai_tone_issues": 3,
        "style_deviations": 0,
        "structure_issues": 0,
        "severity_high": 0,
        "severity_medium": 2,
        "severity_low": 2
      },
      "validation": { "passed": true, "violations": [] },
      "retries": []
    },
    "polish": {
      "status": "completed",
      "started_at": "2026-04-04T10:59:00Z",
      "completed_at": "2026-04-04T11:08:00Z",
      "agent": "polisher",
      "high_severity_resolved": 0,
      "high_severity_rejected": 0,
      "validation": { "passed": true, "violations": [] },
      "retries": [],
      "checkpoint": {
        "id": "CP2",
        "decision": "approved",
        "modifications": [],
        "decided_at": "2026-04-04T11:15:00Z"
      }
    },
    "publish": {
      "status": "completed",
      "started_at": "2026-04-04T11:16:00Z",
      "completed_at": "2026-04-04T11:20:00Z",
      "agent": "publisher",
      "validation": { "passed": true, "violations": [] },
      "retries": [],
      "checkpoint": {
        "id": "CP3",
        "decision": "approved",
        "modifications": [],
        "decided_at": "2026-04-04T11:22:00Z"
      }
    }
  }
}
```

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
| Audit 完成 | `summary` 对象（从 audit.md 提取统计数字） |
| Polish 完成 | `high_severity_resolved/rejected`（从变更溯源表统计） |

## 向后兼容

旧格式（阶段直接挂在顶层，无 meta 和 stages 包装）的 state 文件，编排器在 resume 时检测到缺少 `stages` 键，按以下方式处理：
1. 将旧阶段数据迁移到 `stages` 下
2. `meta` 从 `articles/{slug}/brief.md` frontmatter 重建
3. 缺失的新字段填 null，不影响恢复流程
