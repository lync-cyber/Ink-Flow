# HTML 预览生成指南

SKILL.md §4 触发后读此文件。生成 `workspace/column-design/{slug}/preview.html`，
两方向系统性对比，让用户用浏览器打开后决策。

## 两方向的对比逻辑

**不是参数差异，是排版主张。** 两方向在 H1 / H2 / H3 / 引用块 / 分隔线 / 列表 / 粗体 /
行距 **至少 5 项**系统性站队到不同立场，形成两种可对比的阅读体验。

挑选原则：基于用户象限（§2 问询结果），选**有张力的相邻气质**——不要跨度太大（跨象限会让用户
更迷惑），也不要同象限微调（差异不够明显）。常见组合：

| 用户象限 | A 方向 | B 方向 |
|---|---|---|
| ① 学术 | 编号编辑部（硬框 + 数字前缀 + 全宽分隔） | 极简学术（无框 + 字重区分 + 留白分隔） |
| ② 文学 | 衬线编辑部（衬线 H1 + 左竖条 + 衬线引用 + 点线） | 留白随笔（无衬线 + 符号 H2 + 纯留白分隔） |
| ③ 科技 | 几何块（色块 H1 + 左粗条 + 细边框卡片） | Mono 极简（等宽字 + 字重 H2 + 纯线） |
| ④ 生活 | 奶油底（Surface 底引用 + 小圆角 + 留白） | 清新线条（细线 + 无底色 + 符号点缀） |

这些只是起点——最终方向按 SKILL.md §3 从用户真实话题合成，不是查表。

## 14 组件全覆盖清单

每个方向必须渲染（缺一项算失败，回去补）：

```
① H1 文章主标题           ⑧ 链接 a
② H2 章节标题             ⑨ 引用块 blockquote（含 cite 出处）
③ H3 小节标题             ⑩ 无序列表 ul（3 项）
④ H4 段内小标题           ⑪ 有序列表 ol（3 项）
⑤ 正文段落 p（连续 2 段） ⑫ 代码块 pre code（≥3 行）
⑥ 粗体 strong             ⑬ 图片 + 图注（占位图即可）
⑦ 行内代码 code           ⑭ 分隔线 hr（章节间出现 2 次）
```

## 签名元素

每个方向**一个**签名——读者一眼记住的单点设计。常见模式：

- H1 下 32px 短色条（而非全宽下划线）
- 引用块切换衬线字体（和正文无衬线拉出两种声音）
- `hr` 用 80px radial-gradient 点线 / 纯 64px 留白（而非横贯全宽）
- H2 前缀 `§` / `01` / 裸方块
- 粗体用主色而非加深黑色
- 列表符号方块 / 破折号（而非默认圆点）
- 章节间用纯留白代替线条

**一套一个**。每组件都加戏 = AI slop。

## HTML 骨架

预览 HTML 是**本地渲染用**的标准 HTML，这里用普通 CSS 选择器（`h1`/`p`/`ul`/...）。
真正的 doocs 主题 CSS（§5）才需要 doocs 特殊选择器，预览和最终 CSS 不共享选择器命名。

```html
<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><title>公众号主题预览 · {栏目中文名}</title>
<style>
  body { margin:0; padding:40px 20px; background:#EEEBE5;
         font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif; }
  .variant { max-width:677px; margin:0 auto 20px; padding:56px 40px;
             background:{{paper-color}}; box-shadow:0 1px 3px rgba(0,0,0,.04); }
  .variant-label { max-width:677px; margin:40px auto 12px;
                   font-size:12px; color:#8A8A8A; letter-spacing:.15em; text-transform:uppercase; }
  .caption { display:block; text-align:center; font-size:13px; color:#595959;
             margin-top:8px; margin-bottom:32px; }
  .compare { max-width:677px; margin:40px auto; font-size:13px; color:#595959; }
  .compare table { width:100%; border-collapse:collapse; }
  .compare th, .compare td { padding:10px 12px; border-bottom:.5px solid #D8D5CE;
                             text-align:left; vertical-align:top; line-height:1.6; }
  .compare th { font-weight:600; width:16%; color:#1A1A1A; }

  /* ===== A 方向：完整 14 组件样式 ===== */
  .variant-a h1 { /* ... */ }
  .variant-a h2 { /* ... */ }
  .variant-a h3 { /* ... */ }
  .variant-a h4 { /* ... */ }
  .variant-a p { /* ... */ }
  .variant-a strong { /* ... */ }
  .variant-a code { /* 行内代码 */ }
  .variant-a a { /* ... */ }
  .variant-a blockquote { /* ... */ }
  .variant-a blockquote p { /* 引用内段落，HTML 结构里是 blockquote > p */ }
  .variant-a blockquote cite { /* 出处 */ }
  .variant-a ul { /* ... */ }
  .variant-a ol { /* ... */ }
  .variant-a li { /* ... */ }
  .variant-a pre { /* 代码块容器 */ }
  .variant-a pre code { /* 代码块内部 */ }
  .variant-a hr { /* ... */ }
  .variant-a img { /* ... */ }

  /* ===== B 方向：另一套完整 14 组件样式，系统性不同 ===== */
  .variant-b h1 { /* ... */ }
  /* ... 同 A 结构，但在 ≥5 项上站对立立场 ... */
</style></head><body>

<div class="variant-label">方向 A · [气质词] · [签名元素] · [主色名]</div>
<article class="variant variant-a">
  <h1>{{用户真实主标题}}</h1>
  <p>{{用户真实正文段 1，含 <strong>主色强调</strong>、<code>行内代码</code>、<a href="#">链接</a>}}</p>
  <h2>{{用户真实小标题}}</h2>
  <p>{{用户真实正文段 2}}</p>
  <blockquote><p>{{用户真实引用}}</p><cite>{{出处}}</cite></blockquote>
  <p>引用后正文。</p>
  <h3>小节标题</h3>
  <ul><li>项 1</li><li>项 2</li><li>项 3</li></ul>
  <h3>另一小节</h3>
  <ol><li>步骤 1</li><li>步骤 2</li><li>步骤 3</li></ol>
  <h4>代码示例</h4>
  <pre><code>def hello():
    print("world")</code></pre>
  <hr>
  <p>分隔线后的段落，展示章节切换节奏。</p>
  <img src="https://via.placeholder.com/600x360/E8E4DD/595959?text=示例图" alt="">
  <span class="caption">图注：居中浅色小字</span>
</article>

<div class="variant-label">方向 B · [气质词] · [签名元素] · [主色名]</div>
<article class="variant variant-b"><!-- 同结构，B 样式 --></article>

<section class="compare">
  <h3 style="font-size:14px;color:#1A1A1A;margin:0 0 16px;">两方向逐项差异</h3>
  <table>
    <tr><th>H1</th>      <td>A：...</td><td>B：...</td></tr>
    <tr><th>H2</th>      <td>A：...</td><td>B：...</td></tr>
    <tr><th>H3</th>      <td>A：...</td><td>B：...</td></tr>
    <tr><th>引用块</th>  <td>A：...</td><td>B：...</td></tr>
    <tr><th>粗体</th>    <td>A：...</td><td>B：...</td></tr>
    <tr><th>行内代码</th><td>A：...</td><td>B：...</td></tr>
    <tr><th>链接</th>    <td>A：...</td><td>B：...</td></tr>
    <tr><th>分隔线</th>  <td>A：...</td><td>B：...</td></tr>
    <tr><th>列表</th>    <td>A：...</td><td>B：...</td></tr>
    <tr><th>整体气质</th><td>A：...</td><td>B：...</td></tr>
  </table>
</section>

</body></html>
```

## 色值使用原则（关键）

骨架里的 `{{paper-color}}` 等占位由 SKILL.md §3 合成值填入。示例主色必须是 AI 当场合成的
context-specific 值，**绝不能**从任何"文学杂志 = 水墨灰蓝"这类映射查表——那会让 skill
退化为 AI slop 源头。

预览 HTML 里可以用 `::before`/`::after` 制造装饰（这是本地 HTML，浏览器直接渲染）。最终
doocs 主题 CSS（§5）才要避免伪元素，因为微信粘贴会剥离。

## 呈现消息

生成后告诉用户：

> 两套完整排版主张已渲染到 `workspace/column-design/{slug}/preview.html`，用的是你提供的真实内容。
> - **A · [气质词]** — [一句话]
> - **B · [气质词]** — [一句话]
>
> 请在浏览器打开该文件。底部有逐项对比表。可选 A/B、混合反馈（"A 的引用 + B 的分隔"），
> 或都不喜欢让我换方向。

**禁止**：贴 HTML 代码、写长篇"A 的设计意图是…"、预设用户会选哪个。
