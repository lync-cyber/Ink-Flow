---
topic: "wechat-typeset：一个为 AI/LLM 打造的微信公众号排版工具"
slug: "wechat-typeset-ai-friendly"
target_length: 2800
content_type: deep_dive
audience: general
content_column: tech
target_platforms: [wechat]
primary_platform: wechat

skip_research: false
no_figures: false
skip_seo: true

opening_style: pain_point
cta_type: follow

original: true
author: "lync 笔记"

# 关键源材料
sources:
  - type: github
    url: https://github.com/lync-cyber/wechat-typeset
  - type: local_repo
    path: C:/Users/huanc/OneDrive/GitRepo/wechat-typeset
  - type: contract
    path: framework/contracts/wechat-typeset.schema.json
  - type: skills_overview
    path: C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/
---

## 核心观点

微信公众号排版的最后一公里，长期卡在"AI 写完后人工搬运"上。
wechat-typeset 把"主题表达"和"内容生产"彻底解耦：

- **AI / LLM 只生产 GFM + `:::` 容器扩展**，不碰主题
- **本地浏览器工具消费 `:::` 容器**，运行时切主题、复制富文本，一键粘到公众号
- **附带可被 LLM 直接读的 skill 包**（capabilities.json / `:::` 协议 schema / 主题清单 / 风险矩阵），任何 AI Agent 接入即用

这样的分工换来一件以前做不到的事：让 Claude / GPT / DeepSeek 写完文章直接得到"投递就绪"的富文本，作者只剩选主题和发文。

## 调研方向

### 必须挖到的事实

1. **设计取舍**：为什么坚持纯浏览器、不要服务端？为什么用 `:::` 容器而不是直接出 HTML？
2. **容器协议**：`wechat-typeset.schema.json` 定义的容器集（intro / cover / author / section-title / abstract / tip / warning / quote-card / compare / steps / key-number / footer-cta 等 25 个）覆盖哪些公众号常见排版场景？
3. **主题数与变体**：仓库里有多少主题（technical-formal / minimal-mono / soft-warm 等）？每个容器有多少 variants？
4. **AI 友好接口**：
   - `dist/api/capabilities.json` 是什么、给谁用、字段长什么样
   - `skills/` 目录里的 typeset-skill / theme-skill / risk-matrix 怎么被 LLM 消费
   - 是否有 `npm run skills:bundle` 之类的 LLM 工具链
5. **微信限制对抗**：剥离 `<style>` / `<script>` / id / class 之后，用什么 CSS 内联策略保住排版？SVG / 图片有什么硬约束？
6. **核心使用流程**：`npm run dev` → 浏览器粘贴 → 选主题 → 复制富文本 → 公众号后台，整链 1-2 分钟可达？
7. **与 Markdown Nice / 秀米 / Doocs 的差异点**：尤其在"AI 直接产物 → 排版"这一段

### 必须给出的代码 / 数据片段

- 一段 demo `:::` 容器 markdown（intro + tip + quote-card 嵌套），3-15 行
- `capabilities.json` 的关键字段截选（containers / variants / themes / signatureLimit）
- 主题切换前后的 inline 样式对比（同一段 markdown，两个主题，看 inline style 差异）
- 一段"LLM agent 引用 skill 自动生成合规 markdown"的伪 prompt 示例（30 行内）

### 对比表格

| 维度 | Markdown Nice | 秀米 / 135 | wechat-typeset |
|---|---|---|---|
| 主题切换 | ? | ? | ? |
| AI 输入友好 | ? | ? | ? |
| `:::` 容器支持 | ? | ? | ? |
| LLM skill / schema 暴露 | ? | ? | ? |
| 部署方式 | ? | ? | ? |

研究者按真实情况补完。

## 目标读者画像

混合人群：

- **公众号作者 / 独立创作者**：写完 markdown 想要一键漂亮排版，不要学 PS / 不要交月费
- **技术博主**：用 Claude / Cursor / GPT 写初稿，目前还得手动搬运 + 调样式
- **AI Agent 开发者**：在做"内容自动化发布"流水线，需要一个稳定可被 LLM 调用的排版后端
- **新人**：对工具内部不感兴趣，但要看懂"它解决了我什么问题"

写作时：技术细节要有（架构图、容器协议、capabilities），但每段开头必须能让"非技术读者"也读得懂大意。

## 补充说明

### 必须做到

- **第一人称视角**：作者就是 wechat-typeset 的开发者，要用"我做这个工具是因为..."的私人叙述线
- **AI 角度是主线**：约 50% 篇幅讲 AI / LLM 集成（skill 包、capabilities、agent 用法），其余讲常规排版亮点
- **至少 1 个完整 demo**：一段 markdown 在不同主题下的展示效果（用 svg-chart 或 svg-flow 或对比图说明）
- **金句位**：文章前 1/3 处必有一句 ≤20 字的强观点。候选：
  - "AI 写完不算完，让 AI 自己把活儿做到底。"
  - "排版不该是创作的最后一公里苦力活。"
  - "把主题切换权留给运行时，把生产权交还给 AI。"

### 必须避开

- 不要写成"工具说明书" → 要写成"为什么我做了这个、它解决了什么"
- 不要罗列所有主题截图 → 重点讲设计哲学
- 不要把 AI 部分写成宣传 → 要给出 LLM 实际能怎么用的具体 prompt / skill 路径
- 不要堆 emoji 和强调标记（每段 ≤2 处强调）

### 视觉断点候选

- 一张"AI 内容生产 → wechat-typeset 排版 → 公众号"的流程图（svg-flow）
- 一张"容器 / variant / 主题"三层模型示意（svg-chart 或 html-card）
- 一张主题对比图（同一段 markdown，2-3 个主题并列；可由作者本地截图）

### 用户填充位（USER_FILL）

预留 2-3 处给作者补私人经验：
- 做这个工具的契机（哪次手动排版被搞崩了？）
- 自己用 AI 写文章时这工具节省了多少时间
- 一个意外发现的用法（比如某个主题特别适合某类内容）
