# tools/fetch — 外部文章抓取

将外部平台的文章抓取并清洗为标准 Markdown，落地到 `references/articles/`，
供 `style-learning` skill（study 模式）或 researcher 调研使用。

## wechat.py — 微信公众号文章抓取

### 用法

```bash
# 单篇
python tools/fetch/wechat.py https://mp.weixin.qq.com/s?__biz=xxx...

# 批量（每行一个 URL，# 开头为注释）
python tools/fetch/wechat.py --list references/wechat-urls.txt

# 自定义输出目录
python tools/fetch/wechat.py <URL> --out references/articles

# 详细模式 / JSON 输出（便于 agent 消费）
python tools/fetch/wechat.py <URL> -v
python tools/fetch/wechat.py <URL> --json
```

### 输出

落地到 `references/articles/wechat-{yyyymmdd}-{title-slug}.md`，带 frontmatter：

```yaml
---
source_url: https://mp.weixin.qq.com/s?...
platform: wechat
title: "原文标题"
author: "公众号昵称"
wechat_id: "公众号 ID"
publish_time: "2024-01-15 08:30"
fetched_at: "2026-04-16 12:34:56"
content_hash: "a1b2c3d4e5f6"
---

# 正文（标准 Markdown）
...
```

### 清洗规则

- 只抽取 `<div id="js_content">` / `.rich_media_content` 内容
- 剥离：`qr_code_pc`、`rich_media_tool`、`rich_media_area_extra`、分享栏、打赏、相关阅读
- `<img data-src>` → `![alt](url)`（处理微信懒加载）
- `<h1-h6>` → `# ~ ######`
- `<blockquote>` → `>`
- `<strong>`/`<em>`/`<code>` → `**`/`_`/`` ` ``

### 限制

- **需要公网访问** — 微信文章需公开可访问（未加密/未删）
- **不执行 JS** — 若文章关键内容由 JS 后加载（少数情况），抓取结果为空
- **反爬** — 对同一 IP 高频抓取可能触发微信风控；建议间隔 >2s
- **非微信 URL** — 工具会给出 warning，但仍会尝试；建议只用于 mp.weixin.qq.com

### 依赖

- Python 3.8+
- `requests`（stdlib 不足以 handle SSL + 重定向，必须装）

## 下游使用

- **style-learning (study 模式)**：`references/articles/*.md` 会被扫描并送入 `style-analyzer` agent
- **researcher agent**：调研时可用 `references/articles/` 作为本地事实库
- **手动复用**：frontmatter 的 `content_hash` 用于去重
