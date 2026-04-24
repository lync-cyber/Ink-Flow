---
name: profile-injecting
description: >
  装配 Profile 到工作区 / 单篇文章 / 单次运行。
  三种模式：full（全量绑定）/ overlay（单篇局部覆盖）/ stack（临时叠加）。
  触发词："切换 profile"、"本次用 X"、"叠加 overlay"、"profile use"、"profile overlay"、"/profile"。
argument-hint: "[use|overlay|stack|show|unuse|list] [id]"
allowed-tools: Read, Write, Bash, AskUserQuestion, Glob
---

# Profile Injector

## 子命令

| 命令 | 作用 | 详细 |
|---|---|---|
| `/profile show` | 打印当前 lock | inject_profile.py show |
| `/profile list` | 列出 `profiles/` 下所有可用 pack | 直接 glob |
| `/profile use <id>` | 全量绑定（写 lock + 触发 resolver） | [`references/mode-full.md`](references/mode-full.md) |
| `/profile unuse` | 清空 activeProfile（回到 kernel 默认） | inject_profile.py unuse |
| `/profile overlay <id>@<stage>` | 单篇某阶段叠加（写 article .profile/overlay.yaml） | [`references/mode-partial.md`](references/mode-partial.md) |
| `/profile stack A+B+C` | 临时虚拟组合（不落盘物理 Profile） | [`references/mode-stacked.md`](references/mode-stacked.md) |

## 执行入口

所有子命令最终都走 `framework/tools/inject_profile.py` CLI：

```bash
python framework/tools/inject_profile.py set-active <id>
python framework/tools/inject_profile.py unuse
python framework/tools/inject_profile.py show
python framework/tools/inject_profile.py slot-dump --stage drafting --agent writer
python framework/tools/inject_profile.py overlay --slug <slug> --add <id> --stages drafting polishing
```

## 依赖

- `framework/tools/inject_profile.py` — CLI 入口
- `framework/tools/profile_resolver.py` — 合成产物
- `framework/tools/validate_profile.py` — use 前自检
- `framework/contracts/profile-protocol.md` — 协议文档

## 全局约束

- `use` 命令必须先跑 `validate_profile.py`：不通过 → 中止并打印错误
- `overlay` 只对当前写作 `{slug}` 生效；离开该文章后不影响全局 lock
- `stack` 是临时虚拟 lock，终端重启即失效
- 切换 profile 不会删除上一个绑定的 `runtime/profile-resolved/*` 内容 → resolver 会 overwrite
