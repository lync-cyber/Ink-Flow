#!/usr/bin/env python3
"""Adapter CLI — agent 通过 Bash 调用的统一入口（契约 v2）.

子命令：
  health         探测 adapter 目标是否在线（capabilities.json 可读 + node/npx 可用）
  capabilities   拉取 capabilities 并写入 runtime/typeset-capabilities.json
  docs           列出 sibling repo 内 SKILL / 参考文档的**绝对路径**（方式 A）
  validate       对 annotated.md 做 dry-run：fence 语法 + 真实 render 能否成功
  conform        校验 plan 是否只用合规 id（persona / container / variant）

示例：
  python framework/tools/_adapters/cli.py health
  python framework/tools/_adapters/cli.py capabilities --cache
  python framework/tools/_adapters/cli.py docs
  python framework/tools/_adapters/cli.py validate --input annotated.md --persona tech-explainer
  python framework/tools/_adapters/cli.py conform --persona tech-explainer \\
        --signature tip=terminal \\
        --variant-override quote-card=classic --variant-override compare=ledger

退出码：
  0   成功
  1   health 失败 / 合规校验失败 / render dry-run 失败
  2   参数错误
  3   AdapterError（能力清单缺失、repo 未 clone 等）
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE.parent) not in sys.path:
    sys.path.insert(0, str(HERE.parent))

# Windows 控制台默认 cp1252 会吃中文 / emoji；JSON 输出统一走 utf-8。
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass

from _adapters import AdapterError, get_adapter  # noqa: E402
from _adapters.base import Capabilities  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[3]
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


def cmd_docs(args: argparse.Namespace) -> int:
    adapter = get_adapter(args.adapter)
    paths = adapter.docs_paths()
    _emit({"paths": paths})
    return 0


def cmd_validate(args: argparse.Namespace) -> int:
    adapter = get_adapter(args.adapter)
    md_path = Path(args.input)
    if not md_path.exists():
        print(f"[validate] input not found: {md_path}", file=sys.stderr)
        return 2
    result = adapter.validate_markdown(
        str(md_path),
        persona=args.persona,
        timeout=args.timeout,
    )
    _emit(
        {
            "ok": result.ok,
            "persona": result.persona,
            "wordCount": result.word_count,
            "readingTime": result.reading_time,
            "htmlLength": result.html_length,
            "issues": result.issues,
        }
    )
    return 0 if result.ok else 1


def _parse_kv(items: list[str] | None) -> list[dict[str, str]]:
    """['container=variant', ...] → [{"container": c, "variant": v}]"""
    out: list[dict[str, str]] = []
    for s in items or []:
        if "=" not in s:
            raise argparse.ArgumentTypeError(f"expected container=variant, got {s!r}")
        c, v = s.split("=", 1)
        out.append({"container": c.strip(), "variant": v.strip()})
    return out


def cmd_conform(args: argparse.Namespace) -> int:
    caps_payload: dict
    if CACHE_FILE.exists() and not args.no_cache:
        caps_payload = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    else:
        adapter = get_adapter(args.adapter)
        caps_payload = adapter.capabilities(timeout=args.timeout).raw
    caps = Capabilities.from_json(caps_payload)

    signature: dict[str, str] | None = None
    if args.signature:
        if "=" not in args.signature:
            print(f"[conform] --signature expects container=variant, got {args.signature!r}", file=sys.stderr)
            return 2
        c, v = args.signature.split("=", 1)
        signature = {"container": c.strip(), "variant": v.strip()}
    overrides = _parse_kv(args.variant_override)

    adapter = get_adapter(args.adapter)
    violations = adapter.conform_plan(
        persona_id=args.persona,
        signature=signature,
        variant_overrides=overrides,
        capabilities=caps,
    )

    # 额外：图片 src 必须是 http(s) 或数据 URI（P1-6）
    if args.markdown:
        import re

        md = Path(args.markdown).read_text(encoding="utf-8")
        for m in re.finditer(r"!\[[^\]]*\]\(([^)]+)\)", md):
            src = m.group(1).strip()
            if not (src.startswith("http://") or src.startswith("https://") or src.startswith("data:")):
                violations.append(
                    f"image src {src!r} is a local/relative path; upload to CDN or 公众号素材库 before typeset"
                )

    _emit({"ok": len(violations) == 0, "violations": violations})
    return 0 if not violations else 1


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="adapter-cli",
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument(
        "--adapter",
        default=os.environ.get("INKFLOW_ADAPTER", "wechat-typeset"),
        help="adapter name (default: wechat-typeset or $INKFLOW_ADAPTER)",
    )
    p.add_argument("--timeout", type=float, default=30.0)
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("health", help="check adapter reachability")
    sp.set_defaults(func=cmd_health)

    sp = sub.add_parser("capabilities", help="fetch capabilities.json")
    sp.add_argument("--cache", action="store_true", help=f"write to {CACHE_FILE.relative_to(REPO_ROOT)}")
    sp.add_argument("--print", action="store_true", help="also print to stdout when --cache")
    sp.set_defaults(func=cmd_capabilities)

    sp = sub.add_parser("docs", help="list absolute paths of sibling repo SKILL/reference docs")
    sp.set_defaults(func=cmd_docs)

    sp = sub.add_parser("validate", help="fence-syntax + render dry-run via provider CLI")
    sp.add_argument("--input", required=True)
    sp.add_argument("--persona", required=True)
    sp.set_defaults(func=cmd_validate)

    sp = sub.add_parser("conform", help="verify plan ids against capabilities")
    sp.add_argument("--persona", required=True)
    sp.add_argument("--signature", help="container=variant, e.g. tip=terminal")
    sp.add_argument(
        "--variant-override",
        action="append",
        help="container=variant; repeatable",
    )
    sp.add_argument("--markdown", help="optional annotated.md path; checks image src policy")
    sp.add_argument("--no-cache", action="store_true")
    sp.set_defaults(func=cmd_conform)

    return p


def main() -> int:
    args = build_parser().parse_args()
    try:
        return args.func(args)
    except AdapterError as e:
        print(f"[adapter-cli] {e}", file=sys.stderr)
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
