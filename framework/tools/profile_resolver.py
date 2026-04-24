#!/usr/bin/env python3
"""
InkFlow Profile Resolver
========================

读 runtime/profile-lock.yaml.activeProfile → 展开 extends 图 → 合成 4 类 slot
→ 写 runtime/profile-resolved/{principles.md, voice.md, typesetting.yaml, constraints.yaml, manifest.json}

用法：
    python framework/tools/profile_resolver.py                # 读当前 lock
    python framework/tools/profile_resolver.py --profile id   # 显式指定
    python framework/tools/profile_resolver.py --refresh-if-stale 3600  # 陈旧才重建
    python framework/tools/profile_resolver.py --dry-run      # 校验不落盘

无依赖（除 PyYAML）。解析规则见 framework/contracts/profile-protocol.md § 4。
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import sys

# Windows 控制台默认 cp936/GBK，强制 stdout/stderr 为 UTF-8
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
import time
from datetime import datetime, timezone
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import yaml
except ImportError:
    print("[profile-resolver] error: PyYAML not installed (pip install pyyaml)", file=sys.stderr)
    sys.exit(2)

# ---------------------------------------------------------------------------
# 路径常量
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[2]
LOCK_PATH = REPO_ROOT / "runtime" / "profile-lock.yaml"
RESOLVED_DIR = REPO_ROOT / "runtime" / "profile-resolved"
PROFILES_DIRS = [
    REPO_ROOT / "profiles",
    Path.home() / ".inkflow" / "profiles",
]
KERNEL_CONTRACT = REPO_ROOT / "framework" / "contracts" / "writing-kernel.md"

SLOT_FILES = {
    "principles":  ("principles.md",  "markdown"),
    "voice":       ("voice.md",       "markdown"),
    "typesetting": ("typesetting.yaml","yaml"),
    "constraints": ("constraints.yaml","yaml"),
}


# ---------------------------------------------------------------------------
# 基础工具
# ---------------------------------------------------------------------------
def log(msg: str, level: str = "info") -> None:
    tag = {"info": "[profile]", "warn": "[profile:warn]", "error": "[profile:error]"}.get(level, "[profile]")
    print(f"{tag} {msg}", file=sys.stderr if level != "info" else sys.stdout)


def read_yaml(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: top-level must be a mapping")
    return data


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


# ---------------------------------------------------------------------------
# Profile 解析
# ---------------------------------------------------------------------------
@dataclass
class ProfileRef:
    id: str
    version_range: Optional[str] = None   # 形如 ^1.0.0 / ~0.2.0 / 1.0.0

    @classmethod
    def parse(cls, spec: str) -> "ProfileRef":
        m = re.match(r"^([a-z][a-z0-9-]*[a-z0-9])(?:@(.+))?$", spec.strip())
        if not m:
            raise ValueError(f"invalid profile spec: {spec!r}")
        return cls(id=m.group(1), version_range=m.group(2))


@dataclass
class LoadedProfile:
    id: str
    version: str
    path: Path
    manifest: Dict[str, Any]
    extends: List[ProfileRef] = field(default_factory=list)


def find_profile_dir(pid: str) -> Path:
    for root in PROFILES_DIRS:
        candidate = root / pid
        if (candidate / "profile.yaml").exists():
            return candidate
    raise FileNotFoundError(f"profile '{pid}' not found in {[str(p) for p in PROFILES_DIRS]}")


def load_profile(pid: str) -> LoadedProfile:
    pdir = find_profile_dir(pid)
    manifest = read_yaml(pdir / "profile.yaml")
    if manifest.get("apiVersion") != "inkflow.profile/v1":
        raise ValueError(f"{pid}: apiVersion must be inkflow.profile/v1")
    if manifest.get("id") != pid:
        raise ValueError(f"{pid}: manifest.id ({manifest.get('id')}) does not match directory name")
    version = str(manifest.get("version") or "0.0.0")
    extends = [ProfileRef.parse(s) for s in (manifest.get("extends") or [])]
    return LoadedProfile(id=pid, version=version, path=pdir, manifest=manifest, extends=extends)


def topo_sort(root_id: str) -> List[LoadedProfile]:
    """DFS topological sort of extends graph. Raises on cycle."""
    visited: Dict[str, str] = {}  # id -> state: 'gray' | 'black'
    order: List[LoadedProfile] = []
    cache: Dict[str, LoadedProfile] = {}

    def visit(pid: str, stack: Tuple[str, ...]) -> None:
        if pid in visited and visited[pid] == "black":
            return
        if pid in visited and visited[pid] == "gray":
            cycle = " -> ".join(stack + (pid,))
            raise ValueError(f"extends cycle detected: {cycle}")
        visited[pid] = "gray"
        if pid not in cache:
            cache[pid] = load_profile(pid)
        prof = cache[pid]
        for dep in prof.extends:
            visit(dep.id, stack + (pid,))
        visited[pid] = "black"
        order.append(prof)

    visit(root_id, tuple())
    return order


# ---------------------------------------------------------------------------
# 合并策略
# ---------------------------------------------------------------------------
def merge_yaml(lo: Any, hi: Any) -> Any:
    """深度合并：dict 递归；list 默认 union+dedup；$replace: true 强制覆盖；标量后者胜。"""
    if isinstance(hi, dict) and hi.get("$replace") is True and "value" in hi:
        return hi["value"]
    if isinstance(lo, dict) and isinstance(hi, dict):
        merged: Dict[str, Any] = dict(lo)
        for k, v in hi.items():
            if k == "$replace":
                continue
            merged[k] = merge_yaml(lo.get(k), v) if k in lo else v
        return merged
    if isinstance(lo, list) and isinstance(hi, list):
        out: List[Any] = []
        seen: set = set()
        for item in list(lo) + list(hi):
            key = json.dumps(item, sort_keys=True, ensure_ascii=False) if not isinstance(item, (str, int, float, bool, type(None))) else item
            if key in seen:
                continue
            seen.add(key)
            out.append(item)
        return out
    # 任一为 None 则取另一个；否则后者胜
    if lo is None:
        return hi
    if hi is None:
        return lo
    return hi


MD_SECTION_HEAD = re.compile(r"^##\s+(.+?)\s*$", re.MULTILINE)


def split_markdown_sections(md: str) -> Tuple[str, List[Tuple[str, str]]]:
    """返回 (frontmatter+preamble, [(title, body), ...])。"""
    # 剥离 yaml frontmatter
    pre = ""
    body = md
    if md.startswith("---\n"):
        end = md.find("\n---", 4)
        if end != -1:
            pre = md[: end + 4] + "\n"
            body = md[end + 4 :].lstrip("\n")
    # 找所有 ## 段
    matches = list(MD_SECTION_HEAD.finditer(body))
    if not matches:
        return pre + body, []
    preamble = body[: matches[0].start()]
    sections: List[Tuple[str, str]] = []
    for i, m in enumerate(matches):
        title = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        section_body = body[start:end].strip("\n")
        sections.append((title, section_body))
    return pre + preamble, sections


def merge_markdown(lo_md: str, hi_md: str) -> str:
    """同名 ## 小节内：列表条目 union+dedup，段落后者覆盖。其他小节顺序追加。"""
    lo_pre, lo_sections = split_markdown_sections(lo_md)
    _, hi_sections = split_markdown_sections(hi_md)

    merged: Dict[str, str] = {k: v for k, v in lo_sections}
    order = [k for k, _ in lo_sections]

    for title, hi_body in hi_sections:
        if title in merged:
            merged[title] = _merge_section_body(merged[title], hi_body)
        else:
            merged[title] = hi_body
            order.append(title)

    out = [lo_pre.rstrip() + "\n"] if lo_pre.strip() else []
    for title in order:
        out.append(f"\n## {title}\n\n{merged[title].strip()}\n")
    return "".join(out).lstrip("\n")


LIST_LINE = re.compile(r"^([-*])\s+(.+?)\s*$")


def _merge_section_body(lo: str, hi: str) -> str:
    """小节正文合并：识别顶层 '- ' 列表做 union，否则整块后者覆盖。"""
    lo_lines = lo.splitlines()
    hi_lines = hi.splitlines()
    lo_is_list = all((not ln.strip()) or LIST_LINE.match(ln) for ln in lo_lines) and any(LIST_LINE.match(ln) for ln in lo_lines)
    hi_is_list = all((not ln.strip()) or LIST_LINE.match(ln) for ln in hi_lines) and any(LIST_LINE.match(ln) for ln in hi_lines)
    if lo_is_list and hi_is_list:
        seen: set = set()
        merged: List[str] = []
        for ln in lo_lines + [""] + hi_lines:
            m = LIST_LINE.match(ln)
            if m:
                key = m.group(2).strip()
                if key in seen:
                    continue
                seen.add(key)
                merged.append(f"- {key}")
            elif ln.strip() == "" and merged and merged[-1] != "":
                # 保留一个空行的空隙；最终再 strip
                pass
        return "\n".join(merged)
    return hi  # 非列表段落 → 后者胜


# ---------------------------------------------------------------------------
# 合成
# ---------------------------------------------------------------------------
@dataclass
class SlotFragment:
    profile_id: str
    content: Any          # str for markdown, dict for yaml


def load_slot(profile: LoadedProfile, slot_name: str) -> Optional[SlotFragment]:
    slots = profile.manifest.get("slots") or {}
    decl = slots.get(slot_name)
    default_file, default_kind = SLOT_FILES[slot_name]
    if decl is None:
        # 回退到约定文件名
        candidate = profile.path / default_file
        if not candidate.exists():
            return None
        kind = default_kind
        file_path = candidate
    else:
        kind = decl.get("kind") or default_kind
        file_path = profile.path / decl["file"]
        if not file_path.exists():
            raise FileNotFoundError(f"{profile.id}: slot file missing: {file_path}")
    if kind == "yaml":
        return SlotFragment(profile.id, read_yaml(file_path))
    return SlotFragment(profile.id, read_text(file_path))


def compose(order: List[LoadedProfile]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """按拓扑序从低到高合并每个 slot。返回 (composed, provenance)。"""
    composed: Dict[str, Any] = {}
    provenance: Dict[str, List[str]] = {k: [] for k in SLOT_FILES}
    for prof in order:
        for slot in SLOT_FILES:
            frag = load_slot(prof, slot)
            if frag is None:
                continue
            provenance[slot].append(f"{prof.id}@{prof.version}")
            if slot not in composed:
                composed[slot] = frag.content
            else:
                if isinstance(frag.content, str):
                    composed[slot] = merge_markdown(composed[slot], frag.content)
                else:
                    composed[slot] = merge_yaml(composed[slot], frag.content)
    return composed, provenance


# ---------------------------------------------------------------------------
# 写出
# ---------------------------------------------------------------------------
def write_resolved(composed: Dict[str, Any], provenance: Dict[str, List[str]], order: List[LoadedProfile]) -> None:
    RESOLVED_DIR.mkdir(parents=True, exist_ok=True)
    for slot, (fname, kind) in SLOT_FILES.items():
        if slot not in composed:
            # 写空骨架提醒 agent
            placeholder = f"# {slot} (empty — kernel default applies)\n" if kind == "markdown" else "# empty — kernel default applies\n"
            write_text(RESOLVED_DIR / fname, placeholder)
            continue
        content = composed[slot]
        if kind == "yaml":
            header = f"# Generated by profile_resolver.py\n# layers: {' < '.join(provenance[slot])}\n"
            write_text(RESOLVED_DIR / fname, header + yaml.safe_dump(content, allow_unicode=True, sort_keys=False, default_flow_style=False))
        else:
            header = f"<!-- generated by profile_resolver.py · layers: {' < '.join(provenance[slot])} -->\n\n"
            write_text(RESOLVED_DIR / fname, header + content.lstrip())

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "resolved": [{"id": p.id, "version": p.version, "path": (p.path.relative_to(REPO_ROOT).as_posix() if p.path.is_relative_to(REPO_ROOT) else str(p.path))} for p in order],
        "provenance": provenance,
        "apiVersion": "inkflow.profile/v1",
    }
    write_text(RESOLVED_DIR / "manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))


def write_lock(order: List[LoadedProfile], active_id: str) -> None:
    lock = {
        "apiVersion": "inkflow.profile/v1",
        "activeProfile": active_id,
        "resolved": [
            {"id": p.id, "version": p.version, "path": (p.path.relative_to(REPO_ROOT).as_posix() if p.path.is_relative_to(REPO_ROOT) else str(p.path))}
            for p in order
        ],
        "resolvedAt": datetime.now(timezone.utc).isoformat(),
        "lockfileVersion": 1,
    }
    write_text(LOCK_PATH, yaml.safe_dump(lock, allow_unicode=True, sort_keys=False))


def read_active_id() -> Optional[str]:
    data = read_yaml(LOCK_PATH)
    return data.get("activeProfile")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser(description="InkFlow Profile Resolver")
    ap.add_argument("--profile", help="explicit profile id; default reads runtime/profile-lock.yaml")
    ap.add_argument("--refresh-if-stale", type=int, metavar="SECONDS", help="skip if resolved snapshot younger than N seconds")
    ap.add_argument("--dry-run", action="store_true", help="validate + print plan; do not write")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    active_id = args.profile or read_active_id()
    if not active_id:
        log("no activeProfile (runtime/profile-lock.yaml missing or empty) — kernel defaults will apply; nothing to resolve", "warn")
        return 0

    if args.refresh_if_stale and (RESOLVED_DIR / "manifest.json").exists():
        age = time.time() - (RESOLVED_DIR / "manifest.json").stat().st_mtime
        if age < args.refresh_if_stale:
            if not args.quiet:
                log(f"snapshot fresh ({int(age)}s < {args.refresh_if_stale}s), skip")
            return 0

    try:
        order = topo_sort(active_id)
    except Exception as e:
        log(str(e), "error")
        return 1

    if not args.quiet:
        log(f"active = {active_id}")
        log("resolution order: " + " < ".join(f"{p.id}@{p.version}" for p in order))

    composed, provenance = compose(order)

    if args.dry_run:
        print(json.dumps({"activeProfile": active_id, "order": [p.id for p in order], "slots": list(composed.keys()), "provenance": provenance}, ensure_ascii=False, indent=2))
        return 0

    write_resolved(composed, provenance, order)
    write_lock(order, active_id)
    if not args.quiet:
        log(f"resolved snapshot written to {RESOLVED_DIR.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
