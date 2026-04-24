# 安装指南

## 目录

- [环境要求](#环境要求)
- [安装方式 A：从零部署](#安装方式-a从零部署)
- [安装方式 B：在已有仓库内升级框架](#安装方式-b在已有仓库内升级框架)
- [绑定 Profile](#绑定-profile)
- [验证安装](#验证安装)
- [常见问题](#常见问题)

---

## 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| [Claude Code](https://claude.ai/code) | 最新版 | 运行 agent / skill 的宿主环境 |
| Anthropic API | — | 需要有效的 API Key |
| Python | ≥ 3.10 | 运行框架工具脚本 |
| PyYAML | 任意 | `pip install pyyaml` |
| Git | 任意 | 版本管理 |

**可选**（微信公众号本地排版）：

- Node.js ≥ 18
- [wechat-typeset](https://github.com/lync-cyber/wechat-typeset) 克隆到 Ink-Flow **同级**目录

---

## 安装方式 A：从零部署

在空目录（或新建仓库）下执行：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/lync-cyber/Ink-Flow/main/framework/tools/bootstrap.sh)
```

脚本完成后，当前目录结构：

```
./
├── .claude/          # agent / skill / hook 定义
├── framework/        # 框架代码与配置
├── profiles/         # 内置 Profile 包（base / platform-wechat / lync-wechat-tech）
├── runtime/          # 运行时状态（首次为空）
├── content/          # 待创建（下一步初始化）
├── CLAUDE.md
└── README.md
```

---

## 安装方式 B：在已有仓库内升级框架

```bash
bash framework/tools/bootstrap.sh . https://github.com/lync-cyber/Ink-Flow
```

或在 Claude Code 中说：**"更新 InkFlow"** / **"升级框架"**。

bootstrap.sh 只覆盖 `.claude/` 和 `framework/` 下的框架文件，不触碰 `content/` 和 `profiles/`（你的创作资产）。

---

## 绑定 Profile

框架安装完成后，需要绑定一个 Profile，agent 才有写作设定可以读取。

**在 Claude Code 中：**

```
/profile use lync-wechat-tech
```

**或命令行：**

```bash
python framework/tools/inject_profile.py set-active lync-wechat-tech
```

执行后会自动运行 profile_resolver.py，将合成结果写入 `runtime/profile-resolved/`。

> **内置可用 Profile**
> - `base-generic-chinese` — 通用中文基座（不要直接绑定，作为其他 Profile 的 extends 基础）
> - `platform-wechat` — 微信平台排版契约（容器白名单 / CSS 安全规则）
> - `lync-wechat-tech` — 示例品牌 Profile，微信四栏目（技术专题 / 学术前沿 / 行业趋势 / 人物故事）

---

## 验证安装

在 Claude Code 中说 **"初始化工作区"**，skill 会创建 `content/` 目录结构并确认框架正常加载。

检查关键文件是否存在：

```bash
ls runtime/profile-resolved/
# 应有: principles.md  voice.md  typesetting.yaml  constraints.yaml  manifest.json
```

如果目录为空，说明 resolver 未运行，手动执行：

```bash
python framework/tools/profile_resolver.py
```

---

## 常见问题

**Q：`runtime/profile-resolved/` 目录不存在或为空**

先绑定 Profile：`/profile use <id>`，resolver 会自动触发。也可手动运行 `python framework/tools/profile_resolver.py`。

**Q：bootstrap.sh 下载失败**

检查网络连通性。国内环境可先克隆仓库，再在本地运行 `bash framework/tools/bootstrap.sh .`。

**Q：PyYAML 未安装**

```bash
pip install pyyaml
# 或使用 uv
uv pip install pyyaml
```

**Q：agent 报错"Profile resolved 缺失"**

框架要求 `runtime/profile-resolved/` 必须存在才能运行 agent。按上述步骤绑定 Profile 即可。
