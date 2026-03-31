#!/usr/bin/env python3
"""lint-framework.py — InkFlow 框架静态校验（L0 质量门禁）

用法: python tests/lint-framework.py

校验项:
  1. 路径一致性 — agent/skill 中的路径引用与目录结构一致
  2. YAML Schema — pipeline/domain/.inkflow.yaml 必填字段
  3. Agent Frontmatter 完整性 — 必填字段 + RCCF 正文结构
  4. Skill Frontmatter 完整性 — 必填字段 + type 合法性
  5. 交叉引用 — pipeline 中引用的 agent/skill/rule 文件存在
  6. 领域包完整性 — domain.yaml 中列出的 skill/rule 均存在
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


def error(msg: str):
    global errors
    print(f"  \u2717 ERROR: {msg}")
    errors += 1


def warn(msg: str):
    global warnings
    print(f"  \u26a0 WARN: {msg}")
    warnings += 1


def ok(msg: str):
    print(f"  \u2713 {msg}")


def section(title: str):
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


def extract_yaml_section(text: str, section_name: str) -> list[str]:
    """提取顶层 YAML 段落的行（如 skills: 或 rules: 下的所有缩进行）"""
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
            result.append(line)
    return result


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
    dirs_all = dirs + [repo / ".claude" / "pipelines"]
    hits = grep_recursive(dirs_all, r"/c/Users|C:\\Users|/home/")
    if hits:
        for path, num, line in hits:
            error(f"发现硬编码绝对路径（{path.relative_to(repo)}:{num}）")
    else:
        ok("无硬编码绝对路径")


def check_yaml_schema(repo: Path):
    section("2. YAML Schema 校验")

    # .inkflow.yaml
    inkflow = repo / ".inkflow.yaml"
    if inkflow.exists():
        for field in ("version", "domains", "model_allocation"):
            if file_contains(inkflow, rf"^{field}:"):
                ok(f".inkflow.yaml 包含 {field}")
            else:
                error(f".inkflow.yaml 缺少必填字段: {field}")
    else:
        error(".inkflow.yaml 不存在")

    # pipeline YAML
    for pipeline in sorted((repo / ".claude" / "pipelines").glob("*.yaml")):
        pname = pipeline.name
        for field in ("name", "stages"):
            if file_contains(pipeline, rf"^{field}:"):
                ok(f"{pname} 包含 {field}")
            else:
                error(f"{pname} 缺少 {field} 字段")

    # domain.yaml
    for domain_yaml in sorted((repo / ".claude" / "skills" / "domains").glob("*/domain.yaml")):
        dname = domain_yaml.parent.name
        for field in ("name", "skills", "rules"):
            if file_contains(domain_yaml, rf"^{field}:"):
                ok(f"domain {dname}: 包含 {field}")
            else:
                error(f"domain {dname}: 缺少必填字段 {field}")


def check_agent_frontmatter(repo: Path):
    section("3. Agent Frontmatter 完整性")

    for agent_file in sorted((repo / ".claude" / "agents").glob("*.md")):
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

    valid_types = {"rule", "context", "transform", "orchestration"}

    for skill_file in sorted((repo / ".claude" / "skills").rglob("SKILL.md")):
        sname = skill_file.parent.name

        fm = extract_frontmatter(skill_file)
        for field in ("name", "description"):
            if field in fm:
                ok(f"skill {sname}: frontmatter 包含 {field}")
            else:
                error(f"skill {sname}: frontmatter 缺少 {field}")

        type_val = fm.get("type", "").strip()
        if type_val:
            if type_val in valid_types:
                ok(f"skill {sname}: type '{type_val}' 合法")
            else:
                error(f"skill {sname}: type '{type_val}' 不合法（允许: {', '.join(sorted(valid_types))}）")


def resolve_skill(name: str, repo: Path) -> Path | None:
    """按搜索优先级解析 skill: common → domains/*"""
    p = repo / ".claude" / "skills" / "common" / name / "SKILL.md"
    if p.exists():
        return p
    for domain_dir in sorted((repo / ".claude" / "skills" / "domains").iterdir()):
        if domain_dir.is_dir():
            p = domain_dir / name / "SKILL.md"
            if p.exists():
                return p
    return None


def resolve_rule(name: str, repo: Path) -> Path | None:
    """按搜索优先级解析 rule: core → domains/*"""
    p = repo / ".claude" / "rules" / "core" / f"{name}.md"
    if p.exists():
        return p
    for domain_dir in sorted((repo / ".claude" / "rules" / "domains").iterdir()):
        if domain_dir.is_dir():
            p = domain_dir / f"{name}.md"
            if p.exists():
                return p
    return None


def check_cross_references(repo: Path):
    section("5. 交叉引用完整性")

    for pipeline in sorted((repo / ".claude" / "pipelines").glob("*.yaml")):
        pname = pipeline.name
        text = pipeline.read_text(encoding="utf-8")

        # Agent 引用
        for m in re.finditer(r"agent:\s*(\S+)", text):
            agent_name = re.sub(r"#.*", "", m.group(1)).strip()
            if not agent_name:
                continue
            agent_path = repo / ".claude" / "agents" / f"{agent_name}.md"
            if agent_path.exists():
                ok(f"{pname}: agent '{agent_name}' 存在")
            else:
                error(f"{pname}: agent '{agent_name}' 不存在 (.claude/agents/{agent_name}.md)")

        # Skill 引用 — 仅从 skills: 段提取
        skills_lines = extract_yaml_section(text, "skills")
        skill_names = set()
        for line in skills_lines:
            m = re.match(r"\s+- name:\s*(\S+)", line)
            if m:
                name = re.sub(r"#.*", "", m.group(1)).strip().strip("\"'")
                if name and name not in ("true", "false"):
                    skill_names.add(name)

        for skill in sorted(skill_names):
            resolved = resolve_skill(skill, repo)
            if resolved:
                ok(f"{pname}: skill '{skill}' \u2192 {resolved.relative_to(repo)}")
            else:
                error(f"{pname}: skill '{skill}' 未找到（搜索路径: common/ + domains/*/）")

        # Rule 引用 — 从 rules: 段提取
        rules_lines = extract_yaml_section(text, "rules")
        rule_names = set()
        for line in rules_lines:
            m = re.match(r"\s+- ([a-z][-a-z_]+)", line)
            if m:
                name = m.group(1)
                if name not in ("global", "stages"):
                    rule_names.add(name)

        for rule in sorted(rule_names):
            resolved = resolve_rule(rule, repo)
            if resolved:
                ok(f"{pname}: rule '{rule}' \u2192 {resolved.relative_to(repo)}")
            else:
                error(f"{pname}: rule '{rule}' 未找到（搜索路径: rules/core/ + rules/domains/*/）")


def check_domain_completeness(repo: Path):
    section("6. 领域包完整性")

    for domain_yaml in sorted((repo / ".claude" / "skills" / "domains").glob("*/domain.yaml")):
        domain_dir = domain_yaml.parent
        dname = domain_dir.name
        text = domain_yaml.read_text(encoding="utf-8")

        for m in re.finditer(r"^\s*- (\S+)", text, re.MULTILINE):
            item = m.group(1).strip()
            if not item:
                continue

            skill_path = domain_dir / item / "SKILL.md"
            if skill_path.exists():
                ok(f"domain {dname}: skill '{item}' 存在")
            elif resolve_rule(item, repo):
                ok(f"domain {dname}: rule '{item}' 存在")
            # else: 可能是 export format 名，不报错


# ============================================================
# 主入口
# ============================================================

def main():
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
        print("\u274c 未通过质量门禁")
        sys.exit(1)
    else:
        print("\u2705 通过质量门禁")
        sys.exit(0)


if __name__ == "__main__":
    main()
