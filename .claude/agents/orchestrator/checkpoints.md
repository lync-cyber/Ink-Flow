# orchestrator / checkpoints 模块

3 个检查点使用 AskUserQuestion 结构化交互。详细文案见 `.claude/skills/pipeline-orchestrating/references/checkpoint-prompts.md`。

## CP1 — 大纲审核（outline 阶段结束）

### CP1 预检：标题门禁

进入主交互前，orchestrator 调用 `title-crafting` skill：

```
FOR each platform in brief.target_platforms:
  1. 从 03-outline/{platform}.md 提取标题
  2. 执行 title-crafting 硬性规则（≤15 字 + 非描述性 + 栏目调性）
  3. 未通过 → 走 title-crafting 备选标题流程
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
- **标题已通过 title-crafting 门禁**（摘要中展示最终标题，便于人工复核）

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

### CP3 预检：发布清单生成

进入主交互前，orchestrator 调用 `publish-preparing` skill 生成发布清单：

```
1. 读 brief.target_platforms 和 publisher 导出报告
2. 调用 publish-preparing，传入 slug
3. 清单内容并入 CP3 主交互的展示包
```

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
