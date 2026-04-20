# Platform Adapters

InkFlow 与外部排版 / 渲染工具对接的**单一入口**。每个 adapter 是一个薄壳，负责
把 InkFlow 的"平台无关 Markdown 产物 + 排版决策"桥接到**具体平台工具**。

## 设计不变量

1. **InkFlow 永远不读对方 repo 的源码**，只读对方发布的产物（capabilities.json
   / HTTP endpoint / 命令行 stdout）
2. **Adapter 无状态**：不持有会话、不缓存鉴权；所有调用都是单次 IO
3. **契约在 `framework/contracts/*.schema.json`**：对方 repo 按 schema 产出能力清单，
   Ink-Flow 按 schema 消费。改 schema = 改合约 = 两端协商的 breaking change
4. **失败即告知**：`health()` 返回布尔 + 原因；`render()` 不可用时返回 `None`
   让上游 agent 走降级路径，不靠抛异常做流程控制

## 当前 adapter 清单

| name | 平台 | 对接方式 | 契约 | render 可用 |
|---|---|---|---|---|
| `wechat-typeset` | 微信公众号 | 文件系统（读 dist/api/capabilities.json） | `framework/contracts/wechat-typeset-v1.schema.json` | 否（v1 降级为占位） |

## 新增平台三步

以"接入知乎"为例：

### 1. 和目标工具约定 schema

在 `framework/contracts/` 新增 `zhihu-v1.schema.json`。典型字段：

- `schemaVersion` / `tool.{name,version}` （与 wechat-typeset 一致）
- `containerSyntax`（或该平台等效的扩展语法）
- `themes` / `variants` / `components` / `defaultVariants`

### 2. 写 adapter 子类

新建 `zhihu.py`，继承 `base.PlatformAdapter`，实现：

```python
class ZhihuAdapter(PlatformAdapter):
    name = "zhihu"
    contract_version = "1.0"

    def health(self, timeout=2.0) -> HealthResult: ...
    def capabilities(self, timeout=5.0) -> Capabilities: ...
    def render(self, md: str, theme: str, *, timeout=10.0) -> RenderResult | None: ...
```

无须重写 `conform_plan`——基类已提供通用合规校验。

### 3. 在工厂里注册

`__init__.py` 的 `get_adapter()`：

```python
if name in ("zhihu", "zhihu-typeset"):
    return ZhihuAdapter()
```

完成。CLI `python framework/tools/_adapters/cli.py --adapter zhihu health` 立即可用。

## Ink-Flow 侧配置点

### `framework/config/inkflow.yaml`

```yaml
typeset:
  adapter: wechat-typeset             # 当前 adapter
  contract: framework/contracts/wechat-typeset-v1.schema.json
  required_version: ">=0.2.0,<0.3.0"
```

未来同一文章要多平台发布时，可以扩展为：

```yaml
typeset:
  adapters:                           # 多平台 fan-out
    - name: wechat-typeset
      platform: wechat
      required_version: ">=0.2.0,<0.3.0"
    - name: zhihu
      platform: zhihu
      required_version: ">=1.0.0"
  default_platform: wechat
```

此时 typeset 阶段会对每个平台各跑一次，产物分别落在
`export/08-typeset/wechat/` 和 `export/08-typeset/zhihu/`。

### `framework/config/artifact-layout.yaml`

新增 `typeset_plan` / `typeset_annotated` / `typeset_render` / `typeset_meta`
字段已预留平台隔离，无需改动。

## Adapter 失败降级矩阵

| 问题 | Adapter 行为 | typesetter agent 应对 |
|---|---|---|
| dist 目录找不到 | `health.ok=false`, reason 指引用户 build | 暂停 typeset 阶段，提示用户 |
| 版本超出 `required_version` | `capabilities()` 仍成功，但上游对账失败 | 报错并要求升级对方 repo |
| `/api/render` 返回 501 | `render()` 返回 `None` | 落盘占位 HTML，提示用户去浏览器复制 |
| 网络/文件损坏 | 抛 `AdapterError` | orchestrator 进 recovery L2 重试 |

## 为什么不做 HTTP 强依赖

wechat-typeset 当前形态是**纯浏览器工具**（Vue 3 + `navigator.clipboard` API），
渲染管线深度耦合 iframe 预览与 DOM 选区。把它改造成 headless 渲染需要：

- 要么引入 Puppeteer / Playwright（体量大）
- 要么把管线里所有 Vue / juice/client 依赖抽到 Node（重构成本高）

用 **"文件系统读 capabilities.json + 用户在浏览器完成最后一步"** 的降级方式，
给了我们 80% 的 agent 自动化收益（决策校验 + 合规静态检查），同时保留了
工具侧可以独立演进的空间。未来如果对方 repo 决定加 headless API，adapter
只需补上 HTTP 分支，Ink-Flow 其它代码不变。
