# publisher / extra-outputs 子模块

> 主 publisher agent 在执行 Step 5（导出）时，若 `platforms/{platform}.publish.yaml` 的
> `extra_outputs` 列表非空，按需 Read 本文件查每个 `format` 的具体生成规则。
>
> **职责边界**：本文只描述"额外产物的内容生成规则"，不重复主 transform 流程；
> 主产物（`export/08-{platform}-publish.md`）由 transforms 序列产出，与本文件无关。

## 通用约束

- 每个 extra_output 的 `output` 路径来自 yaml 字段，路径里的 `{slug}` 替换实际 slug
- 生成失败 → 在 publisher 退出 JSON 的 `extra_outputs.errors` 数组里记录，**不**回滚主产物
- 每个 format 都需通过 lint.py 的简易检查（无 TODO / 字数符合 word_limit）
- 写入前 Read 目标路径；若已存在且内容一致 → 跳过；存在但不一致 → 覆盖并在退出报告标记 `overwritten: true`

## kind: teaser（120 字摘要）

**目的**：社群分发场景的"钩子文案"，朋友圈/微信群直接粘贴即可吸引点击。

**输入**：
- `export/07-final/{platform}.md` 的 H1 + 前 200 字
- `intermediate/01-brief.md` 的 `tldr` / `cta_type`

**生成规则**：

1. 长度 = `word_limit`（默认 120 中文字符，含标点；超 ±10% → error）
2. 第一句必须是"钩子"——避免"今天来分享"、"本文介绍"，参考 brief.opening_style
3. 末尾追加 1 个行动号召，与 brief.cta_type 对齐：
   - `follow` → "关注后台回复关键词领取笔记"
   - `comment` → "你怎么看？评论区聊聊"
   - `share` → "觉得有用就转给同事"
4. **不**带任何 markdown 标记（社群粘贴会乱）；纯文本 + 1 行换行分隔钩子/正文/CTA

**模板**：

```
{钩子句子，开头不超过 20 字}

{核心结论 1 句 + 关键数字/对比 1 句，控制在 60-80 字}

{CTA 1 句，10-20 字}
```

**Exit Criteria**：
- 长度落在 `[word_limit×0.9, word_limit×1.1]`
- 不含 markdown 符号（`#`、`*`、`>`、`![]()` 等）
- 不含品牌套话（"赋能"、"颠覆"、"未来已来"）
- AskUserQuestion 不必要——钩子写差了用户回头看一眼就改

## kind: plain（剥运营区的兜底版）

**目的**：跨平台兜底，把 wechat 的"阅读原文 / 关于作者"等运营区剥掉，保留纯内容。

**输入**：`export/08-{platform}-publish.md`（即主产物，紧跟 transforms 序列之后）

**生成规则**：

1. 复制主产物到 `output` 路径
2. 删除以下区块（逐项 Edit）：
   - `### 阅读原文` 及其下整段，直到下一个 H3 或 EOF
   - `### 关于作者` 及其下整段，直到下一个 H3 或 EOF
   - 任何 `<!-- USER_FILL:` / `<!-- FIGURE:` 残留（理论上 publisher Step 6 已清，二次保险）
3. 保留 H1、tldr blockquote、所有正文 H2/H3/H4 章节、参考文献区
4. **不**改 frontmatter；plain 版仍允许 wechat 风格的 frontmatter（下游若再适配会自己剥）

**Exit Criteria**：
- lint.py `--platform wechat` 通过（plain 仍走 wechat 规则；本质是同源不同剥离深度）
- 字数 = 主产物字数 - 运营区字数；偏差 ≤ ±10% 之外则 warning（可能误删）

## kind: hashtags（小红书话题标签）

**目的**：小红书没有 frontmatter，话题标签在文末以 `#标签` 行内出现。

**输入**：
- `export/07-final/xiaohongshu.md`
- `intermediate/01-brief.md` 的 `topic` / `tags`

**生成规则**：

1. 数量 ∈ `[min_count, max_count]`（默认 3-5）
2. 每个 tag 形式：`#话题词`（无空格，无引号），多个标签之间用单个空格分隔
3. 选词来源排序：
   - brief.tags（用户显式声明，优先）
   - 文章 H2 标题里的高频名词
   - 栏目 columns.{column}.suggested_tags（若存在）
4. 禁止的 tag：含特殊符号（!@$%）、长度 > 10、纯英文且未在文章出现过
5. 输出位置：附加到 `output` 路径的最后一行（在 split_long_paragraph_to_bullets 完成后）

**Exit Criteria**：
- 数量符合 `[min_count, max_count]`
- 无重复
- 每个 tag 满足"在 brief 或正文里出现过"的可追溯性

## kind: 其他

平台新增 extra_output 类型时，按以下契约扩本文件：

```
## kind: {kind_name}（一句话描述）

**目的**：...
**输入**：...
**生成规则**：1. ... 2. ...
**Exit Criteria**：...
```

不要把规则写在 publish.yaml 的 `note` 里——`note` 是给 LLM 看的执行提示，
不是规则 SSOT；规则全在本文件。
