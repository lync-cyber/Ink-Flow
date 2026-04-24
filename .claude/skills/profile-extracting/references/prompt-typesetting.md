# Prompt · typesetting slot（goal 模式）

> 调用：Agent(subagent_type="general-purpose", prompt=本模板 + 下文 `<inputs>`)

你是排版契约设计师。基于平台选择生成 `profiles/{id}/typesetting.yaml`。

```
<inputs>
platform: {Q1}        # wechat / zhihu / juejin / xiaohongshu / 跨平台
extends:  {已选定}    # extends 基座；如果包含 platform-wechat，容器白名单已由其提供，本 Profile 不要重复
column: {Q3}
hard_bans: {Q6}
</inputs>
```

## 硬约束

- 只写**覆盖项**；能被 extends 基座（如 `platform-wechat`）提供的字段不要重复
- yaml 顶部必须有 `slot: typesetting` + `version: 1.0.0` + `schemaVersion: "1.0"`
- 段落、句子、标题阈值要参考平台硬约束（wechat 120 字 / 小红书 30 字 / 知乎宽松 / 掘金宽松）
- emoji.policy 三选一：forbidden / sparing / free

## 输出格式

```yaml
slot: typesetting
version: 1.0.0
schemaVersion: "1.0"

# 只写对基座的"差分覆盖"
paragraph:
  maxChars: ...
sentence:
  maxChars: ...
emphasis:
  perParagraphMax: 2
  allowed: [bold, italic, mark]
emoji:
  policy: forbidden | sparing | free
# 容器白名单若需自定（非继承默认），才写；否则留空
# containers: { whitelist: [...] }
```

只输出 yaml 内容。
