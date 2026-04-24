# Platform Adapters

InkFlow 与外部排版 / 渲染工具对接的**单一入口**。每个 adapter 是一个薄壳，负责
把对方 repo 的 **capabilities 清单** 拉到 InkFlow 侧（缓存到
`runtime/typeset-capabilities.json`），供 lint.py 消费。

## 设计不变量

1. **InkFlow 永远不读对方 repo 的源码**，只读对方发布的产物（capabilities.json）
2. **Adapter 无状态**：不持有会话、不缓存鉴权；所有调用都是单次 IO
3. **契约在 `framework/contracts/*.schema.json`**：对方 repo 按 schema 产出能力清单，
   Ink-Flow 按 schema 消费。改 schema = 改合约 = 两端协商的 breaking change
4. **adapter 只做对账，不做决策**：主题 / variant / 组件选择是用户运行时动作
   （在 wechat-typeset 本地编辑器里完成），不由 pipeline 决定

## 当前 adapter 清单

| name | 平台 | 对接方式 | 契约 |
|---|---|---|---|
| `wechat-typeset` | 微信公众号 | 文件系统（读 `dist/api/capabilities.json`） | `framework/contracts/wechat-typeset.schema.json` |

## 职责边界

adapter 负责：
- ✅ `health()` — 探测对方 dist 是否就绪
- ✅ `capabilities()` — 拉 capabilities.json 回来

adapter **不负责**：
- ❌ 主题 / variant / 组件的"决策式"校验 — 由 `lint.py rule_container_whitelist`（W1-W4）承担
- ❌ 服务端渲染 — 渲染由用户在 wechat-typeset 本地编辑器完成
- ❌ 排版方案中间产物 — writer 直接在 draft 阶段写 `::: 容器`，无中间形态

## 新增平台三步

以"接入知乎"为例：

### 1. 和目标工具约定 schema

在 `framework/contracts/` 新增 `zhihu.schema.json`（版本由 schema 内 `schemaVersion` 字段承载，不入文件名）。典型字段：

- `schemaVersion` / `tool.{name,version}`
- `containerSyntax`（或该平台等效的扩展语法）
- `variants`（每个容器 kind 的合法 variant id）

### 2. 写 adapter 子类

新建 `zhihu.py`，继承 `base.PlatformAdapter`，实现：

```python
class ZhihuAdapter(PlatformAdapter):
    name = "zhihu"
    contract_version = "1.0"

    def health(self, timeout=2.0) -> HealthResult: ...
    def capabilities(self, timeout=5.0) -> Capabilities: ...
```

### 3. 在工厂里注册

`__init__.py` 的 `get_adapter()`：

```python
if name in ("zhihu", "zhihu-typeset"):
    return ZhihuAdapter()
```

完成。CLI `python framework/tools/_adapters/cli.py --adapter zhihu capabilities --cache` 立即可用。

## Ink-Flow 侧配置点

### `framework/config/inkflow.yaml`

```yaml
typeset_adapter:          # 非 pipeline 阶段；仅描述与 wechat-typeset 对账所需元数据
  adapter: wechat-typeset
  contract: framework/contracts/wechat-typeset.schema.json
  required_version: ">=0.2.0,<0.3.0"
```

### `runtime/typeset-capabilities.json`

由 `python framework/tools/_adapters/cli.py capabilities --cache` 写入。
被 `lint.py` 的 `rule_container_whitelist` 读取，用作 `variant=X` 合法性白名单。
缺失时 lint.py 降级到 Profile 合成产物 `runtime/profile-resolved/typesetting.yaml.containers.variants`。

## Adapter 失败降级矩阵

| 问题 | Adapter 行为 | pipeline 应对 |
|---|---|---|
| dist 目录找不到 | `health.ok=false`, reason 指引用户 build | auditor 在报告中标注"容器 variant 校验降级到静态白名单"，不阻断 |
| capabilities.json 损坏 | `capabilities()` 抛 `AdapterError` | 同上 |

## 为什么不做 HTTP / headless 渲染

wechat-typeset 是纯浏览器工具（Vue 3 + `navigator.clipboard` API），渲染管线
深度耦合 iframe 预览与 DOM 选区。headless 改造成本高，收益小——用户本来就要
在浏览器里粘贴、切主题、一键复制。

所以 adapter **只搬 capabilities，不碰渲染**。writer 产出的 `::: 容器` Markdown
是最终交付物；主题切换在用户侧完成，契约承诺 9 套主题间切换不塌版。
