# Changelog

所有重要变更记录在此文件。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [Semantic Versioning](https://semver.org/)。

## [Unreleased]

## [1.0.0] - 2026-04-24

### 新增

- **Profile 插件化架构**：通用写作内核与可插拔 Profile 层完全分离；四类 slot（principles / voice / typesetting / constraints）声明式定义写作设定
- **8 阶段 Pipeline**：brief → research → atoms → outline → draft ∥ figures → audit → polish → publish，三检查点驱动
- **内容原子池（atoms）**：atomizer agent 将调研备忘录拆解为 9 类可跨平台复用的内容原子
- **多平台分发**：outline 起按 `brief.target_platforms` 扇出，支持微信 / 知乎 / 掘金 / 小红书同步产出
- **Profile 三种注入模式**：full（工作区持久）/ overlay（单篇局部）/ stack（临时虚拟组合）
- **Profile 两种提取路径**：goal（目标描述驱动）/ sample（样本文章反推）
- **12 个 Skill**：pipeline-orchestrating / profile-extracting / profile-injecting / workspace-init / quality-linting / title-crafting / content-planning / creation-reviewing / metrics-tracking / performance-benchmarking / publish-preparing
- **格式 Lint**：W1-W4 容器规则 + A1 平台规则，lint.py 从 profile-resolved 读取规则数据
- **排版适配器**：与独立 repo [wechat-typeset](https://github.com/lync-cyber/wechat-typeset) 对账，读 capabilities.json 做 variant 白名单校验
- **SessionStart Hook**：会话启动时自动刷新 runtime/profile-resolved/*

### 架构整改（相对开发初版）

- 容器语法下沉到 writer 阶段，废除独立 typeset 阶段
- Profile resolver 支持 `extends` 多层继承链，按拓扑顺序深度合并
- 写作契约剥离为 `framework/contracts/writing-kernel.md`，单一事实来源
- orchestrator 子模块化（brief / fanout / checkpoints / lifecycle / recovery / stages）
- 路径漂移修复：所有 agent 统一从 `runtime/profile-resolved/*` 读取，禁止直接读 `profiles/{id}/*`

[Unreleased]: https://github.com/lync-cyber/Ink-Flow/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lync-cyber/Ink-Flow/releases/tag/v1.0.0
