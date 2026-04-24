#!/usr/bin/env bash
# InkFlow 框架文件拉取/同步脚本
# 职责：从远程仓库拉取或更新 InkFlow 框架文件（agents、skills、rules、tools）
# 不负责：项目目录结构初始化、.gitignore 生成、git init（由 workspace-init skill 处理）
#
# 用法:
#   bash framework/tools/bootstrap.sh [目标目录] [仓库URL]
#   bash framework/tools/bootstrap.sh [目标目录] --ssh       # 强制使用 SSH
#   bash framework/tools/bootstrap.sh [目标目录] --https     # 强制使用 HTTPS
#   curl -fsSL https://raw.githubusercontent.com/{owner}/InkFlow/main/tools/bootstrap.sh | bash
#
# 未指定仓库 URL 时，自动检测 SSH 连通性：可用则走 SSH，否则走 HTTPS
#
# 空目录 → 拉取框架文件；已有 framework/config/inkflow.yaml (mode: content) → 升级框架文件

set -euo pipefail

# ── 参数 ──────────────────────────────────────────────
TARGET_DIR="${1:-.}"
REPO_OWNER="lync-cyber"
REPO_NAME="Ink-Flow"
TEMP_DIR=""

# 解析选项（--ssh / --https）
PROTO=""
for arg in "$@"; do
    case "$arg" in
        --ssh)   PROTO="ssh" ;;
        --https) PROTO="https" ;;
    esac
done

# 确定仓库 URL：显式参数 > --ssh/--https > 自动检测
if [ -n "${2:-}" ] && [[ ! "$2" =~ ^-- ]]; then
    REPO_URL="$2"
elif [ "$PROTO" = "ssh" ]; then
    REPO_URL="git@github.com:${REPO_OWNER}/${REPO_NAME}.git"
elif [ "$PROTO" = "https" ]; then
    REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
else
    # 自动检测：SSH 可用则优先
    if ssh -T git@github.com 2>&1 | grep -qi "successfully authenticated"; then
        REPO_URL="git@github.com:${REPO_OWNER}/${REPO_NAME}.git"
    else
        REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
    fi
fi

# ── 颜色 ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[InkFlow]${NC} $*"; }
warn()  { echo -e "${YELLOW}[InkFlow]${NC} $*"; }
error() { echo -e "${RED}[InkFlow]${NC} $*" >&2; exit 1; }

cleanup() { [ -n "$TEMP_DIR" ] && rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

# ── 前置检查 ──────────────────────────────────────────
command -v git >/dev/null 2>&1 || error "需要 git，请先安装"

TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd || { mkdir -p "$TARGET_DIR" && cd "$TARGET_DIR" && pwd; })"

# 检测模式
INKFLOW_CONFIG="$TARGET_DIR/framework/config/inkflow.yaml"
if [ -f "$INKFLOW_CONFIG" ]; then
    existing_mode=$(grep 'workspace_mode:' "$INKFLOW_CONFIG" 2>/dev/null | awk '{print $2}' || echo "unknown")
    if [ "$existing_mode" = "content" ]; then
        warn "检测到已有内容工作区，切换到升级模式"
        UPGRADE_MODE=true
    elif [ "$existing_mode" = "framework" ]; then
        error "目标目录是框架开发目录 (mode: framework)，请指定内容工作区或空目录"
    else
        UPGRADE_MODE=false
    fi
else
    UPGRADE_MODE=false
fi

# ── 克隆框架 ──────────────────────────────────────────
TEMP_DIR="$(mktemp -d)"
info "从 $REPO_URL 获取框架..."
git clone --depth 1 --tags "$REPO_URL" "$TEMP_DIR/source" 2>/dev/null || error "克隆失败: $REPO_URL"

SOURCE_DIR="$TEMP_DIR/source"
# 版本号从 git tag 获取（单一事实来源），无 tag 时回退到 commit short hash
SOURCE_VERSION=$(cd "$SOURCE_DIR" && git describe --tags --always 2>/dev/null || echo "unknown")
info "框架版本: $SOURCE_VERSION"

# ── 框架文件清单 ──────────────────────────────────────
# 这些目录/文件属于框架层，拉取时复制、升级时覆盖
FRAMEWORK_DIRS=(
    ".claude/agents"
    ".claude/skills"
    ".claude/rules"
    ".claude/scripts"
    "framework/tools"
    "framework/contracts"
    "profiles"
)
FRAMEWORK_FILES=(
    "framework/config/inkflow.yaml"
    "framework/config/artifact-layout.yaml"
    "framework/config/platform-lint-rules.yaml"
    "framework/contracts/writing-kernel.md"
    "framework/contracts/profile-protocol.md"
    "framework/contracts/profile.schema.json"
    "framework/contracts/wechat-typeset.schema.json"
    ".claude/settings.json"
    "CLAUDE.md"
    "VERSION"
)

# ── 同步框架文件 ─────────────────────────────────────
sync_framework() {
    local src="$1" dst="$2"

    for dir in "${FRAMEWORK_DIRS[@]}"; do
        if [ -d "$src/$dir" ]; then
            mkdir -p "$(dirname "$dst/$dir")"
            [ -d "$dst/$dir" ] && rm -rf "$dst/$dir"
            cp -r "$src/$dir" "$(dirname "$dst/$dir")/"
        fi
    done

    for file in "${FRAMEWORK_FILES[@]}"; do
        if [ -f "$src/$file" ]; then
            mkdir -p "$(dirname "$dst/$file")"
            cp "$src/$file" "$dst/$file"
        fi
    done
}

# ── 执行同步 ──────────────────────────────────────────
sync_framework "$SOURCE_DIR" "$TARGET_DIR"

if [ "$UPGRADE_MODE" = true ]; then
    # ── 升级模式：仅更新版本号 ────────────────────────
    OLD_VERSION=$(grep 'inkflow_version:' "$INKFLOW_CONFIG" 2>/dev/null | awk '{print $2}' | tr -d '"' || echo "unknown")
    info "升级: $OLD_VERSION → $SOURCE_VERSION"
    sed -i "s/^inkflow_version:.*/inkflow_version: \"$SOURCE_VERSION\"/" "$INKFLOW_CONFIG"
    info "框架文件已更新，用户内容未受影响"
else
    info "框架文件已拉取到 $TARGET_DIR"
    echo ""
    echo "  下一步：在 Claude Code 中打开该目录，说「初始化工作区」完成项目配置"
    echo "  或手动创建 content/articles/、runtime/pipeline-states/ 等目录并修改 framework/config/inkflow.yaml 的 workspace_mode 为 content"
fi

info "完成！"
