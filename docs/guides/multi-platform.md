# 多平台分发工作流

InkFlow 支持一次写作、多平台同步分发。从 outline 阶段起，每个平台独立产出，直至发布。

## 目录

- [配置目标平台](#配置目标平台)
- [平台分发差异对比](#平台分发差异对比)
- [多平台产物结构](#多平台产物结构)
- [平台扩展](#平台扩展)

---

## 配置目标平台

在 brief 中设置 `target_platforms` 字段：

```markdown
---
title: "Python 异步编程避坑指南"
target_platforms: [wechat, juejin, zhihu]
primary_platform: wechat
---
```

- `target_platforms`：本篇文章要分发的所有平台；outline 起每平台独立产出
- `primary_platform`：决定 research 深度基准，必须是 `target_platforms` 的成员

也可以在启动 pipeline 时直接告诉 Claude：

```
写一篇关于"Python 异步编程避坑指南"的文章，发到微信和掘金
```

---

## 平台分发差异对比

| 维度 | 微信（wechat） | 知乎（zhihu） | 掘金（juejin） | 小红书（xiaohongshu） |
|------|--------------|-------------|--------------|---------------------|
| 格式 | `:::` 容器 + 行内扩展 | 纯 GFM | 纯 GFM | 纯文本 ≤500 字 |
| 字数限制 | 1500-3500 | 最高 4000 | 最高 2500 | ≤500 |
| 代码块 | 支持 | 支持 | 重点展示 | 替换为截图建议 |
| 配图规格 | 16:9 封面（900×383px）| 任意 | 任意 | 3:4 竖版封面 |
| 叙事结构 | 栏目骨架 | 辩证结构 + SOTA 对比 | 代码优先 | 金句 + 干货清单 |
| 特有产物 | `08-teaser-120chars.md` | — | — | — |

---

## 多平台产物结构

以 `target_platforms: [wechat, juejin]` 为例：

```
content/articles/{slug}/
  intermediate/
    03-outline/
      wechat.md     ← 微信平台大纲（骨架偏向痛点叙事）
      juejin.md     ← 掘金平台大纲（骨架偏向代码优先）
    04a-draft/
      wechat/merged-draft.md
      juejin/merged-draft.md
    04b-figure/
      wechat/       ← 16:9 配图
      juejin/       ← 任意比例配图
  review/
    05-audit/wechat.md
    05-audit/juejin.md
    06-polish/wechat.md
    06-polish/juejin.md
  export/
    07-final/wechat.md
    07-final/juejin.md
    08-wechat-publish.md      ← 含 ::: 容器，给 wechat-typeset
    08-juejin-publish.md      ← 纯 GFM，直接投递掘金
    08-teaser-120chars.md     ← 仅 wechat，朋友圈分发用
```

---

## 平台扩展

新增一个平台只需三步，核心 agent 零改动：

**1. 新建平台 Profile**

```
profiles/platform-<name>/
  profile.yaml        # id: platform-<name>; extends: [base-generic-chinese]
  typesetting.yaml    # 容器语法、行内扩展、CSS 安全规则
  constraints.yaml    # 硬规则、字数范围、禁用词
```

**2. 在品牌 Profile 的 extends 链中加入**

```yaml
# profiles/my-brand/profile.yaml
extends:
  - base-generic-chinese@^1.0.0
  - platform-<name>@~1.0.0     # ← 加这行
```

**3. 可选：声明 Lint 规则开关**

在 `framework/config/platform-lint-rules.yaml` 添加 `<name>` 段，声明哪些 lint 规则在此平台生效。

完整流程见 [扩展指南](../contributing/extending.md)。
