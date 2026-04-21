---
id: comparison-01
type: comparison
weight: primary
platforms: [wechat]
source_section: 竞品事实
length_chars: 720
---
## wechat-typeset vs 主流公众号排版工具

| 维度 | wechat-typeset | Markdown Nice | doocs/md | 壹伴助手 |
|------|---------------|--------------|----------|----------|
| **定位** | 主题人格驱动排版工作台 | Markdown 美化编辑器 | 简洁微信 MD 编辑器 | 全能公众号 SaaS |
| **主题数量** | 9 套内置，可扩展 | 社区主题（数量未定） | 自定义 CSS + 内置主题 | 10 万+ 模板 |
| **主题差异化** | 独立色板+字距+SVG motif+variant | 主要换色/字体 | 主要换色/字体 | 模板库选取 |
| **平台约束处理** | 构造期校验（ThemeAuthoringError）+ 运行时 wxPatch | CSS 绕过 | CSS 绕过 | 模板预先处理 |
| **数据安全** | 全本地，零网络请求 | 有账号系统/云服务 | 可私有部署 | SaaS，数据上云 |
| **LLM 集成** | 官方 Skill 包（Claude/Agent SDK） | 无 | AI 助手（文字生成） | AI 排版生成 |
| **收费模式** | 完全免费开源（MIT） | 免费（部分增值） | 完全免费开源 | 付费订阅 |
| **目标用户** | 技术内容创作者，追求视觉身份差异化 | 技术写作者，追求快速美化 | 技术写作者，多功能 | 非技术运营者，重效率 |
| **GitHub Stars** | 新项目（< 2026-04，数量少） | 4.6k（2024） | 12.3k（2025） | 不适用（闭源） |

[来源 mdnice](https://github.com/mdnice/markdown-nice) | [来源 doocs](https://github.com/doocs/md) | [来源 壹伴](https://yiban.io/) | [来源 wechat-typeset](https://github.com/lync-cyber/wechat-typeset)

---
id: comparison-02
type: comparison
weight: supporting
platforms: [wechat]
source_section: Variant（变体）系统
length_chars: 340
---
## 六类 Variant 可组合样式

| Variant 类型 | 可选样式（部分） | 适用场景 |
|------------|----------------|---------|
| admonition（提示块）| `accent-bar` / `terminal` / `card-shadow` / `pill-tag` / `ticket-notch` 等 15+ | 警告/提示/注意/危险四态提示 |
| quote（金句卡） | `classic` / `column-rule` / `frame-brackets` / `magazine-dropcap` | 引用/金句展示 |
| compare（对比块） | `two-column`（内置） | pros/cons 对比 |
| steps（步骤卡） | `numbered-badge`（主题化数字徽章） | 教程/流程说明 |
| divider（分隔线） | `flower`（花饰）/ 其他主题变体 | 章节分隔 |
| codeBlock（代码块） | `plain`（纯净） | 代码展示 |

切换 variant 无需改代码，在 `PersonaSpec.variants` 字段中声明组合即可。（2026）[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/docs/theme-authoring.md)
