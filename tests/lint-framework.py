#!/usr/bin/env python3
"""lint-framework.py — InkFlow 框架静态校验（L0 质量门禁）

用法: python tests/lint-framework.py [-v|--verbose]

  默认只输出错误和警告；加 -v 输出全部检查项。

校验项:
  1. 路径一致性 — agent/skill 中的路径引用与目录结构一致
  2. YAML Schema — config/inkflow.yaml 必填字段 + stages 结构
  3. Agent Frontmatter 完整性 — 必填字段 + RCCF 正文结构
  4. Skill Frontmatter 完整性 — 必填字段
  5. 交叉引用 — config/inkflow.yaml stages 中引用的 agent 文件存在
  6. 领域包完整性 — domain YAML 中列出的 skill/rule 均存在
  7. Typesetter WeChat CSS 兼容性
  8. 文件清理校验
  9. 栏目必填字段完整性 — columns.yaml 每栏目的四分区字段齐全
 10. Skill 名称交叉引用 — README/CLAUDE/agent/skill/lint 中出现的 skill 名必须真实存在
 11. Agent 依赖真实性 — agent frontmatter 的 dependencies.config/rules/tools 指向的文件存在
"""

import io
import re
import sys
from pathlib import Path

# Windows UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# ============================================================
# 结果收集
# ============================================================

errors = 0
warnings = 0
verbose = False
_section_has_issue = False
_current_section = ""


def error(msg: str):
    global errors, _section_has_issue
    if not verbose and not _section_has_issue:
        print(f"\n=== {_current_section} ===")
    _section_has_issue = True
    print(f"  ✗ ERROR: {msg}")
    errors += 1


def warn(msg: str):
    global warnings, _section_has_issue
    if not verbose and not _section_has_issue:
        print(f"\n=== {_current_section} ===")
    _section_has_issue = True
    print(f"  ⚠ WARN: {msg}")
    warnings += 1


def ok(msg: str):
    if verbose:
        print(f"  ✓ {msg}")


def section(title: str):
    global _section_has_issue, _current_section
    _section_has_issue = False
    _current_section = title
    if verbose:
        print(f"\n=== {title} ===")


# ============================================================
# 辅助函数
# ============================================================

def extract_frontmatter(path: Path) -> dict[str, str]:
    """从 Markdown 文件提取 frontmatter 字段（简易解析，不依赖 yaml 库）"""
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    fm = {}
    for line in lines[1:]:
        if line.strip() == "---":
            break
        m = re.match(r"^(\w[\w-]*):\s*(.*)", line)
        if m:
            fm[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return fm


def file_contains(path: Path, pattern: str) -> bool:
    """检查文件是否包含匹配 pattern 的行"""
    text = path.read_text(encoding="utf-8")
    return bool(re.search(pattern, text, re.MULTILINE))


def grep_recursive(dirs: list[Path], pattern: str) -> list[tuple[Path, int, str]]:
    """递归 grep，返回 (path, line_num, line) 列表"""
    results = []
    for d in dirs:
        if not d.exists():
            continue
        for f in d.rglob("*"):
            if not f.is_file() or f.suffix not in (".md", ".yaml", ".yml"):
                continue
            try:
                for i, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
                    if re.search(pattern, line):
                        results.append((f, i, line))
            except Exception:
                pass
    return results


def parse_yaml_list(text: str, section_name: str) -> list[str]:
    """提取顶层 YAML 列表段落的值（如 skills: 或 rules: 下的 - item 行）"""
    lines = text.splitlines()
    in_section = False
    result = []
    for line in lines:
        if re.match(rf"^{section_name}:", line):
            in_section = True
            continue
        if in_section:
            if line and not line[0].isspace() and not line.startswith("#"):
                break
            m = re.match(r"\s+-\s+(\S+)", line)
            if m:
                result.append(m.group(1))
    return result


def parse_stages(text: str) -> list[dict[str, str]]:
    """从 config/inkflow.yaml 提取 stages 列表中的 name 和 agent 字段"""
    lines = text.splitlines()
    in_stages = False
    stages = []
    current = {}
    for line in lines:
        if re.match(r"^stages:", line):
            in_stages = True
            continue
        if in_stages:
            if line and not line[0].isspace() and not line.startswith("#"):
                break
            # 仅匹配顶层 stage 项（缩进 2 空格 + dash），忽略嵌套的 - name:
            m = re.match(r"  - name:\s*(\S+)", line)
            if m:
                if current:
                    stages.append(current)
                current = {"name": m.group(1)}
                continue
            m = re.match(r"    agent:\s*(\S+)", line)
            if m and current:
                current["agent"] = m.group(1)
    if current:
        stages.append(current)
    return stages


# ============================================================
# 校验逻辑
# ============================================================

def check_path_consistency(repo: Path):
    section("1. 路径一致性检查")

    dirs = [repo / ".claude" / "agents", repo / ".claude" / "skills"]

    # 检查已废弃路径
    hits = grep_recursive(dirs, r"briefs/\{slug\}")
    if hits:
        for path, num, line in hits:
            error(f"发现已废弃的路径 'briefs/{{slug}}'（{path.relative_to(repo)}:{num}）")
    else:
        ok("无已废弃路径引用")

    # 检查硬编码绝对路径
    hits = grep_recursive(dirs, r"/c/Users|C:\\Users|/home/")
    if hits:
        for path, num, line in hits:
            error(f"发现硬编码绝对路径（{path.relative_to(repo)}:{num}）")
    else:
        ok("无硬编码绝对路径")

    # 检查已废弃的 pipelines 目录引用
    hits = grep_recursive(dirs, r"\.claude/pipelines/")
    if hits:
        for path, num, line in hits:
            warn(f"引用已废弃的 .claude/pipelines/ 路径（{path.relative_to(repo)}:{num}）")
    else:
        ok("无已废弃 pipelines 目录引用")


def check_yaml_schema(repo: Path):
    section("2. YAML Schema 校验")

    # config/inkflow.yaml
    inkflow = repo / "config/inkflow.yaml"
    if not inkflow.exists():
        error("config/inkflow.yaml 不存在")
        return

    # version 由 git tag 管理，不要求在 YAML 中硬编码
    # model_allocation 已移除（模型由 agent frontmatter 的 model 字段决定）
    for field in ("domains", "stages"):
        if file_contains(inkflow, rf"^{field}:"):
            ok(f"config/inkflow.yaml 包含 {field}")
        else:
            error(f"config/inkflow.yaml 缺少必填字段: {field}")

    # 校验 stages 结构：每个 stage 必须有 name
    text = inkflow.read_text(encoding="utf-8")
    stages = parse_stages(text)
    if stages:
        ok(f"config/inkflow.yaml 定义了 {len(stages)} 个 stage")
        for stage in stages:
            if "name" not in stage:
                error(f"config/inkflow.yaml stage 缺少 name 字段")
    else:
        error("config/inkflow.yaml stages 段为空")

    # 模型分配由各 agent frontmatter 的 model 字段直接管理，无需在 config/inkflow.yaml 中重复


def check_agent_frontmatter(repo: Path):
    section("3. Agent Frontmatter 完整性")

    agents_dir = repo / ".claude" / "agents"
    if not agents_dir.exists():
        error(".claude/agents/ 目录不存在")
        return

    agent_files = sorted(agents_dir.glob("*.md"))
    if not agent_files:
        error(".claude/agents/ 目录为空")
        return

    for agent_file in agent_files:
        aname = agent_file.stem
        if aname == "_template":
            continue

        fm = extract_frontmatter(agent_file)
        for field in ("name", "description", "allowed-tools", "model"):
            if field in fm:
                ok(f"agent {aname}: frontmatter 包含 {field}")
            else:
                # Check for legacy 'tools' field
                if field == "allowed-tools" and "tools" in fm:
                    error(f"agent {aname}: frontmatter 使用已废弃的 'tools' 字段，应改为 'allowed-tools'")
                else:
                    error(f"agent {aname}: frontmatter 缺少 {field}")

        # RCCF 结构
        for heading in ("## Role", "## Context", "## Constraints", "## Format", "## Exit Criteria"):
            if file_contains(agent_file, rf"^{re.escape(heading)}"):
                ok(f"agent {aname}: 包含 {heading}")
            else:
                error(f"agent {aname}: 缺少 RCCF 段落 {heading}")


def check_skill_frontmatter(repo: Path):
    section("4. Skill Frontmatter 完整性")

    skills_dir = repo / ".claude" / "skills"
    if not skills_dir.exists():
        error(".claude/skills/ 目录不存在")
        return

    skill_files = sorted(skills_dir.rglob("SKILL.md"))
    if not skill_files:
        error("未找到任何 SKILL.md 文件")
        return

    for skill_file in skill_files:
        sname = skill_file.parent.name

        fm = extract_frontmatter(skill_file)
        for field in ("name", "description"):
            if field in fm:
                ok(f"skill {sname}: frontmatter 包含 {field}")
            else:
                error(f"skill {sname}: frontmatter 缺少 {field}")

        # name 字段应与目录名一致
        name_val = fm.get("name", "")
        if name_val and name_val != sname:
            warn(f"skill {sname}: frontmatter name '{name_val}' 与目录名 '{sname}' 不一致")


def check_cross_references(repo: Path):
    section("5. 交叉引用完整性")

    inkflow = repo / "config/inkflow.yaml"
    if not inkflow.exists():
        error("config/inkflow.yaml 不存在，跳过交叉引用检查")
        return

    text = inkflow.read_text(encoding="utf-8")
    stages = parse_stages(text)
    agents_dir = repo / ".claude" / "agents"

    # 检查 stages 中引用的 agent 文件存在
    for stage in stages:
        agent_name = stage.get("agent")
        if not agent_name:
            continue
        agent_path = agents_dir / f"{agent_name}.md"
        if agent_path.exists():
            ok(f"stage '{stage['name']}': agent '{agent_name}' 存在")
        else:
            error(f"stage '{stage['name']}': agent '{agent_name}' 不存在 (.claude/agents/{agent_name}.md)")

    # 检查 contracts_source 引用的合约文件存在
    contracts_match = re.search(r"^contracts_source:\s*(.+)", text, re.MULTILINE)
    if contracts_match:
        contracts_path = repo / contracts_match.group(1).strip()
        if contracts_path.exists():
            ok(f"contracts_source '{contracts_match.group(1).strip()}' 存在")

            # 在合约文件中检查 rules 和 source 引用
            contracts_text = contracts_path.read_text(encoding="utf-8")
            for line in contracts_text.splitlines():
                rm = re.match(r"\s+-\s+\.claude/rules/(.+\.md)", line)
                if rm:
                    rule_path = repo / ".claude" / "rules" / rm.group(1)
                    if rule_path.exists():
                        ok(f"合约 rules 引用 '{rm.group(1)}' 存在")
                    else:
                        error(f"合约 rules 引用 '{rm.group(1)}' 不存在")

                sm = re.match(r"\s+source:\s*(tools/.+\.yaml)", line)
                if sm:
                    source_path = repo / sm.group(1)
                    if source_path.exists():
                        ok(f"合约 validation source '{sm.group(1)}' 存在")
                    else:
                        error(f"合约 validation source '{sm.group(1)}' 不存在")
        else:
            error(f"contracts_source '{contracts_match.group(1).strip()}' 不存在")

    # 兼容：检查 config/inkflow.yaml 中直接定义的 rules/source 引用（旧格式）
    for line in text.splitlines():
        m = re.match(r"\s+-\s+\.claude/rules/(.+\.md)", line)
        if m:
            rule_path = repo / ".claude" / "rules" / m.group(1)
            if rule_path.exists():
                ok(f"rules 引用 '{m.group(1)}' 存在")
            else:
                error(f"rules 引用 '{m.group(1)}' 不存在")

    for line in text.splitlines():
        m = re.match(r"\s+source:\s*(tools/.+\.yaml)", line)
        if m:
            source_path = repo / m.group(1)
            if source_path.exists():
                ok(f"validation source '{m.group(1)}' 存在")
            else:
                error(f"validation source '{m.group(1)}' 不存在")


def check_domain_completeness(repo: Path):
    section("6. 领域规则目录完整性")

    rules_dir = repo / ".claude" / "rules"
    inkflow = repo / "config/inkflow.yaml"
    if not inkflow.exists():
        warn("config/inkflow.yaml 不存在，跳过")
        return

    domain_refs = parse_yaml_list(inkflow.read_text(encoding="utf-8"), "domains")
    for domain_ref in domain_refs:
        domain_dir = rules_dir / "domains" / domain_ref
        if domain_dir.is_dir():
            ok(f"config/inkflow.yaml domain '{domain_ref}' 对应规则目录存在")
        else:
            error(f"config/inkflow.yaml domain '{domain_ref}' 缺少 .claude/rules/domains/{domain_ref}/")


# ============================================================
# Check 7: 典型文件存在性校验
# ============================================================

def check_file_cleanup(repo):
    """检查关键工具文件存在 + 已移除的历史目录未复活"""
    section("Check 7: 文件清理校验")

    # typesetter 模块已废弃，不应再出现
    typesetter_dir = repo / "tools" / "typesetter"
    if typesetter_dir.exists():
        error("tools/typesetter/ 应已移除（视觉交接迁移到 workspace/column-design/）")
    else:
        ok("tools/typesetter/ 已移除")

    # mermaid renderer 必须在位
    mermaid_py = repo / "tools" / "render" / "mermaid.py"
    if mermaid_py.exists():
        ok("tools/render/mermaid.py 存在")
    else:
        error("tools/render/mermaid.py 缺失")


# ============================================================
# Check 9: 栏目必填字段完整性
# ============================================================

# 分区 → 必填字段映射（与 columns.yaml 头部契约保持一致）
# 视觉字段已移出 columns.yaml，由 column-designing skill 独立产出
REQUIRED_COLUMN_FIELDS = {
    "品牌标识": ["name", "personality"],
    "写作指导": ["skeleton", "tone", "default_opening", "default_cta"],
    "运营指标": ["frequency", "kpi_targets"],
}


def check_column_completeness(repo):
    """校验 columns.yaml 中每个栏目包含所有必填字段（业务字段，视觉字段已移出）"""
    section("Check 9: 栏目必填字段完整性")

    columns_path = repo / "config" / "columns.yaml"
    if not columns_path.exists():
        error("columns.yaml 不存在")
        return

    text = columns_path.read_text(encoding="utf-8")

    # 简易解析：提取 columns: 下各栏目的顶层字段
    lines = text.splitlines()
    in_columns = False
    columns_data: dict[str, dict[str, bool]] = {}  # {col_id: {field: True}}
    current_col = None

    for line in lines:
        # 进入 columns: 顶层段
        if re.match(r"^columns:\s*$", line):
            in_columns = True
            continue

        if not in_columns:
            continue

        # 退出 columns 段（回到顶层）
        if line and not line[0].isspace() and not line.startswith("#"):
            break

        # 栏目 ID（2 空格缩进）
        m = re.match(r"  (\w+):\s*$", line)
        if m:
            current_col = m.group(1)
            columns_data[current_col] = {}
            continue

        if not current_col:
            continue

        # 栏目下的字段（4 空格缩进）
        fm = re.match(r"    (\w[\w-]*):", line)
        if fm:
            columns_data[current_col][fm.group(1)] = True

    if not columns_data:
        error("columns.yaml 未找到栏目定义")
        return

    ok(f"找到 {len(columns_data)} 个栏目: {', '.join(columns_data.keys())}")

    # 校验每个栏目的必填字段
    all_required = []
    for fields in REQUIRED_COLUMN_FIELDS.values():
        all_required.extend(fields)

    for col_id, fields in columns_data.items():
        for req_field in all_required:
            if req_field in fields:
                ok(f"栏目 {col_id}: 包含 {req_field}")
            else:
                error(f"栏目 {col_id}: 缺少必填字段 '{req_field}'")


# ============================================================
# Check 10: Skill 名称交叉引用
# ============================================================

# 已废弃的 skill 名 → 新名（用于报错时给出迁移提示）
DEPRECATED_SKILLS = {
    "style-profiling":   "style-learning (profile 模式)",
    "style-studying":    "style-learning (study 模式)",
    "article-structuring": "已合并进 config/columns.yaml 的 skeleton 段",
    "writing-guiding":     "已合并进 config/columns.yaml 的 phrase_replacements / human_voice_techniques",
    "opening-crafting":    "已合并进 config/columns.yaml 的 opening_strategies",
    "visual-theming":      "column-designing（产出 workspace/column-design/{slug}/theme.css）",
    "format-linting":      "quality-linting",
    "format-exporting":    "publisher agent（publish 阶段）",
}

# 允许在文件中作为"已废弃提示"出现的上下文 — 不报错
DEPRECATED_ALLOWED_CONTEXT = ("已废弃", "deprecated", "迁移至", "合并进", "旧名")


def check_skill_name_references(repo: Path):
    section("Check 10: Skill 名称交叉引用")

    skills_dir = repo / ".claude" / "skills"
    if not skills_dir.exists():
        error(".claude/skills/ 不存在，跳过")
        return

    existing_skills = {p.name for p in skills_dir.iterdir() if p.is_dir()}

    # 要扫描的文件集合：所有顶层文档 + agents + skills + tools/lint/lint.py + CLAUDE.md/README.md
    scan_files: list[Path] = []
    scan_files.append(repo / "README.md")
    scan_files.append(repo / "CLAUDE.md")
    scan_files.append(repo / "tools" / "lint" / "lint.py")
    scan_files.extend((repo / ".claude" / "agents").rglob("*.md"))
    scan_files.extend((repo / ".claude" / "skills").rglob("*.md"))

    found_issues = 0
    for f in scan_files:
        if not f.exists():
            continue
        try:
            text = f.read_text(encoding="utf-8")
        except Exception:
            continue
        for lineno, line in enumerate(text.splitlines(), 1):
            for dep, migration in DEPRECATED_SKILLS.items():
                # 匹配独立 token（反引号、空格、行首/尾）
                if re.search(rf"(?<![\w-]){re.escape(dep)}(?![\w-])", line):
                    # 允许在"迁移说明"上下文中提及
                    if any(ctx in line for ctx in DEPRECATED_ALLOWED_CONTEXT):
                        continue
                    # 允许在 README 的说明表中标注（已在 README 中整体重写，此处不应再命中）
                    error(f"{f.relative_to(repo)}:{lineno} 引用已废弃的 skill '{dep}' → 请改为 {migration}")
                    found_issues += 1

    if found_issues == 0:
        ok("无已废弃 skill 名残留")

    # 检查 pipeline-orchestrating SKILL.md 中显式提到的 skill 名是否都真实存在
    po_skill = skills_dir / "pipeline-orchestrating" / "SKILL.md"
    if po_skill.exists():
        text = po_skill.read_text(encoding="utf-8")
        # 匹配形如 "触发 foo-bar skill" 或 "`foo-bar`" 的 skill 名引用
        cited = set(re.findall(r"([a-z][a-z0-9-]+)\s+skill", text))
        for name in cited:
            if name in DEPRECATED_SKILLS:
                continue  # 已在上面检查
            if name in existing_skills:
                ok(f"pipeline-orchestrating 引用的 skill '{name}' 存在")
            elif "-" in name and len(name) > 4:
                warn(f"pipeline-orchestrating 引用的 skill '{name}' 不存在于 .claude/skills/")


# ============================================================
# Check 11: Agent 依赖真实性
# ============================================================

# agent frontmatter 中 dependencies 下允许的子段
DEP_SECTIONS = ("artifacts", "config", "rules", "tools")

# 占位符 — 出现则跳过存在性检查
PATH_PLACEHOLDERS = ("{slug}", "{N}", "{N-1}", "{NN}", "{col}", "{column}", "{profile}")


def parse_dependencies(path: Path) -> dict[str, list[str]]:
    """从 agent frontmatter 中解析 dependencies 块。
    返回 {section_name: [path1, path2, ...]}。路径末尾的 `# 注释` 会被剥离。
    """
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}

    # 定位 dependencies 段
    result: dict[str, list[str]] = {}
    in_fm = False
    in_deps = False
    current_section = None

    for line in lines:
        stripped = line.strip()
        if stripped == "---":
            if not in_fm:
                in_fm = True
                continue
            else:
                break  # frontmatter 结束

        if not in_fm:
            continue

        if re.match(r"^dependencies:\s*$", line):
            in_deps = True
            continue

        if in_deps:
            # 回到顶层字段（无缩进）→ 退出 deps
            if line and not line[0].isspace():
                in_deps = False
                current_section = None
                continue

            # 2 空格缩进的子段名（任何新段开始 → 重置 current_section）
            m = re.match(r"  (\w+):\s*$", line)
            if m:
                if m.group(1) in DEP_SECTIONS:
                    current_section = m.group(1)
                    result[current_section] = []
                else:
                    current_section = None  # 未知子段（modules/agents_dispatched 等）
                continue

            # 4 空格缩进的 list item
            if current_section:
                m = re.match(r"    -\s+(.+?)(?:\s+#.*)?$", line)
                if m:
                    result[current_section].append(m.group(1).strip())

    return result


def check_agent_dependencies(repo: Path):
    section("Check 11: Agent 依赖真实性")

    agents_dir = repo / ".claude" / "agents"
    if not agents_dir.exists():
        error(".claude/agents/ 目录不存在，跳过")
        return

    checked_count = 0
    for agent_file in sorted(agents_dir.glob("*.md")):
        if agent_file.stem == "_template":
            continue
        deps = parse_dependencies(agent_file)
        if not deps:
            continue

        for section_name in ("config", "rules", "tools"):
            for raw_path in deps.get(section_name, []):
                # 剥去 trailing 斜杠
                p = raw_path.rstrip("/")
                # 包含占位符 → 跳过（运行时才填充）
                if any(ph in p for ph in PATH_PLACEHOLDERS):
                    continue
                # 文件或目录必须存在
                target = repo / p
                if target.exists():
                    ok(f"agent {agent_file.stem}: {section_name}/{p} 存在")
                    checked_count += 1
                else:
                    error(f"agent {agent_file.stem}: {section_name} 引用不存在的路径 '{p}'")

    if checked_count == 0:
        warn("未发现任何 agent 依赖声明（可能是解析失败）")


# ============================================================
# 主入口
# ============================================================

def main():
    global verbose
    verbose = "-v" in sys.argv or "--verbose" in sys.argv

    repo = Path(__file__).resolve().parent.parent
    if not (repo / "config/inkflow.yaml").exists():
        print(f"错误: 未找到 config/inkflow.yaml，请在 InkFlow 项目根目录运行", file=sys.stderr)
        sys.exit(1)

    check_path_consistency(repo)
    check_yaml_schema(repo)
    check_agent_frontmatter(repo)
    check_skill_frontmatter(repo)
    check_cross_references(repo)
    check_domain_completeness(repo)
    check_file_cleanup(repo)
    check_column_completeness(repo)
    check_skill_name_references(repo)
    check_agent_dependencies(repo)

    print()
    print("================================")
    print(f"校验完成: {errors} 错误, {warnings} 警告")
    print("================================")

    if errors > 0:
        print("❌ 未通过质量门禁")
        sys.exit(1)
    else:
        print("✅ 通过质量门禁")
        sys.exit(0)


if __name__ == "__main__":
    main()
