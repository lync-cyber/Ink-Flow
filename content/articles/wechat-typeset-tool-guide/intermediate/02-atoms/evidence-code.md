---
id: evidence-code-01
type: evidence-code
weight: primary
platforms: [wechat]
source_section: 技术实现：渲染管线
length_chars: 398
---
// 解决：把 <style> 块内联到每个元素 style="" 属性，消除微信剥离 class 的副作用
```typescript
export function inlineHtml(htmlWithStyle: string): string {
  const styles: string[] = []
  const htmlWithoutStyle = htmlWithStyle.replace(
    /<style[^>]*>([\s\S]*?)<\/style>/gi,
    (_, css) => { styles.push(css); return '' }
  )
  return juice.inlineContent(htmlWithoutStyle, styles.join('\n'), {
    preserveMediaQueries: false,
    preserveFontFaces: false,
    removeStyleTags: true,
  })
}
```
[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/src/pipeline/juiceInline.ts)

---
id: evidence-code-02
type: evidence-code
weight: primary
platforms: [wechat]
source_section: 技术实现：渲染管线
length_chars: 440
---
// 解决：跨浏览器可靠地把富文本写入剪贴板；Clipboard API 不可用时自动降级
```typescript
export async function copyHtmlToClipboard(html: string, plain: string): Promise<CopyResult> {
  if (navigator.clipboard && window.isSecureContext && typeof ClipboardItem !== 'undefined') {
    const item = new ClipboardItem({
      'text/html': Promise.resolve(new Blob([html], { type: 'text/html' })),
      'text/plain': Promise.resolve(new Blob([plain], { type: 'text/plain' })),
    })
    await navigator.clipboard.write([item])
    return { ok: true, mode: 'clipboard-api' }
  }
  // 降级：创建 contenteditable 节点 + document.execCommand('copy')
}
```
[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/src/clipboard/copyHtml.ts)

---
id: evidence-code-03
type: evidence-code
weight: supporting
platforms: [wechat]
source_section: 容器扩展语法（20+ 种）
length_chars: 198
---
// 解决：用 Markdown 容器语法写四态提示块（tip/warning/info/danger），靠形状冗余区分（色盲友好）
```markdown
::: tip 小贴士
草稿 100% 落在 localStorage，刷新页面不丢。
:::

::: warning 注意
切换主题会重新渲染，但内容不会丢失。
:::
```
[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)

---
id: evidence-code-04
type: evidence-code
weight: supporting
platforms: [wechat]
source_section: 容器扩展语法（20+ 种）
length_chars: 185
---
// 解决：用嵌套冒号语法写 pros/cons 对比块，无需任何 CSS 手调
```markdown
:::: compare
::: pros 本地优先
- 不跑后端 · 草稿在 localStorage
- 375px iframe 锁死，预览即产物
:::
::: cons 平台约束
- 禁 class / font-family
- 禁 1px 以下描边
:::
::::
```
[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)

---
id: evidence-code-05
type: evidence-code
weight: supporting
platforms: [wechat]
source_section: 容器扩展语法（20+ 种）
length_chars: 98
---
// 解决：用步骤卡容器语法生成带编号徽章的教程步骤，自动应用主题样式
```markdown
::: steps
1. 粘贴 Markdown 原文
2. 切主题、看 375px 预览
3. 点「一键复制」→ 回公众号粘贴
:::
```
[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)

---
id: evidence-code-06
type: evidence-code
weight: supporting
platforms: [wechat]
source_section: wechat-typeset 核心参数
length_chars: 130
---
// 解决：本地快速启动 wechat-typeset，严格按 lockfile 安装避免版本漂移
```bash
git clone https://github.com/lync-cyber/wechat-typeset.git
cd wechat-typeset
npm ci            # 严格按 lockfile 安装
npm run dev       # http://127.0.0.1:5173
```
[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/README.md)

---
id: evidence-code-07
type: evidence-code
weight: supporting
platforms: [wechat]
source_section: 主题系统（Theme Persona）
length_chars: 212
---
// 解决：新增自定义主题，三步完成，import.meta.glob 自动发现无需手动注册
```bash
# 1. 复制骨架
cp -r src/themes/default src/themes/your-slug

# 2. 编辑 persona.spec.ts（改 id/name/palette/motifs）

# 3. 校验 + 预览
npm run validate:spec   # schema 校验 + 平台约束守卫
npm run dev             # 热更新预览，import.meta.glob 自动发现
npm test                # 全量单测 + sample-full.md 端到端
```
[来源](https://github.com/lync-cyber/wechat-typeset/blob/main/docs/theme-authoring.md)
