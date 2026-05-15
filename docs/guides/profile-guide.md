# Profile 使用指南

Profile 是 InkFlow 的写作设定插件包，决定"这篇文章怎么写"。一个 Profile 对应一个栏目、品牌或平台风格。

## 目录

- [三种注入模式](#三种注入模式)
- [查看当前绑定](#查看当前绑定)
- [自定义 Profile：两条路径](#自定义-profile两条路径)
- [Profile 的 extends 继承链](#profile-的-extends-继承链)
- [Profile 目录结构](#profile-目录结构)
- [注意事项](#注意事项)

---

## 三种注入模式

### full — 工作区持久绑定

```
/profile use <id>
```

整个工作区所有后续文章都使用此 Profile，直到再次切换。执行后会：

1. 写入 `runtime/profile-lock.yaml`
2. 自动运行 resolver 合成四类 slot
3. 下次 Claude Code 会话启动时 SessionStart hook 会自动刷新

### overlay — 单篇局部覆盖

```
/profile overlay <id>@<stage>
```

仅对当前正在写的文章的特定阶段生效，不影响工作区默认 Profile。用于"这篇文章想换一种语气，但不想全局切换"的场景。

产物写入 `content/articles/{slug}/.profile/overlay.yaml`，orchestrator 在 fanout 时自动消费。

### stack — 临时虚拟组合

```
/profile stack A+B+C
```

将多个 Profile 的 slot 临时叠加，不落盘物理文件，会话结束后消失。适合探索性实验。

---

## 查看当前绑定

```
/profile show
```

打印当前 lock 文件的内容，包括 activeProfile、已解析的 extends 链和各 slot 版本。

```
/profile list
```

列出 `profiles/` 下所有可用的 Profile。

---

## 自定义 Profile：两条路径

### 路径 A：样本驱动（推荐）

准备 1-5 篇你认为写得好的参考文章，放入 `content/references/articles/`，然后：

```
/profile extract sample content/references/articles/article1.md content/references/articles/article2.md
```

skill `profile`（extract sample 模式）会：
1. 分析文章的论证方式、语气、排版习惯
2. 反推四类 slot 的配置
3. 进入 Plan Mode 让你确认，确认后落盘到 `profiles/<new-id>/`

### 路径 B：目标驱动

描述你的栏目定位和读者画像，skill 通过多轮问答生成：

```
/profile extract goal
```

skill 会询问：
- 栏目名称和面向读者？
- 期望的语气（技术严谨 / 对话感 / 分析师风格）？
- 主要发布平台？
- 字数范围？

---

## Profile 的 extends 继承链

Profile 支持多层继承，类似 Docker FROM：

```yaml
# profiles/my-brand/profile.yaml
extends:
  - base-generic-chinese@^1.0.0   # 通用中文基座，提供字段默认值
  - platform-wechat@~0.2.0        # 微信平台容器语法 + CSS 规则
```

resolver 按拓扑顺序展开，后者覆盖前者。你的品牌 Profile 只需要声明与基座不同的部分。

**三层职责分工：**

| 层 | Profile | 主要字段 |
|----|---------|---------|
| base | `base-generic-chinese` | 禁用词、语气基线、字段默认值 |
| platform | `platform-wechat` | 容器白名单、CSS 安全、行内扩展 |
| 品牌 | 你的 Profile | 字数范围、栏目骨架、个人语气偏好 |

---

## Profile 目录结构

```
profiles/<id>/
  profile.yaml         # manifest（必需）
  principles.md        # 论证方式、叙事骨架、段落推进（可选，从 extends 继承）
  voice.md             # 人称、用词风格、金句位（可选）
  typesetting.yaml     # 排版规则（可选）
  constraints.yaml     # 禁用词、字数、栏目矩阵（可选）
  examples/            # few-shot 参考（可选）
    good-*.md
    bad-*.md
```

---

## 注意事项

- Agent **只读** `runtime/profile-resolved/*`，不直接读 `profiles/{id}/*`；修改 Profile 文件后需重新运行 resolver
- `runtime/profile-resolved/` 缺失时所有 agent 和 lint 会中止，先绑定 Profile 再写文章
- 每次 Claude Code 会话启动时，SessionStart hook 会自动刷新 resolved 产物（可通过 `settings.json` 配置）
- 想手动刷新：`python framework/tools/profile_resolver.py`
- 想校验 Profile 格式是否合法：`python framework/tools/validate_profile.py profiles/<id>/`
