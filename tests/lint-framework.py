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

    for field in ("version", "domains", "model_allocation", "stages"):
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
        for field in ("name", "description", "tools", "model"):
            if field in fm:
                ok(f"agent {aname}: frontmatter 包含 {field}")
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
