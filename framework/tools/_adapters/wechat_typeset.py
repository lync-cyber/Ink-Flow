"""wechat-typeset adapter（文件系统优先，HTTP 可选）.

与独立 repo 的对接方式：
- **主路径**：直接读 ``<WECHAT_TYPESET_DIR>/dist/api/capabilities.json``。
  wechat-typeset 的 ``npm run build`` 会通过 ``scripts/build-capabilities.mjs``
  把主题 / variant / 组件清单静态化到该文件。
  零 HTTP 耦合，零启动依赖。
- **可选路径**：若 ``WXMD_ENDPOINT`` 环境变量存在且对应 serve 可访问，
  走 ``GET /api/capabilities`` 拉取。用于未来 wechat-typeset 加了 headless API
  的场景；本 adapter 不强依赖。
- **render 始终返回 None**：wechat-typeset 的渲染管线与 Vue iframe preview
  耦合，不适合 headless 出 HTML。下游 typesetter agent 只落盘 plan + annotated，
  最终渲染交给用户在浏览器里一键复制。

路径解析优先级：
1. 构造函数 ``dist_dir`` 参数
2. ``WECHAT_TYPESET_DIR`` 环境变量
3. inkflow.yaml 的 ``typeset.dist_dir``（由 CLI 注入）
4. 约定：Ink-Flow 同级的 ``../wechat-typeset/dist``
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from .base import (
    AdapterError,
    Capabilities,
    HealthResult,
    PlatformAdapter,
    RenderResult,
)


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

    # ------------------------------------------------------------------
    # dist 目录解析（懒执行 + 结果缓存）
    # ------------------------------------------------------------------
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

    # ------------------------------------------------------------------
    # 三个 endpoint（文件系统语义）
    # ------------------------------------------------------------------
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

    def render(
        self,
        md: str,
        theme: str,
        *,
        timeout: float = 10.0,
    ) -> RenderResult | None:
        # v1 不支持服务端渲染；上游 CLI 会落盘占位 HTML。
        return None
