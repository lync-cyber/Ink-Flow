# profiles/ — 创作设定插件包

> 一个 Profile = 一套"栏目 / 品牌 / 平台"的完整设定。换 Profile 就是换风格，核心 agent 一行代码不改。**纳入版本管理**。

## 四类 slot（每个 Profile 包必含的填料）

| Slot | 内容 | 形态 |
|---|---|---|
| `principles.md` | 论证方式、叙事骨架、段落推进、开头策略 | markdown |
| `voice.md` | 人称、用词 preferred/avoided、句式偏好、金句位 | markdown |
| `typesetting.yaml` | 段落 / 句子 / 标题 / 容器 / CSS 安全 / SVG 下限 | yaml |
| `constraints.yaml` | 禁用词 / 替换词 / 字数 / 栏目 × 平台矩阵 / 栏目元数据 | yaml |

每个 Profile 还有 `profile.yaml`（manifest）：声明 `id` / `version` / `extends`（继承链）/ `routing`（哪个 agent 用哪个 slot）/ `provenance`（提取来源）。

## 当前包

| Profile id | 类型 | 作用 |
|---|---|---|
| `base-generic-chinese` | base | 通用中文基线（所有 Profile 默认从此继承） |
| `platform-wechat` | platform | 微信公众号专属容器语法 + 排版规则（typesetting + constraints） |
| `lync-wechat-tech` | brand | 当前激活的工作 Profile（继承 base + platform-wechat，覆盖品牌专属字段） |

继承链：`lync-wechat-tech` < `platform-wechat` < `base-generic-chinese`，按 `profile.yaml` 的 `extends` 字段链式合成。

## 我想…

| 需求 | 怎么做 |
|---|---|
| 看当前用的是哪个 Profile | `cat runtime/profile-lock.yaml` 或在 Claude Code 说 `profile show` |
| 换个 Profile | `profile use <id>` |
| 单篇文章某阶段叠加另一个 Profile | `profile overlay <id>@<stage>` |
| 临时虚拟组合多个 Profile | `profile stack A+B+C` |
| 新建一个 Profile（从样本反推） | `profile extract sample <file1> <file2>` |
| 微调现有 Profile 的某条规则 | 直接改对应 slot 文件 → 跑 `python framework/tools/profile_resolver.py` 重合成 |
| 校验 Profile 合法 | `python framework/tools/validate_profile.py profiles/{id}` |

## 注意

- ⚠️ Agent **不直接读** `profiles/{id}/` —— resolver 把继承链合成到 `runtime/profile-resolved/*` 后，agent 只读合成产物。
- 改 slot 文件后必须 `profile_resolver.py` 一次才生效（SessionStart hook 会自动跑）。
- 新建 Profile 前先看 `framework/contracts/profile-protocol.md` 确认字段规范。
