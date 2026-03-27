---
description: 创建或编辑写作指令卡（brief），一次性捕获所有上游决策
---

## 用法

```
/brief "主题标题"
/brief                  # 编辑已有 brief
```

## 执行逻辑

1. **创建 Brief**
   - 若提供了主题参数 → 创建 `briefs/{topic-slug}.md`
   - 若未提供参数 → 列出 briefs/ 下已有文件，让用户选择编辑

2. **生成标准化 Frontmatter**

   使用以下完整模板（所有字段有默认值，最简用法只需填 topic）:

   ```yaml
   ---
   # === 核心参数 ===
   topic: "{用户输入的主题}"
   target_length: 1500              # 目标字数（推荐 800-2000）
   content_type: deep_dive          # quick_take | deep_dive | tutorial | opinion
   audience: tech_intermediate      # tech_beginner | tech_intermediate | tech_advanced | general

   # === 流水线控制 ===
   skip_research: false
   no_figures: false
   skip_seo: false

   # === 公众号运营参数 ===
   publish_timing: evening          # morning | noon | evening | custom
   series_name: ""                  # 系列名称（空=独立文章）
   series_index: 0                  # 系列序号
   cta_type: follow                 # follow | comment | share | mini_program | none
   cover_style: auto                # auto | custom

   # === 风格覆盖 ===
   tone_override: ""                # 空=使用 style-profile 默认值
   opening_style: auto              # pain_point | story | contrast | question | blunt | auto
   ---
   ```

3. **正文区域**

   Frontmatter 下方引导用户填写:
   ```markdown
   ## 核心观点
   {用一句话说清楚这篇文章要传达什么}

   ## 调研方向
   - {需要调查的问题 1}
   - {需要调查的问题 2}

   ## 目标读者画像
   {简述读者是谁，他们的痛点是什么}

   ## 补充说明
   {任何额外的写作要求或限制}
   ```

4. **状态更新**
   - 初始化或更新 `pipeline-state.json`:
     - pipeline: "article-writing"
     - run_id: "{date}-{topic-slug}"
     - brief 阶段 status: "completed"
     - brief 阶段 artifacts: ["briefs/{topic-slug}.md"]
   - 提示用户: "Brief 已创建。执行 /run 开始 pipeline，或 /research 单独执行调研。"
