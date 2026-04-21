---
name: style-learning
description: >
  风格学习 — 统一入口，支持两种模式：
  （1）profile：分析自己的文章，提取风格 DNA，生成 style-profile.md；
  （2）study：分析外部参考材料（本地路径 / content/references/ / 微信公众号 URL），
  与现有规则对比，输出改进建议并按确认写入。
  触发条件："分析风格"、"提取风格 DNA"、"创建风格档案"、
  "学习这篇文章"、"参考这个模板"、"进修"、"对标"。
  当用户想沉淀自己的写作风格档案、或对外部范文进行借鉴/对标分析时，应触发此 skill。
argument-hint: "[profile | study] [参考材料路径或 URL]"
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, Bash, WebFetch, AskUserQuestion
---

# 风格学习（Style Learning）

单一入口，两种模式。详细流程已拆到 `references/`，按模式按需 Read。

| 模式 | 目标 | 输出 | 详细流程 |
|---|---|---|---|
| **profile** | 分析**自己的**文章 → 描述现有风格 DNA | `content/styles/{profile_name}/style-profile.md` | [`references/mode-profile.md`](references/mode-profile.md) |
| **study**   | 分析**外部**材料 → 对比差距，提出改进 | `content/retrospectives/study-reports/{date}-{slug}.md` + 按确认修改规则文件 | [`references/mode-study.md`](references/mode-study.md) |

## 模式判定（先做这一步）

若命令未显式指定模式：

```
AskUserQuestion:
  question: "学习哪种材料？"
  options:
    - "profile — 从我自己的文章提取风格"
    - "study — 学习外部参考材料"
```

判定后**Read 对应 references/mode-*.md** 执行；不要在主 SKILL.md 里展开流程细节。

## 全局约束（两个模式都遵守）

- **不自动修改文件** — 所有变更经用户确认
- **建议必须具体到文件/字段** — 不能只说"建议调整风格"
- **参考材料质量不高时应如实指出** — 不强行提取
- **URL 抓取失败不阻塞流程** — 优雅降级到粘贴正文模式
- **缓存** — `content/references/articles/` 里已有同 URL（按 `source_url` 精确匹配 frontmatter）
  则直接复用，询问是否重抓

## 依赖

- `.claude/skills/style-learning/scripts/wechat.py`（微信 URL 抓取，study 模式 Step 2a 用）
- `requests`、`beautifulsoup4`（首次使用需 `pip install -e .` 或 `pip install requests beautifulsoup4`）
