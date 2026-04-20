# 容器扩展语法

基于 [markdown-it-container](https://github.com/markdown-it/markdown-it-container) 扩展。
每种容器是公众号高频视觉元素，避免作者手写 HTML。

## 通用语法

```
::: name 标题文字 key=value key2="带空格的值"
任意 Markdown 正文
:::
```

- **标题**：`name` 之后的首段空格分隔串（不含 `key=value`）会被当作 `info.title`，各容器按需使用（`author` 当作者名、`tip/warning/...` 当醒目标题、`intro/cover` 当标题行）
- **键值对**：`key=value` 或 `key="v with space"`，在 open 行内声明；渲染器从 `ctx.attrs.key` 读取
- **正文**：两行 fence 之间的内容仍是完整 Markdown（含列表、图片、强调、行内扩展等）

> 常见错误：把键值对写在正文行（YAML 风格）。解析器**只**看 open 行的 `key=value`；正文里的 `name: X` 会作为普通段落渲染。

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

::: author 张三 role=主笔
发表于 2026-04-18

一句简短的作者话
:::

::: cover 本期封面
![封面图](https://placehold.co/1200x630)

_一句描述_
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
::: divider variant=flower
:::
```

`variant` 可选 `wave` / `dots` / `flower` / `line`（默认 `line`）。
视觉 SVG 来自 `theme.assets.dividerWave/Dots/Flower`，主题未提供时回退到内置简版。

```
::: section-title 第一章
章节大标题，带装饰 SVG
:::
```

## 文末引导类

```
::: footer-cta 觉得有用？ cta=关注我
一句引导文案
:::

::: recommend 推荐阅读
- [文章 A](https://...)
- [文章 B](https://...)
:::

::: qrcode 扫码关注
![二维码](https://...)
:::
```

## 媒体类

```
::: mpvoice 标题占位
微信 <mpvoice> 只能在公众号后台从素材库插入，粘贴富文本无法保留；此容器渲染为占位提示卡。
:::

::: mpvideo vid=wxv_xxx
官方视频同上；`vid=` 参数仅作提示。
:::

::: mpvideo qqvid=v326875u4ek
腾讯视频：直接渲染 v.qq.com iframe。
:::
```

## 内联扩展

- `==高亮文字==` → 荧光笔样式（markdown-it-mark）
- `~~删除线~~` → GFM 原生
- `++插入++` → markdown-it-ins
- `[.着重.]` → 自定义着重号
- `[~波浪~]` → 自定义波浪下划线
