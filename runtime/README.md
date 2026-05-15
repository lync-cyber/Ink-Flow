# runtime/ — 运行时状态

> 框架生成的中间产物。**可清空、可重建**——一般不需要手动改。`.gitignore` 视项目策略可考虑排除（默认仍跟踪 `profile-resolved/` 与 `profile-lock.yaml` 作为协作快照）。

## 目录

| 子目录 / 文件 | 用途 | 谁来写 |
|---|---|---|
| `profile-lock.yaml` | 当前工作区绑定的 Profile id + 版本 | `profile use` 命令 / SessionStart hook |
| `profile-resolved/` | Profile 继承链合成后的最终产物（**所有 agent 的唯一读源**） | `framework/tools/profile_resolver.py` |
| `pipeline-states/{slug}.json` | 每篇文章的 pipeline 运行状态（stage status / checkpoint 决议 / lifecycle 元数据） | orchestrator + state-writer 模块 |
| `typeset-capabilities.json`（按需） | wechat-typeset 适配器的 variant 白名单缓存 | `framework/tools/_adapters/cli.py capabilities --cache` |

## profile-resolved/ 字段

| 文件 | 内容来源 |
|---|---|
| `principles.md` | 当前 Profile 链合成后的论证 / 叙事 / 开头策略 |
| `voice.md` | 当前 Profile 链合成后的人称 / 用词 / 句式 |
| `typesetting.yaml` | 当前 Profile 链合成后的排版规则 |
| `constraints.yaml` | 当前 Profile 链合成后的禁用词 / 字数 / 栏目矩阵 |
| `manifest.json` | 字段溯源（每个字段来自哪一层 Profile） |

## 我想…

| 需求 | 怎么做 |
|---|---|
| 查当前绑定的 Profile | `cat runtime/profile-lock.yaml` |
| 看 agent 实际读到的规则 | 翻 `profile-resolved/*` |
| 看某字段来自哪个 Profile | 翻 `profile-resolved/manifest.json` |
| 重新合成 Profile | `python framework/tools/profile_resolver.py` |
| 看某文章卡在哪一步 | `cat runtime/pipeline-states/{slug}.json` |
| 重置某文章状态从头跑 | 删 `pipeline-states/{slug}.json` + 删 `content/articles/{slug}/intermediate/` |
| 让 lint 用最新 variant 白名单 | `python framework/tools/_adapters/cli.py capabilities --cache` |

## 注意

- ⚠️ **不要手动改 `profile-resolved/*`** —— 它是合成产物，下次 resolver 跑会被 overwrite。要改风格请改 `profiles/{id}/` 然后重合成。
- ✅ 可以删整个 `runtime/` 目录然后跑一次 resolver + 重新走 pipeline——一切都能重建。
- 🔄 `pipeline-states/` 是 resume 断点的唯一来源；中断后重启会读这里继续。
