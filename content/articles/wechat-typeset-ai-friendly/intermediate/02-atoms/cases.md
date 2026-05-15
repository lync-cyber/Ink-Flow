---
id: case-01
type: case
weight: primary
platforms: [wechat]
source_section: 核心观点
length_chars: 118
---

场景：用 Claude 或 GPT 写完一篇技术文章后，作者还要手动把 markdown 搬进编辑器、调样式、适配微信约束，耗时往往比写作本身更长。这个"最后一公里"的手工搬运，是现有工具链共同的痛点。wechat-typeset 的目标：让 AI 写完文章直接得到"投递就绪"的富文本，作者只剩选主题和发文。

---
id: case-02
type: case
weight: supporting
platforms: [wechat]
source_section: 竞品分析
length_chars: 102
---

对比场景：doocs/md 集成 DeepSeek/OpenAI 等多家模型，定位是"AI 辅助写作"——AI 帮人生成内容，人再手动排版。wechat-typeset 的 AI 定位相反：AI 消费契约 markdown 直接产出排版结果，即"AI 直接产物投递就绪"。两者 AI 集成的方向差了 180 度，但市面上尚无文章把这个差异讲清楚。[来源](https://github.com/doocs/md) (2025)

---
id: case-03
type: case
weight: supporting
platforms: [wechat]
source_section: 关键事实
length_chars: 96
---

主题切换视觉差异场景：同一段 markdown（含 `:::tip` + `:::quote-card`），在 tech-geek（极客夜行）主题下呈现高对比度深色背景+代码字体；在 literary-humanism（人文札记）主题下呈现暖色衬线字体+宽松行距。切换全程不需修改 markdown 正文，完全由主题的 CSS 内联策略驱动。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json) (2026-05)

---
id: case-04
type: case
weight: optional
platforms: [wechat]
source_section: 关键事实
length_chars: 84
---

本地运行全流程：`npm ci && npm run dev` → 浏览器打开 `http://127.0.0.1:5173`，粘贴 markdown，点选 tech-geek 主题，点"复制富文本"，打开公众号后台粘贴，整个链路在 1-2 分钟内完成。draft 存 localStorage，分享链接把正文+主题打包为 URL hash（base64url），收方打开即只读载入，无服务器存储。[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/README.md) (2026-05)
