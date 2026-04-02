---
name: content-planning
description: >
  内容排期 — 基于栏目频率、发布历史和运营记忆生成内容日历。
  触发条件："排期"、"内容日历"、"本月计划"、"这周写什么"。
  当用户询问写什么、安排发布计划、查看内容规划时，应触发此 skill。
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# 内容排期

基于栏目频率目标和发布历史，生成结构化的内容排期。

## 入口

用 AskUserQuestion 确认排期范围：

```
AskUserQuestion:
  question: "排期范围？"
  options:
    - "未来 2 周" — 默认
    - "本月剩余"
    - "下个月"
    - 自定义时间段
```

可选附带已有选题列表（用户直接提供或从 articles/ 下未完成的 brief 扫描）。

## 数据读取

1. `styles/default/columns.yaml` — 读取每个栏目的：
   - `frequency`（发布频率目标）
   - `best_time`（推荐发布时间）
   - `content_mix`（月度总量控制）
2. `articles/*/brief.md` — 扫描所有已发布文章的 frontmatter，提取：
   - 栏目（column）
   - 发布日期（publish_date，若有）
   - 内容类型（content_type）
3. `articles/_series/*.yaml` — 扫描进行中的系列，将 `status: planned` 的文章自动纳入排期
4. Claude Code 原生 memory — 读取历史习得的运营偏好（如最佳发布时间、系列文章间隔等）

## 排期算法

1. **统计各栏目最近发布频率**，对比 frequency 目标
2. **识别欠缺栏目**（实际频率 < 目标频率），优先排入
3. **按 best_time 分配时间槽**：
   - 行业趋势: 固定周一早
   - 技术专题: 优选周二/四晚
   - 学术前沿: 优选周三/四晚
   - 人物故事: 优选周末
4. **约束检查**：
   - 月总量不超过 content_mix.monthly_target 上限
   - 每天最多 content_mix.max_per_day 篇
   - 系列文章间隔 ≤ 1 周
5. **选题建议**：若用户提供了选题列表则分配到对应槽位；否则标注"待定"并给出栏目方向建议

## 输出格式

生成排期表到 `retro/content-calendar.md`：

```markdown
# 内容排期: {起始日期} - {结束日期}

| 日期 | 星期 | 时间 | 栏目 | 选题 | 备注 |
|------|------|------|------|------|------|
| 4/7  | 周一 | 07:30 | 行业趋势 | 周报第N期 | 固定 |
| 4/8  | 周二 | 21:00 | 技术专题 | {待定} | 系列开篇 |
| ... | | | | | |

## 栏目平衡
- 学术前沿: 本期 N 篇（目标 2-3/月）
- 行业趋势: 本期 N 篇（目标 周报+突发）
- 技术专题: 本期 N 篇（目标 2-4/月）
- 人物故事: 本期 N 篇（目标 1/月）
```

## 确认与调整

```
AskUserQuestion:
  question: "排期已生成，请确认或调整"
  options:
    - "确认排期" — 保存到 retro/content-calendar.md
    - "调整某个时间槽" — 指定修改
    - "增加/减少文章数量" — 重新平衡
    - "为第一篇开始创作" — 触发 pipeline-orchestrating 进入 brief 创建
```
