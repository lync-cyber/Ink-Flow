# 微信排版本地工具对接

InkFlow 通过配套工具 [wechat-typeset](https://github.com/lync-cyber/wechat-typeset) 实现微信公众号富文本排版。两个工具职责分离：InkFlow 产出带容器语法的 Markdown，wechat-typeset 在浏览器中渲染并复制富文本。

## 目录

- [工具职责边界](#工具职责边界)
- [安装 wechat-typeset](#安装-wechat-typeset)
- [发布流程](#发布流程)
- [容器语法说明](#容器语法说明)
- [能力对账（Lint 集成）](#能力对账lint-集成)
- [常见问题](#常见问题)

---

## 工具职责边界

| InkFlow | wechat-typeset |
|---------|---------------|
| 产出 `08-wechat-publish.md`（含 `:::` 容器语法） | 读取 Markdown，在浏览器渲染富文本 |
| 决定容器类型（tip / quote-card / steps 等） | 提供 9 套主题，用户运行时切换 |
| 通过 adapter 读取 capabilities.json 做格式校验 | 发布 `dist/api/capabilities.json`（variant 白名单） |
| **不做**主题决策，**不做**渲染 | **不做**内容生成，**不做**写作决策 |

---

## 安装 wechat-typeset

**前置条件**：Node.js ≥ 18

```bash
# 克隆到 Ink-Flow 同级目录（这是约定路径，不要改）
cd ..
git clone https://github.com/lync-cyber/wechat-typeset.git
cd wechat-typeset
npm install
npm run build          # 构建 dist/（含 capabilities.json）
```

验证安装：

```bash
ls dist/api/capabilities.json   # 应该存在
```

---

## 发布流程

**步骤 1：确认 InkFlow 已交付发布产物**

```
content/articles/{slug}/export/08-wechat-publish.md
```

**步骤 2：启动本地排版工具**

```bash
cd ../wechat-typeset
npm run dev
# 输出：Local:   http://127.0.0.1:7788/
```

**步骤 3：在浏览器中操作**

1. 打开 `http://127.0.0.1:7788`
2. 将 `08-wechat-publish.md` 的内容粘贴进左侧编辑区
3. 在右上角选择主题（9 套主题，切换不影响内容）
4. 点击"复制富文本"
5. 粘贴到微信公众号后台编辑器

**步骤 4（可选）：使用预告文案**

`export/08-teaser-120chars.md` 是 ≤120 字的短摘要，用于朋友圈分发或群内预告。

---

## 容器语法说明

wechat-typeset 支持通过 `:::` 语法声明容器组件，InkFlow writer 按 Profile 白名单使用。

### 基本格式

```markdown
::: tip
这是一条提示内容。
:::
```

### 指定 variant

```markdown
::: tip{variant=pill-tag}
使用 pill-tag 样式的提示。
:::
```

### 嵌套容器（compare）

```markdown
:::: compare{variant=column-card}
::: pros
优点内容
:::
::: cons
缺点内容
:::
::::
```

### 当前白名单中的主要容器

| 容器 | 用途 |
|------|------|
| `tip / warning / info / danger / note` | 提示框（5 种语义） |
| `quote-card` | 引用卡片 |
| `highlight` | 高亮块 |
| `compare` + `pros` + `cons` | 对比布局 |
| `steps` | 步骤流程 |
| `key-number` | 核心数据展示 |
| `section-title` | 章节标题装饰 |
| `footer-cta` | 文末引导 |

完整白名单见 `runtime/profile-resolved/typesetting.yaml` 的 `containers.whitelist`。

---

## 能力对账（Lint 集成）

InkFlow 通过 adapter 读取 wechat-typeset 的 `dist/api/capabilities.json`，校验文章中使用的 variant 是否合法。

**刷新能力缓存：**

```bash
python framework/tools/_adapters/cli.py capabilities --cache
# 写入 runtime/typeset-capabilities.json
```

建议在 wechat-typeset 升级（`npm run build`）后重新执行，保持缓存与工具版本同步。

**lint 集成：**

```bash
python .claude/skills/quality-linting/scripts/lint.py --platform wechat {slug}
```

W1-W4 规则会校验容器 id 合法性和 variant 白名单，详见 [Lint 规则参考](../reference/lint-rules.md)。

---

## 常见问题

**Q：`dist/api/capabilities.json` 不存在**

需要先执行 `npm run build`，dev 模式不生成 dist 目录。

**Q：lint 报 W2 variant 不在白名单**

可能是 wechat-typeset 升级了但 capabilities 缓存未刷新。执行 `python framework/tools/_adapters/cli.py capabilities --cache` 更新缓存。

**Q：复制的富文本粘贴到公众号后样式丢失**

检查是否使用了 `class=` 属性（微信不支持），Profile 的 `constraints.forbidden.patterns` 中应包含此规则。
