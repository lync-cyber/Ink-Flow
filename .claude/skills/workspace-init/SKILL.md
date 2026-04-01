---
name: workspace-init
description: >
  工作区初始化与升级 — 初始化项目目录结构和配置文件，或升级已有工作区的框架版本。
  触发条件："初始化工作区"、"创建内容项目"、"init workspace"、"新建工作区"、
  "更新 InkFlow"、"升级框架"、"update inkflow"、"sync framework"。
  当用户想创建新的内容工作区、或在已有工作区中升级 InkFlow 框架版本时，应触发此 skill。
argument-hint: "[目标目录路径 或 GitHub 仓库 URL]"
allowed-tools: Read, Write, Glob, Bash, AskUserQuestion
---

# 工作区初始化与升级

> **职责分工**:
> - `tools/bootstrap.sh` — 从远程 GitHub 仓库拉取/同步框架文件（agents、skills、rules、tools）
> - 本 skill — 初始化项目目录结构（articles/、retro/、references/）、生成配置文件（.inkflow.yaml、.gitignore）、git init

支持两种操作模式：**初始化**（创建新工作区）和**升级**（更新已有工作区的框架文件）。

> **框架目录 vs 内容工作区**:
> - 框架目录（`workspace_mode: framework`）：开发 InkFlow 本身，articles/ 被 gitignore
> - 内容工作区（`workspace_mode: content`）：创作内容，articles/ 纳入版本管理

---

## 模式判断

读取当前目录的 `.inkflow.yaml`：

| workspace_mode | 用户意图信号 | 动作 |
|----------------|-------------|------|
| `framework` | "初始化"、"创建" | → 初始化流程（从本地框架目录创建新工作区） |
| `content` | "更新"、"升级"、"sync" | → 升级流程（调用 bootstrap.sh 更新框架文件） |
| `content` | "初始化" | → 提示已在内容工作区中，问是否要升级 |
| 不存在 | "部署"、"安装"、仓库 URL | → 引导部署流程（先 bootstrap.sh 拉取，再初始化） |
| 不存在 | 其他 | → 提示先运行 `bash tools/bootstrap.sh` |

---

## 用户内容层（永不覆盖）

```
articles/
references/
retro/
styles/*/style-profile.md
styles/*/exemplar-*.md
.pipeline-states/
.claude/settings.local.json
```

---

## 初始化流程

### Step 1 — 确定来源和目标

```
AskUserQuestion:
  question: "InkFlow 框架来源？"
  options:
    - "当前目录" — 从本地框架目录复制（需在 framework 模式下）
    - "GitHub 仓库" — 从远程拉取（输入仓库 URL 或 owner/repo）
```

```
AskUserQuestion:
  question: "在哪个目录创建内容工作区？"
  options:
    - "指定路径" — 用户输入绝对路径
    - "当前目录的兄弟目录" — 自动命名为 ../inkflow-content/
```

确认目标目录不存在或为空。

### Step 2 — 拉取框架文件

调用 `tools/bootstrap.sh` 完成框架文件拉取：

**本地来源**（当前在 framework 目录）：
```bash
# 从本地框架目录复制
cp -r .claude/agents .claude/skills .claude/rules tools {target_dir}/
cp styles/default/columns.yaml styles/default/markdown-extensions.md {target_dir}/styles/default/
cp tools/CLAUDE.content.md {target_dir}/CLAUDE.md
```

**远程来源**：
```bash
bash tools/bootstrap.sh {target_dir} {repo_url}
```

### Step 3 — 创建用户内容目录

本 skill 的核心职责 — 创建项目结构：

```
articles/            ← .gitkeep
retro/               ← runs/.gitkeep
references/          ← articles/ + style-guides/ + templates/（各含 .gitkeep）
.pipeline-states/    ← .gitkeep
```

### Step 4 — 生成内容模式 .inkflow.yaml

修改 Step 2 拉取的 `.inkflow.yaml`：
- `workspace_mode: content`
- 追加 `inkflow_source`: GitHub 仓库 URL 或本地路径
- 追加 `inkflow_version`: 从源读取的版本号
- 其他配置（stages、defaults、exports 等）保持不变

### Step 5 — 生成内容模式 .gitignore

```gitignore
# 运行时状态（可重建）
.pipeline-states/
!.pipeline-states/.gitkeep

# 用户本地配置
.claude/settings.local.json

# Python
.venv/
__pycache__/
*.pyc

# 系统文件
.DS_Store
Thumbs.db

# 编辑器
*.swp
*.swo
*~
.vscode/
.idea/

# 日志
*.log
retro/runs/*.log.md
!retro/runs/.gitkeep
```

关键区别：**不忽略** `articles/`、`styles/*/style-profile.md`、`retro/ops-metrics.csv`。

### Step 6 — 初始化 git 仓库

```bash
cd {target_dir} && git init && git add -A && git commit -m "初始化 InkFlow 内容工作区"
```

### Step 7 — 确认

展示目录结构和配置摘要。

---

## 升级流程

在 `workspace_mode: content` 的工作区中执行。

### Step 1 — 读取升级源

从当前 `.inkflow.yaml` 读取 `inkflow_source` 和 `inkflow_version`。
若 `inkflow_source` 不存在，用 AskUserQuestion 询问仓库 URL。

### Step 2 — 调用 bootstrap.sh 同步框架文件

```bash
bash tools/bootstrap.sh . {inkflow_source}
```

bootstrap.sh 自动检测到 `workspace_mode: content`，进入升级模式，同步框架文件并更新版本号。

### Step 3 — 提交变更

```bash
git add -A && git diff --cached --stat  # 展示变更摘要
```

```
AskUserQuestion:
  question: "以下框架文件已更新："（附变更摘要）
  options:
    - "提交变更"
    - "取消升级" — git checkout .
```

---

## 引导部署流程

当 `.inkflow.yaml` 不存在时（空目录），用户提供了仓库 URL 或表达了部署意图：

### Step 1 — 确认仓库 URL

```
AskUserQuestion:
  question: "请提供 InkFlow 框架的 GitHub 仓库地址"
  options:
    - "输入仓库 URL 或 owner/repo"
    - "取消"
```

### Step 2 — 拉取框架文件

```bash
# 克隆仓库获取 bootstrap 脚本
git clone --depth 1 {repo_url} /tmp/inkflow-bootstrap
# 运行 bootstrap 拉取框架文件到当前目录
bash /tmp/inkflow-bootstrap/tools/bootstrap.sh "$(pwd)" {repo_url}
rm -rf /tmp/inkflow-bootstrap
```

### Step 3 — 执行初始化

框架文件已就位，继续执行初始化流程的 Step 3-7（创建目录结构、生成配置、git init）。

---

## 约束

- 升级流程**永不覆盖**用户内容层文件
- 初始化流程目标目录必须不存在或为空
- 框架文件的拉取/同步统一由 `tools/bootstrap.sh` 负责
- 项目结构初始化和配置生成由本 skill 负责
