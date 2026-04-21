---
id: case-01
type: case
weight: primary
platforms: [wechat]
source_section: 排版痛点背景
length_chars: 118
---
场景：技术内容创作者每次发文前，需要在 Markdown Nice 里手动选主题、调色值、修复字体被微信覆盖的问题。
转折：不同题材（财经稿、生活随笔、技术教程）在调整后依然共用同一套 Medium 蓝风格，视觉身份无差异化。
结果：每篇文章排版耗时约 45 分钟，其中 70% 是重复性样式调整，写作创意时间被严重侵占。（2025）[来源](https://yiban.io/geo/31586)

---
id: case-02
type: case
weight: supporting
platforms: [wechat]
source_section: LLM Agent 集成（Skill 包）
length_chars: 116
---
场景：InkFlow 写作 pipeline 需要在 AI 生成草稿后，自动触发公众号排版并产出可直接粘贴的富文本。
转折：wechat-typeset 提供官方 Skill 包，InkFlow 通过 `framework/tools/_adapters/cli.py` 读取 `dist/api/capabilities.json` 做能力对账。
结果：从草稿到排版产物全程无需人工介入，annotated.md → 主题选择 → 一键复制的工作流可由 AI agent 驱动。（2026）[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/skills/wechat-typeset/SKILL.md)

---
id: case-03
type: case
weight: supporting
platforms: [wechat]
source_section: 技术实现：渲染管线
length_chars: 110
---
场景：开发者在 wechat-typeset 里写了一个使用 `display:flex + gap` 的容器样式，预览效果良好。
转折：粘贴到微信后台后，Android 客户端布局塌陷——因为微信 Android 不支持 `flex + gap`。
结果：`wxPatch.patchFlexToFallback` 在运行时自动将 `display:flex` 降级为 `display:block`，"预览 = 剪贴板"纪律保证了粘贴后不会出现此类问题。（2026）[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/skills/wechat-typeset/references/hard-rules.md)
