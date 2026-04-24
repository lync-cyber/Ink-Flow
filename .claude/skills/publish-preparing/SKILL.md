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
    - 自动检测最近完成的文章（扫描 runtime/pipeline-states/ 找 publish=completed）
    - 手动指定 slug
```

## 数据读取

1. `content/articles/{slug}/intermediate/01-brief.md` — 栏目、内容类型、CTA 类型
2. `content/articles/{slug}/export/08-wechat-publish.md` — 文章成品
3. `runtime/profile-resolved/constraints.yaml` — 栏目 `columns.{col}.bestTime`、`kpiTargets`
4. Claude Code memory — 历史习得的最佳发布时间（若有）

## 发布前清单

根据栏目自动生成（直接输出到终端，不写文件）：

### 通用项

- [ ] **发布时间**: 推荐 {bestTime}（来自 Profile constraints.columns 或 orchestrator memory）
- [ ] **标题终审**: 确认标题 ≤15 字、有观点/信息增量
- [ ] **摘要检查**: 确认摘要不超过 `framework/config/inkflow.yaml` 的 `exports.summary.word_limit`，含核心关键词
- [ ] **封面检查**: 确认封面图已准备
- [ ] **本地排版**：启动独立 repo [wechat-typeset](https://github.com/lync-cyber/wechat-typeset)（`npm run dev` 或 launcher），打开 `http://127.0.0.1:7788/`，将 `export/08-wechat-publish.md` 粘贴到编辑器，左侧主题抽屉挑主题，点"一键复制"得到富文本，粘贴到公众号后台
  - **必须走 127.0.0.1 / localhost**，`file://` 下 Clipboard API 不可用、富文本会丢
  - 主题切换在本地编辑器里完成；wechat-typeset 契约承诺 9 套主题间切换不塌版
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
