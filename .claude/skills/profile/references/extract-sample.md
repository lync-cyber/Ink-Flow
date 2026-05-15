# Profile Extractor · sample 模式

## 流程

### Step 1 — 收集样本

接收 1-5 个样本：
- 本地路径（md 文件）→ 直接 Read
- `content/references/articles/` 路径 → Read
- 微信公众号 URL → 调 `scripts/wechat.py` 抓取；失败降级到"粘贴正文"

为每份样本计算 `sha256`，存到 `provenance.samples` 列表。

### Step 2 — 启动 4 个 Miner 子 Agent（并行）

每个 miner 只看样本 + 一份 prompt 模板：

| Agent | prompt | 负责 slot | 输出形态 |
|---|---|---|---|
| PrinciplesMiner | `prompt-principles-mine.md` | principles | JSON：`{ fields: [{path, value, confidence, evidence}] }` |
| VoiceMiner      | `prompt-voice-mine.md`      | voice      | JSON 同上 |
| TypesetMiner    | `prompt-typesetting-mine.md`| typesetting| JSON（含容器使用统计、段落长度分布） |
| ConstraintMiner | `prompt-constraints-mine.md`| constraints| JSON（从"样本不出现"反推禁用项） |

并行调用（单条消息多个 Agent tool_use）。

### Step 3 — 合成与过滤

resolver 读 4 份 JSON：
1. 保留 `confidence >= 0.7` 的字段
2. `0.4 <= confidence < 0.7` 放入 `profile.yaml.todo` 列表，让用户手填
3. `< 0.4` 直接丢弃

合成出草稿四份文件（markdown / yaml）。

### Step 4 — 选择继承基

根据样本 URL 域名或 frontmatter 平台字段自动推断 `extends`：
- 样本都是微信推文 → `extends: [base-generic-chinese, platform-wechat]`
- 其他 → `extends: [base-generic-chinese]`

### Step 5 — Plan Mode 评审

展示：
- 四份草稿
- `profile.yaml` 预览（含 provenance.samples）
- 每个 confidence < 0.7 的字段单独列出，让用户决定「采纳 / 修改 / 丢弃」

### Step 6 — 落盘 + 校验

同 `mode-goal.md § Step 5`。

### Step 7 — 装配建议

同 `mode-goal.md § Step 6`。

## Miner Prompt 模板索引

- [`prompt-principles-mine.md`](prompt-principles-mine.md)
- [`prompt-voice-mine.md`](prompt-voice-mine.md)
- [`prompt-typesetting-mine.md`](prompt-typesetting-mine.md)
- [`prompt-constraints-mine.md`](prompt-constraints-mine.md)

## Miner 输出 JSON schema

```json
{
  "slot": "voice",
  "confidenceDefault": 0.8,
  "fields": [
    {
      "path": "人称与语气.人称",
      "value": "第一人称",
      "confidence": 0.95,
      "evidence": ["sample-01.md:L3", "sample-02.md:L14"]
    },
    {
      "path": "用词风格.avoided",
      "value": ["换言之", "需要注意的是"],
      "confidence": 0.65,
      "evidence": ["统计：样本中 0/5 篇出现"]
    }
  ],
  "warnings": ["样本 3 的人称与其他矛盾，已排除"]
}
```

## 降级策略

| 场景 | 行为 |
|---|---|
| URL 抓取失败 | 提示用户粘贴正文；正文入临时文件后继续 miner |
| 样本数 < 3 | warning：「样本过少，字段 confidence 普遍较低，建议补充后重跑」 |
| 某 slot 所有字段 confidence < 0.4 | 该 slot 文件不落盘，`slots.{slot}` 在 manifest 中省略（从 extends 继承） |
