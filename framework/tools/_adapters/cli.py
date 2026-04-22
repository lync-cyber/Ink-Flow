#!/usr/bin/env python3
"""Adapter CLI — agent 通过 Bash 调用的统一入口。

子命令：
  health         探测 wechat-typeset dist 是否在线（读 capabilities.json 文件存在性）
  capabilities   拉取 capabilities 并写入 runtime/typeset-capabilities.json（variant 白名单）

示例：
  python framework/tools/_adapters/cli.py health
  python framework/tools/_adapters/cli.py capabilities --cache

说明：
  主题 / variant / 组件选择由用户在 wechat-typeset 本地编辑器（127.0.0.1:7788）
  运行时完成，pipeline 不做决策。
  容器 / variant 的静态合法性校验由 .claude/skills/quality-linting/scripts/lint.py
  的 rule_container_whitelist（W1-W4）承担。

退出码：
  0   成功
  1   目标不可达 / 其它已知错误
  2   参数错误
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# 允许脚本直接执行（`python cli.py ...`），需把上层目录入 sys.path
HERE = Path(__file__).resolve().parent
if str(HERE.parent) not in sys.path:
    sys.path.insert(0, str(HERE.parent))

from _adapters import AdapterError, get_adapter  # noqa: E402


REPO_ROOT = Path(__file__).resolve().parents[3]  # cli.py → _adapters → tools → framework → repo
CACHE_FILE = REPO_ROOT / "runtime" / "typeset-capabilities.json"


def _emit(obj: dict, *, pretty: bool = True) -> None:
    print(json.dumps(obj, ensure_ascii=False, indent=2 if pretty else None))


def cmd_health(args: argparse.Namespace) -> int:
    adapter = get_adapter(args.adapter)
    result = adapter.health(timeout=args.timeout)
    _emit({"ok": result.ok, "tool": result.tool, "version": result.version, "reason": result.reason})
    return 0 if result.ok else 1


def cmd_capabilities(args: argparse.Namespace) -> int:
    adapter = get_adapter(args.adapter)
    caps = adapter.capabilities(timeout=args.timeout)
    payload = caps.raw
    if args.cache:
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        CACHE_FILE.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"[capabilities] cached to {CACHE_FILE.relative_to(REPO_ROOT)}", file=sys.stderr)
    if not args.cache or args.print:
        _emit(payload)
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="adapter-cli", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--adapter", default=os.environ.get("INKFLOW_ADAPTER", "wechat-typeset"),
                   help="adapter name (default: wechat-typeset or $INKFLOW_ADAPTER)")
    p.add_argument("--timeout", type=float, default=5.0)
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("health", help="ping the adapter target (check dist/api/capabilities.json exists)")
    sp.set_defaults(func=cmd_health)

    sp = sub.add_parser("capabilities", help="fetch capabilities.json (variant whitelist for lint)")
    sp.add_argument("--cache", action="store_true", help=f"write to {CACHE_FILE.relative_to(REPO_ROOT)}")
    sp.add_argument("--print", action="store_true", help="also print to stdout when --cache")
    sp.set_defaults(func=cmd_capabilities)

    return p


def main() -> int:
    args = build_parser().parse_args()
    try:
        return args.func(args)
    except AdapterError as e:
        print(f"[adapter-cli] {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
