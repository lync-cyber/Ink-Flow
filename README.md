# InkFlow · 墨流

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Claude%20Code-blueviolet)

**LLM 写作工作流框架：换 Profile，换整套风格，核心 pipeline 不动。**

---

## 功能亮点

- **风格不漂移** — 四类 slot（原则 / 语气 / 排版 / 约束）声明式绑定一个栏目或品牌的全部设定；换 Profile 不改 agent
- **上下文不污染** — 8 个 subagent 各在独立上下文里跑一步；调研素材不污染写作，写作结果不污染审校
- **三个检查点，你来拍板** — Outline 确认 → 审校终稿 → 发布前，每次交给你的是可判断的产出物，不是 yes/no 问题
- **多平台一键扩展** — 新建 `profiles/platform-<name>/` 声明容器语法和约束，writer / publisher 自动适配，核心 agent 零改动
- **本地排版直出公众号** — 配套 [wechat-typeset](https://github.com/lync-cyber/wechat-typeset)，粘贴 Markdown → 挑主题 → 一键复制富文本

---

## 架构一览

<p align="center">
  <img src="docs/assets/architecture.svg" alt="InkFlow 三层架构" width="760">
</p>

**L3 编排层**（orchestrator + 12 个 skill）→ **L2 Profile 插件层**（四类 slot + extends 链）→ **L1 通用内核**（8 个 subagent，只读 resolved 产物）

<p align="center">
  <img src="docs/assets/workflow.svg" alt="从初始化到发布的完整工作流" width="960">
</p>

<p align="center">
  <img src="docs/assets/agents-skills.svg" alt="Agent 与 Skill 架构" width="960">
</p>

详细说明见 [架构概览 →](docs/architecture/overview.md)

---

## 快速开始

**前置条件**：已安装 [Claude Code](https://claude.ai/code)，有 Anthropic API 访问权限。

### 场景 A：从零部署到空目录

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/lync-cyber/Ink-Flow/main/framework/tools/bootstrap.sh)
```

### 场景 B：已有仓库内升级框架

```bash
bash framework/tools/bootstrap.sh . https://github.com/lync-cyber/Ink-Flow
```

### 然后在 Claude Code 中：

```
步骤 1  "初始化工作区"
        → 创建 content/ profiles/ runtime/ 目录结构

步骤 2  "/profile use lync-wechat-tech"
        → 绑定示例 Profile（微信四栏目）

步骤 3  "写一篇关于 X 的文章"
        → 启动 8 阶段 pipeline，产出草稿 / 审校 / 终稿
```

完整端到端步骤见 [安装与快速开始 →](docs/getting-started/quickstart.md)

---

## 文档导航

| 我想要… | 链接 |
|---------|------|
| 从零安装并写第一篇文章 | [安装指南](docs/getting-started/installation.md) · [快速开始](docs/getting-started/quickstart.md) |
| 切换 / 定制 Profile | [Profile 使用指南](docs/guides/profile-guide.md) |
| 理解 8 阶段 pipeline | [Pipeline 详解](docs/guides/pipeline-guide.md) |
| 分发到多平台 | [多平台工作流](docs/guides/multi-platform.md) |
| 微信公众号本地排版 | [wechat-typeset 对接](docs/guides/wechat-typeset.md) |
| profile.yaml 字段速查 | [Profile Schema 参考](docs/reference/profile-schema.md) |
| Python CLI 工具参数 | [CLI 参考](docs/reference/cli.md) |
| Lint 规则分类与严重级别 | [Lint 规则](docs/reference/lint-rules.md) |
| 扩展新平台 / 新 Profile | [扩展指南](docs/contributing/extending.md) |
| 三层架构设计原理 | [架构概览](docs/architecture/overview.md) |

**协议文件**（面向框架开发者）：
[Profile 协议](framework/contracts/profile-protocol.md) ·
[写作元契约](framework/contracts/writing-kernel.md) ·
[微信排版契约](framework/contracts/wechat-typeset.schema.json)

---

## 项目结构

```
.claude/          # Claude Code 框架目录（agents / skills / rules）
profiles/         # Profile 插件包（base / platform / 品牌三层）
framework/        # 框架代码（config / contracts / tools）
runtime/          # 运行时状态（profile-resolved / pipeline-states）
content/          # 创作资产（articles / references / retrospectives）
docs/             # 用户文档
```

详细目录说明见 [架构概览](docs/architecture/overview.md)。

---

## 贡献

欢迎提交 Issue 和 PR。贡献前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

[MIT](LICENSE)
