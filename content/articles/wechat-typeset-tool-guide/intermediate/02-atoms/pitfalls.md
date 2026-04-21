---
id: pitfall-01
type: pitfall
weight: primary
platforms: [wechat]
source_section: 平台约束的编码方式
length_chars: 116
---
现象：SVG 里用了 `#ffffff` 白色填充，预览正常，粘贴到微信后白色区域变成透明。
原因：微信 SVG→PNG 光栅化器把 `#fff` / `#ffffff` fill 处理为透明，这是平台底层行为。
最小修复：把所有白色填充改为 `#fefefe`（视觉无差异，但规避了光栅化透明 bug）。[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/src/pipeline/rules.ts)

---
id: pitfall-02
type: pitfall
weight: primary
platforms: [wechat]
source_section: 平台约束的编码方式
length_chars: 100
---
现象：用了 `display:flex + gap` 布局，在桌面预览里排列整齐，粘贴后在 Android 公众号内塌陷成单列。
原因：微信 Android 客户端不支持 `display:flex + gap` 属性组合。
最小修复：使用 wechat-typeset 的渲染管线（`wxPatch.patchFlexToFallback` 自动降级为 `display:block`），或手动改为 `display:block` + 外边距控制间距。[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/skills/wechat-typeset/references/hard-rules.md)

---
id: pitfall-03
type: pitfall
weight: primary
platforms: [wechat]
source_section: 平台约束的编码方式
length_chars: 94
---
现象：主题里用了 `position:absolute` 做浮动装饰，本地预览正常，粘贴后装饰层消失。
原因：微信公众号后台在粘贴时剥离所有 `position` / `float` / `@media` / `@keyframes` / `-webkit-` 前缀属性（`-webkit-print-color-adjust` 除外）。
最小修复：所有布局改用 `display:block` + margin/padding，禁止依赖 `position` 和 `float` 实现视觉效果。[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/src/pipeline/rules.ts)

---
id: pitfall-04
type: pitfall
weight: supporting
platforms: [wechat]
source_section: 技术实现：渲染管线
length_chars: 80
---
现象："一键复制"按钮点击后无反应，或弹出权限拒绝提示。
原因：`navigator.clipboard.write()` 要求浏览器处于 secure context（即 `https://` 或 `localhost`），在 HTTP 环境下不可用。
最小修复：使用 `npm run preview`（端口 7788）替代直接打开 HTML 文件；或访问官方在线演示 https://lync-cyber.github.io/wechat-typeset 。[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/src/clipboard/copyHtml.ts)

---
id: pitfall-05
type: pitfall
weight: supporting
platforms: [wechat]
source_section: 平台约束的编码方式
length_chars: 58
---
现象：正文字号设为 12px，预览清晰，但在手机上文字糊成一片。
原因：微信 SVG 会被光栅化为 PNG 并以 `max-width:100%` 缩放至约 375px，640→375 缩放系数约 0.586；12px × 0.586 ≈ 7px，远低于可读下限。
最小修复：SVG 正文/数据标签字号 ≥ 14px（硬下限），图注/脚注 ≥ 12px（警告可人工放行），主标题 ≥ 18px。[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/src/pipeline/rules.ts)
