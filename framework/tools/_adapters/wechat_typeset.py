"""wechat-typeset adapter（文件系统读 capabilities.json）。

与独立 repo 的对接方式：
- 直接读 ``<WECHAT_TYPESET_DIR>/dist/api/capabilities.json``。
  wechat-typeset 的 ``npm run build`` 会通过 ``scripts/build-capabilities.mjs``
  把主题 / variant / 组件清单静态化到该文件。
  零 HTTP 耦合，零启动依赖。

本 adapter **只做 capabilities 对账**：
- 把 variant 白名单搬进 runtime/typeset-capabilities.json，供 lint.py 消费
- 主题 / variant / 组件选择在 wechat-typeset 本地编辑器（127.0.0.1:7788）
  由用户运行时完成，不在 pipeline 决策

路径解析优先级：
1. 构造函数 ``dist_dir`` 参数
2. ``WECHAT_TYPESET_DIR`` 环境变量
3. 约定：Ink-Flow 同级的 ``../wechat-typeset/dist``
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from .base import AdapterError, Capabilities, HealthResult, PlatformAdapter


def _default_dist_candidates() -> list[Path]:
    """按优先级列出可能的 wechat-typeset dist 目录。"""
    candidates: list[Path] = []
    env = os.environ.get("WECHAT_TYPESET_DIR")
    if env:
        candidates.append(Path(env) / "dist")

    # 约定：Ink-Flow repo 的同级目录
    repo_root = Path(__file__).resolve().parents[3]  # framework/tools/_adapters → repo root
    candidates.append(repo_root.parent / "wechat-typeset" / "dist")

    return candidates


class WechatTypesetAdapter(PlatformAdapter):
    name = "wechat-typeset"
    contract_version = "1.0"

    def __init__(self, dist_dir: str | Path | None = None):
        self._explicit_dist = Path(dist_dir) if dist_dir else None
        self._cached_dist: Path | None = None

    def _resolve_dist(self) -> Path:
        if self._cached_dist is not None:
            return self._cached_dist
        candidates: list[Path] = []
        if self._explicit_dist:
            candidates.append(self._explicit_dist)
        candidates.extend(_default_dist_candidates())

        for cand in candidates:
            if (cand / "api" / "capabilities.json").exists():
                self._cached_dist = cand
                return cand

        tried = "\n  - ".join(str(c) for c in candidates)
        raise AdapterError(
            "wechat-typeset capabilities.json not found. Tried:\n  - " + tried + "\n"
            "Fix: cd into your wechat-typeset clone and run `npm run build`, "
            "or set WECHAT_TYPESET_DIR to point at it."
        )

    def health(self, timeout: float = 2.0) -> HealthResult:
        try:
            dist = self._resolve_dist()
        except AdapterError as e:
            return HealthResult(ok=False, reason=str(e))
        caps_file = dist / "api" / "capabilities.json"
        try:
            payload = json.loads(caps_file.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            return HealthResult(ok=False, reason=f"capabilities.json unreadable: {e}")
        tool = payload.get("tool") or {}
        return HealthResult(
            ok=True,
            tool=tool.get("name", ""),
            version=tool.get("version", ""),
        )

    def capabilities(self, timeout: float = 5.0) -> Capabilities:
        dist = self._resolve_dist()
        caps_file = dist / "api" / "capabilities.json"
        try:
            payload = json.loads(caps_file.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            raise AdapterError(f"failed to read {caps_file}: {e}") from e
        return Capabilities.from_json(payload)
