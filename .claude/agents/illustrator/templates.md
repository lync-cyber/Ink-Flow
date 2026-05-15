# illustrator / 模板库（主题驱动）

> illustrator 主文件按需读取本文件。所有模板均以 token 占位写就，渲染前先把 `{theme.xxx}` 替换为实际值；token 定义见 [themes.md](./themes.md)，文生图风格见 [t2i-styles.md](./t2i-styles.md)。
>
> **关键原则**：
>
> - HTML/CSS 是流程图、框图、对比、卡片、时间线、封面的**默认载体**
> - 连线箭头用 inline SVG 叠层（绝对定位），不要用 CSS 边框三角拼接
> - 纯数据图（柱状/折线/雷达/热力）才走独立 SVG
> - 单图字号种类 ≤ 4 ；色 ≤ 5；字族 ≤ 2；圆角与描边宽度各 ≤ 2 种

---

## 渲染前的主题解析步骤

1. 读 `runtime/profile-resolved/typesetting.yaml.illustration.theme`
2. 在 `themes.md` 内置主题 / `customThemes` 中查找；缺失回退 `editorial-mono`
3. 合并 `themeOverrides`；校验通过后得到 `theme` 字典
4. 把模板字符串中所有 `{theme.<path>}` 替换为字面量再写盘

illustrator 在 Bash 中可用一段 Python 小脚本完成（写入 `intermediate/04b-figure/{platform}/_theme.json` 留痕，便于审核与一致性比对）。

---

## HTML/CSS · 通用画布壳

所有 HTML 模板按此外层包裹（无 `<style>` 块、纯 inline style，便于无 CSS 文件依赖 headless 渲染）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>fig</title>
</head>
<body style="margin:0;background:{theme.palette.surface};">
<div style="
  width:{canvas.width}px;
  padding:32px;
  background:{theme.palette.surface};
  font-family:{theme.typography.body_family};
  color:{theme.palette.ink};
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
">
  <!-- 内容 -->
</div>
</body>
</html>
```

`canvas.width`：wechat / zhihu / juejin = 640；xiaohongshu 竖版 = 750；封面横版 2.35:1 = 900。

---

## 模板 1 · HTML+SVG 叠层流程图（默认）

适用：步骤流程、状态机、模块调用关系、决策树。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;background:{theme.palette.surface};">
<div style="
  width:640px;height:360px;position:relative;
  background:{theme.palette.surface};
  font-family:{theme.typography.body_family};
  color:{theme.palette.ink};
  box-sizing:border-box;
">

  <!-- 节点 · 用 div 排版，位置绝对定位（按设计稿写死 x/y） -->
  <div style="
    position:absolute;left:40px;top:140px;width:140px;
    padding:{theme.node.padding};
    background:{theme.node.bg};
    color:{theme.node.text_color};
    border:{theme.geometry.stroke_width}px solid {theme.palette.primary};
    border-radius:{theme.geometry.radius_node}px;
    box-shadow:{theme.shadow.card};
    font-size:{theme.typography.scale.body}px;
    font-weight:{theme.typography.weights.regular};
    text-align:center;line-height:1.4;
  ">输入</div>

  <div style="
    position:absolute;left:250px;top:140px;width:140px;
    padding:{theme.node.padding};
    background:{theme.palette.accent};
    color:{theme.palette.surface_alt};
    border:{theme.geometry.stroke_width}px solid {theme.palette.accent};
    border-radius:{theme.geometry.radius_node}px;
    box-shadow:{theme.shadow.emphasis};
    font-size:{theme.typography.scale.body}px;
    font-weight:{theme.typography.weights.bold};
    text-align:center;line-height:1.4;
  ">处理（关键路径）</div>

  <div style="
    position:absolute;left:460px;top:140px;width:140px;
    padding:{theme.node.padding};
    background:{theme.node.bg};
    color:{theme.node.text_color};
    border:{theme.geometry.stroke_width}px solid {theme.palette.primary};
    border-radius:{theme.geometry.radius_node}px;
    box-shadow:{theme.shadow.card};
    font-size:{theme.typography.scale.body}px;
    text-align:center;line-height:1.4;
  ">输出</div>

  <!-- 连线 · inline SVG 占满父容器，纯展示用，pointer-events:none -->
  <svg viewBox="0 0 640 360"
       style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;"
       xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arrow"
              viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="{theme.geometry.arrow_size}"
              markerHeight="{theme.geometry.arrow_size}"
              orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="{theme.arrow.head_fill}"/>
      </marker>
    </defs>
    <!-- 节点 1 → 节点 2 -->
    <path d="M 180 178 L 250 178"
          stroke="{theme.arrow.stroke}"
          stroke-width="{theme.geometry.stroke_width}"
          stroke-linecap="{theme.geometry.line_cap}"
          fill="none"
          marker-end="url(#arrow)"/>
    <!-- 节点 2 → 节点 3 -->
    <path d="M 390 178 L 460 178"
          stroke="{theme.arrow.stroke}"
          stroke-width="{theme.geometry.stroke_width}"
          stroke-linecap="{theme.geometry.line_cap}"
          fill="none"
          marker-end="url(#arrow)"/>
  </svg>

  <!-- 标题与脚注：标题居顶、脚注居底 -->
  <div style="
    position:absolute;left:40px;top:32px;right:40px;
    font-family:{theme.typography.heading_family};
    font-size:{theme.typography.scale.section}px;
    font-weight:{theme.typography.weights.bold};
    color:{theme.palette.ink};
  ">{图标题 ≤ 16 字}</div>

  <div style="
    position:absolute;left:40px;bottom:24px;right:40px;
    font-size:{theme.typography.scale.caption}px;
    color:{theme.palette.mute};
  ">图 N · {一句话脱离正文也能看懂}</div>

</div>
</body>
</html>
```

写法要点：

- 节点 ≤ 7（超过分两张图）
- 节点宽度统一（同行节点同宽）
- 关键路径节点用 `accent` 实心填充，其它走 `surface_alt` + 描边
- 折线连线用多段 `L`；曲线用 `Q` 控制点；禁用 `path` 自动平滑
- `arrow` marker id 唯一不冲突；同一文件多张图改为 `arrow-1` / `arrow-2`

---

## 模板 2 · HTML 对比表（理由：盒模型 + 条纹底 + 边框）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;background:{theme.palette.surface};">
<div style="width:640px;padding:32px;background:{theme.palette.surface};
            font-family:{theme.typography.body_family};color:{theme.palette.ink};
            box-sizing:border-box;">
  <div style="font-family:{theme.typography.heading_family};
              font-size:{theme.typography.scale.section}px;
              font-weight:{theme.typography.weights.bold};
              margin-bottom:16px;">{图标题}</div>
  <table style="width:100%;border-collapse:separate;border-spacing:0;
                font-size:{theme.typography.scale.body}px;
                border-radius:{theme.geometry.radius_card}px;overflow:hidden;
                box-shadow:{theme.shadow.card};">
    <thead>
      <tr style="background:{theme.palette.primary};color:{theme.palette.surface_alt};">
        <th style="padding:12px 16px;text-align:left;font-weight:{theme.typography.weights.bold};">维度</th>
        <th style="padding:12px 16px;text-align:left;font-weight:{theme.typography.weights.bold};">方案 A</th>
        <th style="padding:12px 16px;text-align:left;font-weight:{theme.typography.weights.bold};">方案 B</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background:{theme.palette.surface_alt};">
        <td style="padding:12px 16px;color:{theme.palette.mute};border-bottom:{theme.geometry.stroke_hairline}px solid {theme.palette.mute}33;">性能</td>
        <td style="padding:12px 16px;border-bottom:{theme.geometry.stroke_hairline}px solid {theme.palette.mute}33;"><strong style="color:{theme.palette.accent};">2.1× 提升</strong></td>
        <td style="padding:12px 16px;border-bottom:{theme.geometry.stroke_hairline}px solid {theme.palette.mute}33;">baseline</td>
      </tr>
      <tr style="background:{theme.palette.surface};">
        <td style="padding:12px 16px;color:{theme.palette.mute};">成本</td>
        <td style="padding:12px 16px;">$120/月</td>
        <td style="padding:12px 16px;">$45/月</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size:{theme.typography.scale.caption}px;color:{theme.palette.mute};margin-top:12px;">图 N · {一句话脱离正文也能看懂}</div>
</div>
</body></html>
```

要点：仅在"赢的一边"用 accent 色加粗，输的一边或基线用 mute。**禁止两列都用 accent 高亮**——这等于没高亮。

---

## 模板 3 · HTML 卡片组（3-4 列均衡布局）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;background:{theme.palette.surface};">
<div style="width:640px;padding:32px;background:{theme.palette.surface};
            font-family:{theme.typography.body_family};color:{theme.palette.ink};
            box-sizing:border-box;">
  <div style="font-family:{theme.typography.heading_family};
              font-size:{theme.typography.scale.section}px;
              font-weight:{theme.typography.weights.bold};
              margin-bottom:16px;">{图标题}</div>
  <div style="display:flex;gap:16px;">

    <div style="flex:1;background:{theme.palette.surface_alt};
                border-radius:{theme.geometry.radius_card}px;
                padding:20px;
                box-shadow:{theme.shadow.card};
                border-top:3px solid {theme.palette.primary};">
      <div style="font-size:{theme.typography.scale.section}px;
                  font-weight:{theme.typography.weights.bold};
                  color:{theme.palette.ink};margin-bottom:8px;">卡片 1</div>
      <div style="font-size:{theme.typography.scale.body}px;
                  color:{theme.palette.mute};line-height:1.7;">描述文字。</div>
    </div>

    <div style="flex:1;background:{theme.palette.surface_alt};
                border-radius:{theme.geometry.radius_card}px;
                padding:20px;
                box-shadow:{theme.shadow.emphasis};
                border-top:3px solid {theme.palette.accent};">
      <div style="font-size:{theme.typography.scale.section}px;
                  font-weight:{theme.typography.weights.bold};
                  color:{theme.palette.accent};margin-bottom:8px;">卡片 2（重点）</div>
      <div style="font-size:{theme.typography.scale.body}px;
                  color:{theme.palette.ink};line-height:1.7;">描述文字。</div>
    </div>

    <div style="flex:1;background:{theme.palette.surface_alt};
                border-radius:{theme.geometry.radius_card}px;
                padding:20px;
                box-shadow:{theme.shadow.card};
                border-top:3px solid {theme.palette.primary};">
      <div style="font-size:{theme.typography.scale.section}px;
                  font-weight:{theme.typography.weights.bold};
                  color:{theme.palette.ink};margin-bottom:8px;">卡片 3</div>
      <div style="font-size:{theme.typography.scale.body}px;
                  color:{theme.palette.mute};line-height:1.7;">描述文字。</div>
    </div>

  </div>
  <div style="font-size:{theme.typography.scale.caption}px;color:{theme.palette.mute};margin-top:12px;">图 N · 脱离正文也能看懂</div>
</div>
</body></html>
```

---

## 模板 4 · HTML 时间线（垂直）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;background:{theme.palette.surface};">
<div style="width:640px;padding:32px;background:{theme.palette.surface};
            font-family:{theme.typography.body_family};color:{theme.palette.ink};
            box-sizing:border-box;">
  <div style="font-family:{theme.typography.heading_family};
              font-size:{theme.typography.scale.section}px;
              font-weight:{theme.typography.weights.bold};
              margin-bottom:20px;">{时间线标题}</div>
  <div style="position:relative;padding-left:32px;">
    <div style="position:absolute;left:8px;top:6px;bottom:6px;
                width:{theme.geometry.stroke_width}px;
                background:{theme.palette.primary};"></div>

    <div style="position:relative;margin-bottom:20px;">
      <div style="position:absolute;left:-32px;top:4px;width:18px;height:18px;
                  background:{theme.palette.accent};
                  border-radius:50%;
                  box-shadow:0 0 0 3px {theme.palette.surface};"></div>
      <div style="font-weight:{theme.typography.weights.bold};
                  color:{theme.palette.accent};
                  font-size:{theme.typography.scale.body}px;">2024 · Q1</div>
      <div style="color:{theme.palette.ink};font-size:{theme.typography.scale.body}px;
                  margin-top:4px;line-height:1.6;">事件描述</div>
    </div>

    <!-- 重复节点 -->
  </div>
</div>
</body></html>
```

---

## 模板 5 · HTML 数字卡片（key-number / 强单数）

适用于趋势文章里抓眼的"40%、3 倍、127 篇"等单数突出。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;background:{theme.palette.surface};">
<div style="width:640px;padding:48px 32px;background:{theme.palette.surface};
            font-family:{theme.typography.body_family};color:{theme.palette.ink};
            box-sizing:border-box;text-align:center;">
  <div style="font-size:{theme.typography.scale.caption}px;
              color:{theme.palette.mute};letter-spacing:2px;
              text-transform:uppercase;margin-bottom:8px;">{超小帽子文字 · 可省}</div>
  <div style="font-family:{theme.typography.heading_family};
              font-size:96px;line-height:1;
              font-weight:{theme.typography.weights.bold};
              color:{theme.palette.accent};margin:8px 0;">40<span style="font-size:48px;">%</span></div>
  <div style="font-size:{theme.typography.scale.section}px;
              color:{theme.palette.ink};
              max-width:480px;margin:8px auto 0;line-height:1.5;">{一句话解释这个数字代表什么}</div>
</div>
</body></html>
```

---

## 模板 6 · HTML 平台封面

横版（公众号 / 知乎 / 掘金，2.35:1 · 900×383）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;">
<div style="width:900px;height:383px;
            background:{theme.palette.surface};
            font-family:{theme.typography.body_family};
            color:{theme.palette.ink};
            box-sizing:border-box;
            padding:48px 56px;
            display:flex;flex-direction:column;justify-content:center;
            border-left:6px solid {theme.palette.accent};">
  <div style="font-size:{theme.typography.scale.caption}px;
              color:{theme.palette.mute};letter-spacing:3px;
              text-transform:uppercase;margin-bottom:16px;">{栏目英文/系列名}</div>
  <div style="font-family:{theme.typography.heading_family};
              font-size:48px;line-height:1.2;
              font-weight:{theme.typography.weights.bold};
              color:{theme.palette.ink};max-width:720px;">{≤22 字标题}</div>
  <div style="font-size:18px;color:{theme.palette.mute};
              margin-top:16px;max-width:720px;line-height:1.5;">{≤30 字副标题}</div>
</div>
</body></html>
```

竖版（小红书 3:4 · 750×1000）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;">
<div style="width:750px;height:1000px;padding:64px 56px;
            background:{theme.palette.surface};
            font-family:{theme.typography.body_family};
            color:{theme.palette.ink};
            box-sizing:border-box;
            display:flex;flex-direction:column;justify-content:flex-end;">
  <div style="width:64px;height:6px;background:{theme.palette.accent};margin-bottom:24px;"></div>
  <div style="font-family:{theme.typography.heading_family};
              font-size:72px;font-weight:{theme.typography.weights.bold};
              line-height:1.15;color:{theme.palette.ink};">{≤20 字封面金句}</div>
  <div style="font-size:24px;color:{theme.palette.mute};
              margin-top:24px;line-height:1.5;">{副标题 · 一行}</div>
</div>
</body></html>
```

封面禁忌：

- 不要塞 ≥3 句话；不要"前后呼应"放两句标题
- 不要用 emoji 替代图形元素
- 不要纯渐变背景；如必须渐变，stops ≤ 2 且同色相

---

## 纯 SVG · 仅用于这两类

### A · 数据图（柱状 / 折线 / 雷达 / 热力）

```svg
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .axis  { stroke: {theme.palette.mute}; stroke-width: {theme.geometry.stroke_hairline}; }
      .tick  { font-family: {theme.typography.body_family}; font-size: {theme.typography.scale.caption}px; fill: {theme.palette.mute}; }
      .bar   { fill: {theme.palette.primary}; }
      .bar.h { fill: {theme.palette.accent}; }
      .label { font-family: {theme.typography.body_family}; font-size: {theme.typography.scale.caption}px; fill: {theme.palette.ink}; text-anchor: middle; }
      .title { font-family: {theme.typography.heading_family}; font-size: {theme.typography.scale.section}px; font-weight: {theme.typography.weights.bold}; fill: {theme.palette.ink}; }
    </style>
  </defs>
  <text class="title" x="40" y="32">{图标题}</text>
  <!-- 轴 -->
  <line class="axis" x1="60" y1="280" x2="600" y2="280"/>
  <line class="axis" x1="60" y1="80"  x2="60"  y2="280"/>
  <!-- 柱 · 高亮项用 .bar.h -->
  <rect class="bar"   x="100" y="180" width="60" height="100"/>
  <rect class="bar h" x="200" y="120" width="60" height="160"/>
  <rect class="bar"   x="300" y="200" width="60" height="80"/>
  <!-- 数值标签 -->
  <text class="label" x="130" y="170">12</text>
  <text class="label" x="230" y="110">28</text>
  <text class="label" x="330" y="190">8</text>
  <!-- 类目 -->
  <text class="label" x="130" y="300">A</text>
  <text class="label" x="230" y="300">B</text>
  <text class="label" x="330" y="300">C</text>
</svg>
```

要点：

- 仅一项用 accent 色（"主角"），其它用 primary
- 数值贴柱顶，不写"单位（万）"等多余文字
- 网格线如必要用 mute@30% alpha；多数情况省

### B · 网络 / 拓扑（节点 ≥ 8 且有大量斜向连线）

```svg
<svg viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="{theme.geometry.arrow_size}" markerHeight="{theme.geometry.arrow_size}"
            orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="{theme.arrow.head_fill}"/>
    </marker>
    <style>
      .node  { fill: {theme.palette.surface_alt}; stroke: {theme.palette.primary}; stroke-width: {theme.geometry.stroke_width}; }
      .node.h{ fill: {theme.palette.accent}; stroke: {theme.palette.accent}; }
      .label { font-family: {theme.typography.body_family}; font-size: {theme.typography.scale.body}px; fill: {theme.palette.ink}; text-anchor: middle; }
      .label.h { fill: {theme.palette.surface_alt}; }
      .edge  { stroke: {theme.arrow.stroke}; stroke-width: {theme.geometry.stroke_width}; fill: none; }
    </style>
  </defs>
  <!-- 节点（按布局算法或手放） -->
  <rect class="node" x="60"  y="80"  width="120" height="40" rx="{theme.geometry.radius_node}"/>
  <text class="label" x="120" y="105">服务 A</text>
  <!-- ... -->
  <!-- 边 -->
  <path class="edge" d="M 180 100 Q 280 100 380 220" marker-end="url(#arr)"/>
</svg>
```

---

## 质量自检清单（每张图渲染前自查）

| # | 检查项 | 失败处理 |
|---|---|---|
| 1 | 主题 token 是否全部 patch（不再留 `{theme.xxx}`）？ | 重新 patch；禁止把 token 名字写进 PNG |
| 2 | 色种 ≤ 5？字号 ≤ 4 种？字族 ≤ 2？圆角与描边宽度各 ≤ 2 种？ | 合并到主题 token |
| 3 | accent 色是否只用于"一处"焦点？ | 多于一处则改回 primary |
| 4 | 是否有 emoji 节点 / 系统默认字体 / 彩虹色？ | 删除 / 替换 |
| 5 | 文字最小字号 ≥ 11（小红书 ≥ 14）？ | 调大 |
| 6 | 同一文章已有图主题与本图一致？ | 切换为已有主题 |
| 7 | 是否符合主题 notes.ban / notes.prefer？ | 调整 |

---

## fig2img 调用（强制 · 写完源就跑）

写完一批 HTML / SVG 源后立刻跑，**不允许把转换推到下一阶段**：

```bash
python .claude/scripts/fig2img.py \
  content/articles/{slug}/intermediate/04b-figure/{platform}/ \
  --width 1280 \
  --format png
```

可选参数：

- `--format jpg --quality 88` —— 小红书 / 公众号封面体积敏感时用
- `--width 1500` —— 知乎 / 掘金正文最大宽度推荐

**强制验证**：

```bash
ls content/articles/{slug}/intermediate/04b-figure/{platform}/*.png 2>/dev/null | wc -l
```

期望数 = 该平台 `.svg` + `.html` 源文件数。少于则定位失败源并重跑（fig2img 内有 cairosvg → inkscape → chromium → playwright 多重回退；单文件失败 stderr 报错但不中止全批）。

退出码：

- `0` 全部成功
- `1` 部分失败 → illustrator 打印失败清单并将对应条目在 `figure-index.md` 标注 `image: pending-render`
- `2` 目录不存在或无源 → 重新写源

文生图 `.md` 不参与转换，对应 `image: pending-user`。
