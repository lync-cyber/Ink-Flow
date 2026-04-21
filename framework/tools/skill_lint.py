"""skill_lint — 校验 .claude/skills/*/SKILL.md 的契约一致性 (P2-1).

只读、零副作用。根据 .claude/skills/_template/SKILL.md 定下的契约执行：

frontmatter 必填项
  - name      : kebab-case，必须等于目录名
  - description: 三段式（功能定位 / 触发词 / 应触发场景），自动可调用 skill 必填
  - allowed-tools: 列表式或逗号分隔字符串

description 三段式（仅当 user-invocable 不为 false 时强制）
  1. 一句话功能定位（含 — 或 -）
  2. 触发词列表（"触发条件:" / "触发词:" 关键字）
  3. 应触发场景描述（出现"当用户...应触发此 skill"或同义句式）

模板 / 内部 skill 通过 ``user-invocable: false`` + ``disable-model-invocation: true``
跳过 description 三段式校验，但 name / 描述非空仍校验。

用法
----
::

    python framework/tools/skill_lint.py            # 校验全部 skill
    python framework/tools/skill_lint.py --json     # 机器可读输出
    python framework/tools/skill_lint.py SKILL_DIR  # 单个目录

退出码：通过 0；任意 error 1；仅 warning 0。
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# 轻量 frontmatter 解析（不引入 pyyaml 依赖；只支持本仓库实际用到的字段格式）
# ---------------------------------------------------------------------------

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def _parse_frontmatter(text: str) -> dict[str, Any]:
    m = _FRONTMATTER_RE.match(text)
    if not m:
        return {}
    body = m.group(1)
    out: dict[str, Any] = {}
    current_key: str | None = None
    folded_buf: list[str] = []

    def _flush_folded() -> None:
        nonlocal folded_buf, current_key
        if current_key and folded_buf:
            out[current_key] = " ".join(s.strip() for s in folded_buf).strip()
        folded_buf = []

    for raw in body.splitlines():
        if raw.startswith("#") or not raw.strip():
            continue
        if raw.startswith(" ") and current_key is not None:
            folded_buf.append(raw.strip())
            continue
        # 新键 → 先冲掉上一段折叠值
        _flush_folded()
        if ":" not in raw:
            continue
        key, _, val = raw.partition(":")
        key = key.strip()
        val = val.strip()
        current_key = key
        if val == ">" or val == "|":
            # 折叠/字面块；下面行用缩进续接
            folded_buf = []
            continue
        # 解析常见标量
        if val.lower() in {"true", "false"}:
            out[key] = val.lower() == "true"
            current_key = None
        elif val.startswith("[") and val.endswith("]"):
            out[key] = [s.strip().strip('"').strip("'") for s in val[1:-1].split(",") if s.strip()]
            current_key = None
        elif val.startswith('"') and val.endswith('"'):
            out[key] = val[1:-1]
            current_key = None
        elif val.startswith("'") and val.endswith("'"):
            out[key] = val[1:-1]
            current_key = None
        elif val:
            out[key] = val
            current_key = None
        # else: 等待续行
    _flush_folded()
    return out


# ---------------------------------------------------------------------------
# 校验规则
# ---------------------------------------------------------------------------


@dataclass
class Issue:
    skill: str
    severity: str  # "error" | "warning"
    rule: str
    message: str

    def to_dict(self) -> dict[str, str]:
        return {
            "skill": self.skill,
            "severity": self.severity,
            "rule": self.rule,
            "message": self.message,
        }


@dataclass
class SkillLintResult:
    skill: str
    path: str
    invocable: bool
    issues: list[Issue] = field(default_factory=list)

    def add(self, severity: str, rule: str, message: str) -> None:
        self.issues.append(Issue(self.skill, severity, rule, message))


KEBAB_RE = re.compile(r"^[a-z][a-z0-9-]*$")
TRIGGER_KEYWORDS = ("触发条件", "触发词", "触发场景", "trigger", "when user")
SCENARIO_KEYWORDS = ("当用户", "should trigger", "应触发", "请使用此 skill", "使用此 skill")
DASH_TOKENS = ("—", "-")


def _check_one(path: Path) -> SkillLintResult:
    name_from_dir = path.parent.name
    res = SkillLintResult(skill=name_from_dir, path=str(path), invocable=True)
    text = path.read_text(encoding="utf-8")
    fm = _parse_frontmatter(text)

    if not fm:
        res.add("error", "frontmatter_missing", "未找到 YAML frontmatter（缺 --- 包裹）")
        return res

    # name 必须等于目录名；kebab-case（模板/内部 skill 允许 _ 前缀）
    name = fm.get("name", "")
    if not name:
        res.add("error", "name_missing", "frontmatter 缺 name 字段")
    else:
        if name != name_from_dir:
            res.add("error", "name_mismatch", f"name={name!r} 与目录名 {name_from_dir!r} 不一致")
        if not KEBAB_RE.match(name) and not name.startswith("_"):
            res.add("error", "name_format", f"name={name!r} 不是 kebab-case")

    # description 必填且非空
    desc = (fm.get("description") or "").strip()
    if not desc:
        res.add("error", "description_missing", "frontmatter 缺 description")

    # allowed-tools 校验（模板 skill 仅声明 Read 即可）
    tools = fm.get("allowed-tools")
    if tools is None:
        res.add("warning", "allowed_tools_missing", "建议显式声明 allowed-tools")

    # 是否为可触发 skill
    invocable = True
    if fm.get("user-invocable") is False or fm.get("disable-model-invocation") is True:
        invocable = False
    res.invocable = invocable

    # 仅可触发 skill 必须满足三段式
    if invocable and desc:
        if not any(tok in desc for tok in DASH_TOKENS):
            res.add(
                "warning",
                "description_no_dash",
                "建议用 '—' 或 '-' 分隔功能定位与详细说明（一句话定位 + 详情）",
            )
        if not any(k in desc for k in TRIGGER_KEYWORDS):
            res.add(
                "error",
                "description_no_triggers",
                "description 未列出触发词（要含 '触发条件' 或 '触发词' 等关键字 + 实际词列表）",
            )
        if not any(k in desc for k in SCENARIO_KEYWORDS):
            res.add(
                "error",
                "description_no_scenario",
                "description 未描述应触发场景（要含 '当用户……应触发此 skill' 等句式）",
            )
        # 长度建议（避免过长 = 触发不稳定）
        if len(desc) > 320:
            res.add(
                "warning",
                "description_too_long",
                f"description 过长（{len(desc)} 字符），建议精简到 ≤320 字以内以稳定触发",
            )
        if len(desc) < 40:
            res.add("warning", "description_too_short", f"description 过短（{len(desc)} 字符），可能影响匹配")

    return res


def lint(paths: list[Path]) -> list[SkillLintResult]:
    results: list[SkillLintResult] = []
    for p in paths:
        if not p.exists():
            r = SkillLintResult(skill=p.parent.name, path=str(p), invocable=True)
            r.add("error", "file_missing", f"SKILL.md 不存在: {p}")
            results.append(r)
            continue
        results.append(_check_one(p))
    return results


def _discover(root: Path) -> list[Path]:
    return sorted(root.glob("*/SKILL.md"))


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _format_human(results: list[SkillLintResult]) -> str:
    lines: list[str] = []
    n_err = n_warn = 0
    for r in results:
        if not r.issues:
            lines.append(f"  ok   {r.skill}")
            continue
        for issue in r.issues:
            tag = "ERROR" if issue.severity == "error" else "warn "
            if issue.severity == "error":
                n_err += 1
            else:
                n_warn += 1
            lines.append(f"  {tag} {r.skill:30s} {issue.rule:24s} {issue.message}")
    lines.append("")
    lines.append(f"summary: {len(results)} skills, {n_err} error, {n_warn} warning")
    return "\n".join(lines)


def _format_json(results: list[SkillLintResult]) -> str:
    return json.dumps(
        [
            {
                "skill": r.skill,
                "path": r.path,
                "invocable": r.invocable,
                "issues": [i.to_dict() for i in r.issues],
            }
            for r in results
        ],
        ensure_ascii=False,
        indent=2,
    )


def main(argv: list[str] | None = None) -> int:
    # Windows 控制台默认 cp1252；强制走 UTF-8 才能打印 — / 中文
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    parser = argparse.ArgumentParser(description="lint .claude/skills/*/SKILL.md")
    parser.add_argument("targets", nargs="*", help="单个 SKILL 目录或 SKILL.md；为空则扫描全部")
    parser.add_argument("--json", action="store_true", help="JSON 输出")
    parser.add_argument(
        "--root",
        default=".claude/skills",
        help="skill 根目录（默认 .claude/skills）",
    )
    args = parser.parse_args(argv)

    paths: list[Path]
    if args.targets:
        paths = []
        for t in args.targets:
            p = Path(t)
            if p.is_dir():
                p = p / "SKILL.md"
            paths.append(p)
    else:
        root = Path(args.root)
        if not root.exists():
            print(f"skill root not found: {root}", file=sys.stderr)
            return 2
        paths = _discover(root)

    results = lint(paths)
    if args.json:
        print(_format_json(results))
    else:
        print(_format_human(results))

    has_error = any(i.severity == "error" for r in results for i in r.issues)
    return 1 if has_error else 0


if __name__ == "__main__":
    sys.exit(main())
