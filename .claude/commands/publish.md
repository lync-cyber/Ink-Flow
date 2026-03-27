---
description: 执行发布阶段 — 应用排版规则、生成运营元数据、多格式导出（Checkpoint 3）
---

## 用法

```
/publish                          # 默认: wechat_md 格式
/publish --formats all            # 全部格式
/publish --formats wechat_md,html # 指定格式
```

## 执行逻辑

### 1. 前置检查
- 读取 `pipeline-state.json`
- 确认 refine 阶段 status 为 completed 且 checkpoint_approved 为 true
- 读取 `output/{topic}-final.md` — 润色后文章

### 2. 应用 wechat-format Skill
- 加载 `.claude/skills/domains/wechat-article/wechat-format/SKILL.md`
- 应用排版规则:
  - inline style 转换
  - 标题层级检查
  - 代码块语言标注
  - 图片宽度检查

### 3. 生成运营元数据
- 读取 `briefs/{topic}.md` 获取运营参数
- 自动生成:
  ```markdown
  ## 运营元数据
  - 摘要: {120 字以内，含主关键词}
  - 封面图建议: {场景描述，用于 AI 生图或素材搜索}
  - 标签建议: {tag1}, {tag2}, {tag3}
  - SEO 标题变体: {变体1} | {变体2}
  - 建议发布时间: {根据 brief.publish_timing 和 content_type 推荐}
  - CTA 文案: {根据 brief.cta_type 生成具体文案}
  ```

### 4. 多格式导出

根据 --formats 参数（默认 wechat_md）:

#### wechat_md（默认）
- 输出: `output/{topic}-wechat.md`
- 标准 Markdown，适配 Markdown Nice 排版工具
- 图片路径转换为相对路径
- 附加运营元数据

#### plain_md
- 输出: `output/{topic}-plain.md`
- 纯净 Markdown，去除公众号特定格式
- 适用于知乎、掘金等平台

#### html
- 输出: `output/{topic}.html`
- 所有样式内联到 HTML 元素
- 可直接粘贴到公众号编辑器
- 不使用外部 CSS 和 class

#### summary
- 输出: `output/{topic}-summary.md`
- 200 字以内的短摘要版
- 适用于朋友圈、社群分发
- 包含文章核心观点和链接引导

### 5. 更新状态
- 更新 pipeline-state.json:
  - publish.status: "completed"
  - publish.artifacts: [导出的文件列表]
- 追加运行日志

### 6. Checkpoint 3 — 用户确认发布

```
★ Checkpoint 3: 确认发布

已生成以下文件:
- output/{topic}-wechat.md (Markdown Nice 格式)
{其他格式文件列表}

运营元数据:
- 摘要: {摘要内容}
- 建议发布时间: {时间}
- CTA 文案: {文案}

下一步:
1. 将 wechat.md 粘贴到 Markdown Nice 排版
2. 或将 .html 直接粘贴到公众号编辑器
3. 发布后执行 /feedback 和 /retro 完成学习闭环
```
