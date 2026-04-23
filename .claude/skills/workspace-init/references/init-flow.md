# 初始化流程（创建新内容工作区）

> 本文件为 workspace-init skill 的 progressive-disclosure 子文档；主 SKILL.md 在模式判定为
> "初始化"时按需 Read 本文。

## Step 1 — 确定来源和目标

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

## Step 2 — 拉取框架文件

调用 `framework/tools/bootstrap.sh` 完成框架文件拉取：

**本地来源**（当前在 framework 目录）：
```bash
mkdir -p {target_dir}/config
cp -r .claude/agents .claude/skills .claude/rules tools {target_dir}/
cp .claude/settings.json {target_dir}/.claude/settings.json
cp framework/config/inkflow.yaml framework/config/columns.yaml framework/config/artifact-layout.yaml framework/config/markdown-extensions.md {target_dir}/config/
cp CLAUDE.md {target_dir}/CLAUDE.md
```

**远程来源**：
```bash
bash framework/tools/bootstrap.sh {target_dir} {repo_url}
```

## Step 3 — 创建用户内容目录

本 skill 的核心职责 — 创建项目结构：

```
content/articles/                     ← .gitkeep
content/retrospectives/                        ← runs/.gitkeep + study-reports/.gitkeep
content/references/                   ← content/articles/（抓取的外部文章落地处）
content/styles/default/               ← style-profile.md 模板（首次 style-learning profile 模式覆盖）
runtime/pipeline-states/    ← .gitkeep
```

`content/styles/default/style-profile.md` 的初始模板内容：

```markdown
# 风格 DNA: default

> 这是占位档案。运行"分析风格"或 style-learning profile 模式后会被填充。

## 句式模式
（待生成）

## 段落结构
（待生成）

## 视觉节奏
（待生成）
```

## Step 4 — 生成内容模式 framework/config/inkflow.yaml

修改 Step 2 拉取的 `framework/config/inkflow.yaml`：
- `workspace_mode: content`
- 追加 `inkflow_source`: GitHub 仓库 URL 或本地路径
- 追加 `inkflow_version`: 从 `git describe --tags --always` 获取的版本号（由 bootstrap.sh 写入）
- 其他配置（stages、defaults、exports 等）保持不变

## Step 5 — 生成内容模式 .gitignore

```gitignore
# 运行时状态（可重建）
runtime/pipeline-states/
!runtime/pipeline-states/.gitkeep

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
```

关键区别：**不忽略** `content/articles/`、`content/styles/*/style-profile.md`、`content/retrospectives/ops-metrics.csv`。

## Step 6 — 初始化 git 仓库

```bash
cd {target_dir} && git init && git add -A && git commit -m "初始化 InkFlow 内容工作区"
```

## Step 7 — 确认

展示目录结构和配置摘要。
