#!/usr/bin/env python3
"""
Validate a Profile Pack against framework/contracts/profile.schema.json.

用法：
    python framework/tools/validate_profile.py profiles/<id>
    python framework/tools/validate_profile.py --all
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
from pathlib import Path

# Windows 控制台默认 cp936/GBK，强制 stdout 为 UTF-8
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
from typing import Any, Dict, List

try:
    import yaml
except ImportError:
    print("[validate-profile] error: PyYAML not installed", file=sys.stderr)
    sys.exit(2)

REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = REPO_ROOT / "framework" / "contracts" / "profile.schema.json"
PROFILES_DIR = REPO_ROOT / "profiles"

ALLOWED_SLOTS = {"principles", "voice", "typesetting", "constraints"}
ALLOWED_STAGES = {"planning", "drafting", "polishing", "auditing"}
ROUTING_VALUES = ALLOWED_SLOTS | {"examples"}


def fail(errors: List[str], msg: str) -> None:
    errors.append(msg)


def validate_manifest(manifest: Dict[str, Any], pdir: Path) -> List[str]:
    errors: List[str] = []
    if manifest.get("apiVersion") != "inkflow.profile/v1":
        fail(errors, "apiVersion must be 'inkflow.profile/v1'")
    pid = manifest.get("id")
    if not isinstance(pid, str) or not re.match(r"^[a-z][a-z0-9-]*[a-z0-9]$", pid):
        fail(errors, f"id invalid: {pid!r}")
    if pid and pdir.name != pid:
        fail(errors, f"id '{pid}' does not match directory name '{pdir.name}'")
    ver = manifest.get("version")
    if not isinstance(ver, str) or not re.match(r"^[0-9]+\.[0-9]+\.[0-9]+([+-].+)?$", ver):
        fail(errors, f"version must be semver: got {ver!r}")

    extends = manifest.get("extends") or []
    if not isinstance(extends, list):
        fail(errors, "extends must be a list")
    else:
        for spec in extends:
            if not isinstance(spec, str) or not re.match(r"^[a-z][a-z0-9-]*[a-z0-9](@[~^]?[0-9.]+([+-].+)?)?$", spec):
                fail(errors, f"extends entry invalid: {spec!r}")

    slots = manifest.get("slots") or {}
    if not isinstance(slots, dict):
        fail(errors, "slots must be a mapping")
    else:
        for name, decl in slots.items():
            if name not in ALLOWED_SLOTS:
                fail(errors, f"unknown slot '{name}'; allowed: {sorted(ALLOWED_SLOTS)}")
                continue
            if not isinstance(decl, dict) or "file" not in decl or "kind" not in decl:
                fail(errors, f"slot '{name}': must include {{file, kind}}")
                continue
            if decl["kind"] not in {"markdown", "yaml"}:
                fail(errors, f"slot '{name}': kind must be markdown|yaml")
            if not (pdir / decl["file"]).exists():
                fail(errors, f"slot '{name}': file not found: {decl['file']}")

    routing = manifest.get("routing") or {}
    if routing:
        if not isinstance(routing, dict):
            fail(errors, "routing must be a mapping")
        else:
            for stage, lst in routing.items():
                if stage not in ALLOWED_STAGES:
                    fail(errors, f"routing: unknown stage '{stage}'")
                if not isinstance(lst, list):
                    fail(errors, f"routing['{stage}'] must be a list")
                    continue
                for v in lst:
                    if v not in ROUTING_VALUES:
                        fail(errors, f"routing['{stage}']: invalid entry '{v}'")

    examples = manifest.get("examples")
    if examples:
        for k in ("goodRefs", "badRefs"):
            for ref in examples.get(k, []):
                if not (pdir / ref).exists():
                    fail(errors, f"examples.{k}: file not found: {ref}")

    prov = manifest.get("provenance")
    if prov:
        ext = prov.get("extractedBy")
        if ext and ext not in {"manual", "goal", "sample"}:
            fail(errors, f"provenance.extractedBy must be manual|goal|sample, got {ext!r}")

    return errors


def validate_pack(pdir: Path) -> List[str]:
    if not (pdir / "profile.yaml").exists():
        return [f"profile.yaml missing in {pdir}"]
    with (pdir / "profile.yaml").open("r", encoding="utf-8") as f:
        manifest = yaml.safe_load(f) or {}
    return validate_manifest(manifest, pdir)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="?", default=None)
    ap.add_argument("--all", action="store_true")
    args = ap.parse_args()

    targets: List[Path] = []
    if args.all:
        if not PROFILES_DIR.exists():
            print("[validate-profile] no profiles/ directory")
            return 0
        targets = [p for p in PROFILES_DIR.iterdir() if p.is_dir() and (p / "profile.yaml").exists()]
    elif args.path:
        targets = [Path(args.path)]
    else:
        ap.error("provide a path or --all")

    any_fail = False
    for t in targets:
        errors = validate_pack(t)
        if errors:
            any_fail = True
            print(f"✗ {t.name}")
            for e in errors:
                print(f"    - {e}")
        else:
            print(f"✓ {t.name}")
    return 1 if any_fail else 0


if __name__ == "__main__":
    sys.exit(main())
