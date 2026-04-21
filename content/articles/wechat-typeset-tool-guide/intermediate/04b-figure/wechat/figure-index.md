# 配图: 微信公众号排版神器 wechat-typeset · wechat

---

## 图 1: 金句卡（SVG → PNG）

> "排版不是内容，却吃掉你 30% 的创作时间。" — Section 1 核心论点，深色背景金句卡，大字号居中，配蓝色装饰线。

source: fig-01.svg
image: fig-01.png
section: Section 1（痛点开篇）
format: SVG → PNG

<svg viewBox="0 0 640 320" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .bg { fill: #1a1a2e; }
      .accent-line { stroke: #4f9cf9; stroke-width: 3; stroke-linecap: round; }
      .main-text { font-family: "Microsoft YaHei","PingFang SC",sans-serif; font-size: 28px; font-weight: 700; fill: #fefefe; text-anchor: middle; }
      .sub-text { font-family: "Microsoft YaHei","PingFang SC",sans-serif; font-size: 16px; font-weight: 400; fill: #8aa3c8; text-anchor: middle; }
      .quote-mark { font-family: "Microsoft YaHei","PingFang SC",sans-serif; font-size: 72px; font-weight: 900; fill: #4f9cf9; opacity: 0.25; }
    </style>
  </defs>
  <rect class="bg" width="640" height="320" rx="0"/>
  <line class="accent-line" x1="60" y1="80" x2="60" y2="240"/>
  <line class="accent-line" x1="580" y1="80" x2="580" y2="240"/>
  <text class="quote-mark" x="90" y="150">"</text>
  <text class="main-text" x="320" y="138">排版不是内容，</text>
  <text class="main-text" x="320" y="180">却吃掉你 30% 的创作时间。</text>
  <line x1="260" y1="208" x2="380" y2="208" stroke="#4f9cf9" stroke-width="1.5" opacity="0.6"/>
  <text class="sub-text" x="320" y="238">wechat-typeset · 一键解决排版问题</text>
</svg>

---

## 图 2: 三步流程卡（SVG → PNG）

> AI 生成专属主题的全流程：描述风格 → AI 生成 → 一键使用。面向非技术读者，图标 + 文字，三卡并排箭头连接。

source: fig-02.svg
image: fig-02.png
section: Section 2（AI 生成主题）
format: SVG → PNG

---

## 图 3: 主题视觉对比图（SVG → PNG）

> 同一段文字在"科技极客"（深色终端风）和"生活美学"（暖色手账风）两套主题下的视觉效果对比，左右并排，中间 VS 标志，底部说明气质差异。

source: fig-03.svg
image: fig-03.png
section: Section 3（9 种文章人格）
format: SVG → PNG

---

## 图 4: 竞品简对比表（HTML → PNG）

> 4 款公众号排版工具 × 3 个维度（定位 / 收费 / AI 能力）对比表，wechat-typeset 行蓝色高亮 + "推荐"标签，底部注脚说明本地启动前提。

source: fig-04.html
image: fig-04.png
section: Section 5（三步上手 + 竞品对比）
format: HTML → PNG
