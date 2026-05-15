# Profile Extractor · discover 模式

> 介于 goal 和 sample 之间的"半自动"模式：Claude 用 WebSearch 拉候选 + 质量评估，
> 但**最终入选必须由用户显式勾选**。这样 provenance 既可审计，又免去用户手动找文章的成本。

## 流程

### Step 0 — 收集检索意图

```
AskUserQuestion 或解析命令行参数：

Q1 主题关键词？（必填）
   示例："Rust 异步运行时" / "AI Agent 工程实践"

Q2 风格描述（3-5 个调性词，必填）
   示例："硬核技术 / 第一人称 / 踩坑叙事 / 不煽情"

Q3 目标平台？（影响 query 模板与域名偏好）
   选项：wechat / zhihu / juejin / xiaohongshu / 跨平台

Q4 候选数 N？（默认 12，范围 6-20）

Q5 入选数 K？（默认 5，范围 3-8；K ≤ min(N, 5 篇 sample 上限)）
```

### Step 1 — 构造 query 列表（3-5 条）

按 Q3 平台拼检索词，每条 query 独立调一次 WebSearch：

| 平台 | query 模板示例 |
|---|---|
| wechat   | `{topic} site:mp.weixin.qq.com {style词}` |
| zhihu    | `{topic} site:zhuanlan.zhihu.com {style词}` |
| juejin   | `{topic} site:juejin.cn {style词}` |
| 跨平台   | `{topic} {style词} 深度长文` / `{topic} 实战经验` |

> **微信公众号公网索引差**：site:mp.weixin.qq.com 经常召回不足，可补一条不带 site
> 的通用 query 兜底（搜出来的镜像/转载站在 Step 3 抓取阶段会被判长度过滤排除）。

### Step 2 — WebSearch 拉候选

并行（单条消息多个 tool_use）调 WebSearch；合并、按 URL 去重，截至 N 条。

每条候选记录：
```
{title, url, snippet, query_source}
```

### Step 3 — WebFetch 抓正文 + 启发式打分

对每条候选并行调 WebFetch（失败则跳过，不重试）。抓到正文后按下表打 3 维分（每维 1-5），加权合成总分：

| 维度 | 权重 | 评分启发式 |
|---|---|---|
| **长度** | 0.3 | < 800 字 = 1；800-1500 = 2；1500-2500 = 3；2500-4000 = 4；4000+ = 5 |
| **结构** | 0.3 | H2/H3 数量 ≥ 3 + 至少 1 个代码块/表格/列表 = 5；纯流水账无层级 = 1 |
| **风格匹配** | 0.4 | 与 Q2 调性词的契合度（第一人称密度、具体数字、踩坑叙事关键词等）= 1-5 |

**自动排除**（不进入用户评审）：
- 正文 < 500 字（很可能是镜像截断）
- 总分 < 2.0
- 抓取失败 / 403 / 404
- 与已选样本 sha256 重复

### Step 4 — 用户评审与勾选

```
AskUserQuestion（或多轮，因为选项 > 4 时建议拆批次）：
  question: "从下列候选中勾选 {K} 篇作为样本（按总分排序）："
  options:
    - "[4.6/5] 标题A — 来源域名 — 200字摘要..."
    - "[4.3/5] 标题B — ..."
    - "[3.8/5] 标题C — ..."
    ...
    - "全部不合适，重新搜（让我调整 query）"
    - "我手动给 URL 替换 / 补充"
```

允许多次往返：用户可以"再搜一轮"、"换关键词"、"我手贴 URL 进来"。

**校验**：用户最终勾选数必须 ≥ 3，否则按 mode-sample.md 的"样本过少"warning 处理或回到 Step 1。

### Step 5 — 入选样本入库

对每篇入选样本：
1. 写入 `content/references/articles/{auto-slug}.md`，frontmatter 含 `source_url`、`fetched_at`、`quality_score`
2. 计算 sha256
3. 记入 `provenance.samples` 列表

`provenance.discoveryPlan` 同时记录：
```yaml
provenance:
  extractedBy: discover
  discoveryPlan:
    queries:
      - "Rust 异步 site:mp.weixin.qq.com 踩坑"
      - "Rust 异步 实战 深度长文"
    candidatesFound: 12
    candidatesAutoExcluded: 4   # 长度 / 抓取失败 / 重复
    candidatesPresented: 8
    candidatesSelected: 5
  samples:
    - path: content/references/articles/rust-async-pitfalls-2024.md
      sha256: abc123...
      source_url: https://mp.weixin.qq.com/s/...
      quality_score: 4.6
```

### Step 6 — 进入 sample 流程

完全复用 [`mode-sample.md`](mode-sample.md) 的 **Step 2 ~ Step 7**：
- 4 个 Miner 并行（PrinciplesMiner / VoiceMiner / TypesetMiner / ConstraintMiner）
- confidence 过滤（≥ 0.7 采纳，0.4-0.7 进 todo，< 0.4 丢弃）
- Step 4 选继承基（按入选样本域名分布判定）
- Plan Mode 评审 → 落盘 → validate_profile.py 校验 → 装配建议

## 与 sample 模式的关键差异

| 维度 | sample | discover |
|---|---|---|
| 样本来源 | 用户提供 | Claude 检索 + 用户勾选 |
| provenance | `extractedBy: sample` | `extractedBy: discover` + `discoveryPlan` |
| 入选机制 | 全量入选 | 必须经 AskUserQuestion 显式勾选 |
| 质量保障 | 由用户保证 | 启发式打分 + 长度/重复自动过滤 + 用户复核 |
| 适用场景 | 已有目标公众号/作者 | 只有主题和风格目标，没有现成参考 |

## 降级策略

| 场景 | 行为 |
|---|---|
| WebSearch 全部失败 / 配额耗尽 | 提示用户改用 sample 模式手动补 URL |
| 候选合并去重后 < K | warning：「公网覆盖不足（找到 X 篇），建议补关键词或改用 sample 模式」 |
| WebFetch 大面积失败（> 50%） | 提示「目标域名可能反爬（典型为微信公众号镜像站），改用粘贴正文」 |
| 用户连续两轮"全部不合适" | 询问是否改用 goal 模式直接从描述生成 |
| 入选样本域名分散（≥ 3 个不同域名） | warning：「样本风格可能混杂，提取出的 Profile 一致性会下降」 |

## 启发式评分实现注记

打分由 Claude 在 mining 阶段直接执行（读 WebFetch 返回的 markdown，按 Step 3 表格逐项评估），
**不依赖外部脚本**。如果未来需要更严格的可复现评分，可以新增 `scripts/quality_score.py`
但当前 MVP 不引入。

风格匹配维度的关键词命中表（启发式参考，不是穷举）：

| 调性词 | 命中信号 |
|---|---|
| 第一人称 / 个人化 | "我"出现频率 > "笔者"+"我们"且 ≥ 5 次 / 千字 |
| 踩坑 / 实战 | "坑 / 翻车 / 试错 / 踩过 / 测了 / 跑了" 出现 ≥ 2 次 |
| 数据驱动 | 全文出现 ≥ 3 处具体数字（百分比 / 时长 / 倍数） |
| 不煽情 | 不出现"未来可期 / 让我们拭目以待 / 希望本文对你有所帮助" |
| 硬核技术 | 代码块 ≥ 1 + 版本号或 API 名 ≥ 3 |
