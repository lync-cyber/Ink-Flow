# 快速开始：从安装到第一篇文章

本文带你从零完成第一篇微信公众号文章的完整创作流程，预计用时 **30-60 分钟**（含 AI 生成等待）。

## 目录

- [前置准备](#前置准备)
- [步骤 1：初始化工作区](#步骤-1初始化工作区)
- [步骤 2：绑定 Profile](#步骤-2绑定-profile)
- [步骤 3：启动 Pipeline](#步骤-3启动-pipeline)
- [步骤 4：三个检查点](#步骤-4三个检查点)
- [步骤 5：发布](#步骤-5发布)
- [下一步](#下一步)

---

## 前置准备

确认以下条件已满足（详见 [安装指南](installation.md)）：

- Claude Code 已安装，API Key 已配置
- InkFlow 框架已通过 bootstrap.sh 部署
- Python 环境有 PyYAML

---

## 步骤 1：初始化工作区

在 Claude Code 中说：

```
初始化工作区
```

skill `workspace-init` 会创建：

```
content/
  articles/       ← 文章产物存放处
  references/     ← 外部参考文章
  retrospectives/ ← 运营数据与复盘日志
runtime/          ← 运行时状态（自动管理）
```

---

## 步骤 2：绑定 Profile

Profile 是写作设定的"插件包"，决定语气、排版规则、字数范围等。先用内置示例：

```
/profile use lync-wechat-tech
```

绑定成功后，Claude 会显示已合成的四类 slot 摘要（principles / voice / typesetting / constraints）。

> **想用自己的写作风格？** 见 [Profile 使用指南](../guides/profile-guide.md)。

---

## 步骤 3：启动 Pipeline

直接告诉 Claude 你要写什么：

```
写一篇关于"Python 异步编程避坑指南"的文章
```

orchestrator 会自动创建 brief，然后依次调度各阶段 agent：

```
brief → research → atoms → outline [CP1] → draft ∥ figures → audit → polish [CP2] → publish [CP3]
```

你不需要手动推进，只需在三个检查点介入。

---

## 步骤 4：三个检查点

### CP1 · 大纲确认

pipeline 在 outline 阶段结束后暂停，展示各平台大纲供你审核：

- 检查：论点是否准确？章节顺序是否合理？有没有你知道但 AI 不知道的关键信息？
- 确认后：`继续` 或补充修改意见后 `继续`
- 如需重新生成：`重跑 outline`

### CP2 · 审校终稿

auditor 完成审校 + polisher 完成润色后暂停，展示修改清单和终稿：

- 检查：事实准确性、逻辑完整性、AI 味是否已消除
- 如有问题，告诉 Claude 具体哪里需要改

### CP3 · 发布确认

publisher 交付最终产物后暂停：

- 产物路径：`content/articles/{slug}/export/08-wechat-publish.md`
- 确认后 pipeline 完成

---

## 步骤 5：发布

**微信公众号（推荐）：**

1. 启动本地排版工具：

```bash
# 前提：wechat-typeset 已克隆到 Ink-Flow 同级目录
cd ../wechat-typeset && npm run dev
```

2. 浏览器打开 `http://127.0.0.1:7788`
3. 粘贴 `export/08-wechat-publish.md` 内容
4. 选择主题 → 一键复制富文本 → 粘贴到公众号后台

详细操作见 [wechat-typeset 对接指南](../guides/wechat-typeset.md)。

---

## 下一步

- 创建适合自己风格的 Profile → [Profile 使用指南](../guides/profile-guide.md)
- 同时分发到知乎 / 掘金 / 小红书 → [多平台工作流](../guides/multi-platform.md)
- 了解 pipeline 每个阶段的输入输出 → [Pipeline 详解](../guides/pipeline-guide.md)
