"""wechat-typeset adapter（v2 契约，文件系统对接）.

与独立 repo 的对接方式：
- **能力清单**：读 ``<WECHAT_TYPESET_DIR>/dist/api/capabilities.json``
  （对方 ``npm run build`` 会触发 ``scripts/build-capabilities.ts`` 生成）。
  缺失 → raise AdapterError，上游 CP3 硬停。无任何静态推断降级。
- **dry-run 渲染**：shell-out 到 ``<WECHAT_TYPESET_DIR>/scripts/wechat-typeset-cli.ts``
  （npx tsx 跑，不依赖 headless 浏览器）。
- **文档路径**：通过 ``docs_paths()`` 暴露 sibling repo 内 SKILL.md / references/
  的绝对路径，agent 直接 Read——方式 A 集成无副本。

路径解析优先级：
1. 构造函数 ``repo_dir`` 参数
2. ``WECHAT_TYPESET_DIR`` 环境变量（指向对方 repo root）
3. inkflow.yaml 的 ``typeset.repo_dir``（由 CLI 注入）
4. 约定：Ink-Flow 同级的 ``../wechat-typeset/``
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any

from .base import (
    AdapterError,
    Capabilities,
    HealthResult,
    PlatformAdapter,
    ValidateResult,
)


def _default_repo_candidates() -> list[Path]:
    """按优先级列出可能的 wechat-typeset repo 根目录。"""
    candidates: list[Path] = []
    env = os.environ.get("WECHAT_TYPESET_DIR")
    if env:
        candidates.append(Path(env))
    # 约定：Ink-Flow repo 的同级目录
    repo_root = Path(__file__).resolve().parents[3]
    candidates.append(repo_root.parent / "wechat-typeset")
    return candidates


class WechatTypesetAdapter(PlatformAdapter):
    name = "wechat-typeset"
    contract_version = "2.0"

    def __init__(self, repo_dir: str | Path | None = None):
        self._explicit_repo = Path(repo_dir) if repo_dir else None
        self._cached_repo: Path | None = None

    # ------------------------------------------------------------------
    # repo 根目录解析（懒执行 + 结果缓存）
    # ------------------------------------------------------------------
    def _resolve_repo(self) -> Path:
        if self._cached_repo is not None:
            return self._cached_repo
        candidates: list[Path] = []
        if self._explicit_repo:
            candidates.append(self._explicit_repo)
        candidates.extend(_default_repo_candidates())

        for cand in candidates:
            if (cand / "package.json").exists() and (cand / "scripts").exists():
                self._cached_repo = cand
                return cand

        tried = "\n  - ".join(str(c) for c in candidates)
        raise AdapterError(
            "wechat-typeset repo not found. Tried:\n  - " + tried + "\n"
            "Fix: git clone https://github.com/lync-cyber/wechat-typeset.git ../wechat-typeset, "
            "or set WECHAT_TYPESET_DIR."
        )

    def _capabilities_file(self) -> Path:
        return self._resolve_repo() / "dist" / "api" / "capabilities.json"

    # ------------------------------------------------------------------
    # PlatformAdapter 接口
    # ------------------------------------------------------------------
    def health(self, timeout: float = 2.0) -> HealthResult:
        try:
            repo = self._resolve_repo()
        except AdapterError as e:
            return HealthResult(ok=False, reason=str(e))
        caps_file = self._capabilities_file()
        if not caps_file.exists():
            return HealthResult(
                ok=False,
                reason=(
                    f"capabilities.json missing at {caps_file}. "
                    f"Run: cd {repo} && npm ci && npm run build"
                ),
            )
        try:
            payload = json.loads(caps_file.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            return HealthResult(ok=False, reason=f"capabilities.json unreadable: {e}")
        if payload.get("schemaVersion") != "2.0":
            return HealthResult(
                ok=False,
                reason=(
                    f"capabilities schemaVersion={payload.get('schemaVersion')!r}; "
                    "InkFlow adapter expects 2.0. Rebuild provider."
                ),
            )
        tool = payload.get("tool") or {}
        version = tool.get("version", "")
        if not version or version == "unknown":
            return HealthResult(
                ok=False,
                reason=f"tool.version={version!r}; provider did not stamp a real version",
            )
        if not self._has_node_toolchain():
            return HealthResult(
                ok=False,
                reason="node/npx not found on PATH; needed to shell out to wechat-typeset CLI",
            )
        return HealthResult(
            ok=True,
            tool=tool.get("name", ""),
            version=version,
        )

    def capabilities(self, timeout: float = 5.0) -> Capabilities:
        caps_file = self._capabilities_file()
        if not caps_file.exists():
            raise AdapterError(
                f"capabilities.json missing at {caps_file}. "
                "Run `npm run build` in wechat-typeset repo."
            )
        try:
            payload = json.loads(caps_file.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            raise AdapterError(f"failed to read {caps_file}: {e}") from e
        return Capabilities.from_json(payload)

    def validate_markdown(
        self,
        md_path: str,
        *,
        persona: str,
        timeout: float = 30.0,
    ) -> ValidateResult:
        repo = self._resolve_repo()
        script = repo / "scripts" / "wechat-typeset-cli.ts"
        if not script.exists():
            raise AdapterError(
                f"{script} not found. Provider repo missing headless CLI; pull latest wechat-typeset."
            )
        md_abs = Path(md_path).resolve()
        if not md_abs.exists():
            raise AdapterError(f"markdown input not found: {md_abs}")

        cmd = self._npx_cmd() + [
            "tsx",
            str(script),
            "validate",
            "--input",
            str(md_abs),
            "--persona",
            persona,
        ]
        proc = subprocess.run(
            cmd,
            cwd=str(repo),
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
        )
        stdout = proc.stdout.strip()
        try:
            payload = json.loads(stdout) if stdout else {}
        except json.JSONDecodeError:
            raise AdapterError(
                f"wechat-typeset CLI returned non-JSON (exit={proc.returncode}):\n"
                f"stdout={stdout[:500]}\nstderr={proc.stderr[:500]}"
            )
        ok = bool(payload.get("ok", False))
        return ValidateResult(
            ok=ok,
            persona=payload.get("persona", persona),
            word_count=int(payload.get("wordCount") or 0),
            reading_time=int(payload.get("readingTime") or 0),
            html_length=int(payload.get("htmlLength") or 0),
            issues=list(payload.get("issues", [])) + (
                [] if ok else [{"kind": payload.get("error", "unknown"), "hint": payload.get("message", "")}]
                if not payload.get("issues")
                else []
            ),
            raw=payload,
        )

    def docs_paths(self) -> dict[str, str]:
        """返回 sibling repo 内 SKILL / 参考文档的绝对路径。agent 读这些而不是副本。"""
        repo = self._resolve_repo()
        caps = self.capabilities()
        paths: dict[str, str] = {}
        for key, rel in caps.docs.items():
            abs_path = (repo / rel).resolve()
            if abs_path.exists():
                paths[key] = str(abs_path)
            else:
                paths[key] = f"MISSING: {abs_path}"
        # 兜底：若 capabilities 未列 docs，至少给出 SKILL.md 与 container-syntax.md
        if "skillReadme" not in paths:
            candidate = repo / "skills" / "wechat-typeset" / "SKILL.md"
            if candidate.exists():
                paths["skillReadme"] = str(candidate)
        if "containerSyntax" not in paths:
            candidate = repo / "docs" / "container-syntax.md"
            if candidate.exists():
                paths["containerSyntax"] = str(candidate)
        return paths

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _has_node_toolchain(self) -> bool:
        return shutil.which("node") is not None and shutil.which("npx") is not None

    def _npx_cmd(self) -> list[str]:
        """Windows 上 npx 实为 npx.cmd；subprocess 需要完整可执行名。"""
        npx = shutil.which("npx") or shutil.which("npx.cmd")
        if not npx:
            raise AdapterError("npx not found on PATH")
        return [npx]
