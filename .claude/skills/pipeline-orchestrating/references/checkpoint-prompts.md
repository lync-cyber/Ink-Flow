# Checkpoint 交互文案

## Checkpoint 1 — 大纲审核

展示大纲摘要后，提示审核要点：

```
请审核 articles/{slug}/outline.md，重点关注：

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
请审核 articles/{slug}/output/final.md，重点关注：

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
- articles/{slug}/output/article.md (Markdown + :::block 扩展格式)
{其他格式文件列表}

下一步：
1. 复制 article.md 内容到 typesetter（tools/typesetter/index.html）
2. 选择栏目主题 → 预览 → 复制 HTML → 粘贴到公众号编辑器
3. 发布后触发 creation-reviewing 完成学习闭环
```
