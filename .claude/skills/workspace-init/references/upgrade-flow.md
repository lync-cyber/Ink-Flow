# 升级流程（更新已有工作区的框架文件）

> 本文件为 workspace-init skill 的 progressive-disclosure 子文档；主 SKILL.md 在
> 模式判定为"升级"时按需 Read 本文。前置条件：当前目录处于 `workspace_mode: content`。

## Step 1 — 读取升级源

从当前 `framework/config/inkflow.yaml` 读取 `inkflow_source` 和 `inkflow_version`。
若 `inkflow_source` 不存在，用 AskUserQuestion 询问仓库 URL。

## Step 2 — 调用 bootstrap.sh 同步框架文件

```bash
bash framework/tools/bootstrap.sh . {inkflow_source}
```

bootstrap.sh 自动检测到 `workspace_mode: content`，进入升级模式，同步框架文件并更新版本号。

## Step 3 — 提交变更

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

## 不破坏的承诺

- 永不覆盖用户内容层文件（content/articles/、content/styles/*/style-profile.md、
  content/retrospectives/ops-metrics.csv 等）
- 永不动 .claude/settings.local.json
- runtime/pipeline-states/ 仅同步 .gitkeep 占位
