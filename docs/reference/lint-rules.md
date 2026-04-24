# Lint 规则参考

InkFlow 的格式校验由 `lint.py` 执行，规则分为两类：W 系列（容器语法规则）和 A 系列（平台适配规则）。规则数据从 `runtime/profile-resolved/*` 读取，variant 白名单从 `runtime/typeset-capabilities.json` 读取。

## 目录

- [运行 Lint](#运行-lint)
- [W 系列：容器语法规则](#w-系列容器语法规则)
- [A 系列：平台适配规则](#a-系列平台适配规则)
- [严重级别](#严重级别)
- [降级行为](#降级行为)

---

## 运行 Lint

```bash
# 在 Claude Code 中
"跑一下 lint"
"检查格式"
"格式校验 {slug}"

# 命令行
python .claude/skills/quality-linting/scripts/lint.py {slug}
python .claude/skills/quality-linting/scripts/lint.py --platform wechat {slug}
```

lint.py 会读取以下文件：
- `runtime/profile-resolved/typesetting.yaml` — 容器白名单、行内扩展、heading 规则
- `runtime/profile-resolved/constraints.yaml` — 禁用词、字数范围
- `runtime/typeset-capabilities.json` — variant 白名单（来自 wechat-typeset）

---

## W 系列：容器语法规则

### W1 · 容器 id 合法性

**规则**：文章中使用的容器 id 必须精确匹配 `typesetting.containers.whitelist`。

**触发条件**：出现 `typesetting.containers.whitelist` 中未声明的 `:::` 容器 id。

**严重级别**：error

**示例（违规）**：
```markdown
::: callout          ← "callout" 不在白名单
内容
:::
```

**修复**：改用白名单中的 id，如 `tip` / `info` / `warning`。

---

### W2 · variant 合法性

**规则**：`variant=X` 的值必须在 `typesetting.containers.variants` 或 `typeset-capabilities.json` 白名单内。

**触发条件**：指定了 `variant=X` 但 X 不在任何白名单中。

**严重级别**：error

**示例（违规）**：
```markdown
::: tip{variant=rainbow}   ← "rainbow" 不在 tip 的 variant 列表
:::
```

**修复**：检查该容器支持的 variant 列表（见 `typesetting.yaml` 或 capabilities.json）。

---

### W3 · pros/cons 嵌套规则

**规则**：`pros` 和 `cons` 容器必须嵌套在 `:::: compare` 内，不能独立出现。

**严重级别**：error

**正确写法**：
```markdown
:::: compare{variant=column-card}
::: pros
优点
:::
::: cons
缺点
:::
::::
```

---

### W4 · 冒号配对闭合

**规则**：外层容器（`::::` 4 个冒号）必须严格多于内层容器（`:::` 3 个冒号），配对必须闭合。

**严重级别**：error

**常见错误**：外层和内层都用三个冒号导致解析歧义。

---

## A 系列：平台适配规则

### A1 · 容器语法平台适用性

**规则**：`:::` 容器语法只在 `typesetting.containers.whitelist` 非空的平台（如 wechat）才合法；在知乎、掘金、小红书产物中，容器语法会被平台剥离，应使用纯 GFM 替代。

**触发条件**：在非 wechat 平台的 `08-{platform}-publish.md` 中出现 `:::` 语法。

**严重级别**：error

---

### A2 · CSS 安全规则

**规则**：产物中不得出现 `cssSafety.forbiddenProperties` 或 `cssSafety.forbiddenTags` 中列出的属性和标签。

**常见违规**：
- `position:` / `float:` — 微信编辑器不支持
- `<style>` / `<script>` 标签 — 被微信剥离
- `class="..."` — 微信只支持 inline style
- ` id="..."` — 微信剥离 id 属性

**严重级别**：error

---

### A3 · 禁用词检查

**规则**：文章正文中不得出现 `constraints.forbidden.phrases` 列表中的词语，或匹配 `constraints.forbidden.patterns` 的正则模式。

**严重级别**：warning（可配置为 error）

---

### A4 · 字数范围

**规则**：文章总字数应在 `constraints.length.min` 到 `constraints.length.max` 之间；超出 `max * hardFactor` 时升级为 error。

**示例**（lync-wechat-tech Profile）：

| 范围 | 值 |
|------|----|
| 目标 | 2800 |
| 最小 | 2200 |
| 最大 | 3600 |
| 硬上限（max × 1.2） | 4320 |

---

## 严重级别

| 级别 | 说明 | pipeline 行为 |
|------|------|--------------|
| error | 格式违规，必须修复 | auditor 在报告中标注，polisher 需处理 |
| warning | 建议修复 | 不阻断 pipeline，记录在审校报告中 |

---

## 降级行为

当 `runtime/typeset-capabilities.json` 不存在时（wechat-typeset 未 build 或缓存未刷新）：

- W2 variant 校验降级为"仅与 `typesetting.yaml.containers.variants` 对照"
- auditor 在报告中标注"容器 variant 校验降级到静态白名单"
- pipeline 不阻断

刷新缓存：

```bash
python framework/tools/_adapters/cli.py capabilities --cache
```
