# 扩展指南

本文说明如何在 InkFlow 中扩展新平台和创建新 Profile。核心 agent 在两种情况下都不需要修改。

## 目录

- [扩展新平台](#扩展新平台)
- [创建新 Profile](#创建新-profile)

---

## 扩展新平台

以接入"知乎"为例，共三步。

### 步骤 1：新建平台 Profile 包

```
profiles/platform-zhihu/
  profile.yaml
  typesetting.yaml      # 知乎的排版规则
  constraints.yaml      # 知乎的字数 / 禁用词 / 合规规则
```

**profile.yaml**（最小合法示例）：

```yaml
apiVersion: inkflow.profile/v1
id: platform-zhihu
version: 1.0.0
title: 知乎平台契约
author: your-handle
description: |
  知乎文章的排版规则与合规约束。

extends:
  - base-generic-chinese@^1.0.0

slots:
  typesetting:
    file: typesetting.yaml
    kind: yaml
  constraints:
    file: constraints.yaml
    kind: yaml
```

**typesetting.yaml**（知乎平台特点）：

```yaml
slot: typesetting
version: 1.0.0
schemaVersion: "1.0"

heading:
  allowed: [2, 3, 4]
  h1Uniqueness: true

paragraph:
  maxChars: 200

containers:
  whitelist: []             # 知乎不支持 ::: 容器语法

inlineExtensions:
  allowed: []               # 仅 GFM 原生语法

emoji:
  policy: sparing
```

**constraints.yaml**（知乎平台特点）：

```yaml
slot: constraints
version: 1.0.0

length:
  target: 3000
  min: 2000
  max: 4000
  hardFactor: 1.2

compliance:
  absoluteTerms: warn
  claimsNeedSource: true
```

### 步骤 2：在品牌 Profile 的 extends 链中加入

```yaml
# profiles/my-brand/profile.yaml
extends:
  - base-generic-chinese@^1.0.0
  - platform-wechat@~0.2.0
  - platform-zhihu@~1.0.0    # ← 加这行
```

### 步骤 3（可选）：声明 Lint 规则开关

在 `framework/config/platform-lint-rules.yaml` 添加 `zhihu` 段：

```yaml
zhihu:
  W1: error      # 容器 id 合法性（知乎无容器，此规则触发后需清理）
  A1: error      # 容器语法平台适用性
  A2: warn       # CSS 安全（知乎相对宽松）
  A3: warn       # 禁用词
  A4: error      # 字数范围
```

完成。在 brief 中加入 `target_platforms: [wechat, zhihu]`，writer 和 publisher 自动产出两份格式各异的文章。

---

### 可选：接入外部排版工具 adapter

如果新平台有配套的本地渲染工具（类似 wechat-typeset），可以写一个 adapter：

1. **约定 schema**：在 `framework/contracts/` 新增 `zhihu.schema.json`，定义 `schemaVersion / tool / containerSyntax / variants`
2. **写 adapter 子类**：新建 `framework/tools/_adapters/zhihu.py`，继承 `base.PlatformAdapter`，实现 `health()` 和 `capabilities()`
3. **在工厂中注册**：在 `__init__.py` 的 `get_adapter()` 中加入 `if name == "zhihu": return ZhihuAdapter()`

详见 [适配器文档](../../framework/tools/_adapters/README.md)。

---

## 创建新 Profile

### 路径 A：从样本文章提取（推荐）

适合"我已经有几篇满意的文章，想让 AI 模仿这种风格"的场景。

1. 将 1-5 篇参考文章放入 `content/references/articles/`
2. 在 Claude Code 中运行：

```
/profile extract sample content/references/articles/a1.md content/references/articles/a2.md
```

3. skill 会分析文章，推导四类 slot 配置，在 Plan Mode 中展示供你确认
4. 确认后落盘到 `profiles/<new-id>/`，并自动运行 `validate_profile.py` 校验

### 路径 B：从目标描述生成

适合"我想要某种风格，但还没有现成文章"的场景。

```
/profile extract goal
```

skill 会问你：
- 栏目名和读者画像
- 语气（技术严谨 / 对话感 / 分析师风格 / 故事感）
- 主要发布平台
- 字数偏好
- 有没有特别的禁用词或风格偏好

回答完成后同样进入 Plan Mode 确认，落盘后自动校验。

### 绑定并使用新 Profile

```
/profile use <new-id>
```

或者只对某篇文章临时使用：

```
/profile overlay <new-id>@drafting
```

### 调试 Profile

如果 resolver 报错或 agent 行为不符合预期：

```bash
# 校验 Profile 格式
python framework/tools/validate_profile.py profiles/<id>/

# 干跑合成（不写文件）
python framework/tools/profile_resolver.py --profile <id> --dry-run

# 查看合成产物
ls runtime/profile-resolved/
cat runtime/profile-resolved/manifest.json    # 含各字段来源追溯
```
