# wx-md · 手动验收清单

> 自动化测试覆盖单元/契约逻辑；本清单覆盖**端到端的交互与视觉**（跨浏览器 / 微信真机），
> 每次发布前跑一遍，打勾即合格。

## 环境准备

```bash
cd framework/tools/typeset/app
pnpm install
pnpm build
node ../serve.mjs        # 或 framework/tools/typeset/launcher.{bat,command}
```

浏览器打开 `http://127.0.0.1:7788`。

## Step 1 · 端到端最小链路

- [ ] 打开后左侧 CodeMirror 能正常编辑
- [ ] 右侧 375px 预览实时刷新
- [ ] 点击"复制"按钮后，浏览器无报错

## Step 2 · 预览保真 & 防抖

- [ ] 快速连按键（持续 2 秒）预览不卡顿，最多 400ms 延迟
- [ ] 滚动预览时内容不重排/抖动
- [ ] 预览 iframe 始终锁定 375px 宽（缩放浏览器窗口不变）

## Step 3 · 兼容性补丁（wxPatch）

- [ ] 粘贴到公众号后台后，检查源码：
  - [ ] 无 `id=` 属性
  - [ ] 无 `font-family` 属性（含 SVG）
  - [ ] 无 `<style>` / `<script>` / `<a>` 标签
  - [ ] SVG `url(...)` 无引号
- [ ] 打开某个带 SVG 的主题（business-finance 推荐），公众号预览 SVG 白底区域不穿透

## Step 4 · 容器语法

对四套主题分别切换后，19 个容器全部渲染无异常：

- [ ] `intro` / `cover` / `author` / `section-title`
- [ ] `tip` / `warning` / `info` / `danger`
- [ ] `quote-card` / `highlight`
- [ ] `compare-pros-cons` / `steps`
- [ ] `divider` 三种 variant（wave / dots / flower）
- [ ] `footer-cta` / `recommend`
- [ ] `qrcode` / `mpvoice`（占位）/ `mpvideo`（官方占位）/ `qqvid`

行内扩展：

- [ ] `==highlight==` 渲染为高亮
- [ ] `~~wavy~~` 渲染为波浪下划线（若主题启用）
- [ ] `**emphasis**` / `*em*` / `` `code` `` 样式正确

## Step 5 · 主题设计系统

- [ ] `import { themeList }` 返回 ≥ 5 个主题（default + 4 套风格包）
- [ ] 切换主题后 CSS 变量、内联样式、SVG 资产同步刷新
- [ ] 主题里使用的 `tokens.colors.primary` 等被正确透传到容器渲染器

## Step 6 · 四套风格包

切换每套主题后，依次检查：

### tech-geek

- [ ] H2 前缀、sectionCorner、三种 divider、icons、stepBadge 都是几何/代码风
- [ ] 代码块对比度高，配色冷色偏蓝
- [ ] 示例 md（内置加载）覆盖所有容器

### life-aesthetic

- [ ] 视觉语言偏手写/波点，配色暖色柔和
- [ ] H2 下划线为 dotted
- [ ] 示例 md 同上

### business-finance

- [ ] 视觉语言报告/图表风（K 线柱、方块序列）
- [ ] 配色深红 + 深蓝 + 金点缀
- [ ] stepBadge 的数字色为 `#fefefe`（非纯白，避免公众号 SVG→PNG 透明化）
- [ ] 示例 md 同上

### literary-humanism

- [ ] 视觉语言古籍/云纹（如意、缠枝花、回纹）
- [ ] 字号偏大，行高更松
- [ ] 示例 md 同上

## Step 7 · 配色生成器 + 自定义面板

- [ ] 打开"配色"面板（或 Ctrl/⌘+Shift+C）
- [ ] 10 个预设点一遍：主题色 + 对比度 + 所有容器同步刷新
- [ ] 手动输入 `primary` 后，`secondary`/`accent` 自动补全
- [ ] 切换 dark 模式后背景变暗，前景变浅
- [ ] 低对比度组合（如 `#dddddd` on `#ffffff`）面板显示 `fail` 红色标记
- [ ] 关闭面板后自定义配色保留；刷新页面丢失（设计预期）

## Step 8 · 多草稿 + 模板市场 + 导出 + 快捷键

### 多草稿

- [ ] 打开"草稿"抽屉（或 Ctrl/⌘+Shift+D）
- [ ] 新建、切换、删除草稿工作正常
- [ ] 刷新后默认打开最近使用的草稿
- [ ] 导出 JSON → 清空 → 导入 JSON，条目全恢复
- [ ] 旧版 `wx-md:draft:single` 用户升级后自动迁移成一篇

### 模板市场

- [ ] 打开"模板"抽屉
- [ ] 4 个模板卡片（cover / authorBar / footerCTA / recommend）
- [ ] 点击"插入"会把模板 md 写入编辑器光标处

### 导出

- [ ] Ctrl/⌘+Shift+H 导出 HTML，打开文件可见完整样式
- [ ] Ctrl/⌘+Shift+M 导出 Markdown，源文本无损
- [ ] 点击"长图"按钮：
  - [ ] 已安装 `html2canvas`：下载完整 PNG
  - [ ] 未安装：Toolbar 提示"需要 html2canvas"，不崩溃

### 快捷键

- [ ] Ctrl/⌘+S 保存当前草稿（视觉反馈）
- [ ] Ctrl/⌘+K 复制富文本
- [ ] Ctrl/⌘+Shift+C/D/H/M 触发配色/草稿/HTML/MD 操作

## 真机验收（微信粘贴）

- [ ] Chrome / Edge / Safari 各复制一次，粘贴到公众号后台：
  - [ ] 富文本完整（不是纯文本）
  - [ ] SVG 可见、无白色穿透
  - [ ] 段落间距合理，无首行缩进
  - [ ] 代码块配色保留
  - [ ] 手机预览：小屏下 SVG 字号 ≥ 8.2px（即原 SVG 14+ 缩放后）

## 出现问题时的排查顺序

1. 打开 DevTools Console 看有无红字
2. 打开 Preview iframe 的 srcdoc 看 HTML 结构
3. 跑 `pnpm test` 确认契约未破
4. 跑 `pnpm typecheck` 确认类型未破
5. 对照 `.claude/rules/data/platform-limits.yaml` 确认约束未破

---

自动化测试对照：`app/tests/` · 单次命令 `pnpm test` 应见 114 条以上全绿。
