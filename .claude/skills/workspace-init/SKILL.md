---
name: workspace-init
description: >
  工作区初始化 / 框架升级 — 创建 content / profiles / runtime 目录骨架，或从远程同步框架代码。
  触发词："初始化工作区"、"新建工作区"、"升级框架"、"sync inkflow"。
argument-hint: "[目标目录路径 或 GitHub 仓库 URL]"
allowed-tools: Read, Write, Glob, Bash, AskUserQuestion
---

# 工作区初始化与升级

> **职责分工**:
> - `framework/tools/bootstrap.sh` — 从远程 GitHub 仓库拉取/同步框架文件（agents、skills、rules、tools）
> - 本 skill — 初始化项目目录结构（content/articles/、content/retrospectives/、content/references/）、生成配置文件（framework/config/inkflow.yaml、.gitignore）、git init

支持两种操作：**初始化**（创建新工作区）和**升级**（更新已有工作区的框架文件）。
另有**引导部署**作为空目录场景的兜底分支。

> **框架目录 vs 内容工作区**:
> - 框架目录（`workspace_mode: framework`）：开发 InkFlow 本身，content/articles/ 被 gitignore
> - 内容工作区（`workspace_mode: content`）：创作内容，content/articles/ 纳入版本管理

## 模式判断（先做这一步）

读取当前目录的 `framework/config/inkflow.yaml`：

| workspace_mode | 用户意图信号 | 转入流程 |
|----------------|-------------|---------|
| `framework` | "初始化"、"创建" | [`references/init-flow.md`](references/init-flow.md) |
| `content` | "更新"、"升级"、"sync" | [`references/upgrade-flow.md`](references/upgrade-flow.md) |
| `content` | "初始化" | 提示已在内容工作区中，问是否要升级 |
| 不存在 | "部署"、"安装"、仓库 URL | [`references/bootstrap-flow.md`](references/bootstrap-flow.md) |
| 不存在 | 其他 | 提示先运行 `bash framework/tools/bootstrap.sh` |

按表格选定流程后，**Read 对应 references/<flow>.md** 执行；不要在主 SKILL.md 里展开。

## 用户内容层（永不覆盖）

```
content/articles/
content/references/
content/retrospectives/
profiles/                   # 用户 Profile 包（升级不覆盖用户自建 id）
runtime/pipeline-states/
runtime/profile-lock.yaml
runtime/profile-resolved/
.claude/settings.local.json
```

## 全局约束

- 升级流程**永不覆盖**用户内容层文件
- 初始化流程目标目录必须不存在或为空
- 框架文件的拉取/同步统一由 `framework/tools/bootstrap.sh` 负责
- 项目结构初始化和配置生成由本 skill 负责

## 子流程速查

| 文件 | 何时读 |
|---|---|
| [`references/init-flow.md`](references/init-flow.md) | 首次创建内容工作区（Step 1-7） |
| [`references/upgrade-flow.md`](references/upgrade-flow.md) | 已存在内容工作区，更新框架文件 |
| [`references/bootstrap-flow.md`](references/bootstrap-flow.md) | 空目录 + 用户给出仓库 URL，引导部署后转入 init |
