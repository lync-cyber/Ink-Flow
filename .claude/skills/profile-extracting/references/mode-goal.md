# Profile Extractor · goal 模式

## 流程

### Step 1 — 多轮 AskUserQuestion 收集元信息

```
Q1 profile 要服务哪个平台？
   选项：wechat / zhihu / juejin / xiaohongshu / 跨平台

Q2 目标读者画像？（描述一段，或选择）
   选项：tech_intermediate / tech_senior / business / general_chinese / 其他（自由输入）

Q3 栏目定位？（4 选 1，或自定义）
   选项：tech(技术专题) / academic(学术前沿) / industry(行业趋势) / story(人物故事) / 其他

Q4 调性关键词？（3-5 个，用户自由输入）
   示例："克制 / 数据驱动 / 有判断 / 不煽情"

Q5 要对齐的 KPI？（可跳过）
   示例：completionRate ≥ 0.35, bookmarkRate ≥ 0.08

Q6 硬禁止项？（可跳过）
   示例：禁用 emoji / 禁止绝对化用语 / 禁用词列表
```

### Step 2 — 选择继承基

根据 Q1 平台选 `extends` 链：

| 平台 | extends |
|---|---|
| wechat | `[base-generic-chinese@^1.0.0, platform-wechat@~0.2.0]` |
| zhihu / juejin / xiaohongshu | `[base-generic-chinese@^1.0.0]`（暂无平台 pack） |
| 跨平台 | `[base-generic-chinese@^1.0.0]` |

### Step 3 — 并行调用 4 个子 Agent 生成各 slot

通过独立 Agent 调用隔离上下文；每个只负责一个 slot：

```
Agent(subagent_type="general-purpose",
      description="生成 principles slot",
      prompt=read("references/prompt-principles.md") + 用户元信息)
Agent(... voice slot, prompt-voice.md)
Agent(... typesetting 覆写项, prompt-typesetting.md)
Agent(... constraints slot, prompt-constraints.md)
```

4 个 Agent 并行（单条消息多个 tool_use）。

### Step 4 — Plan Mode 评审

把四份草稿 + `profile.yaml` manifest 拼成一个预览，进入 Plan Mode 让用户：
- 通过 → 执行 Step 5
- 修改 → 回到对应 slot 的 prompt 重跑
- 放弃 → 不落盘

### Step 5 — 落盘 + 校验

```bash
# 写 profiles/{id}/ 下所有文件
# 运行 validator
python framework/tools/validate_profile.py profiles/{id}
# 运行 dry-run resolve
python framework/tools/profile_resolver.py --profile {id} --dry-run
```

任一失败 → 打印错误、撤回文件、回到 Plan Mode。

### Step 6 — 装配建议

```
Profile '{id}' 已创建。可选：
  /profile use {id}          # 切换为工作区默认
  /profile show              # 查看当前绑定
```

## Prompt 模板索引

- [`prompt-principles.md`](prompt-principles.md)
- [`prompt-voice.md`](prompt-voice.md)
- [`prompt-typesetting.md`](prompt-typesetting.md)
- [`prompt-constraints.md`](prompt-constraints.md)

## profile.yaml 填写

- `id` = 用户指定 `--id`，未指定则从 Q4 调性关键词合成 kebab-case（如 `clipped-datadriven-wechat`）
- `version: 1.0.0`
- `title` 由 Q3 栏目 + Q1 平台合成
- `provenance.extractedBy: goal`
- `provenance.goal:` 存 Q1-Q6 原始答案（dict）
- `routing` 使用协议默认
