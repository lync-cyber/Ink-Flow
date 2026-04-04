#!/usr/bin/env bash
# InkFlow 框架文件拉取/同步脚本（增量更新版）
# 职责：从远程仓库拉取或更新 InkFlow 框架文件（agents、skills、rules、tools）
# 不负责：项目目录结构初始化、.gitignore 生成、git init（由 workspace-init skill 处理）
#
# 用法:
#   bash tools/bootstrap.sh [目标目录] [仓库URL]
#   bash tools/bootstrap.sh [目标目录] --ssh       # 强制使用 SSH
#   bash tools/bootstrap.sh [目标目录] --https     # 强制使用 HTTPS
#   bash tools/bootstrap.sh --rollback [目标目录]  # 回滚到上一版本
#   curl -fsSL https://raw.githubusercontent.com/{owner}/InkFlow/main/tools/bootstrap.sh | bash
#
# 未指定仓库 URL 时，自动检测 SSH 连通性：可用则走 SSH，否则走 HTTPS
#
# 空目录 → 拉取框架文件；已有 .inkflow.yaml → 增量升级框架文件

set -euo pipefail

# ── 颜色 ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${GREEN}[InkFlow]${NC} $*"; }
warn()  { echo -e "${YELLOW}[InkFlow]${NC} $*"; }
error() { echo -e "${RED}[InkFlow]${NC} $*" >&2; exit 1; }
detail(){ echo -e "${CYAN}[InkFlow]${NC} $*"; }

# ── SHA256 兼容层（Linux sha256sum / macOS shasum） ───
if command -v sha256sum >/dev/null 2>&1; then
    sha_cmd() { sha256sum "$@"; }
elif command -v shasum >/dev/null 2>&1; then
    sha_cmd() { shasum -a 256 "$@"; }
else
    error "需要 sha256sum 或 shasum，请先安装"
fi

# ── 临时目录清理 ──────────────────────────────────────
TEMP_DIR=""
cleanup() { [ -n "$TEMP_DIR" ] && rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

# ── 回滚处理 ──────────────────────────────────────────
handle_rollback() {
    local target="${1:-.}"
    target="$(cd "$target" 2>/dev/null && pwd)"
    local backup_root="$target/.inkflow-backups"

    [ ! -d "$backup_root" ] && error "没有可用的备份"
    local latest
    latest=$(ls -td "$backup_root"/*/ 2>/dev/null | head -1)
    [ -z "$latest" ] && error "没有可用的备份"

    local backup_name
    backup_name=$(basename "$latest")
    info "回滚到备份: $backup_name"

    # 恢复备份的文件
    local count=0
    while IFS= read -r -d '' bf; do
        local rel="${bf#$latest}"
        [ "$rel" = ".inkflow-manifest.sha256" ] && continue
        mkdir -p "$(dirname "$target/$rel")"
        cp "$bf" "$target/$rel"
        count=$((count + 1))
    done < <(find "$latest" -type f -print0)

    # 恢复旧 manifest
    if [ -f "$latest/.inkflow-manifest.sha256" ]; then
        cp "$latest/.inkflow-manifest.sha256" "$target/.inkflow-manifest.sha256"
    fi

    # 从备份目录名提取旧版本号（格式: YYYYMMDD-HHMMSS-<version>）
    local old_ver
    old_ver=$(echo "$backup_name" | sed 's/^[0-9]*-[0-9]*-//')
    if [ -n "$old_ver" ] && [ -f "$target/.inkflow.yaml" ]; then
        sed -i.bak "s/^inkflow_version:.*/inkflow_version: \"$old_ver\"/" "$target/.inkflow.yaml"
        rm -f "$target/.inkflow.yaml.bak"
    fi

    info "已恢复 $count 个文件，回滚完成"
    exit 0
}

# ── 参数解析 ──────────────────────────────────────────
ROLLBACK=false
PROTO=""
POSITIONAL=()

for arg in "$@"; do
    case "$arg" in
        --rollback) ROLLBACK=true ;;
        --ssh)      PROTO="ssh" ;;
        --https)    PROTO="https" ;;
        *)          POSITIONAL+=("$arg") ;;
    esac
done

if [ "$ROLLBACK" = true ]; then
    handle_rollback "${POSITIONAL[0]:-}"
fi

TARGET_DIR="${POSITIONAL[0]:-.}"
REPO_OWNER="lync-cyber"
REPO_NAME="Ink-Flow"

# 确定仓库 URL：显式参数 > --ssh/--https > 自动检测
if [ -n "${POSITIONAL[1]:-}" ]; then
    REPO_URL="${POSITIONAL[1]}"
elif [ "$PROTO" = "ssh" ]; then
    REPO_URL="git@github.com:${REPO_OWNER}/${REPO_NAME}.git"
elif [ "$PROTO" = "https" ]; then
    REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
else
    if ssh -T git@github.com 2>&1 | grep -qi "successfully authenticated"; then
        REPO_URL="git@github.com:${REPO_OWNER}/${REPO_NAME}.git"
    else
        REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
    fi
fi

# ── 前置检查 ──────────────────────────────────────────
command -v git >/dev/null 2>&1 || error "需要 git，请先安装"

TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd || { mkdir -p "$TARGET_DIR" && cd "$TARGET_DIR" && pwd; })"

# 检测模式
UPGRADE_MODE=false
if [ -f "$TARGET_DIR/.inkflow.yaml" ]; then
    existing_mode=$(grep 'workspace_mode:' "$TARGET_DIR/.inkflow.yaml" 2>/dev/null | awk '{print $2}' || echo "unknown")
    if [ "$existing_mode" = "content" ]; then
        warn "检测到已有内容工作区，切换到增量升级模式"
        UPGRADE_MODE=true
    elif [ "$existing_mode" = "framework" ]; then
        error "目标目录是框架开发目录 (mode: framework)，请指定内容工作区或空目录"
    fi
fi

# ── 克隆框架 ──────────────────────────────────────────
TEMP_DIR="$(mktemp -d)"
info "从 $REPO_URL 获取框架..."
git clone --depth 1 --tags "$REPO_URL" "$TEMP_DIR/source" 2>/dev/null || error "克隆失败: $REPO_URL"

SOURCE_DIR="$TEMP_DIR/source"
SOURCE_VERSION=$(cd "$SOURCE_DIR" && git describe --tags --always 2>/dev/null || echo "unknown")
info "框架版本: $SOURCE_VERSION"

# ── 框架文件清单 ──────────────────────────────────────
FRAMEWORK_DIRS=(".claude/agents" ".claude/skills" ".claude/rules" "tools")
FRAMEWORK_FILES=("styles/default/columns.yaml" "styles/default/markdown-extensions.md" ".claude/settings.json")

# ── 用户保护模式 ──────────────────────────────────────
USER_PROTECTED_PATTERNS=(
    ".claude/rules/local/*"
    ".claude/agents/local-*"
    "tools/local-*"
)

# ── 函数：生成清单 ────────────────────────────────────
generate_manifest() {
    local root="$1"
    local manifest_file="$2"
    local file_list
    file_list="$TEMP_DIR/filelist.tmp"
    : > "$file_list"

    for dir in "${FRAMEWORK_DIRS[@]}"; do
        if [ -d "$root/$dir" ]; then
            (cd "$root" && find "$dir" -type f) >> "$file_list"
        fi
    done

    for file in "${FRAMEWORK_FILES[@]}"; do
        [ -f "$root/$file" ] && echo "$file" >> "$file_list"
    done

    sort -u "$file_list" | while IFS= read -r fpath; do
        sha_cmd "$root/$fpath" | awk -v p="$fpath" '{print $1 "  " p}'
    done > "$manifest_file"
}

# ── 函数：比较清单 ────────────────────────────────────
diff_manifests() {
    local old_manifest="$1"
    local new_manifest="$2"
    local added_file="$3"
    local changed_file="$4"
    local removed_file="$5"

    : > "$added_file"
    : > "$changed_file"
    : > "$removed_file"

    # 提取路径和哈希（忽略注释行）
    local old_data new_data
    old_data="$TEMP_DIR/old_data.tmp"
    new_data="$TEMP_DIR/new_data.tmp"

    if [ -f "$old_manifest" ]; then
        grep -v '^#' "$old_manifest" | sort -k2 > "$old_data"
    else
        : > "$old_data"
    fi
    grep -v '^#' "$new_manifest" | sort -k2 > "$new_data"

    local old_paths new_paths
    old_paths="$TEMP_DIR/old_paths.tmp"
    new_paths="$TEMP_DIR/new_paths.tmp"
    awk '{print $2}' "$old_data" > "$old_paths"
    awk '{print $2}' "$new_data" > "$new_paths"

    # added: 新版有、旧版无
    comm -13 "$old_paths" "$new_paths" > "$added_file"

    # removed: 旧版有、新版无
    comm -23 "$old_paths" "$new_paths" > "$removed_file"

    # changed: 都有但哈希不同
    comm -12 "$old_paths" "$new_paths" | while IFS= read -r path; do
        local old_hash new_hash
        old_hash=$(awk -v p="$path" '$2==p {print $1}' "$old_data")
        new_hash=$(awk -v p="$path" '$2==p {print $1}' "$new_data")
        [ "$old_hash" != "$new_hash" ] && echo "$path"
    done > "$changed_file"

    return 0
}

# ── 函数：检查用户保护 ────────────────────────────────
is_user_protected() {
    local filepath="$1"

    for pattern in "${USER_PROTECTED_PATTERNS[@]}"; do
        # shellcheck disable=SC2254
        case "$filepath" in
            $pattern) return 0 ;;
        esac
    done

    # 检查 .inkflow-keep 标记
    local dir
    dir="$(dirname "$filepath")"
    while [ "$dir" != "." ] && [ "$dir" != "/" ]; do
        [ -f "$TARGET_DIR/$dir/.inkflow-keep" ] && return 0
        dir="$(dirname "$dir")"
    done

    return 1
}

# ── 函数：创建备份 ────────────────────────────────────
create_backup() {
    local backup_dir="$1"
    local changed_file="$2"
    local removed_file="$3"

    mkdir -p "$backup_dir"

    local count=0
    cat "$changed_file" "$removed_file" | while IFS= read -r fpath; do
        [ -z "$fpath" ] && continue
        if [ -f "$TARGET_DIR/$fpath" ]; then
            mkdir -p "$backup_dir/$(dirname "$fpath")"
            cp "$TARGET_DIR/$fpath" "$backup_dir/$fpath"
            count=$((count + 1))
        fi
    done

    # 保存旧 manifest
    if [ -f "$TARGET_DIR/.inkflow-manifest.sha256" ]; then
        cp "$TARGET_DIR/.inkflow-manifest.sha256" "$backup_dir/.inkflow-manifest.sha256"
    fi

    detail "备份已创建: $(basename "$backup_dir")"
}

# ── 函数：清理旧备份（保留 3 个） ────────────────────
prune_backups() {
    local backup_root="$TARGET_DIR/.inkflow-backups"
    [ ! -d "$backup_root" ] && return
    local old_backups
    old_backups=$(ls -td "$backup_root"/*/ 2>/dev/null | tail -n +4)
    if [ -n "$old_backups" ]; then
        echo "$old_backups" | xargs rm -rf
    fi
}

# ── 函数：变更报告 ────────────────────────────────────
generate_change_report() {
    local old_ver="$1" new_ver="$2"
    local added_file="$3" changed_file="$4" removed_file="$5" skipped_file="$6"
    local report="$TARGET_DIR/.inkflow-upgrade.log"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    local added_count changed_count removed_count skipped_count unchanged_count
    added_count=$(wc -l < "$added_file" | tr -d ' ')
    changed_count=$(wc -l < "$changed_file" | tr -d ' ')
    removed_count=$(wc -l < "$removed_file" | tr -d ' ')
    skipped_count=$(wc -l < "$skipped_file" | tr -d ' ')

    # 计算未变更文件数
    local total_new
    total_new=$(grep -cv '^#' "$TEMP_DIR/source.manifest" 2>/dev/null || echo "0")
    unchanged_count=$((total_new - added_count - changed_count))
    [ "$unchanged_count" -lt 0 ] && unchanged_count=0

    {
        echo ""
        echo "══════════════════════════════════════════════════"
        echo "InkFlow upgrade: $old_ver → $new_ver  ($timestamp)"
        echo "══════════════════════════════════════════════════"
        echo ""

        if [ "$added_count" -gt 0 ]; then
            echo "Added ($added_count):"
            sed 's/^/  + /' "$added_file"
            echo ""
        fi

        if [ "$changed_count" -gt 0 ]; then
            echo "Changed ($changed_count):"
            sed 's/^/  ~ /' "$changed_file"
            echo ""
        fi

        if [ "$removed_count" -gt 0 ]; then
            echo "Removed ($removed_count):"
            sed 's/^/  - /' "$removed_file"
            echo ""
        fi

        echo "Unchanged: $unchanged_count files"

        if [ "$skipped_count" -gt 0 ]; then
            echo ""
            echo "User files preserved:"
            sed 's/^/  /' "$skipped_file"
        fi

        echo ""
        echo "══════════════════════════════════════════════════"
    } | tee -a "$report"
}

# ── 函数：增量同步 ────────────────────────────────────
sync_framework() {
    local src="$1" dst="$2"

    # 1. 生成源清单
    local source_manifest="$TEMP_DIR/source.manifest"
    generate_manifest "$src" "$source_manifest"

    # 2. 加载目标现有清单
    local old_manifest="$dst/.inkflow-manifest.sha256"

    # 3. 计算差异
    local added="$TEMP_DIR/added"
    local changed="$TEMP_DIR/changed"
    local removed="$TEMP_DIR/removed"
    local skipped="$TEMP_DIR/skipped"
    : > "$skipped"

    diff_manifests "$old_manifest" "$source_manifest" "$added" "$changed" "$removed"

    local added_count changed_count removed_count
    added_count=$(wc -l < "$added" | tr -d ' ')
    changed_count=$(wc -l < "$changed" | tr -d ' ')
    removed_count=$(wc -l < "$removed" | tr -d ' ')

    # 4. 无变更则提前退出
    if [ "$added_count" -eq 0 ] && [ "$changed_count" -eq 0 ] && [ "$removed_count" -eq 0 ]; then
        info "框架文件已是最新版本，无需更新"
        # 仍然保存 manifest（兼容旧版迁移）
        cp "$source_manifest" "$dst/.inkflow-manifest.sha256"
        return 0
    fi

    info "变更统计: +$added_count ~$changed_count -$removed_count"

    # 5. 创建备份（仅升级模式）
    if [ "$UPGRADE_MODE" = true ] && { [ "$changed_count" -gt 0 ] || [ "$removed_count" -gt 0 ]; }; then
        local old_ver
        old_ver=$(grep 'inkflow_version:' "$dst/.inkflow.yaml" 2>/dev/null | awk '{print $2}' | tr -d '"' || echo "unknown")
        local backup_dir="$dst/.inkflow-backups/$(date +%Y%m%d-%H%M%S)-${old_ver}"
        create_backup "$backup_dir" "$changed" "$removed"
    fi

    # 6. 复制新增和变更文件
    local copy_count=0
    cat "$added" "$changed" | while IFS= read -r fpath; do
        [ -z "$fpath" ] && continue
        mkdir -p "$(dirname "$dst/$fpath")"
        cp "$src/$fpath" "$dst/$fpath"
        copy_count=$((copy_count + 1))
    done

    # 7. 删除已移除的文件（跳过用户保护文件）
    local actual_removed="$TEMP_DIR/actual_removed"
    : > "$actual_removed"
    while IFS= read -r fpath; do
        [ -z "$fpath" ] && continue
        if is_user_protected "$fpath"; then
            echo "$fpath" >> "$skipped"
            detail "保留用户文件: $fpath"
        else
            rm -f "$dst/$fpath"
            echo "$fpath" >> "$actual_removed"
        fi
    done < "$removed"

    # 8. 清理空目录（仅在框架目录内）
    for dir in "${FRAMEWORK_DIRS[@]}"; do
        if [ -d "$dst/$dir" ]; then
            find "$dst/$dir" -type d -empty -delete 2>/dev/null || true
        fi
    done

    # 9. 保存新 manifest
    cp "$source_manifest" "$dst/.inkflow-manifest.sha256"

    # 10. 生成变更报告（仅升级模式）
    if [ "$UPGRADE_MODE" = true ]; then
        local old_ver
        old_ver=$(grep 'inkflow_version:' "$dst/.inkflow.yaml" 2>/dev/null | awk '{print $2}' | tr -d '"' || echo "unknown")
        generate_change_report "$old_ver" "$SOURCE_VERSION" "$added" "$changed" "$actual_removed" "$skipped"
    fi

    # 11. 清理旧备份
    prune_backups
}

# ── 执行同步 ──────────────────────────────────────────
sync_framework "$SOURCE_DIR" "$TARGET_DIR"

# 部署内容版 CLAUDE.md（非框架版）
if [ -f "$SOURCE_DIR/tools/CLAUDE.content.md" ]; then
    cp "$SOURCE_DIR/tools/CLAUDE.content.md" "$TARGET_DIR/CLAUDE.md"
fi

if [ "$UPGRADE_MODE" = true ]; then
    # ── 升级模式：更新版本号和时间戳 ─────────────────
    OLD_VERSION=$(grep 'inkflow_version:' "$TARGET_DIR/.inkflow.yaml" 2>/dev/null | awk '{print $2}' | tr -d '"' || echo "unknown")
    info "升级: $OLD_VERSION → $SOURCE_VERSION"
    sed -i.bak "s/^inkflow_version:.*/inkflow_version: \"$SOURCE_VERSION\"/" "$TARGET_DIR/.inkflow.yaml"
    rm -f "$TARGET_DIR/.inkflow.yaml.bak"

    # 更新升级时间戳
    if grep -q '^inkflow_last_upgrade:' "$TARGET_DIR/.inkflow.yaml"; then
        sed -i.bak "s/^inkflow_last_upgrade:.*/inkflow_last_upgrade: \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"/" "$TARGET_DIR/.inkflow.yaml"
    else
        # 追加到 inkflow_version 后面
        sed -i.bak "/^inkflow_version:.*/a inkflow_last_upgrade: \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" "$TARGET_DIR/.inkflow.yaml"
    fi
    rm -f "$TARGET_DIR/.inkflow.yaml.bak"

    info "框架文件已增量更新，用户内容未受影响"
else
    # ── 首次拉取：复制基础 .inkflow.yaml ──────────────
    cp "$SOURCE_DIR/.inkflow.yaml" "$TARGET_DIR/.inkflow.yaml"
    info "框架文件已拉取到 $TARGET_DIR"
    echo ""
    echo "  下一步：在 Claude Code 中打开该目录，说「初始化工作区」完成项目配置"
    echo "  或手动创建 articles/、retro/ 等目录并修改 .inkflow.yaml 的 workspace_mode 为 content"
fi

info "完成！"
