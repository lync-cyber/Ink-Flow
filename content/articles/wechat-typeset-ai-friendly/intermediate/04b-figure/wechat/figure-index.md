# 配图: wechat-typeset-ai-friendly · wechat

## 图 1: 端到端排版流程图（SVG）

> AI 生成 GFM + `:::` 容器 markdown，经 markdown-it 解析、persona 渲染、juice CSS 内联、WxPatch 8 项修复，最终输出可直接粘贴到微信公众号编辑器的合规富文本。
source: fig-01.svg
image: fig-01.png

对应 outline 断点：Section 3 `(illustrator:svg-flow)`

SVG 硬约束自查：
- font-family: "Microsoft YaHei","PingFang SC",sans-serif — 合规
- 最小字号：14px（全部元素）；节点标题 15px，主标题 14px，箭头标签 14px，底部说明 14px — 均 >= 14
- 无 id 属性 — 合规（已移除 marker id="arr"，defs 块整体删除；所有箭头改用 polygon 三角形）
- 无 style 标签 — 合规
- 无 script / a 标签 — 合规
- url() 引用 — 不适用（已无 marker，无 url() 引用）
- fill 无纯白 — 合规（白色区域用 #fefefe）
- stroke-width >= 1 — 合规（最小 1.5）
- 无 @media / @keyframes / position / float / -webkit- — 合规
- viewBox: 0 0 640 340，宽 640 — 合规

---

## 图 2: AI 接口栈 4 层模型（SVG）

> wechat-typeset 为 LLM 暴露的 4 层接口：底层 capabilities.json 机器可读全集，第二层公开 TypeScript API（12 个符号），第三层 4 个 SKILL.md，顶层 LLM Agent system prompt 注入。层层向上传递，核心目标是让 AI 不靠记忆写排版。
source: fig-02.svg
image: fig-02.png

对应 outline 断点：Section 4 `(illustrator:svg-chart)`

SVG 硬约束自查：
- font-family: "Microsoft YaHei","PingFang SC",sans-serif — 合规
- 最小字号：14px（全部元素）；层标题 16px，主标题 18px，副标题 14px，标注文字 14px，底部说明 14px — 均 >= 14
- 无 id 属性 — 合规（已移除 marker id="arr2"，defs 块整体删除；所有箭头改用 polygon 三角形；原"defs 内部引用不算违规"判断已纠正，wechatSpecific.forbidIdAttribute 不区分 defs 内外）
- 无 style 标签 — 合规
- 无 script / a 标签 — 合规
- url() 引用 — 不适用（已无 marker，无 url() 引用）
- fill 无纯白 — 合规（#fefefe）
- stroke-width >= 1 — 合规（最小 1.5）
- 无 @media / @keyframes / position / float / -webkit- — 合规
- viewBox: 0 0 640 410，宽 640 — 合规

---

## 图 3: 主题对比截图（image-prompt，pending-user）

> 此图需真实场景感（同一 markdown 在 tech-geek 与 literary-humanism 两个主题下的并排截图），SVG/HTML 无法替代；见 fig-03.md，作者本地截图后手动插入。
source: fig-03.md
image: pending-user

对应 outline 断点：Section 5 `(illustrator:image-prompt)`

截图规格：1200 × 600px，左右各 600px，左侧 tech-geek，右侧 literary-humanism，内容相同。
draft 占位标记：`<!-- IMAGE: pending-user fig-03 -->`

---

## 汇总表

| id | type | source | image | owner | section | 状态 |
|---|---|---|---|---|---|---|
| fig-01 | svg-flow | fig-01.svg | fig-01.png | illustrator | Section 3 | 待转 PNG |
| fig-02 | svg-chart | fig-02.svg | fig-02.png | illustrator | Section 4 | 待转 PNG |
| fig-03 | image-prompt | fig-03.md | pending-user | user | Section 5 | 待作者截图 |

## PNG 转换命令

```bash
# 在文章目录下运行 fig2img.py（转换 fig-01 和 fig-02）
python framework/tools/fig2img.py \
  content/articles/wechat-typeset-ai-friendly/intermediate/04b-figure/wechat/fig-01.svg \
  content/articles/wechat-typeset-ai-friendly/intermediate/04b-figure/wechat/fig-02.svg
```
