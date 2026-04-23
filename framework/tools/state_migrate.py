#!/usr/bin/env python3
"""state_migrate.py — 清理 runtime/pipeline-states/*.json 的历史残留字段。

已知残留：
- stages.typeset          # pipeline 已无 typeset 阶段；该字段在旧 brief 初始化时写入
- stages.conform          # 早期 conform 阶段已合并进 audit
- stages.typeset_check    # 同上

用法:
    python framework/tools/state_migrate.py [--dry-run]

行为:
- 默认就地修改 runtime/pipeline-states/*.json
- --dry-run：只打印将清理的字段，不写盘
- 对不在 inkflow.yaml.stages 列表中的 key 统一视为残留，静默删除并记录
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
STATE_DIR = ROOT / "runtime" / "pipeline-states"
INKFLOW_YAML = ROOT / "framework" / "config" / "inkflow.yaml"


def _load_active_stages() -> set[str]:
    """读 inkflow.yaml 的 stages 列表（YAML 不可用时静态回退）。"""
    try:
        import yaml  # type: ignore
    except ImportError:
        return {
            "brief", "research", "atoms", "outline",
            "draft", "figures", "audit", "polish", "publish",
        }
    data = yaml.safe_load(INKFLOW_YAML.read_text(encoding="utf-8"))
    stages = data.get("stages", [])
    names = set()
    for s in stages:
        if isinstance(s, dict) and s.get("name"):
            names.add(s["name"])
    return names


def migrate_file(path: Path, active: set[str], dry_run: bool) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    stages = data.get("stages", {})
    removed = [key for key in stages if key not in active]
    if not removed:
        return []
    if dry_run:
        return removed
    for key in removed:
        stages.pop(key, None)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return removed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="仅打印将清理的字段，不写盘")
    args = parser.parse_args()

    if not STATE_DIR.exists():
        print(f"state dir not found: {STATE_DIR}", file=sys.stderr)
        return 0

    active = _load_active_stages()
    total_files = 0
    total_fields = 0
    for path in sorted(STATE_DIR.glob("*.json")):
        total_files += 1
        removed = migrate_file(path, active, args.dry_run)
        if removed:
            verb = "would remove" if args.dry_run else "removed"
            print(f"{path.relative_to(ROOT)}: {verb} {removed}")
            total_fields += len(removed)

    label = "dry-run" if args.dry_run else "done"
    print(f"[{label}] files={total_files} fields_cleaned={total_fields}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
