# WeChat Typesetter

微信公众号排版工具，支持 Markdown/HTML/纯文本输入、实时预览、主题切换、富文本复制。

## 快速使用（双击即用）

- Windows 用户直接双击 `open.bat`
- 工具会自动启动本地静态服务并打开 `index.html`
- 页面打开后粘贴内容并点击“复制富文本”即可粘贴到公众号后台
- 如需手工改默认元素配置，双击 `edit-config.bat` 直接编辑同目录 `element-config.json`

> 说明：页面依赖 CDN 加载 Mermaid，首次使用需要联网。

## 目录说明

- `index.html`：发布入口（双击可用版）
- `open.bat`：Windows 一键启动入口（推荐）
- `edit-config.bat`：Windows 一键打开配置文件
- `element-config.json`：同目录默认元素配置（可直接手改）
- `assets/`：发布后的 JS/CSS 资源
- `dev-assets/`：开发工程（Vite + React + TS + 测试）

## 统一元素配置

页面顶部有“元素配置 / Elements”按钮，可统一配置以下内容：

- 分割线样式与文案
- 公众号名称、二维码标签、二维码图片路径
- 文末联系文案、版权模板
- CTA 默认按钮文案
- Readmore 默认文案
- Note 标签文案
- 扩展块兜底提示文案

这些配置会自动保存在浏览器本地，下次打开自动恢复。

此外，工具会自动尝试加载同目录 `element-config.json`。你可以：

- 双击 `edit-config.bat` 修改该文件
- 刷新页面后生效（或在“元素配置”面板点“加载同目录配置”）
- 将二维码图片（如 `qrcode.png`）与 `element-config.json` 放在同目录，并配置 `qrImageUrl: "./qrcode.png"`

## 配置导入/导出 JSON

在“元素配置”面板里：

- 点击“加载同目录配置”可重新读取 `element-config.json`
- 点击“导出配置JSON”可导出当前配置
- 点击“导入配置JSON”可导入团队共享配置

示例（部分字段）：

```json
{
  "brandName": "AI+工控",
  "qrLabel": "扫码关注",
  "qrImageUrl": "./qrcode.png",
  "ctaDefaultText": "阅读原文",
  "divider": {
    "style": "dot",
    "text": "· · ·"
  }
}
```

说明：

- `qrImageUrl` 支持相对路径（推荐同目录：`./qrcode.png`）或 HTTP URL
- 文末会自动渲染二维码 `<img>`
- 图片加载失败时会自动回退为 `qrLabel` 文本占位

## Frontmatter 文章级覆盖

支持在 Markdown 顶部 frontmatter 中对元素配置做**单篇覆盖**（优先级高于全局配置）。

优先级：

- 默认配置
- 本地全局配置（元素配置面板）
- frontmatter 单篇覆盖（最高）

### 覆盖写法一：`element.*` 点路径

```yaml
---
element.brandName: 本文专属公众号
element.qrLabel: 本文二维码
element.qrImageUrl: ./qrcode.png
element.divider.style: text
element.divider.text: —— 本文分割线 ——
---
```

### 覆盖写法二：`element_config_json`

```yaml
---
element_config_json: {"brandName":"前言专栏","ctaDefaultText":"查看原文"}
---
```

> 注意：`element_config_json` 需为合法 JSON 字符串。

## 开发工程（仅二次开发）

进入 `dev-assets/` 后：

```bash
npm install
npm run test
npm run build
```
