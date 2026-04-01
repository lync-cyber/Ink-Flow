---
name: format-exporting
description: >
  格式导出 — 将终稿 Markdown 标准化为 typesetter 可消费格式，导出多格式。
  由 pipeline 在 publish 阶段执行。
user-invocable: false
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob
---

> 排版约束见 platform-base 和 wechat-platform rules。
> Markdown 扩展语法参考见 `styles/default/markdown-extensions.md`。
> HTML 排版由 typesetter（`tools/wechat-typesetter/index.html`）程序化生成，本 skill 不生成 HTML。
> 确定性格式校验由 format-linting skill 独立执行（lint.py），本 skill 不重复。

## 架构

```
auditor → polisher → final.md (Markdown + :::extensions)
                        ↓
               format-exporting (本 skill)
                        ↓
               article.md — 标准化 Markdown，可直接粘贴到 typesetter
               plain.md   — 纯净 Markdown（无扩展标记）
               summary.md — 摘要 + 关键词
                        ↓
               typesetter — 选栏目 → 生成 inline HTML → 复制到公众号编辑器
```

---

## 转换流程

### Step 1: 解析 Frontmatter

从 `output/final.md` 读取 YAML frontmatter：
- `column` → 确定栏目类型（对应 typesetter 中的主题 ID：academic/industry/tech/story）
- `title`, `issue`, `date`, `tags`, `tldr` → 元数据

### Step 2: 语法标准化

将终稿的 Markdown 标准化为 typesetter 可解析的格式：

1. **确认 `:::block` 语法正确** — 开始标记 `:::type` 和结束标记 `:::` 各占一行
2. **H1 + 摘要** — 确保首个 H1 后紧跟 blockquote 作为摘要（story 栏目除外）
3. **引用文献** — 文内用 `[N]` 上标标注，文末用有序列表或 `---` 分隔后列出
4. **图片路径** — 转换为相对路径，确认 alt 属性包含图注文字
5. **代码块** — 确认语言标注（` ```python ` 而非 ` ``` `）
6. **清理残留** — 移除 `<!-- USER_FILL: -->` 注释、`TODO` 标记等

### Step 3: 语义内容检查（LLM 专属）

| 栏目 | 检查项 |
|------|--------|
| academic | 引用来源是否可信；论点是否有数据支撑 |
| industry | 信息时效性标注是否完整；判断是否有依据 |
| tech | 代码示例是否可运行；环境说明是否完整 |
| story | 叙事是否有具体场景；观点是否足够鲜明 |

---

## 导出格式

### article.md（主输出）

标准化后的 Markdown，包含 `:::block` 扩展标记。用户复制到 typesetter 后：
1. 选择对应栏目主题
2. typesetter 自动渲染为品牌 inline HTML
3. 复制 HTML 到微信公众号编辑器

### plain.md

纯净 Markdown，去除所有 `:::block` 标记和 HTML：
- `:::card` 内容转为普通段落
- `:::note` 内容转为 `> blockquote`
- `:::cta`, `:::footer`, `:::label` 等移除
- 适合 RSS、邮件通讯、知乎/掘金等平台

### summary.md

- 摘要字数上限见 `.inkflow.yaml` 的 `exports.summary.word_limit`
- 3-5 个长尾关键词（搜一搜优化）
- 封面变量填充建议（封面背景色从 columns.yaml 读取）
