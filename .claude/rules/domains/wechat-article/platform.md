> 继承 `core/platform-base.md`，以下为微信公众号特有补充。

## 排版约束

- 仅使用 inline style（公众号不支持 `<style>` 块和 class）
- 正文排版参数见 `.claude/rules/data/platform-limits.yaml` 的 `constraints:`
- SVG 微信特有限制见 `.claude/rules/data/platform-limits.yaml` 的 `svg_wechat:`

## CSS 安全

完整清单在 `.claude/rules/data/platform-limits.yaml`（单一事实来源）。
Agent 引用其中的 `allowed` / `cautious` / `forbidden_css` / `forbidden_tags` 字段。
