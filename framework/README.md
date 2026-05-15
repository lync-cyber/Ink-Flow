# framework/ — 框架代码与契约

> InkFlow 的"系统层"：配置、协议、工具。**升级命令覆盖**——除了 `config/*.yaml` 你可能想改阈值，其他文件尽量别手动改。

## 目录

| 子目录 | 用途 | 关键文件 |
|---|---|---|
| `config/` | 项目配置（单一事实来源） | `inkflow.yaml`（stages / presets / model_allocation）· `artifact-layout.yaml`（产物路径模板）· `platform-lint-rules.yaml`（lint 严重级别） |
| `contracts/` | 跨组件硬契约（agent / skill / 排版工具都按此对账） | `writing-kernel.md`（平台无关写作元契约）· `profile-protocol.md` + `profile.schema.json`（Profile 协议）· `wechat-typeset.schema.json`（与本地排版工具的对账） |
| `tools/` | Python 工具（resolver / lint / 适配器 / bootstrap） | `profile_resolver.py` · `inject_profile.py` · `validate_profile.py` · `agent_lint.py` · `skill_lint.py` · `bootstrap.sh` · `_adapters/`（与独立 repo wechat-typeset 对接） |

## 我想…

| 需求 | 改哪个文件 |
|---|---|
| 改 brief 默认值 / 增加 preset 档位 | `config/inkflow.yaml` |
| 改产物路径占位 | `config/artifact-layout.yaml` |
| 改 lint 严重级别 / 启用/关闭某条规则 | `config/platform-lint-rules.yaml` |
| 升级 Profile 协议字段 | `contracts/profile-protocol.md` + 同步 `profile.schema.json` |
| 修订通用写作元契约 | `contracts/writing-kernel.md` |
| 重新合成 Profile | `python framework/tools/profile_resolver.py` |
| 校验 agent / skill frontmatter | `python framework/tools/agent_lint.py` / `skill_lint.py` |
| 刷新排版能力缓存 | `python framework/tools/_adapters/cli.py capabilities --cache` |
| 从远程同步框架更新 | `bash framework/tools/bootstrap.sh . <repo-url>` |

## 注意

- ⚠️ **bootstrap.sh 会覆盖** `framework/tools/` 和 `.claude/agents/`、`.claude/skills/`、`.claude/rules/`——别在这些路径下做本地分叉。要扩展请走 `profiles/` 或新 PR。
- ✅ `config/*.yaml` 是配置而非代码，可以放心改——但改完跑一次 `agent_lint.py` 验三向一致性。
- 🔒 `contracts/` 升级要 bump schemaVersion；老 Profile 会通过 `compatibility.inkflowKernel` 字段声明兼容范围。
