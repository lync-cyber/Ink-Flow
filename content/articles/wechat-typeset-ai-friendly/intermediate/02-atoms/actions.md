---
id: action-01
type: action
weight: primary
platforms: [wechat]
source_section: 核心观点
length_chars: 78
---

**给谁**：想试用的公众号作者 / 技术博主

**何时**：现在，30 秒内

**怎么做**：打开 [GitHub 仓库](https://github.com/lync-cyber/wechat-typeset) 看 README 和在线 demo（GitHub Pages）；或直接访问在线编辑器 `https://lync-cyber.github.io/wechat-typeset`，粘一段 markdown 进去，切换 tech-geek 和 literary-humanism 主题，看渲染差异。

---
id: action-02
type: action
weight: primary
platforms: [wechat]
source_section: 关键事实
length_chars: 72
---

**给谁**：想本地跑完整流程的技术写作者

**何时**：有 5 分钟 + 已安装 Node >= 24

**怎么做**：`npm ci && npm run dev` → 浏览器打开 `http://127.0.0.1:5173` → 粘贴 markdown → 选主题 → 点"复制富文本" → 粘贴到公众号后台。draft 自动存 localStorage，无需登录。

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/README.md) (2026-05)

---
id: action-03
type: action
weight: primary
platforms: [wechat]
source_section: AI / LLM 集成钩子汇总
length_chars: 90
---

**给谁**：用 Claude / GPT / Cursor 写公众号文章的技术博主

**何时**：有 30 分钟，想体验 AI 全程

**怎么做**：在 Agent 上下文中挂载 `skills/wechat-typeset/SKILL.md`（或全部 4 个子 skill），让 AI 调用 `getContainerVocabulary()` + `getVariantIds()` 生成契约 markdown；再通过 `render()` API 或导出脚本得到富文本，粘进公众号后台，全程不改稿。

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/wechat-typeset/SKILL.md) (2026-05)

---
id: action-04
type: action
weight: supporting
platforms: [wechat]
source_section: AI / LLM 集成钩子汇总
length_chars: 88
---

**给谁**：AI Agent / MCP server 开发者，在搭"内容自动化发布"流水线

**何时**：搭建 pipeline 阶段

**怎么做**：订阅 `capabilities.json`（jsDelivr CDN，12h 缓存，无鉴权）获取主题、容器、variant、硬约束的机器可读清单；调用 `getContainerVocabulary()` 动态生成 system prompt 的写作词汇表，调用 `getVariantIds()` 防止幻觉，调用 `validatePersona(spec)` 校验 LLM 输出的主题 spec 并自动重试。

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/dist/api/capabilities.json) (2026-05)

---
id: action-05
type: action
weight: optional
platforms: [wechat]
source_section: AI / LLM 集成钩子汇总
length_chars: 76
---

**给谁**：想做自定义主题的设计师 / 技术写作团队

**何时**：需要品牌化排版风格

**怎么做**：fork 仓库，参照 `dist/schema/persona-spec.schema.json`（PersonaSpec JSON Schema draft-07）设计自定义主题；运行 `validatePersona(spec)` 检查合规性（11 键色板 / fontSize≥14 / strokeWidth≥1 / variant id 白名单），通过后即可注入自定义 persona 供团队使用。

[来源](C:/Users/huanc/OneDrive/GitRepo/wechat-typeset/skills/wechat-typeset-author-persona/SKILL.md) (2026-05)
