# illustrator / 模板库

> illustrator 主文件按需读取本文件。不在每次调用时默认加载。

## SVG 画布规范

- `viewBox="0 0 640 {height}"`，height 按内容弹性（流程图 320–480，数据图 360–480）
- 不写固定 `width` / `height` 属性
- 自由使用 `<defs>`、`<marker>`、`<linearGradient>`、`id`、`class`、`<style>` 块等完整 SVG 特性（产物会转 PNG）

### 字号（视觉质量下限）

- 正文/数据标签 ≥ 14px；节标题 ≥ 16px；主标题 ≥ 18px
- font-family 统一 `"Microsoft YaHei", "PingFang SC", sans-serif`
- font-weight ≥ 400
- 单张图字号种类 ≤ 4 种

### 颜色

- 优先 `runtime/profile-resolved/typesetting.yaml.palette` 字段（若当前 Profile 声明）；缺失时用默认 `#2d2d2d` / `#555555` / `#f0f0f0`
- 禁止 emoji 节点

### 连线/箭头示例

```svg
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#2d2d2d"/>
    </marker>
    <style>
      .node { fill: #f0f0f0; stroke: #2d2d2d; stroke-width: 1.5; rx: 6; }
      .label { font-family: "Microsoft YaHei","PingFang SC",sans-serif;
               font-size: 14px; fill: #2d2d2d; text-anchor: middle; }
    </style>
  </defs>
  <line x1="160" y1="100" x2="300" y2="100"
        stroke="#2d2d2d" stroke-width="1.5"
        marker-end="url(#arrow)"/>
</svg>
```

## HTML/CSS 画布规范

- 外层 `<div>` 固定宽度 640px（wechat/zhihu/juejin）或 750px（xiaohongshu 竖版 × 3:4）
- 背景 `#ffffff` 或品牌浅色，内边距 24px
- 完整 CSS 可用（flex/grid/position/box-shadow/border-radius/transition）
- 字体 `"Microsoft YaHei", "PingFang SC", sans-serif`
- 以完整 HTML 保存（`<!DOCTYPE>` + meta charset=utf-8），保证 headless 渲染字体

### 对比表模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;">
<div style="width:640px;padding:24px;background:#ffffff;font-family:'Microsoft YaHei','PingFang SC',sans-serif;box-sizing:border-box;">
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <thead>
      <tr style="background:#2d2d2d;color:#ffffff;">
        <th style="padding:12px 16px;text-align:left;font-weight:600;border-radius:6px 0 0 0;">维度</th>
        <th style="padding:12px 16px;text-align:left;font-weight:600;">方案 A</th>
        <th style="padding:12px 16px;text-align:left;font-weight:600;border-radius:0 6px 0 0;">方案 B</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background:#ffffff;">
        <td style="padding:10px 16px;border-bottom:1px solid #e8e8e8;color:#555;">性能</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e8e8e8;">...</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e8e8e8;">...</td>
      </tr>
      <tr style="background:#f9f9f9;">
        <td style="padding:10px 16px;border-bottom:1px solid #e8e8e8;color:#555;">成本</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e8e8e8;">...</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e8e8e8;">...</td>
      </tr>
    </tbody>
  </table>
</div>
</body></html>
```

### 卡片组模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;">
<div style="width:640px;padding:24px;background:#f5f5f5;font-family:'Microsoft YaHei','PingFang SC',sans-serif;box-sizing:border-box;display:flex;gap:16px;">
  <div style="flex:1;background:#ffffff;border-radius:8px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="font-size:16px;font-weight:600;color:#2d2d2d;margin-bottom:8px;">标题</div>
    <div style="font-size:14px;color:#555;line-height:1.6;">描述文字，支持多行自动换行，无需手动处理。</div>
  </div>
  <!-- 重复卡片 -->
</div>
</body></html>
```

### 小红书封面模板（竖版 3:4）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;">
<div style="width:750px;height:1000px;padding:48px;background:linear-gradient(135deg,#ff6b6b,#ffa94d);font-family:'Microsoft YaHei','PingFang SC',sans-serif;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;">
  <div style="font-size:72px;font-weight:900;color:#ffffff;line-height:1.2;margin-bottom:24px;">
    {≤20 字封面金句}
  </div>
  <div style="font-size:28px;color:#ffffff;opacity:0.9;">
    {副标题 · 一行}
  </div>
</div>
</body></html>
```

## 文生图提示词模板

用于真实感图像（人物/场景/照片）。输出 `fig-NN.md`：

```markdown
## 配图建议：{图片用途一句话描述}

**建议位置**：{插入正文哪个段落之后}

**为何需要真实图片**：{SVG/HTML 无法胜任的原因}

**文生图提示词（Midjourney / DALL-E / Stable Diffusion）**：

```
{英文提示词，150 词以内，描述视觉元素而非抽象概念}
Style: flat design illustration, no text overlay, clean background,
professional tech aesthetic, 3:2 ratio.
Negative prompt: realistic photograph, human faces close-up,
cluttered background, neon colors, text in image.
```

**配图规格建议**：
- 宽高比：3:2（首图）或 16:9（文章内图）或 3:4（小红书封面）
- 最小尺寸：900×600px / 900×1200px
- 风格：{按栏目 tone 描述}

**手动插入步骤**：生成 → 裁剪至建议比例 → 导出 JPG（≤1MB）→ 插入指定位置
```

## fig2img 调用

所有 SVG / HTML 源文件写完后统一调用：

```bash
python .claude/scripts/fig2img.py \
  content/articles/{slug}/intermediate/04b-figure/{platform}/ \
  --width 1280
```

行为：cairosvg → inkscape → chromium headless（SVG）；playwright → chromium（HTML）。产物比源新则跳过；单个失败打 stderr 不中断。文生图 `.md` 不参与转换。
