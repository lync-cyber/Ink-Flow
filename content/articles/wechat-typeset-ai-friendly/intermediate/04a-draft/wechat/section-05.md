## 跟 mdnice / doocs/md / 秀米的差异在哪

先把对比表摆这儿：

| 维度 | Markdown Nice | doocs/md | 秀米 / 135 | wechat-typeset |
|---|---|---|---|---|
| Markdown 支持 | GFM | GFM + 公式 | 无，富文本拖拽 | GFM + 5 种行内扩展 |
| 主题切换 | 自定义 CSS | 多套预设 + 自定义 | 模板市场 | 11 套内置 persona，切换不改稿 |
| `:::` 容器 | 无 | 无 | 无 | 37 个 |
| AI 友好接口 | 无 | 有 AI 助手，但定位辅助写作 | 无 | capabilities.json + 12 API + 4 skill |
| LLM 可读 schema | 无 | 无 | 无 | CDN 无鉴权拉取 |
| 开源 | 是 | 是 | 否 | MIT，纯静态 |

<!-- FIGURE: fig-03 image-prompt 同一段 markdown 在 tech-geek 与 literary-humanism 两主题下并排截图 -->

不贬低别家。mdnice 主题美观，doocs/md 多平台同步做得很全，秀米的视觉模板库非常厚实。这些工具都解决了真问题。

但定位真的不同。换个角度看就明白了：

:::: compare variant=column-card
::: pros wechat-typeset 的读者是 AI
- 接口面向 LLM，capabilities.json 给机器读
- AI 输出即终稿，作者不进编辑器
- 容器协议是写作契约，不是 GUI 配置
:::
::: cons 其他工具的读者是人
- mdnice / doocs/md 主要是给人挑样式
- doocs/md 的 AI 帮人**写内容**，写完还是人手动套主题
- 秀米的盒子拖拽链路里 AI 接不进来
:::
::::

doocs/md 的 AI 集成方向跟我差了 180 度。它的 AI 是帮人多写几个字，写完仍然要打开它的 GUI 选样式、套模板。wechat-typeset 的 AI 是消费契约直接出富文本，那个 GUI 步骤被去掉了。

两种都对，看你想让 AI 干哪一段活。
