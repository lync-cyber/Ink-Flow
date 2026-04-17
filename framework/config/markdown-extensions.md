# Markdown 语法规约（InkFlow × 微信公众号）

> **单一事实来源** — writer 输出、auditor 审校、polisher 润色、publisher 导出共用一套语法；下游排版器（兼容 doocs/md 的在线/本地渲染器）消费此语法。
>
> **核心原则**：只使用**标准 Markdown + GFM Alerts**。任何自定义容器语法（`:::` 开头）都会在粘贴到微信时被剥，禁止使用。
>
> **职责分工**：本文件定义"能写什么"。"写什么最合适"由 writer/illustrator agent 结合
> `framework/config/columns.yaml` 的 `suggested_components` 字段判断。

---

## 1. 标准 Markdown 元素

| 元素 | 语法 | 语义说明 |
|------|------|---------|
| H1 标题 | `# title` | 全篇唯一；作为文章主标题 |
| H2 标题 | `## heading` | 章节 |
| H3 标题 | `### heading` | 小节 |
| H4 标题 | `#### heading` | 子节（尽量不用超过此层级） |
| 段落 | 自然段落 | 长度限制见 `.claude/rules/data/platform-limits.yaml` |
| 引用 | `> text` | H1 后紧跟的 blockquote 约定为摘要引言（非 story 建议、story 按需） |
| 无序列表 | `- item` | |
| 有序列表 | `1. item` | |
| 代码块 | ` ```lang ` | 语言标记必填（触发下游高亮） |
| 行内代码 | `` `code` `` | |
| 表格 | `\| col \| col \|` | |
| 分割线 | `---` | |
| 图片 | `![caption](url)` | `caption` 作为图注 |
| 链接 | `[text](url)` | |
| 强调 | `**bold**` / `*italic*` / `~~del~~` | |

---

## 2. GFM Alerts（唯一允许的"容器"扩展）

**5 种类型**，由 GitHub 定义。下游排版器（如 doocs/md）通常以 [marked-alert](https://github.com/bent10/marked-extensions) 渲染。

```markdown
> [!NOTE]
> 补充说明，不影响主线阅读。

> [!TIP]
> 建议或最佳实践，读者可直接采纳。

> [!IMPORTANT]
> 关键信息，读者必须关注。

> [!WARNING]
> 潜在风险，提醒读者规避。

> [!CAUTION]
> 红线 / 致命错误 / 不可逆操作。
```

**用法映射**：

| 场景 | 用哪个 |
|------|--------|
| 非主线补充、历史背景、相关链接 | `[!NOTE]` |
| 最佳实践、快捷写法 | `[!TIP]` |
| 必读的前置条件 | `[!IMPORTANT]` |
| 常见陷阱、性能坑 | `[!WARNING]` |
| 数据丢失 / 不可逆 / 红线 | `[!CAUTION]` |

**约束**：
- 每类 ≤ 3 行内容；超过用普通段落或拆分
- 每篇文章 Alert 总数建议 ≤ 4
- 不嵌套 Alert
- 首行后可选自定义标题：`> [!TIP] 我的建议`

---

## 3. 摘要引言

H1 之后可跟一个 blockquote 作摘要引言，下游排版器按此位置差异化渲染。

```markdown
# 文章标题

> 一句话核心观点。读者 3 秒内看到的结论。
```

- **非 story 栏目**：建议始终有（academic 强制）
- **story 栏目**：按需——故事有时直接开场更有力
- **不要在正文里写 "TL;DR" 字样**（AI 味重）。需要显式标签用"核心观点"、"一句话"等自然表达；也可以无标签，仅用 blockquote

---

## 4. 引用文献（标准有序列表 + 上标标记）

文内用 `[1]` 上标标记；文末用**标准有序列表**汇总。

```markdown
近年异常检测方法有突破性进展[1][2]。

---

### 参考文献

1. Zhang et al. (2025). "Industrial Anomaly Detection". *CVPR 2025*.
2. Li et al. (2024). "EfficientAD". *NeurIPS 2024*.
3. [边缘 AI 部署实战](https://example.com/edge-ai). TechBlog, 2025-01.
```

- **academic 栏目必须**包含文末参考文献列表
- 格式：学术引用 `作者 (年份). "标题". *期刊*.`；网页引用 `[标题](URL). 来源, 日期.`
- 禁止只放 URL 不写说明；微信会剥链接，读者必须能从纯文本读出来源

---

## 5. 图表

### 5.1 Mermaid（线性流程、简单树）

```markdown
​```mermaid
flowchart LR
  A[输入] --> B[处理] --> C[输出]
​```
```

发布前由 `.claude/scripts/mermaid.py` 转为内联 SVG（部分下游排版器也支持客户端渲染），
或者由 illustrator agent 直接产出 SVG。

### 5.2 内联 SVG（精确图表、循环、数据可视化）

```html
<svg viewBox="0 0 640 360" ...>
  <!-- 内联 SVG，遵守 .claude/rules/data/platform-limits.yaml 的 svg 段硬约束 -->
</svg>
```

微信特有约束（禁 id 属性、禁 `<style>/<script>/<a>`）详见
`.claude/rules/data/platform-limits.yaml` 的 `svg_wechat:` 段。

---

## 6. 结构化数据 —— 用 Markdown 表格

```markdown
| 环境 | 版本要求 |
|------|----------|
| Python | ≥ 3.10 |
| PyTorch | ≥ 2.0 |
| GPU | RTX 3060+ |
```

突出某行用**加粗行**：

```markdown
| 方法 | AUROC |
|------|-------|
| PatchCore | 99.1% |
| EfficientAD | 98.8% |
| **本文方法** | **99.6%** |
```

---

## 7. 时间轴、步骤 —— 用标准列表

时间轴：

```markdown
- **2024-03** 项目立项，完成技术选型
- **2024-06** v1.0 发布，支持基础检测
- **2024-12** v2.0 发布，引入 AI 模型
```

步骤：

```markdown
1. **环境准备** — 安装 Python 3.10+ 和 PyTorch
2. **数据导入** — 将训练数据放入 `data/` 目录
3. **模型训练** — 运行 `train.py` 启动训练
```

---

## 8. 文末运营区（约定俗成，无特殊语法）

公众号文章末尾固定结构，用**H3 标题 + 正文段落**组织。publisher 按模板拼接。

```markdown
---

### 阅读原文

{一段描述性文字，引导读者点击"阅读原文"查看 GitHub 仓库 / 原始链接}

### 关于作者

{公众号介绍、往期推荐链接、下期预告}
```

可选：`#话题 #标签` 直接写在段落里，微信后台有独立的 tag 输入栏。

---

## 9. 栏目特有约定

| 栏目 | 特有约定 |
|------|---------|
| academic | 必须有文末参考文献列表；H1 后必须有摘要引言 blockquote |
| industry | 通常 ≤3 个 section；表格用于事件/数据对比 |
| tech | 如用代码块必标语言；栏目不限于软件技术，不强制必须有代码块 |
| story | 摘要引言按需；行高 2.0；引用用 `> text` 即可 |
