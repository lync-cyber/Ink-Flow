# content/ — 你的创作资产

> 文章产物、外部参考、复盘记录。**纳入版本管理**——这是你的产出，跟着仓库走。

## 目录

| 子目录 | 用途 | 谁来写 |
|---|---|---|
| `articles/{slug}/` | 单篇文章的全部产物（brief / research / atoms / outline / draft / figure / audit / polish / export） | pipeline 各 agent 自动落盘 |
| `references/articles/` | 外部参考文章原文（profile extract sample 模式来源 / 主题对标素材） | 用户手动放入，或 profile skill 抓取后缓存 |
| `retrospectives/` | 复盘日志（runs/）+ 已闭环文章归档（archive/）+ 内容日历 | creation-reviewing / content-planning skill |

## 单篇文章目录骨架

```
content/articles/{slug}/
  intermediate/
    01-brief.md
    02-research-memo.md
    02-atoms/{type}.md × 9
    03-outline/{platform}.md
    04a-draft/{platform}/section-NN.md + merged-draft.md
    04b-figure/{platform}/fig-NN.{html,svg,md,png}
  review/
    05-audit/{platform}.md
    06-polish/{platform}.md
  export/
    07-final/{platform}.md
    08-{platform}-publish.md
    08-teaser-120chars.md   # 仅 wechat
```

完整产物路径模板见 `framework/config/artifact-layout.yaml`。

## 我想…

| 需求 | 看哪里 |
|---|---|
| 找正在写的文章 | `articles/{slug}/intermediate/01-brief.md` |
| 看最终交付物 | `articles/{slug}/export/08-*-publish.md` |
| 添加对标参考 | 把 `.md` 文件放到 `references/articles/` |
| 查复盘记录 | `retrospectives/runs/{slug}-{date}.md` |
| 查内容排期 | `retrospectives/content-calendar.md` |

## 注意

- ✅ **纳入 git**：你的劳动成果。
- ⚠️ 历史 brief 的 frontmatter 是 content-planning skill 推演频率的数据源——删 brief 等于删历史。
