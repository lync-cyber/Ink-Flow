# 引导部署流程（空目录 + 用户提供仓库 URL）

> 本文件为 workspace-init skill 的 progressive-disclosure 子文档；主 SKILL.md 在
> 检测到 `framework/config/inkflow.yaml` 不存在且用户表达了部署意图时按需 Read 本文。

## Step 1 — 确认仓库 URL

```
AskUserQuestion:
  question: "请提供 InkFlow 框架的 GitHub 仓库地址"
  options:
    - "输入仓库 URL 或 owner/repo"
    - "取消"
```

## Step 2 — 拉取框架文件

```bash
# 克隆仓库获取 bootstrap 脚本
git clone --depth 1 {repo_url} /tmp/inkflow-bootstrap
# 运行 bootstrap 拉取框架文件到当前目录
bash /tmp/inkflow-bootstrap/tools/bootstrap.sh "$(pwd)" {repo_url}
rm -rf /tmp/inkflow-bootstrap
```

## Step 3 — 执行初始化

框架文件已就位，转入 [`init-flow.md`](init-flow.md) 的 Step 3-7：
创建目录结构 → 生成 inkflow.yaml / .gitignore → git init。
