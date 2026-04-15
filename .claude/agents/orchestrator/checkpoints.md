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
    - "手动编辑" — 暂停等待用户编辑 export/_final.md
    - "返回重写" — 重跑 draft
```

审核要点：
- 审校报告中所有"高"严重性问题已解决
- 变更溯源表覆盖所有改动
- 无残留 `USER_FILL` 占位符（publisher 前必须清理）

## CP3 — 发布确认（publish 阶段结束）

```
AskUserQuestion:
  question: "导出文件已生成"（附文件列表 + 运营元数据摘要）
  options:
    - "确认发布"
    - "调整运营元数据"
    - "更换导出格式"
    - "暂不发布"
```

审核要点：
- export/wechat.md / plain.md / teaser.md 均存在
- 摘要 ≤120 字（config.exports.teaser.word_limit）
- 无残留 `<!-- FIGURE:` `<!-- MEDIA:` `<!-- USER_FILL:` 占位符

## checkpoint 状态

state 中记录：`{id: CP1/CP2/CP3, decision: approved|approved_with_edits|rejected|returned, modifications: [...]}`。
用户确认 → 标记 `checkpoint_approved: true`，继续下一阶段。
用户回退 → 重置目标阶段为 pending，保留后续阶段状态。
