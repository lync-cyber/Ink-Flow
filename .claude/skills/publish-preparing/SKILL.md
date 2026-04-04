---
name: publish-preparing
description: >
  发布准备 — 根据当前文章和栏目生成发布前/后检查清单。
  触发条件："发布提醒"、"运营清单"、"发布前检查"。
  当用户准备发布文章、需要发布流程指引或运营待办时，应触发此 skill。
argument-hint: "[文章 slug]"
allowed-tools: Read, Glob, Grep, AskUserQuestion
---

# 发布准备清单

根据当前文章的栏目和状态，生成结构化的发布前/后运营清单。

## 入口

用 AskUserQuestion 确认目标文章：

```
AskUserQuestion:
  question: "为哪篇文章生成发布清单？"
  options:
    - 自动检测最近完成的文章（扫描 .pipeline-states/ 找 publish=completed）
    - 手动指定 slug
```

## 数据读取

1. `articles/{slug}/brief.md` — 栏目、内容类型、CTA 类型
2. `articles/{slug}/output/article.md` — 文章成品
3. `styles/default/columns.yaml` — 栏目 best_time、kpi_targets
4. Claude Code memory — 历史习得的最佳发布时间（若有）

## 发布前清单

根据栏目自动生成（直接输出到终端，不写文件）：

### 通用项

- [ ] **发布时间**: 推荐 {best_time}（来自 columns.yaml 或 orchestrator memory）
- [ ] **标题终审**: 确认标题字数符合 title-crafting skill 限制、有观点/信息增量
- [ ] **摘要检查**: 确认摘要不超过 `.inkflow.yaml` 的 `exports.summary.word_limit`，含核心关键词
- [ ] **封面检查**: 确认封面图已准备（封面背景色从 columns.yaml 读取）
- [ ] **排版流程**: 复制 article.md → 打开 typesetter → 选栏目主题 → 预览 → 复制 HTML → 粘贴到公众号编辑器
- [ ] **话题标签**: 添加 2-3 个精准话题标签（从 output/summary.md 提取）

### 栏目特化项

根据 brief 中的栏目字段追加：

| 栏目 | 额外检查项 |
|------|-----------|
| 学术前沿 | [ ] 论文引用格式正确 [ ] 数据图表清晰 |
| 行业趋势 | [ ] 时效信息标注日期 [ ] 多信源交叉验证 |
| 技术专题 | [ ] 代码块可运行 [ ] 版本/环境说明完整 |
| 人物故事 | [ ] USER_FILL 标记已替换 [ ] 互动引导语到位 |

## 发布后清单

```
### D+0（发布后 2 小时内）
- [ ] 回复所有留言
- [ ] 精选优质评论（提升推荐权重）
- [ ] 转发到相关社群

### D+1（次日）
- [ ] 录入初步运营数据 → 提示触发 creation-reviewing skill

### D+7（一周后）
- [ ] 录入完整运营数据 → 提示触发 performance-benchmarking 做交叉分析
```

## 输出

直接在终端输出格式化清单，不写入文件。清单末尾询问：

```
AskUserQuestion:
  question: "清单已生成。需要执行哪个后续操作？"
  options:
    - "立即录入运营数据" — 引导触发 metrics-tracking
    - "查看排期计划" — 引导触发 content-planning
    - "返回" — 结束
```
