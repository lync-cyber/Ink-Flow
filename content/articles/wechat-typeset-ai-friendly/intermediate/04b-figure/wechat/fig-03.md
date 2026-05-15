# fig-03 · 主题对比截图（image-prompt）

> 此图需作者本地截屏后手动替换。在 draft 中以 `<!-- IMAGE: pending-user fig-03 -->` 占位。

## 图片说明

同一段 markdown 在两个 persona 主题下的并排渲染对比，直观展示"切主题不改稿"的效果。

## 截图指引

1. 本地启动 wechat-typeset：`npm ci && npm run dev`，浏览器打开 `http://127.0.0.1:5173`
2. 粘入以下示例 markdown（或任意一段含 `:::` 容器的技术文章片段）：

```markdown
::: tip 核心结论
超过 1000 条数据会直接超时，改用分页 + 虚拟滚动后，渲染耗时从 4.2s 降到 380ms。
:::

::: quote-card
排版不该是创作的最后一公里苦力活。
:::
```

3. 在主题选择器中切换到 **tech-geek（极客夜行）**，截取编辑器右侧预览区，保存为 `fig-03-left.png`
4. 再切换到 **literary-humanism（人文札记）**，相同区域截图，保存为 `fig-03-right.png`
5. 用任意图片工具拼为左右并排，建议尺寸 **1200 × 600px**（左右各 600px，高度对齐）
6. 最终文件保存为 `fig-03.png`，放在本目录

## 文生图提示词（备选，若无法本地截图）

```
Split-screen comparison screenshot of a markdown editor preview panel.
Left side labeled "tech-geek": dark navy background (#0d1117), monospace code-style typography,
neon accent colors (#00ff88 green highlights), compact line spacing, terminal-like aesthetic.
Right side labeled "literary-humanism": warm off-white background (#fdf6ec), elegant serif-style
Chinese typography, muted earth tones, generous line spacing, magazine editorial aesthetic.
Both sides show identical content: a tip callout box and a pull-quote card with Chinese text.
Clean UI, no browser chrome, 1200x600px, realistic web app screenshot style.
```

## 发布前处理

- 将 `fig-03.png` 上传到公众号图床或内容 CDN
- 在 `07-final/wechat.md` 中将 `<!-- IMAGE: pending-user fig-03 -->` 替换为实际图片链接
- 图片 alt 文字建议："同一 markdown，两套主题，效果对比"
