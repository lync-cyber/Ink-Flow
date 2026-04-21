# orchestrator / checkpoints 模块

3 个检查点使用 AskUserQuestion 结构化交互。详细文案见 `.claude/skills/pipeline-orchestrating/references/checkpoint-prompts.md`。

## CP1 — 大纲审核（outline 阶段结束）

```
AskUserQuestion:
  question: "大纲已生成，请审核"（附大纲摘要 + 审核要点）
  options:
    - "通过，继续写作"
    - "修改特定 section" — 暂停等待用户编辑
    - "重新组织结构" — 重跑 outline
    - "返回调研阶段" — 重跑 research
```

审核要点：
- 每个 section 有明确论点（非描述性标题）
- 视觉断点归属清晰（writer:/illustrator:）
- 总字数与 brief.target_length 偏差 ≤20%

## CP2 — 终审（polish 阶段结束）

```
AskUserQuestion:
  question: "审校和润色已完成"（附审校报告摘要 + 审核要点）
  options:
    - "通过，准备发布"
    - "处理审校问题后重新润色" — 重跑 polish
    - "手动编辑" — 暂停等待用户编辑 export/07-final-manuscript.md
    - "返回重写" — 重跑 draft
```

审核要点：
- 审校报告中所有"高"严重性问题已解决
- 变更溯源表覆盖所有改动
- 无残留 `USER_FILL` 占位符（publisher 前必须清理）

## CP3 — 排版就绪（typeset 阶段结束 · 仅 wechat）

```
AskUserQuestion:
  question: "排版方案与 annotated.md 已生成"（附 persona + validate 结果）
  options:
    - "确认，去浏览器复制"
    - "换 persona / 换签名" — 重跑 typesetter
    - "先修图片 / 先手动上传素材库" — 暂停
    - "暂不排版"
```

CP3 有**三态**，state.checkpoints.CP3.status 必填：

| status | 触发条件 | 下一步 |
|---|---|---|
| `passed`   | `meta.json.conform.ok=true` 且 `meta.json.validate.ok=true` 且产物三件齐全 | 允许 pipeline 声明完成，交付用户去 wechat-typeset launcher 粘贴 |
| `degraded` | conform/validate ok 但带 `issues[]`（如图片本地路径但用户选"粘贴时手动补图"）| 把 degraded reason 写进 state 与用户告知，不阻塞结束，但 retrospective 必须登记 |
| `failed`   | health=false（能力清单缺失）/ conform.ok=false / validate.ok=false / 产物缺件 | **禁止**声明 pipeline 完成；recovery.md 的 L2 走向要求用户修 sibling repo 或重跑 typesetter |

非 wechat 平台不触发 CP3（pipeline 在 publish 完成后即结束）。

## CP3 的 state 记录格式

```json
"checkpoints": {
  "CP3": {
    "status": "passed|degraded|failed",
    "decision": "approved|approved_with_edits|returned|skipped",
    "persona": "tech-explainer",
    "adapter_version": "0.1.0",
    "conform": { "ok": true, "violations": [] },
    "validate": { "ok": true, "issues": [] },
    "reasons": ["local_image_manual_upload: 4 images pending 素材库 paste"],
    "recorded_at": "2026-04-21T12:00:00Z"
  }
}
```

- `adapter_version` 为空或字面 `unknown` → 本次 CP3 一律 `failed`
- `reasons` 数组是结构化降级原因，只在 `degraded` 下非空

## checkpoint 状态

state 中记录：`{id: CP1/CP2/CP3, decision: approved|approved_with_edits|rejected|returned, modifications: [...]}`。
用户确认 → 标记 `checkpoint_approved: true`，继续下一阶段。
用户回退 → 重置目标阶段为 pending，保留后续阶段状态。
