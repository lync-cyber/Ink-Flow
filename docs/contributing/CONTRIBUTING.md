# 贡献指南

感谢你对 InkFlow 的关注！本文说明如何提交 Issue、贡献代码和扩展框架。

## 目录

- [提交 Issue](#提交-issue)
- [开发流程](#开发流程)
- [分支规范](#分支规范)
- [提交信息规范](#提交信息规范)
- [可贡献的方向](#可贡献的方向)
- [协议文件修改规则](#协议文件修改规则)

---

## 提交 Issue

提交前请先搜索现有 Issue，避免重复。

**Bug 报告**请包含：
- InkFlow 版本（见 `VERSION` 文件）
- 操作系统和 Claude Code 版本
- 复现步骤
- 实际行为 vs 期望行为
- 相关产物文件片段（脱敏后）

**功能请求**请说明：
- 解决什么问题
- 建议的实现思路（可选）
- 是否愿意提交 PR

---

## 开发流程

1. Fork 仓库，克隆到本地
2. 创建特性分支（见[分支规范](#分支规范)）
3. 修改代码
4. 本地测试：运行 `python framework/tools/validate_profile.py` 校验 Profile 变更
5. 提交 PR，填写模板

---

## 分支规范

```
feat/<feature-name>       # 新功能
fix/<issue-or-desc>       # Bug 修复
refactor/<scope>          # 重构（不改行为）
docs/<scope>              # 文档更新
chore/<scope>             # 构建 / 依赖 / 配置
```

---

## 提交信息规范

```
<type>(<scope>): <描述>

<可选正文>
```

**type** 参考：`feat` / `fix` / `refactor` / `docs` / `chore`

**示例：**

```
feat(profile): 支持 $replace 指令覆盖列表字段

在 typesetting.yaml 中使用 $replace: true 可强制覆盖继承链中的 list 字段，
而不是 union-dedup 合并。
```

---

## 可贡献的方向

### 新 Profile

如果你有自己的写作风格或栏目设定，欢迎通过 PR 贡献为示例 Profile：

1. 使用 `/profile extract sample` 或 `/profile extract goal` 生成 Profile 包
2. 放入 `profiles/<your-id>/`
3. 在 PR 描述中说明适用场景（栏目 / 平台 / 语气定位）

详细步骤见 [扩展指南](extending.md)。

### 新平台适配

如果你需要支持新的发布平台：

1. 参考 [扩展指南](extending.md) 的"扩展新平台"章节
2. 新增 `profiles/platform-<name>/`
3. 如果需要本地排版工具对接，参考 `framework/tools/_adapters/` 的 adapter 接口

### 框架工具改进

`framework/tools/` 下的 Python 脚本均欢迎改进：

- `profile_resolver.py` — 合成算法
- `inject_profile.py` — 注入模式
- `validate_profile.py` — 校验规则

**注意**：`framework/tools/bootstrap.sh` 是框架安装脚本，修改前请与维护者沟通，因为用户在升级时会直接覆盖此文件。

---

## 协议文件修改规则

修改 `framework/contracts/` 下的文件需要额外注意：

| 文件 | 影响范围 | 修改要求 |
|------|---------|---------|
| `profile-protocol.md` | resolver / 所有 agent / 两个 skill | 同步更新 `profile.schema.json`，bump schemaVersion |
| `writing-kernel.md` | 所有 agent | 同步更新 kernel schemaVersion |
| `wechat-typeset.schema.json` | adapter / lint.py | 需与 wechat-typeset 仓库协商（两端合约） |

Breaking change 必须 bump `apiVersion`；minor change 只需 version bump。
