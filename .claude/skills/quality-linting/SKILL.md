---
name: quality-linting
description: >
  格式 lint — 对指定文章运行 .claude/skills/quality-linting/scripts/lint.py，报告 error / warning。
  触发条件："跑一下 lint"、"检查格式"、"格式校验"、"lint {slug}"。
  由 publisher agent 在发布前自动调用；当用户想手工校验单篇文章排版/段落/SVG 是否合规时，
  也应触发此 skill。
argument-hint: "[文章 slug 或文件路径]"
allowed-tools: Read, Bash, Glob, AskUserQuestion
---

# 格式 Lint

对文章做确定性格式校验，基于 `.claude/skills/quality-linting/scripts/config.yaml` 规则 + `.claude/rules/data/*.yaml` 数据源。

## 执行流程

### 1. 确定目标

- 用户指定 slug → 对 `content/articles/{slug}/export/*.md` 做全量校验
- 用户指定文件路径 → 仅校验该文件
- 未指定 → AskUserQuestion 列出 `content/articles/*` 让用户选

### 2. 执行

```bash
python .claude/skills/quality-linting/scripts/lint.py {target_file_or_dir}
```

### 3. 报告

解析 lint 输出，按 error / warning 分级汇总：
- error 数 > 0 → 红灯，列出所有违规点（文件:行:规则）
- 仅 warning → 黄灯，列出可选修复项
- 全通过 → 绿灯

### 4. 修复建议（可选）

lint 不提供自动修复。安全可修项（如段落超长、CSS 白名单违规）列出定位信息后由用户手动修改；
涉及语义的修改（如禁用词替换）引导用户进入 style-learning 或手动改写。

## 规则来源

lint.py 的配置读取链：
- `.claude/skills/quality-linting/scripts/config.yaml` — 启用/严重级别控制
- `.claude/rules/data/forbidden-phrases.yaml` — 禁用词
- `.claude/rules/data/platform-limits.yaml` — CSS 禁用/可用属性
- `.claude/rules/data/platform-limits.yaml` — 段落/句子/SVG 字号阈值

修改规则只需改 `.claude/rules/data/*.yaml`，无需改 lint.py 或 config.yaml。
