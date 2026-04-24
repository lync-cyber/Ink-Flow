#!/usr/bin/env python3
"""
InkFlow Profile Injector
========================

三个职责：
    1. set-active   写 runtime/profile-lock.yaml.activeProfile → 触发 resolver
    2. slot-dump    给 orchestrator / subagent 抽取某阶段应该看到的 slot 切片
    3. overlay      读/写 content/articles/{slug}/.profile/overlay.yaml

在 PreToolUse(Agent) hook 中使用：
    python framework/tools/inject_profile.py slot-dump --stage drafting --agent writer

无依赖（除 PyYAML）。
"""
from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
from typing import Any, Dict, List, Optional

try:
    import yaml
except ImportError:
    print("[inject-profile] error: PyYAML not installed", file=sys.stderr)
    sys.exit(2)

REPO_ROOT = Path(__file__).resolve().parents[2]
LOCK_PATH = REPO_ROOT / "runtime" / "profile-lock.yaml"
RESOLVED_DIR = REPO_ROOT / "runtime" / "profile-resolved"
PROFILES_DIR = REPO_ROOT / "profiles"

SLOT_FILES = {
    "principles":  ("principles.md",  "markdown"),
    "voice":       ("voice.md",       "markdown"),
    "typesetting": ("typesetting.yaml","yaml"),
    "constraints": ("constraints.yaml","yaml"),
}


def read_yaml(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def write_yaml(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")


def cmd_set_active(args: argparse.Namespace) -> int:
    if not (PROFILES_DIR / args.id / "profile.yaml").exists():
        print(f"profile '{args.id}' not found under profiles/", file=sys.stderr)
        return 1
    lock = read_yaml(LOCK_PATH)
    lock.setdefault("apiVersion", "inkflow.profile/v1")
    lock["activeProfile"] = args.id
    lock.setdefault("lockfileVersion", 1)
    write_yaml(LOCK_PATH, lock)
    print(f"[inject-profile] activeProfile = {args.id}")
    # 触发 resolver
    import subprocess
    rc = subprocess.call([sys.executable, str(REPO_ROOT / "framework" / "tools" / "profile_resolver.py"), "--quiet"])
    return rc


def cmd_unuse(_args: argparse.Namespace) -> int:
    if LOCK_PATH.exists():
        lock = read_yaml(LOCK_PATH)
        lock.pop("activeProfile", None)
        write_yaml(LOCK_PATH, lock)
    print("[inject-profile] active profile cleared — kernel defaults apply")
    return 0


def cmd_show(_args: argparse.Namespace) -> int:
    lock = read_yaml(LOCK_PATH)
    if not lock.get("activeProfile"):
        print("(no active profile; kernel defaults apply)")
        return 0
    print(yaml.safe_dump(lock, allow_unicode=True, sort_keys=False))
    return 0


def _active_profile_manifest() -> Optional[Dict[str, Any]]:
    active = read_yaml(LOCK_PATH).get("activeProfile")
    if not active:
        return None
    return read_yaml(PROFILES_DIR / active / "profile.yaml")


# ---- stage 默认路由（未在 profile.yaml 中覆盖时使用）----
DEFAULT_ROUTING = {
    "planning":  ["principles", "constraints"],
    "drafting":  ["voice", "principles"],
    "polishing": ["typesetting", "constraints", "voice"],
    "auditing":  ["principles", "voice", "typesetting", "constraints"],
}


def cmd_slot_dump(args: argparse.Namespace) -> int:
    """把某阶段应该注入的 slot 内容打印为 markdown，供 orchestrator 拼到 subagent prompt。"""
    manifest = _active_profile_manifest()
    routing = (manifest or {}).get("routing") or {}
    slots = routing.get(args.stage, DEFAULT_ROUTING.get(args.stage, list(SLOT_FILES)))

    if args.format == "json":
        out: Dict[str, str] = {}
        for s in slots:
            if s == "examples":
                continue
            fname, _ = SLOT_FILES[s]
            p = RESOLVED_DIR / fname
            if p.exists():
                out[s] = p.read_text(encoding="utf-8")
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 0

    print(f"<profile_context stage=\"{args.stage}\" agent=\"{args.agent or '-'}\">\n")
    for s in slots:
        if s == "examples":
            continue
        fname, _ = SLOT_FILES[s]
        p = RESOLVED_DIR / fname
        if not p.exists():
            continue
        print(f"<!-- slot: {s} -->")
        print(p.read_text(encoding="utf-8"))
        print()
    print("</profile_context>")
    return 0


def cmd_overlay(args: argparse.Namespace) -> int:
    base = REPO_ROOT / "content" / "articles" / args.slug / ".profile"
    base.mkdir(parents=True, exist_ok=True)
    overlay = read_yaml(base / "overlay.yaml")
    overlay.setdefault("apiVersion", "inkflow.profile/v1")
    overlay["scope"] = args.scope
    overlay.setdefault("use", [])
    if args.add:
        if args.add not in overlay["use"]:
            overlay["use"].append(args.add)
    if args.stages:
        overlay["targetStages"] = args.stages
    if args.mode:
        overlay["mode"] = args.mode
    write_yaml(base / "overlay.yaml", overlay)
    print(f"[inject-profile] overlay written: {base / 'overlay.yaml'}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="InkFlow Profile Injector")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_set = sub.add_parser("set-active", help="bind profile at workspace level")
    p_set.add_argument("id")
    p_set.set_defaults(func=cmd_set_active)

    p_unuse = sub.add_parser("unuse", help="clear activeProfile")
    p_unuse.set_defaults(func=cmd_unuse)

    p_show = sub.add_parser("show", help="print current lock")
    p_show.set_defaults(func=cmd_show)

    p_dump = sub.add_parser("slot-dump", help="emit stage-filtered slot content")
    p_dump.add_argument("--stage", required=True, choices=list(DEFAULT_ROUTING.keys()))
    p_dump.add_argument("--agent", default=None)
    p_dump.add_argument("--format", choices=["text", "json"], default="text")
    p_dump.set_defaults(func=cmd_slot_dump)

    p_ov = sub.add_parser("overlay", help="write article-level overlay")
    p_ov.add_argument("--slug", required=True)
    p_ov.add_argument("--add", help="profile spec id[@version]")
    p_ov.add_argument("--stages", nargs="*", help="target stages (e.g. drafting polishing)")
    p_ov.add_argument("--mode", choices=["overlay", "replace"], default="overlay")
    p_ov.add_argument("--scope", choices=["article", "stage", "run"], default="article")
    p_ov.set_defaults(func=cmd_overlay)

    args = ap.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
