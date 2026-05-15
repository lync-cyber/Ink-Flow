---
name: quality-linting
description: >
  格式 lint — 对文章跑 lint.py，报告 error / warning（容器 W1-W4 / CSS 安全 / 段落上限 / 图片宽度）。
  publisher agent 发布前自动调用；用户手动触发词："跑 lint"、"检查格式"、"lint {slug}"。
argument-hint: "[文章 slug 或文件路径]"
allowed-tools: Read, Bash, Glob, AskUserQuestion
---

# 格式 Lint

对文章做确定性格式校验，基于当前绑定 Profile 的合成快照 `runtime/profile-resolved/*` 作为规则数据源。

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
涉及语义的修改（如禁用词替换）引导用户进入 `profile` skill（调整当前 Profile 的 constraints.yaml）或手动改写。

## 规则来源

lint.py 的配置读取链：
- `.claude/skills/quality-linting/scripts/config.yaml` — 启用/严重级别控制（可选，缺省用 DEFAULT_CONFIG）
- `framework/config/platform-lint-rules.yaml` — 平台差异规则（通过 `--platform` 启用）
- `runtime/profile-resolved/constraints.yaml` — 禁用词、字数区间、栏目元数据
- `runtime/profile-resolved/typesetting.yaml` — CSS 禁用属性、段落/句子/SVG 阈值、`:::` 容器白名单 + variant 白名单
- `runtime/typeset-capabilities.json` — wechat-typeset variant id 运行时清单（由 `python framework/tools/_adapters/cli.py capabilities --cache` 生成，缺失时使用 Profile 的静态 variant 白名单）

修改规则只需编辑当前 Profile 的 slot 文件（`profiles/{id}/constraints.yaml` / `typesetting.yaml`）并重跑 `python framework/tools/profile_resolver.py`，无需改 lint.py。

## 容器合法性（wechat 专用）

`--platform wechat` 启用 `rule_container_whitelist`（W1-W4）：

- **W1** 容器 id 必须在当前 Profile 的 `typesetting.containers.whitelist` 内
- **W2** `variant=X` 必须在 `runtime/typeset-capabilities.json`（或 Profile `typesetting.containers.variants`）对应 kind 的合法列表内
- **W3** Profile `typesetting.containers.mustNest` 指定的嵌套关系必须满足
- **W4** 容器开合冒号数必须配对，无孤立闭合行或未闭合容器

Profile 声明了 `containers.whitelist` 的平台启用 W1-W4；其他平台（白名单为空）的 `:::` 行由 `forbidden_blocks` 规则拦截。
