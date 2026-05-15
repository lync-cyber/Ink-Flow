# 架构概览

## 目录

- [三层架构](#三层架构)
- [设计哲学](#设计哲学)
- [Agent 与 Skill 的分工](#agent-与-skill-的分工)
- [目录结构详解](#目录结构详解)
- [Profile 解析流程](#profile-解析流程)

---

## 三层架构

<p align="center">
  <img src="../../docs/assets/architecture.svg" alt="InkFlow 两层架构" width="760">
</p>

InkFlow 分三层，从上到下：

### L3 · 编排层

- **orchestrator agent**：唯一能调用 `Agent` tool 的角色，负责意图识别、pipeline 调度、检查点交互
- **12 个 skill**：运行在主会话上下文里，处理用户的自然语言触发词
- **SessionStart hook**：每次会话启动时自动刷新 `runtime/profile-resolved/*`

### L2 · Profile 插件层

- **四类 slot**：principles（论证方式）/ voice（语气用词）/ typesetting（排版规则）/ constraints（字数与禁用词）
- **extends 链**：base → platform → 品牌，三层声明式叠加，后者覆盖前者
- **resolver**：展开继承图，深度合并 slot，写入 `runtime/profile-resolved/`

### L1 · 通用内核

- **8 个 subagent**：researcher / atomizer / outliner / writer / illustrator / auditor / polisher / publisher，各在独立上下文执行
- **writing-kernel 契约**：平台无关的最低线（标题规范、引用格式、视觉断点协议）
- **core rules**：通用写作质量规则和事实核查清单

---

## 设计哲学

### 1 · 交接协议原则

每次交给用户的是可判断的产出物（大纲 / 终稿 / 发布产物），不是 yes/no 问题。三个检查点（CP1 / CP2 / CP3）都展示完整产物，用户基于看得见的内容做决策。

### 2 · 上下文隔离原则

每个阶段独立 subagent，上下文不共享。调研素材（research-memo）不污染写作上下文，写作结果不污染审校上下文。这是长文章质量不衰减的关键。

### 3 · 审改分离原则

auditor 只审不改，输出审校报告；polisher 基于报告润色，不重新审校。裁判不下场，执行者不当裁判。

### 4 · 插件层隔离原则

栏目 / 品牌 / 平台的全部设定沉淀到 Profile 包，通用内核不感知任何具体栏目。换栏目 = 换 Profile，agent 代码零改动。

### 5 · 契约驱动原则

每个 agent 有明确的输入 / 输出契约（必须包含的章节、产物格式、校验规则）。orchestrator 在 agent 完成后独立校验，与 agent 上下文隔离，避免 agent 自我评估。

### 6 · 声明式流水线原则

pipeline 通过 `inkflow.yaml` 的 `stages` 字段定义，不在 agent 代码里硬编码顺序。stages 可重跑、可恢复、可跳过，orchestrator 消费声明，不持有流程逻辑。

---

## Agent 与 Skill 的分工

<p align="center">
  <img src="../../docs/assets/agents-skills.svg" alt="Agent 与 Skill 架构" width="960">
</p>

| 维度 | Agent | Skill |
|------|-------|-------|
| 运行位置 | 独立上下文子进程 | 主会话上下文 |
| 调用方式 | orchestrator 通过 `Agent` tool 派发 | 用户自然语言触发，Claude 自动加载 |
| 典型职责 | 执行一步生产（写作 / 审校 / 发布） | 意图识别、流程组织、Profile 管理 |
| Profile 感知 | 读 `runtime/profile-resolved/*` 的 slot 子集 | 读完整 resolved 产物，管理 lock 和 overlay |

**8 个 subagent**：

| Agent | 阶段 | 主要产物 |
|-------|------|---------|
| researcher | research | 调研备忘录 |
| atomizer | atoms | 9 类内容原子 |
| outliner | outline | 每平台大纲 |
| writer | draft | 每平台正文（逐节 + 合并） |
| illustrator | figures | 每平台配图（SVG / HTML / PNG） |
| auditor | audit | 审校报告 |
| polisher | polish | 润色终稿 + 变更溯源表 |
| publisher | publish | 各平台发布产物 |

---

## 目录结构详解

```
InkFlow/
│
├── .claude/                     # Claude Code 框架目录（只读，升级命令覆盖）
│   ├── agents/                  # 8 个 subagent + orchestrator 子模块
│   ├── skills/                  # 12 个 skill
│   ├── rules/core/              # 通用写作规范（writing-quality.md / fact-check.md）
│   └── settings.json            # SessionStart hook 配置
│
├── profiles/                    # Profile 插件包（你的创作资产）
│   ├── base-generic-chinese/    # 通用中文基座（所有 Profile 的 extends 起点）
│   ├── platform-wechat/         # 微信平台契约（25 容器 + CSS 安全 + 行内扩展）
│   └── lync-wechat-tech/        # 示例品牌 Profile（四栏目 × 微信）
│
├── framework/                   # 框架代码（只读，升级命令覆盖）
│   ├── config/
│   │   ├── inkflow.yaml         # Pipeline manifest（单一事实来源）
│   │   ├── artifact-layout.yaml # 产物路径模板
│   │   └── platform-lint-rules.yaml
│   ├── contracts/
│   │   ├── profile-protocol.md  # Profile 协议（权威原件）
│   │   ├── profile.schema.json  # Profile manifest JSON Schema
│   │   ├── writing-kernel.md    # 平台无关写作元契约
│   │   └── wechat-typeset.schema.json
│   └── tools/
│       ├── bootstrap.sh         # 框架拉取 / 升级
│       ├── profile_resolver.py  # extends 展开 + slot 合成
│       ├── inject_profile.py    # 绑定 / 查询 / overlay / stack
│       ├── validate_profile.py  # schema 校验
│       └── _adapters/           # 外部排版工具适配器
│
├── runtime/                     # 运行时状态（可清空，框架自动重建）
│   ├── profile-lock.yaml        # 当前绑定的 Profile id
│   ├── profile-resolved/        # 合成产物（所有 agent 的唯一读源）
│   ├── pipeline-states/         # pipeline 运行状态
│   └── typeset-capabilities.json
│
├── content/                     # 创作资产（纳入版本管理）
│   ├── articles/{slug}/         # 文章产物（intermediate / review / export）
│   ├── references/articles/     # 外部参考文章（profile skill 使用）
│   └── retrospectives/          # 运营数据 / 复盘日志
│
└── docs/                        # 用户文档
```

---

## Profile 解析流程

```
用户绑定 Profile（/profile use <id>）
       ↓
inject_profile.py 写 runtime/profile-lock.yaml
       ↓
profile_resolver.py 读 lock → 展开 extends 图（拓扑排序）
       ↓
       ├── 按拓扑顺序逐层加载 slot 文件
       ├── markdown slot：同名小节列表 union-dedup，非列表后者覆盖
       └── yaml slot：深度合并，list union-dedup，$replace 强制覆盖
       ↓
写出 runtime/profile-resolved/
  ├── principles.md
  ├── voice.md
  ├── typesetting.yaml
  ├── constraints.yaml
  └── manifest.json（各字段来源追溯）
       ↓
orchestrator 在派发 agent 时注入 slot 切片（按 routing.<stage> 过滤）
       ↓
subagent 只读 runtime/profile-resolved/*，执行生产
```
