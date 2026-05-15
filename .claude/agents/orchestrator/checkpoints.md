# orchestrator / checkpoints 模块

3 个检查点使用 AskUserQuestion 结构化交互。详细文案见 `.claude/agents/orchestrator/references/checkpoint-prompts.md`。

## auto_checkpoints 入口检查（每个 CP 段执行前必读）

进入 CP1 / CP2 / CP3 主交互之前，必须先做：

```
1. 读 brief.auto_checkpoints (来自 preset 展开；默认 [])
2. IF 当前 cp_id ∈ brief.auto_checkpoints:
     a. 检查 stage validation 是否 passed (见 stages.md / fanout.md 的 validation 输出)
     b. validation.passed == false → 强制人工，忽略 auto_checkpoints；打印"validation 失败，{cp_id} 自动通过被覆盖"
     c. validation.passed == true → 调 state-writer.md update_state(checkpoints.{cp_id}, {decision: auto_approved, reason: "preset={brief.preset}"})
     d. 打印一行："[{cp_id}] 自动通过（preset={brief.preset}）"
     e. RETURN（不进入主交互）
3. ELSE: 进入下方主交互段
```

完整协议见 `dispatch-protocol.md § auto_checkpoints 协议`。

## CP1 — 大纲审核（outline 阶段结束）

### CP1 预检：标题门禁

进入主交互前，orchestrator 按 `.claude/agents/orchestrator/references/title-validation.md` 内嵌执行：

```
FOR each platform in brief.target_platforms:
  1. 从 03-outline/{platform}.md 提取标题
  2. 执行 title-validation 硬性规则（≤15 字 + 非描述性 + 栏目调性）
  3. 未通过 → 按 title-validation § 备选标题生成 流程提示用户
  4. 用户确认后回写标题字段
  5. 全部平台通过 → 进入 CP1 主交互
```

### CP1 主交互

```
AskUserQuestion:
  question: "大纲已生成，请审核"（附大纲摘要 + 每平台通过的标题 + 审核要点）
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
- **标题已通过 title-validation 门禁**（摘要中展示最终标题，便于人工复核）

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

## CP3 — 发布确认（publish 阶段结束）

### CP3 预检：发布清单读取

publisher Extra Outputs 段已生成发布清单（写入终端，不持久化）。orchestrator 直接复用其返回包中的清单文本。

### CP3 主交互

```
AskUserQuestion:
  question: "导出文件已生成 + 发布清单已就绪"（附文件列表 + 运营元数据摘要 + 发布清单 + wechat 交付提示）
  options:
    - "确认发布" — 写入 lifecycle.published_at
    - "调整运营元数据"
    - "更换导出格式"
    - "暂不发布"
```

审核要点：
- 对每个 `brief.target_platforms` 的 p：`export/08-{p}-publish.md` 均存在
- wechat 产物若存在：`:::` 容器 W1-W4 均 = 0（lint 报告）
- teaser（仅 wechat）：摘要 ≤120 字
- 无残留 `<!-- FIGURE:` `<!-- MEDIA:` `<!-- USER_FILL:` 占位符

wechat 交付提示（orchestrator 在回显里附上）：

> 下一步在本地完成：
> 1. 启动 wechat-typeset（`cd ../wechat-typeset && npm run dev`）
> 2. 浏览器打开 http://127.0.0.1:7788/
> 3. 粘贴 `export/08-wechat-publish.md` 内容
> 4. 左侧主题抽屉挑主题 → 一键复制到公众号后台

## checkpoint 状态

state 中记录：`{id: CP1/CP2/CP3, decision: approved|approved_with_edits|rejected|returned, modifications: [...]}`。
用户确认 → 标记 `checkpoint_approved: true`，继续下一阶段。
用户回退 → 重置目标阶段为 pending，保留后续阶段状态。
