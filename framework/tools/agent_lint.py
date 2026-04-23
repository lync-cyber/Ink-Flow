"""agent_lint — 校验 .claude/agents/*.md 与 inkflow.yaml 的契约一致性。

规则
----
1. 每个 agent frontmatter 必含 ``name`` / ``description`` / ``allowed-tools`` / ``model``
2. ``model`` 必须等于 ``framework/config/inkflow.yaml`` 的 ``model_allocation.{name}``
   - 缺失或漂移即为 error
3. 模块化 agent（带 ``modules`` 子文件）允许在子目录有 <agent>/<sub>.md，子文件不参与 lint
4. 三向一致性：inkflow.yaml.stages.{agent} ⊆ model_allocation 键；
   artifact-layout.yaml 含 stages.output 所引用的 path key。
   任一边漂移 → error。

只读、零副作用。

用法
----
::

    python framework/tools/agent_lint.py            # 校验全部 agent
    python framework/tools/agent_lint.py --json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def _parse_frontmatter(text: str) -> dict[str, Any]:
    m = _FRONTMATTER_RE.match(text)
    if not m:
        return {}
    out: dict[str, Any] = {}
    current_key: str | None = None
    folded: list[str] = []

    def _flush() -> None:
        nonlocal folded, current_key
        if current_key and folded:
            out[current_key] = " ".join(s.strip() for s in folded).strip()
        folded = []

    for raw in m.group(1).splitlines():
        if raw.startswith("#") or not raw.strip():
            continue
        if raw.startswith(" ") and current_key is not None:
            folded.append(raw.strip())
            continue
        _flush()
        if ":" not in raw:
            continue
        k, _, v = raw.partition(":")
        k = k.strip()
        v = v.strip()
        current_key = k
        if v in {">", "|"}:
            folded = []
            continue
        if v.lower() in {"true", "false"}:
            out[k] = v.lower() == "true"
            current_key = None
        elif v.startswith("[") and v.endswith("]"):
            out[k] = [s.strip().strip('"').strip("'") for s in v[1:-1].split(",") if s.strip()]
            current_key = None
        elif v:
            out[k] = v.strip('"').strip("'")
            current_key = None
    _flush()
    return out


def _load_inkflow_models(yaml_path: Path) -> dict[str, str]:
    """读 model_allocation 段（只解析 ``key: value`` 行，避免引入 pyyaml）。"""
    if not yaml_path.exists():
        raise SystemExit(f"inkflow.yaml not found: {yaml_path}")
    in_section = False
    out: dict[str, str] = {}
    for line in yaml_path.read_text(encoding="utf-8").splitlines():
        s = line.rstrip()
        if not s:
            continue
        if s.startswith("model_allocation:"):
            in_section = True
            continue
        if in_section:
            if not s.startswith(" "):
                # 顶层另一段开始
                break
            stripped = s.strip()
            if stripped.startswith("#") or not stripped:
                continue
            if ":" not in stripped:
                continue
            k, _, v = stripped.partition(":")
            v = v.split("#", 1)[0].strip()
            if v:
                out[k.strip()] = v
    return out


def _load_stage_agents(yaml_path: Path) -> list[tuple[str, str]]:
    """从 inkflow.yaml stages 段抽出 (stage_name, agent_name) 列表。

    只解析必要字段，避免 pyyaml 依赖。跳过 type: user_input 阶段（由 orchestrator 直接处理）。
    """
    pairs: list[tuple[str, str]] = []
    in_stages = False
    current_name: str | None = None
    current_agent: str | None = None
    current_is_user_input = False

    def _flush() -> None:
        nonlocal current_name, current_agent, current_is_user_input
        if current_name and current_agent and not current_is_user_input:
            pairs.append((current_name, current_agent))
        current_name = None
        current_agent = None
        current_is_user_input = False

    for raw in yaml_path.read_text(encoding="utf-8").splitlines():
        s = raw.rstrip()
        if not s:
            continue
        if s.startswith("stages:"):
            in_stages = True
            continue
        if in_stages:
            # 顶层新段（0 缩进非空 + 非 `-`）则退出
            if s and not s.startswith(" ") and not s.startswith("-"):
                _flush()
                break
            stripped = s.strip()
            if stripped.startswith("#"):
                continue
            if stripped.startswith("- name:"):
                _flush()
                current_name = stripped.split(":", 1)[1].strip().strip('"').strip("'")
            elif stripped.startswith("agent:") and current_name:
                current_agent = stripped.split(":", 1)[1].split("#", 1)[0].strip().strip('"').strip("'")
            elif stripped.startswith("type:") and current_name:
                val = stripped.split(":", 1)[1].split("#", 1)[0].strip().strip('"').strip("'")
                if val == "user_input":
                    current_is_user_input = True
    _flush()
    return pairs


def _load_layout_path_keys(layout_path: Path) -> set[str]:
    """从 artifact-layout.yaml 的 paths 段抽出所有 key。"""
    if not layout_path.exists():
        return set()
    out: set[str] = set()
    in_paths = False
    for raw in layout_path.read_text(encoding="utf-8").splitlines():
        s = raw.rstrip()
        if not s:
            continue
        if s.startswith("paths:"):
            in_paths = True
            continue
        if in_paths:
            if s and not s.startswith(" ") and not s.startswith("-"):
                break
            stripped = s.strip()
            if not stripped or stripped.startswith("#"):
                continue
            # paths.{key}: ...
            if ":" in stripped and not stripped.startswith("#"):
                key = stripped.split(":", 1)[0].strip()
                if key and not key.startswith("-"):
                    out.add(key)
    return out


def lint(agents_dir: Path, yaml_path: Path) -> tuple[list[dict], int]:
    expected = _load_inkflow_models(yaml_path)
    issues: list[dict] = []
    n_err = 0
    for md in sorted(agents_dir.glob("*.md")):
        agent_name = md.stem
        text = md.read_text(encoding="utf-8")
        fm = _parse_frontmatter(text)
        if not fm:
            issues.append({"agent": agent_name, "severity": "error", "rule": "frontmatter_missing", "message": "无 frontmatter"})
            n_err += 1
            continue
        # 必填项
        for required in ("name", "description", "allowed-tools", "model"):
            if not fm.get(required):
                issues.append({"agent": agent_name, "severity": "error", "rule": f"{required}_missing", "message": f"缺 {required}"})
                n_err += 1

        name_in_fm = fm.get("name", "")
        if name_in_fm and name_in_fm != agent_name:
            issues.append({"agent": agent_name, "severity": "error", "rule": "name_mismatch",
                           "message": f"name={name_in_fm!r} 与文件名 {agent_name!r} 不一致"})
            n_err += 1

        model = fm.get("model", "")
        want = expected.get(agent_name)
        if want is None:
            issues.append({"agent": agent_name, "severity": "warning", "rule": "model_not_allocated",
                           "message": f"inkflow.yaml model_allocation 未声明 {agent_name}"})
        elif model and model != want:
            issues.append({"agent": agent_name, "severity": "error", "rule": "model_mismatch",
                           "message": f"agent model={model!r} ≠ inkflow.yaml model_allocation.{agent_name}={want!r}"})
            n_err += 1

    # 反向：声明但缺 agent
    declared = set(expected)
    files = {p.stem for p in agents_dir.glob("*.md")}
    for missing in sorted(declared - files):
        issues.append({"agent": missing, "severity": "error", "rule": "agent_missing",
                       "message": f"inkflow.yaml 声明了 {missing} 但 .claude/agents/{missing}.md 不存在"})
        n_err += 1

    # 三向一致性：stages.{agent} ⊆ model_allocation
    stage_pairs = _load_stage_agents(yaml_path)
    for stage_name, agent_name in stage_pairs:
        if agent_name not in declared:
            issues.append({"agent": agent_name, "severity": "error", "rule": "stage_agent_unallocated",
                           "message": f"stages.{stage_name}.agent={agent_name!r} 未出现在 model_allocation 中"})
            n_err += 1

    # 三向一致性：artifact-layout.yaml paths 必须覆盖核心 stage 产物 key
    layout_path = yaml_path.parent / "artifact-layout.yaml"
    layout_keys = _load_layout_path_keys(layout_path)
    required_layout_keys = {
        "brief", "research", "atoms_index", "atoms_item",
        "outline", "draft_section", "draft_merged",
        "figure_item", "figure_index",
        "audit", "polish_trace", "final", "publish",
    }
    for missing in sorted(required_layout_keys - layout_keys):
        issues.append({"agent": "<layout>", "severity": "error", "rule": "layout_key_missing",
                       "message": f"artifact-layout.yaml paths 缺少 key {missing!r}"})
        n_err += 1

    return issues, n_err


def main(argv: list[str] | None = None) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    p = argparse.ArgumentParser()
    p.add_argument("--root", default=".claude/agents")
    p.add_argument("--config", default="framework/config/inkflow.yaml")
    p.add_argument("--json", action="store_true")
    args = p.parse_args(argv)
    issues, n_err = lint(Path(args.root), Path(args.config))
    if args.json:
        print(json.dumps(issues, ensure_ascii=False, indent=2))
    else:
        for it in issues:
            tag = "ERROR" if it["severity"] == "error" else "warn "
            print(f"  {tag} {it['agent']:18s} {it['rule']:24s} {it['message']}")
        if not issues:
            print("  ok   所有 agent 与 inkflow.yaml model_allocation 对齐")
        n_warn = sum(1 for i in issues if i["severity"] == "warning")
        print()
        print(f"summary: {n_err} error, {n_warn} warning")
    return 1 if n_err else 0


if __name__ == "__main__":
    sys.exit(main())
