#!/usr/bin/env python3
"""Adapter CLI — agent 通过 Bash 调用的统一入口。

子命令：
  health         探测 adapter 目标是否在线
  capabilities   拉取 capabilities 并写入 runtime/typeset-capabilities.json
  conform        校验排版方案是否只用合规 id
  render         调 /api/render；v1 返回 501 时落盘占位并退出 0

示例：
  python framework/tools/_adapters/cli.py health
  python framework/tools/_adapters/cli.py capabilities --cache
  python framework/tools/_adapters/cli.py conform --theme tech-geek \\
        --variants admonition=terminal compare=ledger
  python framework/tools/_adapters/cli.py render --input annotated.md \\
        --theme tech-geek --output render.html

退出码：
  0   成功 / 降级成功
  1   目标不可达 / 合规校验失败 / 其它已知错误
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


def cmd_conform(args: argparse.Namespace) -> int:
    """校验 plan 是否只引用合规 id。优先读缓存，缓存缺失再走 HTTP。"""
    caps_payload: dict
    if CACHE_FILE.exists() and not args.no_cache:
        caps_payload = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    else:
        adapter = get_adapter(args.adapter)
        caps = adapter.capabilities(timeout=args.timeout)
        caps_payload = caps.raw

    from _adapters.base import Capabilities  # lazy import after sys.path tweak
    caps = Capabilities.from_json(caps_payload)

    variants: dict[str, str] = {}
    for item in args.variants or []:
        if "=" not in item:
            print(f"[conform] --variants expects kind=variantId, got {item!r}", file=sys.stderr)
            return 2
        k, v = item.split("=", 1)
        variants[k.strip()] = v.strip()

    adapter = get_adapter(args.adapter)
    violations = adapter.conform_plan(
        theme_id=args.theme,
        variant_choices=variants,
        component_ids=args.component or [],
        capabilities=caps,
    )

    _emit({"ok": len(violations) == 0, "violations": violations})
    return 0 if not violations else 1


def cmd_render(args: argparse.Namespace) -> int:
    adapter = get_adapter(args.adapter)
    md = Path(args.input).read_text(encoding="utf-8")
    result = adapter.render(md, args.theme, timeout=args.timeout)

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)

    if result is None:
        # v1 降级：落盘带 banner 的占位，告诉用户在浏览器里完成渲染
        placeholder = (
            "<!doctype html>\n<meta charset='utf-8'>\n"
            "<title>wechat-typeset render placeholder</title>\n"
            "<p style='font-family:monospace;padding:2em'>"
            "服务端渲染在 wechat-typeset v1 未实现。\n"
            f"请在浏览器打开 http://127.0.0.1:7788/ 粘贴同目录 annotated.md，"
            f"选择主题 <code>{args.theme}</code> 后一键复制。"
            "</p>\n"
        )
        out.write_text(placeholder, encoding="utf-8")
        _emit({"ok": True, "degraded": True, "output": str(out.relative_to(REPO_ROOT))})
        return 0

    out.write_text(result.html, encoding="utf-8")
    _emit(
        {
            "ok": len(result.errors) == 0,
            "degraded": False,
            "output": str(out.relative_to(REPO_ROOT)),
            "warnings": result.warnings,
            "errors": result.errors,
        }
    )
    return 0 if not result.errors else 1


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="adapter-cli", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--adapter", default=os.environ.get("INKFLOW_ADAPTER", "wechat-typeset"),
                   help="adapter name (default: wechat-typeset or $INKFLOW_ADAPTER)")
    p.add_argument("--timeout", type=float, default=5.0)
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("health", help="ping the adapter target")
    sp.set_defaults(func=cmd_health)

    sp = sub.add_parser("capabilities", help="fetch capabilities.json")
    sp.add_argument("--cache", action="store_true", help=f"write to {CACHE_FILE.relative_to(REPO_ROOT)}")
    sp.add_argument("--print", action="store_true", help="also print to stdout when --cache")
    sp.set_defaults(func=cmd_capabilities)

    sp = sub.add_parser("conform", help="verify plan ids against capabilities")
    sp.add_argument("--theme", required=True)
    sp.add_argument("--variants", nargs="*", help="kind=variantId pairs, e.g. admonition=terminal")
    sp.add_argument("--component", action="append", help="component id to verify (repeatable)")
    sp.add_argument("--no-cache", action="store_true")
    sp.set_defaults(func=cmd_conform)

    sp = sub.add_parser("render", help="POST /api/render (degrades on 501)")
    sp.add_argument("--input", required=True)
    sp.add_argument("--output", required=True)
    sp.add_argument("--theme", required=True)
    sp.set_defaults(func=cmd_render)

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
