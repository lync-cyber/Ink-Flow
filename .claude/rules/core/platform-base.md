## 排版约束

> 确定性阈值定义在 `tools/markdown-lint/lint-config.yaml` 的 `typography` 段（单一事实来源），此处为 LLM 可读的语义描述。
> 排版数值参数（字号、行高、字间距）定义在 `styles/default/columns.yaml` 的 `typography` 段。

- 段落不超过 3 行（移动端屏幕高度限制，lint 规则 C1）
- 禁止首行缩进（移动端显示错位，lint 规则 C3）

## 标题层级

- H2 作为主分节标题
- H3 作为子分节标题
- H4 偶尔使用
- 正文写作阶段禁止 H1（publish 阶段由 publisher 统一插入文章标题 H1）和 H5+

## 图片

- 图片宽度限制 640px（移动端最大适配宽度）
- 每张图表附带一行说明文字
