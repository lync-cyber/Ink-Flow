# Brief Frontmatter 模板

最简用法只需填 topic。默认值从 `.inkflow.yaml` 的 `defaults` 读取。

```yaml
---
# === 核心参数（必填或高频修改） ===
topic: "{用户输入的主题}"
slug: "{auto-generated}"            # 自动生成，全 pipeline 文件名基准
target_length: 1500                  # 目标字数（推荐 800-2000）
content_type: deep_dive              # quick_take | deep_dive | tutorial | opinion
audience: tech_intermediate          # tech_beginner | tech_intermediate | tech_advanced | general
content_column: tech                 # academic | industry | tech | story（英文 ID）

# === 流水线控制 ===
skip_research: false
no_figures: false
skip_seo: false

# === 高级参数（通常使用默认值，按需覆盖） ===
# opening_style: auto               # pain_point | story | contrast | question | blunt | auto
# style_profile: default            # 对应 styles/{style_profile}/ 目录
# tone_override: ""                 # 空=使用 style-profile 默认值
# publish_timing: evening           # morning | noon | evening | custom
# series_name: ""                   # 系列名称（空=独立文章）
# series_index: 0
# cta_type: follow                  # follow | comment | share | mini_program | none
# cover_style: auto                 # auto | custom
---
```

## 栏目 ID 映射

| ID | 中文名 | 说明 |
|----|--------|------|
| academic | 学术前沿 | 论文/研究解读 |
| industry | 行业趋势 | 动态分析/趋势判断 |
| tech | 技术专题 | 实战教程/深度解析 |
| story | 人物故事 | 经验分享/人物访谈 |

## 正文引导结构

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
