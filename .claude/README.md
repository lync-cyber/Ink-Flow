# .claude/ — Claude Code 框架目录

> Subagent / Skill / 规则 / hook 定义。**升级命令覆盖**——除 `settings.local.json` 外尽量别手动改。

## 目录

| 子目录 | 用途 | 关键文件 |
|---|---|---|
| `agents/` | Subagent 定义（每个 agent 一个目录） | `{name}/AGENT.md`（主定义） · `{name}/*.md`（子模块 / references） · `_shared/`（跨 agent 契约） |
| `skills/` | 用户可调 skill 定义 | `{name}/SKILL.md`（主定义） · `{name}/references/`（详细流程） · `{name}/scripts/`（确定性脚本） |
| `rules/` | 跨 agent 通用规则（通过 CLAUDE.md `@`-imports 注入） | `core/writing-quality.md` · `core/fact-check.md` |
| `scripts/` | 工具脚本（如 fig2img） | `fig2img.py` |
| `agent-memory/` | Claude Code 原生 memory（agent 习得的经验） | 框架自动写 |
| `worktrees/` | Claude Code worktree 隔离 | 框架自动写 |
| `settings.json` | 项目级 Claude Code 配置（hooks / permissions） | 团队共享 |
| `settings.local.json` | 你的本地覆盖（gitignored） | 个人配置 |

## Agent 列表

| Agent | 角色 | 模型 |
|---|---|---|
| `orchestrator` | 编排器（运行主对话） | opus |
| `researcher` | 调研 | sonnet |
| `atomizer` | 内容原子化 | sonnet |
| `outliner` | 大纲架构师 | opus |
| `writer` | 执笔者 | sonnet |
| `illustrator` | 视觉表达 | sonnet |
| `auditor` | 审校（只评文学质量，不调 lint） | opus |
| `polisher` | 润色（按 audit 报告修） | opus |
| `publisher` | 平台导出 + lint 终稿守门 | sonnet |

完整定义见 `agents/{name}/AGENT.md`。

## Skill 列表（用户可触发）

| Skill | 触发场景 |
|---|---|
| `profile` | 提取 / 切换 / 叠加 Profile |
| `content-planning` | 生成内容日历 |
| `metrics-tracking` | 录入运营数据 |
| `performance-benchmarking` | 数据交叉分析 |
| `creation-reviewing` | 对比初稿与终稿、提炼规则 |
| `quality-linting` | 手动跑 lint |
| `workspace-init` | 初始化 / 升级框架 |

完整定义见 `skills/{name}/SKILL.md`。

## 注意

- 🔒 **agents / skills / rules / scripts 由 bootstrap.sh 覆盖**——别在这些路径手动改，扩展请走 `profiles/` 或提 PR。
- ✅ `settings.local.json` 是你的私人配置（gitignored），可以放心改。
- ⚠️ 子目录里的 `.md` 文件如果**有合法 frontmatter（name + description）**会被识别为 agent；项目里的子模块文件（`stages.md` / `templates.md` 等）刻意不写 frontmatter 以避免被误识别。
