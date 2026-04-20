# Checkpoint 交互文案

## Checkpoint 1 — 大纲审核

展示大纲摘要后，提示审核要点：

```
请审核 content/articles/{slug}/intermediate/03-outline-structure.md，重点关注：

1. 确认或修改每个 section 的论点方向
   - 论点是否有判断力（非"正确但无聊"）？
   - 论点排序是否有递进关系？

2. 决定不确定项
   - 继续查？→ 选择"返回调研阶段"
   - 直接删？→ 从大纲中移除

3. 调整结构
   - section 数是否合适（3-7 个）？
   - 是否需要合并、拆分、调换？
   - 视觉断点规划是否合理？
```

## Checkpoint 2 — 终审

展示审校报告摘要（事实问题数、AI 味问题数、风格偏离数、句式清理数），然后提示：

```
请审核 content/articles/{slug}/export/07-final-manuscript.md，重点关注：

1. 大声朗读全文
   - 读起来卡顿的地方就是需要改的地方

2. 在 1-2 处加入个人经验、看法、或小故事
   - 查找 <!-- USER_FILL --> 标记位置
   - LLM 做不到的部分，是你的核心价值

3. 确认标题
   - 好标题是精确的问题，不是宏大的概念
```

## Checkpoint 3 — 发布确认

展示已生成的文件列表和运营元数据（摘要、建议发布时间、CTA 文案），然后提示：

```
已生成以下文件：
- content/articles/{slug}/export/08-wechat-publish.md（标准 Markdown + GFM Alerts，纯 GFM，平台无关）
- content/articles/{slug}/export/08-plain-publish.md（纯 Markdown，跨平台可复制）
- content/articles/{slug}/export/08-teaser-120chars.md（摘要 + 关键词）

下一步（由 typesetter agent 在 typeset 阶段完成；若 pipeline 仍在 publish CP，需先推进到 typeset）：
1. typesetter 产出 `intermediate/09-typeset-plan.md` + `export/08-typeset/wechat/annotated.md`
2. 启动独立 repo wechat-typeset（https://github.com/lync-cyber/wechat-typeset）本地工具
3. 在编辑器粘贴 annotated.md，按 plan 选主题，点"一键复制"把富文本粘到公众号后台草稿
4. 发布后触发 creation-reviewing 完成学习闭环
```
