# 容器扩展语法

> Step 1 已注册容器解析；完整渲染器与视觉样式在 Step 4/5/6 接入。
> 此处记录语法规范与嵌套规则，供作者提前写作。

基于 [markdown-it-container](https://github.com/markdown-it/markdown-it-container) 扩展。
每种容器是公众号高频视觉元素，避免作者手写 HTML。

## 嵌套规则

不同长度的冒号标记区分嵌套层级——**外层严格多于内层**即可。
常用：外 4 内 3。

```
:::: compare
::: pros 优点
- ...
:::
::: cons 缺点
- ...
:::
::::
```

## 内容结构类

```
::: intro
文章导语，独立视觉样式（浅色背景 + 左侧色条 + 小字号）
:::

::: author
name: 张三
avatar: https://...
date: 2026-04-18
tags: 技术, 前端
:::

::: cover
src: https://...
caption: 图片题注
:::
```

## 强调与提示类

```
::: tip 小贴士
提示内容
:::

::: warning 注意
风险提示
:::

::: info 补充
补充说明
:::

::: danger 警告
严重警告
:::
```

## 金句与引用类

```
::: quote-card
这是一句金句，大字号居中展示，带装饰引号
—— 作者
:::

::: highlight
重点段落，整段高亮背景
:::
```

## 对比与列表类

```
:::: compare
::: pros 优点
- 优点 1
- 优点 2
:::
::: cons 缺点
- 缺点 1
- 缺点 2
:::
::::

::: steps
1. 第一步
2. 第二步
3. 第三步
:::
```

## 章节装饰类

```
::: divider flower
:::

（variant：flower / wave / dots / line）

::: section-title 第一章
章节大标题，带装饰 SVG
:::
```

## 文末引导类

```
::: footer-cta
关注公众号，获取更多内容
:::

::: recommend
- title: 往期推荐 1
  url: https://...
  cover: https://...
:::

::: qrcode
src: https://...
text: 扫码关注
:::
```

## 媒体类

```
::: mpvoice
name: 音频标题
note: 请在公众号后台从素材库插入
:::
（渲染为占位卡 + 提示；微信 <mpvoice> 只能后台插入）

::: mpvideo
vid: wxv_xxx         # 官方视频占位 + 提示
qqvid: v326875u4ek   # 可选：腾讯视频，直接渲染 iframe
:::
```

## 内联扩展

- `==高亮文字==` → 荧光笔样式（markdown-it-mark）
- `~~删除线~~` → GFM 原生
- `++插入++` → markdown-it-ins
- `[.着重.]` → 自定义着重号（Step 4）
- `[~波浪~]` → 自定义波浪下划线（Step 4）
