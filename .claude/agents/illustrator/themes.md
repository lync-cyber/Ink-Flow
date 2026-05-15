# illustrator / 主题库（HTML & SVG 共用）

> illustrator 主文件按需读取本文件。所有 HTML/SVG 模板的颜色、字体、几何、阴影统一从主题 token 取值，避免"每张图各搞一套"的工程师默认风。
>
> 主题选择优先级（命中即停）：
>
> 1. brief.figure_theme（单篇 override）
> 2. typesetting.illustration.theme（Profile 字段）
> 3. 栏目默认（见 § 栏目 → 主题映射）
> 4. fallback: `editorial-mono`

---

## 主题 Token 结构（所有主题共同字段）

```yaml
id: <主题唯一 id>
mood: <一句话描述>
palette:
  primary:   <主色 · 用于节点描边 / 标题底色 / 主连线>
  accent:    <强调色 · 用于关键路径 / 高亮数字 / CTA>
  ink:       <正文文字色 · 对比度 ≥ 4.5:1>
  mute:      <辅助文字色 / 次级节点描边>
  surface:   <主画布底色>
  surface_alt: <卡片底 / 偶数行背景>
typography:
  heading_family: <主标题字体栈>
  body_family:    <正文字体栈>
  mono_family:    <等宽 · 代码节点>
  scale:
    title:   <主标题 px>
    section: <节标题 px>
    body:    <正文 px>
    caption: <脚注 px>
  weights:
    bold:    <粗体 weight>
    regular: <常规 weight>
geometry:
  radius_node:   <节点圆角 px>
  radius_card:   <卡片圆角 px>
  stroke_width:  <主描边 px>
  stroke_hairline: <细分隔线 px>
  arrow_size:    <箭头边长 px>
  line_cap:      <round | butt>
  line_dash:     <实线 "0" | 虚线 "6 4">
shadow:
  card:    <CSS box-shadow 值；deep 暗系主题用 ""（无）>
  emphasis: <强调元素阴影>
node:
  shape:        <rect | pill | tag | hex>
  bg:           <填充色，取 surface_alt 或 primary alpha>
  text_color:   <ink 或反白>
  padding:      <内边距 px>
arrow:
  stroke:       <连线主色>
  head_fill:    <箭头头部填充>
  style:        <solid | dashed | dotted>
notes:
  ban: [<禁用元素>]
  prefer: [<偏好做法>]
```

任何 HTML/SVG 模板渲染时按 `{theme.<path>}` 形式占位；illustrator agent 在生成图源时先把 token 注入字符串再写盘——禁止把 token **名字** 留在源文件里。

---

## 内置主题 · 1 · editorial-mono · 编辑部冷调

```yaml
id: editorial-mono
mood: 克制、严谨、信噪比优先；纸质杂志感
palette:
  primary:     "#1a1a1a"
  accent:      "#c44536"
  ink:         "#1a1a1a"
  mute:        "#7a7a7a"
  surface:     "#fafaf7"
  surface_alt: "#ffffff"
typography:
  heading_family: '"Source Han Serif SC","Noto Serif SC","PingFang SC",serif'
  body_family:    '"PingFang SC","Microsoft YaHei",sans-serif'
  mono_family:    '"JetBrains Mono","SFMono-Regular",Consolas,monospace'
  scale: { title: 20, section: 16, body: 14, caption: 12 }
  weights: { bold: 700, regular: 400 }
geometry:
  radius_node: 2
  radius_card: 4
  stroke_width: 1.5
  stroke_hairline: 1
  arrow_size: 8
  line_cap: butt
  line_dash: "0"
shadow:
  card: "0 1px 0 rgba(0,0,0,0.04)"
  emphasis: "none"
node:
  shape: rect
  bg: "#ffffff"
  text_color: "#1a1a1a"
  padding: "12px 16px"
arrow:
  stroke: "#1a1a1a"
  head_fill: "#1a1a1a"
  style: solid
notes:
  ban: ["渐变","emoji 节点","彩虹色","霓虹光晕"]
  prefer: ["大量留白","数字加 accent 色","小型脚注","左对齐表格"]
```

用途：academic 学术前沿 · tech 技术专题（zhihu / 公众号正文）

---

## 内置主题 · 2 · soft-warm · 柔和暖卡片

```yaml
id: soft-warm
mood: 温暖、对话感、低对抗；适合人物 / 故事 / 小红书
palette:
  primary:     "#3d2e26"
  accent:      "#e0876a"
  ink:         "#3d2e26"
  mute:        "#9b8a7e"
  surface:     "#faf6f0"
  surface_alt: "#ffffff"
typography:
  heading_family: '"Smiley Sans","HYWenHei","PingFang SC",sans-serif'
  body_family:    '"PingFang SC","Microsoft YaHei",sans-serif'
  mono_family:    '"JetBrains Mono",monospace'
  scale: { title: 22, section: 17, body: 14, caption: 12 }
  weights: { bold: 600, regular: 400 }
geometry:
  radius_node: 14
  radius_card: 16
  stroke_width: 1.5
  stroke_hairline: 1
  arrow_size: 9
  line_cap: round
  line_dash: "0"
shadow:
  card: "0 6px 20px rgba(61,46,38,0.08)"
  emphasis: "0 10px 28px rgba(224,135,106,0.18)"
node:
  shape: pill
  bg: "#ffffff"
  text_color: "#3d2e26"
  padding: "14px 20px"
arrow:
  stroke: "#9b8a7e"
  head_fill: "#9b8a7e"
  style: solid
notes:
  ban: ["黑底","硬直角","锐荧光色","等宽字做正文"]
  prefer: ["圆头连线","软阴影","低饱和色块","手绘风脚注"]
```

用途：story 人物故事 · xiaohongshu 小红书

---

## 内置主题 · 3 · terminal-grid · 终端栅格

```yaml
id: terminal-grid
mood: 工程师同好感、信息密集、代码优先；深色底
palette:
  primary:     "#7fdbca"
  accent:      "#ff8c42"
  ink:         "#e6e6e6"
  mute:        "#7c8590"
  surface:     "#0f1419"
  surface_alt: "#161b22"
typography:
  heading_family: '"JetBrains Mono","SFMono-Regular","PingFang SC",sans-serif'
  body_family:    '"JetBrains Mono","PingFang SC",sans-serif'
  mono_family:    '"JetBrains Mono","SFMono-Regular",Consolas,monospace'
  scale: { title: 18, section: 15, body: 13, caption: 11 }
  weights: { bold: 600, regular: 400 }
geometry:
  radius_node: 0
  radius_card: 4
  stroke_width: 1
  stroke_hairline: 1
  arrow_size: 7
  line_cap: butt
  line_dash: "0"
shadow:
  card: "inset 0 0 0 1px rgba(127,219,202,0.18)"
  emphasis: "0 0 0 1px rgba(255,140,66,0.4),0 0 12px rgba(255,140,66,0.18)"
node:
  shape: rect
  bg: "#161b22"
  text_color: "#e6e6e6"
  padding: "10px 14px"
arrow:
  stroke: "#7fdbca"
  head_fill: "#7fdbca"
  style: solid
notes:
  ban: ["渐变","系统默认 Times New Roman","暖肉色","emoji 装饰"]
  prefer: ["等宽字标签","点阵网格背景","ANSI 风色","代码节点用 mono"]
```

用途：juejin 掘金 · tech 技术专题（代码向）

---

## 内置主题 · 4 · bold-infographic · 粗体信息图

```yaml
id: bold-infographic
mood: 冲击力、大数字、新闻周刊式；适合趋势判断
palette:
  primary:     "#1d3557"
  accent:      "#e63946"
  ink:         "#1d3557"
  mute:        "#457b9d"
  surface:     "#f1faee"
  surface_alt: "#ffffff"
typography:
  heading_family: '"Inter","HarmonyOS Sans","PingFang SC",sans-serif'
  body_family:    '"Inter","PingFang SC","Microsoft YaHei",sans-serif'
  mono_family:    '"JetBrains Mono",monospace'
  scale: { title: 28, section: 18, body: 14, caption: 12 }
  weights: { bold: 800, regular: 500 }
geometry:
  radius_node: 6
  radius_card: 8
  stroke_width: 2.5
  stroke_hairline: 1.5
  arrow_size: 10
  line_cap: round
  line_dash: "0"
shadow:
  card: "0 3px 0 rgba(29,53,87,0.16)"
  emphasis: "0 6px 0 rgba(230,57,70,0.22)"
node:
  shape: rect
  bg: "#ffffff"
  text_color: "#1d3557"
  padding: "14px 18px"
arrow:
  stroke: "#1d3557"
  head_fill: "#e63946"
  style: solid
notes:
  ban: ["低对比灰底","纤细 1px 线","莫兰迪色","柔和阴影"]
  prefer: ["大数字+小标签","accent 色描边","厚实箭头","图块平铺"]
```

用途：industry 行业趋势 · 各平台 cover 封面

---

## 栏目 → 主题 默认映射（无显式声明时）

| 栏目 | 默认主题 |
|---|---|
| academic | editorial-mono |
| tech | terminal-grid（juejin） / editorial-mono（wechat、zhihu） |
| industry | bold-infographic |
| story | soft-warm |

xiaohongshu 平台不论栏目：封面用 `bold-infographic`（trend / academic / tech）或 `soft-warm`（story），由栏目兜底决定。

---

## 用户自定义主题注入

### 方式 1 · Profile 全局（推荐）

在 Profile 的 `typesetting.yaml` 追加：

```yaml
illustration:
  theme: my-brand        # 直接指向 customThemes 中的 id
  t2iStyle: editorial-flat
  themeOverrides:        # 可选 · 只覆盖个别 token
    palette:
      accent: "#0066ff"
  customThemes:
    my-brand:
      extends: editorial-mono   # 继承内置主题，再 patch 字段
      palette:
        primary: "#0a2540"
        accent:  "#635bff"
      typography:
        heading_family: '"Inter","PingFang SC",sans-serif'
```

resolver 合成 `runtime/profile-resolved/typesetting.yaml` 时保留 illustration 块；illustrator 启动时按"内置主题 ← customThemes ← themeOverrides"三层合并。

### 方式 2 · 单篇 override

在 brief.md 写：

```yaml
figure_theme: terminal-grid
figure_t2i_style: tech-isometric
```

仅作用于该 slug，不修改 Profile。

### 方式 3 · 临时 stack

```
/profile overlay <profile-id>@illustration
```

加载一份只含 illustration 块的 overlay，本会话内生效。

### 校验底线

任意自定义主题必须保证：

- palette 至少 6 个色键齐全（不能漏 accent / mute）
- ink 与 surface 对比度 ≥ 4.5:1（WCAG AA）
- 字号 scale.body ≥ 13；scale.caption ≥ 11
- stroke_width 不允许 ＜ 1
- 不允许新增 token 键名（保持 schema 闭合）

illustrator 启动时若校验失败 → 退回内置默认主题 + stderr 报警，不中止生成。
