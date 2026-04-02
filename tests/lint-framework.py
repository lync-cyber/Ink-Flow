#!/usr/bin/env python3
"""lint-framework.py — InkFlow 框架静态校验（L0 质量门禁）

用法: python tests/lint-framework.py [-v|--verbose]

  默认只输出错误和警告；加 -v 输出全部检查项。

校验项:
  1. 路径一致性 — agent/skill 中的路径引用与目录结构一致
  2. YAML Schema — .inkflow.yaml 必填字段 + stages 结构
  3. Agent Frontmatter 完整性 — 必填字段 + RCCF 正文结构
  4. Skill Frontmatter 完整性 — 必填字段
  5. 交叉引用 — .inkflow.yaml stages 中引用的 agent 文件存在
  6. 领域包完整性 — domain YAML 中列出的 skill/rule 均存在
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
    """从 .inkflow.yaml 提取 stages 列表中的 name 和 agent 字段"""
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

    # .inkflow.yaml
    inkflow = repo / ".inkflow.yaml"
    if not inkflow.exists():
        error(".inkflow.yaml 不存在")
        return

    # version 由 git tag 管理，不要求在 YAML 中硬编码
    for field in ("domains", "model_allocation", "stages"):
        if file_contains(inkflow, rf"^{field}:"):
            ok(f".inkflow.yaml 包含 {field}")
        else:
            error(f".inkflow.yaml 缺少必填字段: {field}")

    # 校验 stages 结构：每个 stage 必须有 name
    text = inkflow.read_text(encoding="utf-8")
    stages = parse_stages(text)
    if stages:
        ok(f".inkflow.yaml 定义了 {len(stages)} 个 stage")
        for stage in stages:
            if "name" not in stage:
                error(f".inkflow.yaml stage 缺少 name 字段")
    else:
        error(".inkflow.yaml stages 段为空")

    # 校验 model_allocation 中的 agent 与 agent 文件一致
    agents_dir = repo / ".claude" / "agents"
    if agents_dir.exists():
        agent_files = {f.stem for f in agents_dir.glob("*.md") if f.stem != "_template"}
        model_lines = []
        in_model = False
        for line in text.splitlines():
            if re.match(r"^model_allocation:", line):
                in_model = True
                continue
            if in_model:
                if line and not line[0].isspace() and not line.startswith("#"):
                    break
                m = re.match(r"\s+(\w[\w-]*):", line)
                if m:
                    model_lines.append(m.group(1))

        for agent_name in model_lines:
            if agent_name in agent_files:
                ok(f"model_allocation '{agent_name}' 有对应 agent 文件")
            else:
                error(f"model_allocation '{agent_name}' 无对应 agent 文件 (.claude/agents/{agent_name}.md)")


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

    inkflow = repo / ".inkflow.yaml"
    if not inkflow.exists():
        error(".inkflow.yaml 不存在，跳过交叉引用检查")
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

    # 检查 stages 中引用的 rules 文件存在
    for line in text.splitlines():
        m = re.match(r"\s+-\s+\.claude/rules/(.+\.md)", line)
        if m:
            rule_path = repo / ".claude" / "rules" / m.group(1)
            if rule_path.exists():
                ok(f"rules 引用 '{m.group(1)}' 存在")
            else:
                error(f"rules 引用 '{m.group(1)}' 不存在")

    # 检查 stages 中引用的 validation source 文件存在
    for line in text.splitlines():
        m = re.match(r"\s+source:\s*(tools/.+\.yaml)", line)
        if m:
            source_path = repo / m.group(1)
            if source_path.exists():
                ok(f"validation source '{m.group(1)}' 存在")
            else:
                error(f"validation source '{m.group(1)}' 不存在")


def check_domain_completeness(repo: Path):
    section("6. 领域包完整性")

    skills_dir = repo / ".claude" / "skills"
    rules_dir = repo / ".claude" / "rules"

    # 查找 domain-*.yaml 文件（新结构：扁平化在 .claude/skills/ 下）
    domain_files = sorted(skills_dir.glob("domain-*.yaml"))
    if not domain_files:
        warn("未找到任何 domain-*.yaml 领域包文件")
        return

    for domain_yaml in domain_files:
        dname = domain_yaml.stem.replace("domain-", "")
        text = domain_yaml.read_text(encoding="utf-8")

        # 检查必填字段
        for field in ("name", "skills", "rules"):
            if re.search(rf"^{field}:", text, re.MULTILINE):
                ok(f"domain {dname}: 包含 {field}")
            else:
                error(f"domain {dname}: 缺少必填字段 {field}")

        # 检查 skills 列表中的 skill 是否存在
        skill_names = parse_yaml_list(text, "skills")
        for skill in skill_names:
            skill_path = skills_dir / skill / "SKILL.md"
            if skill_path.exists():
                ok(f"domain {dname}: skill '{skill}' 存在")
            else:
                error(f"domain {dname}: skill '{skill}' 不存在 (.claude/skills/{skill}/SKILL.md)")

        # 检查 rules 列表中的 rule 是否存在
        rule_names = parse_yaml_list(text, "rules")
        for rule in rule_names:
            # 搜索 core/ 和 domains/*/ 下的 rule 文件
            found = False
            for rule_file in rules_dir.rglob(f"{rule}.md"):
                found = True
                break
            if found:
                ok(f"domain {dname}: rule '{rule}' 存在")
            else:
                error(f"domain {dname}: rule '{rule}' 不存在")

    # 检查 .inkflow.yaml 中的 domains 引用都有对应的 domain YAML
    inkflow = repo / ".inkflow.yaml"
    if inkflow.exists():
        inkflow_text = inkflow.read_text(encoding="utf-8")
        domain_refs = parse_yaml_list(inkflow_text, "domains")
        for domain_ref in domain_refs:
            domain_path = skills_dir / f"domain-{domain_ref}.yaml"
            if domain_path.exists():
                ok(f".inkflow.yaml domain '{domain_ref}' 有对应领域包文件")
            else:
                error(f".inkflow.yaml domain '{domain_ref}' 无对应领域包文件 (.claude/skills/domain-{domain_ref}.yaml)")


# ============================================================
# Check 7: Typesetter WeChat CSS 兼容性
# ============================================================

def check_typesetter_wechat_compat(repo):
    """检查 typesetter 渲染输出中不使用微信不兼容的 CSS 属性"""
    section("Check 7: Typesetter WeChat CSS 兼容性")
    index_path = repo / "tools" / "wechat-typesetter" / "index.html"
    if not index_path.exists():
        warn("typesetter index.html 未找到，跳过检查")
        return

    import re
    content = index_path.read_text(encoding="utf-8")

    # Check for gap: in parts.push() template strings (rendered output)
    # Match parts.push(`...gap:Npx...`) patterns
    matches = re.findall(r'parts\.push\(`[^`]*gap:\d+px[^`]*`\)', content)
    if matches:
        for m in matches:
            error(f"typesetter 渲染输出使用了 CSS 'gap'（微信不兼容）: {m[:80]}...")
    else:
        ok("typesetter 渲染输出无 CSS 'gap' 属性")


# ============================================================
# Check 8: THEMES 同步校验
# ============================================================

def check_theme_sync(repo):
    """检查 index.html THEMES 是否与 columns.yaml 同步"""
    section("Check 8: THEMES 同步校验")

    index_path = repo / "tools" / "wechat-typesetter" / "index.html"
    columns_path = repo / "styles" / "default" / "columns.yaml"

    if not index_path.exists() or not columns_path.exists():
        warn("index.html 或 columns.yaml 缺失，跳过 THEMES 同步校验")
        return

    index_text = index_path.read_text(encoding="utf-8")
    columns_text = columns_path.read_text(encoding="utf-8")

    # Check THEME_START/END markers exist
    if "// THEME_START" not in index_text:
        error("index.html 缺少 // THEME_START 标记（运行 python tools/sync-themes.py 同步）")
        return
    if "// THEME_END" not in index_text:
        error("index.html 缺少 // THEME_END 标记")
        return
    ok("index.html 包含 THEME_START/END 标记")

    # Check column colors match between files
    # Extract primary colors from columns.yaml
    yaml_colors = {}
    current_col = None
    in_colors = False
    for line in columns_text.splitlines():
        m = re.match(r"  (\w+):\s*$", line)
        if m and not in_colors:
            current_col = m.group(1)
            continue
        if current_col and re.match(r"    colors:\s*$", line):
            in_colors = True
            continue
        if in_colors:
            cm = re.match(r'      primary:\s*"(#[0-9a-fA-F]+)"', line)
            if cm:
                yaml_colors[current_col] = cm.group(1)
                in_colors = False
                current_col = None

    # Extract primary colors from index.html THEMES
    html_colors = {}
    for m in re.finditer(r'(\w+):\s*\{[^}]*id:\s*"(\w+)"[^}]*primary:\s*"(#[0-9a-fA-F]+)"', index_text):
        html_colors[m.group(2)] = m.group(3)

    for col_id, yaml_primary in yaml_colors.items():
        html_primary = html_colors.get(col_id)
        if html_primary and html_primary.lower() == yaml_primary.lower():
            ok(f"栏目 {col_id} primary 色同步: {yaml_primary}")
        elif html_primary:
            error(f"栏目 {col_id} primary 色不同步: columns.yaml={yaml_primary}, index.html={html_primary}")
        else:
            error(f"栏目 {col_id} 在 index.html THEMES 中缺失")

    # Check dark.primary for story (contrast fix)
    yaml_dark_primary = None
    in_story = False
    in_dark = False
    for line in columns_text.splitlines():
        if re.match(r"  story:", line):
            in_story = True
            continue
        if in_story and re.match(r"    dark:", line):
            in_dark = True
            continue
        if in_dark:
            dm = re.match(r'      primary:\s*"(#[0-9a-fA-F]+)"', line)
            if dm:
                yaml_dark_primary = dm.group(1)
                in_dark = False
                in_story = False

    if yaml_dark_primary:
        html_story_dark = re.search(
            r'story:.*?dark:\s*\{[^}]*primary:\s*"(#[0-9a-fA-F]+)"',
            index_text, re.DOTALL
        )
        if html_story_dark:
            if html_story_dark.group(1).lower() == yaml_dark_primary.lower():
                ok(f"story dark.primary 同步: {yaml_dark_primary}")
            else:
                error(f"story dark.primary 不同步: columns.yaml={yaml_dark_primary}, index.html={html_story_dark.group(1)}")


# ============================================================
# Check 9: 文件清理校验
# ============================================================

def check_file_cleanup(repo):
    """检查已废弃文件是否已删除"""
    section("Check 9: 文件清理校验")

    # components.jsx should not exist (removed per refactoring plan)
    components_path = repo / "tools" / "wechat-typesetter" / "components.jsx"
    if components_path.exists():
        warn("tools/wechat-typesetter/components.jsx 应已删除（与 index.html 功能重复）")
    else:
        ok("components.jsx 已移除")

    # mermaid-render.sh should be replaced by mermaid-render.py
    old_sh = repo / "tools" / "mermaid-render.sh"
    new_py = repo / "tools" / "mermaid-render.py"
    if old_sh.exists() and new_py.exists():
        warn("tools/mermaid-render.sh 已被 mermaid-render.py 替代，可删除 .sh 文件")
    elif new_py.exists():
        ok("mermaid-render.py 存在")


# ============================================================
# 主入口
# ============================================================

def main():
    global verbose
    verbose = "-v" in sys.argv or "--verbose" in sys.argv

    repo = Path(__file__).resolve().parent.parent
    if not (repo / ".inkflow.yaml").exists():
        print(f"错误: 未找到 .inkflow.yaml，请在 InkFlow 项目根目录运行", file=sys.stderr)
        sys.exit(1)

    check_path_consistency(repo)
    check_yaml_schema(repo)
    check_agent_frontmatter(repo)
    check_skill_frontmatter(repo)
    check_cross_references(repo)
    check_domain_completeness(repo)
    check_typesetter_wechat_compat(repo)
    check_theme_sync(repo)
    check_file_cleanup(repo)

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
