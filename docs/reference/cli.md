# CLI 工具参考

InkFlow 的命令行工具均位于 `framework/tools/`，需要 Python ≥ 3.10 和 PyYAML。

## 目录

- [profile_resolver.py](#profile_resolverpy)
- [inject_profile.py](#inject_profilepy)
- [validate_profile.py](#validate_profilepy)
- [_adapters/cli.py](#_adaptersclipy)

---

## profile_resolver.py

展开 extends 依赖图，合成四类 slot，写入 `runtime/profile-resolved/`。

```bash
python framework/tools/profile_resolver.py [OPTIONS]
```

| 选项 | 说明 |
|------|------|
| `--profile <id>` | 显式指定 Profile id（默认读 `runtime/profile-lock.yaml`） |
| `--refresh-if-stale <seconds>` | 仅当 resolved 产物超过 N 秒未更新时重新合成 |
| `--dry-run` | 校验合成结果但不落盘 |
| `--quiet` | 只输出错误，不输出进度 |

**示例：**

```bash
# 读当前 lock，重新合成
python framework/tools/profile_resolver.py

# 显式指定 Profile
python framework/tools/profile_resolver.py --profile lync-wechat-tech

# 只校验，不写文件
python framework/tools/profile_resolver.py --dry-run

# 仅当超过 1 小时才重新合成（用于 SessionStart hook）
python framework/tools/profile_resolver.py --refresh-if-stale 3600
```

**退出码：**

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 1 | Profile 不存在或字段错误 |
| 2 | 依赖缺失（PyYAML 未安装） |

---

## inject_profile.py

管理 Profile 绑定和 slot 切片注入。

```bash
python framework/tools/inject_profile.py <command> [OPTIONS]
```

### 子命令

#### `set-active <id>`

绑定 Profile 到工作区，并自动触发 resolver。

```bash
python framework/tools/inject_profile.py set-active lync-wechat-tech
```

执行后：
1. 写入 `runtime/profile-lock.yaml`
2. 调用 `profile_resolver.py` 合成 resolved 产物

#### `unuse`

解绑当前 Profile（清除 lock 中的 activeProfile）。

```bash
python framework/tools/inject_profile.py unuse
```

#### `slot-dump`

提取某阶段应向 subagent 注入的 slot 切片（供 orchestrator 在 PreToolUse hook 中调用）。

```bash
python framework/tools/inject_profile.py slot-dump --stage drafting --agent writer
```

| 选项 | 说明 |
|------|------|
| `--stage` | 阶段名（planning / drafting / polishing / auditing） |
| `--agent` | agent 名称（用于按 agent 的 `profileSlots` 过滤） |

#### `overlay`

读写单篇文章的临时 overlay 配置。

```bash
# 写入 overlay
python framework/tools/inject_profile.py overlay write --slug my-article --profile alt-voice

# 查看当前 overlay
python framework/tools/inject_profile.py overlay show --slug my-article
```

---

## validate_profile.py

校验 Profile 目录是否符合 schema 和协议要求。

```bash
python framework/tools/validate_profile.py profiles/<id>/
```

**检查项：**

- `profile.yaml` 必填字段完整性
- slot 文件存在性（根据 `slots` 声明）
- YAML 语法有效性
- `extends` 链中引用的 Profile 是否存在
- `typesetting.yaml` 的 `schemaVersion` 是否匹配

**示例：**

```bash
# 校验单个 Profile
python framework/tools/validate_profile.py profiles/lync-wechat-tech/

# 校验所有 Profile
for dir in profiles/*/; do python framework/tools/validate_profile.py "$dir"; done
```

---

## _adapters/cli.py

与外部排版工具（当前仅 wechat-typeset）对账。

```bash
python framework/tools/_adapters/cli.py [--adapter <name>] <command> [OPTIONS]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--adapter` | 适配器名称 | `wechat-typeset` |

### 子命令

#### `capabilities`

拉取外部工具的能力清单。

```bash
# 仅打印，不缓存
python framework/tools/_adapters/cli.py capabilities

# 拉取并写入 runtime/typeset-capabilities.json
python framework/tools/_adapters/cli.py capabilities --cache
```

#### `health`

探测外部工具的 dist 目录是否就绪。

```bash
python framework/tools/_adapters/cli.py health
# 输出: {"ok": true, "dist_dir": "../wechat-typeset/dist"}
```

**示例（完整工作流）：**

```bash
# 1. 确认 wechat-typeset 已 build
python framework/tools/_adapters/cli.py health

# 2. 刷新 capabilities 缓存
python framework/tools/_adapters/cli.py capabilities --cache

# 3. 跑 lint（会自动读取缓存）
python .claude/skills/quality-linting/scripts/lint.py --platform wechat my-article
```
