# orchestrator / ask-user 模块

> orchestrator 与用户所有结构化交互的唯一入口。所有"AskUserQuestion"出现的地方，执行时按本模块的调用协议走。

## 调用协议

```
PROC ask_user(question, options, context=None, multiSelect=False):
  TRY:
    result = AskUserQuestion({
      question: question,
      options: options,
      multiSelect: multiSelect,
      context: context,      # 可选：附大纲/审校摘要/清单
    })
    RETURN result
  CATCH InputValidationError | ToolUnavailable:
    # 降级：主会话中 AskUserQuestion 偶发 InputValidationError
    RETURN ask_user_textual(question, options, multiSelect)
```

## 纯文本降级模板

```
PROC ask_user_textual(question, options, multiSelect):
  向用户输出：

  ── question ──
  {question}

  {option 1}
  {option 2}
  ...
  {option N}

  请回复：
    - 单选：输入序号（如"2"）或选项文本
    - 多选：逗号分隔（如"1,3,4"）
    - 自定义：直接输入自由文本
  ── end ──

  读取用户下一条消息作为回复：
    - 纯数字 → 映射到对应 option
    - 逗号分隔数字 → 多选映射
    - 其他 → 记为自由文本
  返回与 AskUserQuestion 同构的 result 对象
```

## 多选与自由文本

- `multiSelect=True` 时，降级模板末尾额外提示"多选请逗号分隔"
- option 末尾带 "我自己修改 / 自定义组合" 等自由输入项 → 降级模板明确提示"输入 N 后可接自由文本"

## 调用方约定

所有下列位置**不允许直接写** `AskUserQuestion:`，必须经 `ask_user`：

| 模块 | 位置 |
|------|------|
| `brief.md` | Step 1（主题确认）· Step 2（参数采集 Q1..Q4）· Step 2b（栏目）· Step 2d（平台）· Step 4（确认） |
| `checkpoints.md` | CP1 主交互 · CP2 主交互 · CP3 主交互 |
| `recovery.md` | L4 人工介入 · per-platform rerun 确认 · 全量 rerun 确认 · resume warning 决策 |
| `stages.md` | 依赖缺失通知 · stale lock 问询 |
| `fanout.md` | 多平台失败决策 |
| `orchestrator.md` | 启动意图识别 |

## 回复归一化

- 数字 N → options[N-1].text
- 文本完全匹配 options 中某项 → 对应项
- 其他文本 → `{selected: "__free_text__", text: "<原文>"}`，由调用方按 context 自行解析
