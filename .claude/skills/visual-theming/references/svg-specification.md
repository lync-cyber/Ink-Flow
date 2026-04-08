# SVG 生成规范

Illustrator agent 生成手写 SVG 时遵循的完整技术规范。Mermaid 图由渲染器自动处理，不受此约束。

---

## 画布规范

- 根元素: `<svg width="100%" viewBox="0 0 680 H" xmlns="http://www.w3.org/2000/svg" role="img">`
- 680 为固定画布宽度（适配 640px 移动端 + 安全边距），不可修改
- 安全绘图区: x 坐标在 40~640 范围内，y 坐标从 40 开始
- **H 计算**: 找到所有形状的最低边（max(y + height)），加 40px → viewBox 高度
- 无障碍: 每个 `<svg>` 必须包含 `role="img"` 属性，且前两个子元素为 `<title>{图表标题}</title>` 和 `<desc>{面向屏幕阅读器的一句话描述}</desc>`
- 内联样式: 所有样式通过 `style="..."` 属性设置（SVG 禁止项完整列表见 wechat-platform rule 的 SVG 约束段）

### ViewBox 自检清单（每张 SVG 完成后必查）

1. `max(y + height)` 找最低形状 → viewBox 高度 = 该值 + 40
2. 所有内容 x 坐标在 0~680 之间
3. `text-anchor="end"` 的文字向左延伸，检查 `anchor_x - 字符数 × 字符宽度 > 0`
4. 同行相邻盒子: `左盒(x + width) + 20 < 右盒 x`，否则重叠
5. 无负坐标

---

## 排版规则

仅使用两档字号，保持视觉一致:

| 用途 | font-size | font-weight | 说明 |
|------|-----------|-------------|------|
| 节点标题 | 14 | 500 | 盒子内主文字 |
| 副标题/标注/说明 | 12 | 400 | 辅助信息、引导线标注 |

- 禁止使用其他字号（不出现 10px、16px、20px 等）
- 禁止使用 600/700 字重（移动端屏幕字重 500 已足够清晰）
- font-family 使用 columns.yaml `typography.fontStack` 的值

---

## 文字测量参考

SVG `<text>` 不支持自动换行，必须在生成时预计算文字宽度：

| 字号 | 中文 | 英文 (400) | 英文 (500) |
|------|------|-----------|-----------|
| 14px | ~15px/字 | ~7.5px/字符 | ~8px/字符 |
| 12px | ~13px/字 | ~6.5px/字符 | ~7px/字符 |

**节点盒宽公式**: `box_width = max(标题文字总宽, 副标题文字总宽) + 24`（左右各 12px 内边距）

**多行文字处理**: 单行超过 8 个中文字符时，用 `<tspan>` 手动换行:
```xml
<text text-anchor="middle" dominant-baseline="central" x="200" y="30"
      style="font-size:14px;font-weight:500;">
  <tspan x="200" dy="0">第一行文字</tspan>
  <tspan x="200" dy="18">第二行文字</tspan>
</text>
```

---

## 图表布局规则

### 节点尺寸

| 类型 | 高度 | 说明 |
|------|------|------|
| 单行节点 | 44px | 仅标题 |
| 双行节点 | 56px | 标题 + 副标题 |

- 同类节点宽度保持一致
- 文字居中: `text-anchor="middle" dominant-baseline="central"`

**单行节点模板**:
```xml
<rect x="{x}" y="{y}" width="{w}" height="44" rx="4"
      style="fill:{background};stroke:{primary};stroke-width:0.5;"/>
<text x="{x+w/2}" y="{y+22}" text-anchor="middle" dominant-baseline="central"
      style="font-size:14px;font-weight:500;fill:{text};">{标题}</text>
```

**双行节点模板**:
```xml
<rect x="{x}" y="{y}" width="{w}" height="56" rx="8"
      style="fill:{background};stroke:{primary};stroke-width:0.5;"/>
<text x="{x+w/2}" y="{y+20}" text-anchor="middle" dominant-baseline="central"
      style="font-size:14px;font-weight:500;fill:{text};">{标题}</text>
<text x="{x+w/2}" y="{y+40}" text-anchor="middle" dominant-baseline="central"
      style="font-size:12px;font-weight:400;fill:{textSecondary};">{副标题}</text>
```

### 边框/圆角标准

- 描边统一 `stroke-width="0.5"`
- `rx="4"` 默认（普通节点）
- `rx="8"` 强调（重要节点/双行节点）
- `rx="20"` 外层容器（结构图最外层）

### 连接线规则

- 所有 `<path>` / `<line>` 连接线必须 `fill="none"`（SVG 默认 fill 为黑色，不设会产生填充）
- 描边: `stroke-width="0.5"`，颜色取 `border` 或 `textTertiary`
- **禁止穿越盒子**: 连线不可穿过非端点的节点，穿越时用 L 型路径绕行:
  ```xml
  <path d="M {x1} {y1} L {x1} {ymid} L {x2} {ymid} L {x2} {y2}"
        style="fill:none;stroke:{border};stroke-width:0.5;"/>
  ```
- 箭头与盒边留 10px 间隙
- **箭头实现**: 由于微信剥除 `id` 属性，不能使用 `<marker>` + `url(#arrow)`。改用内联三角形:
  ```xml
  <!-- 向下箭头示例（放在连线终点） -->
  <polygon points="{x-4},{y-8} {x+4},{y-8} {x},{y}"
           style="fill:{border};stroke:none;"/>
  ```

### 结构图嵌套规则

适用于架构图、系统分层图等包含嵌套关系的图表:

- 最多 **3 层**嵌套
- 外层容器: `rx="20"`, 使用 `background` 色填充, `primary` 色描边
- 中层容器: `rx="12"`, 使用 `backgroundDeep` 色填充
- 内层元素: `rx="4"`, 白色或最浅色填充
- 父子层必须使用不同颜色（同色则层级消失）
- 容器内边距 ≥ 20px
- 容器标签置于内部左上角

### 标注引导线

当图表需要注解说明时:

- 标注放在图形**右侧**（优先），用 0.5px 虚线（`stroke-dasharray="3,3"`）引导
- 标注使用 12px 字号，`textSecondary` 颜色
- 引导线起点加 2px 实心圆标记目标位置
- 标注文字与其他元素间距 ≥ 8px
- 避免左侧标注（`text-anchor="end"` 的文字向左延伸，易溢出 x=0）

```xml
<!-- 标注示例 -->
<line x1="{目标x}" y1="{目标y}" x2="460" y2="{标注y}"
      style="stroke:{textTertiary};stroke-width:0.5;stroke-dasharray:3,3;fill:none;"/>
<circle cx="{目标x}" cy="{目标y}" r="2" style="fill:{textSecondary};"/>
<text x="468" y="{标注y+4}"
      style="font-size:12px;font-weight:400;fill:{textSecondary};">{标注文字}</text>
```
