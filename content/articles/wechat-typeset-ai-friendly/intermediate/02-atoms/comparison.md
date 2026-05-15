---
id: comparison-01
type: comparison
weight: primary
platforms: [wechat]
source_section: 对比表格
length_chars: 560
---

**主表：四款公众号排版工具横向对比**

| 维度 | Markdown Nice | doocs/md | 秀米 / 135editor | wechat-typeset |
|---|---|---|---|---|
| Markdown 支持 | 有，GFM 兼容 | 有，GFM + 数学公式 + 任务列表 | 无，富文本/盒子拖拽，不支持 Markdown | 有，markdown-it 14，GFM + 扩展行内语法 5 种 |
| 主题切换 | 有，自定义 CSS；社区主题库 | 有，多套预设 + 自定义 CSS | 有（模板市场/样式库），但与 Markdown 工作流不衔接 | 有，11 套内置 persona，切换不改稿 |
| `:::` 容器支持 | 无 | 无 | 无 | 有，37 个容器节点，含嵌套结构 |
| AI / LLM 输入友好 | 无专门设计；AI 生成普通 Markdown 可粘贴，但容器语义层缺失 | 有 AI 助手（集成 DeepSeek/OpenAI 等），但定位是"AI 辅助写作"，非"AI 直接产物投递就绪" | 无，需人工 GUI 拖拽 | 设计核心：capabilities.json + TypeScript API + 4 个 SKILL.md |
| LLM skill / schema 暴露 | 无 | 无 | 无 | 有：capabilities.json（CDN 无鉴权）+ 12 个 API 符号 + 4 个 SKILL.md + PersonaSpec JSON Schema |
| 部署方式 | 在线 SaaS，无本地部署 | 在线 + npm + Docker | 在线 SaaS，无本地部署 | 纯静态：GitHub Pages / CDN / Cloudflare / Netlify / 本地 `npm run dev`，无服务端 |
| 开源 | 是（mdnice/markdown-nice，近期活跃度待确认） | 是（doocs/md，活跃维护） | 否，商业产品 | 是，MIT（lync-cyber/wechat-typeset） |
| 微信约束处理 | 由工具处理，偏向单一蓝色主题 | 由工具处理 | 由工具处理，依赖 GUI 操作 | WxPatch 管线 8 项自动修复，严格分离写作内容与平台约束 |

[来源](https://github.com/doocs/md) (2025)；[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/README.md) (2026-05)

---
id: comparison-02
type: comparison
weight: supporting
platforms: [wechat]
source_section: 竞品分析
length_chars: 200
---

**子表：AI 集成定位对比**

| 维度 | doocs/md（AI 辅助写作） | wechat-typeset（AI 直接产出） |
|---|---|---|
| AI 做什么 | 根据用户提示生成/改写文章内容 | 消费契约 markdown，输出合规富文本 |
| 人的角色 | 提示词工程师 + 手动排版 | 选主题 + 发文 |
| AI 调用接口 | 无公开机器可读 schema | capabilities.json + 12 个 TypeScript API + 4 个 SKILL.md |
| 幻觉防控 | 无 | `getVariantIds()` + `getContainerVocabulary()` 白名单约束 |
| 输出产物 | 普通 markdown（仍需手动排版） | 投递就绪富文本（juice 内联 + WxPatch 处理完毕） |

[来源](https://github.com/doocs/md) (2025)；[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/wechat-typeset/SKILL.md) (2026-05)
