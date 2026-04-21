# Checkpoint 交互文案

## Checkpoint 1 — 大纲审核

多平台场景下展示每个平台的大纲摘要后，统一提示审核要点：

```
请对每个 {platform} ∈ brief.target_platforms，审核
content/articles/{slug}/intermediate/03-outline/{platform}.md，重点关注：

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

按平台逐一展示审校报告摘要（事实问题数、AI 味问题数、风格偏离数、句式清理数），然后提示：

```
请对每个 {platform} ∈ brief.target_platforms，审核
content/articles/{slug}/export/07-final/{platform}.md，重点关注：

1. 大声朗读全文
   - 读起来卡顿的地方就是需要改的地方

2. 在 1-2 处加入个人经验、看法、或小故事
   - 查找 <!-- USER_FILL --> 标记位置
   - LLM 做不到的部分，是你的核心价值

3. 确认标题
   - 好标题是精确的问题，不是宏大的概念
```

## Checkpoint 3 — 排版就绪（仅 wechat）

> CP3 挂在 typeset 阶段（不在 publish）。非 wechat 平台在 publish 完成后 pipeline 直接结束。
> CP3 是三态检查（passed / degraded / failed），详见 `orchestrator/checkpoints.md` § CP3。

typeset 阶段完成后，展示以下内容供用户确认：

```
已生成以下排版产物：
- content/articles/{slug}/intermediate/09-typeset-plan.md（persona / 签名 / 改写点索引）
- content/articles/{slug}/export/08-typeset/wechat/annotated.md（纯 GFM + ::: 容器）
- content/articles/{slug}/export/08-typeset/wechat/meta.json
  （含 conform.ok / validate.ok / issues）

发布平台产物（publish 阶段已产）：
- content/articles/{slug}/export/08-wechat-publish.md（纯 GFM，供 typeset 输入 + 跨平台兜底）
- 其他 {platform}：export/08-{platform}-publish.md

CP3 status：
- passed   → 去浏览器复制：cd ../wechat-typeset && ./launcher.*
             在 127.0.0.1:7788 粘贴 annotated.md → 选 persona → 一键复制 → 公众号后台
- degraded → 有 issues（如本地图片待上传），按 meta.json.validate.issues 处理后再走 passed 流程
- failed   → 不允许发布；按 orchestrator/recovery.md L2 走重跑 / 人工介入

发布后：触发 metrics-tracking 录入运营数据，再走 creation-reviewing 完成学习闭环。
```
