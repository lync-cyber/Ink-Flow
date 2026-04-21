"""PlatformAdapter 接口（平台无关）。

任何新平台（知乎 / 小红书 / Medium）只需实现 ``PlatformAdapter`` 子类，
并在 ``__init__.py`` 的 ``get_adapter`` 工厂里注册。

设计原则：
- **无状态**：adapter 不持有会话或鉴权。
- **早失败**：health() / capabilities() 失败直接 raise AdapterError；不再有"静态推断
  降级"或"adapter_version=unknown"这种半活产物——上游流水线据此硬停 CP3。
- **合约锁定**：capabilities 字段读自对方 v2 schema，conform 对照 containers[] +
  signatureContainerIds + personas[]，拒绝 hallucinated id。
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


class AdapterError(Exception):
    """所有 adapter 错误的根；包含原始 HTTP status / reason 便于 agent 决策。"""

    def __init__(self, message: str, *, status: int | None = None, reason: str | None = None):
        super().__init__(message)
        self.status = status
        self.reason = reason


@dataclass(frozen=True)
class Persona:
    id: str
    name: str
    description: str
    audience: str
    signature_containers: tuple[str, ...]
    variants: dict[str, str]
    palette_primary: str = ""


@dataclass(frozen=True)
class ContainerSpec:
    id: str
    kind: str  # variantized / admonition / free / nested
    variants: tuple[str, ...] = ()
    default_variant: str = ""
    children: tuple[str, ...] = ()
    notes: str = ""

    def allows_variant(self, variant_id: str) -> bool:
        if not self.variants:
            return False
        return variant_id in self.variants


@dataclass(frozen=True)
class Capabilities:
    """来自 dist/api/capabilities.json 的结构化快照；契约 v2。"""

    schema_version: str
    tool_name: str
    tool_version: str
    personas: list[Persona]
    containers: list[ContainerSpec]
    signature_container_ids: tuple[str, ...]
    inline_extensions: list[dict[str, str]]
    hard_rules: dict[str, Any]
    docs: dict[str, str]
    generated_at: str = ""
    raw: dict[str, Any] = field(repr=False, default_factory=dict)

    @classmethod
    def from_json(cls, payload: dict[str, Any]) -> "Capabilities":
        if payload.get("schemaVersion") != "2.0":
            raise AdapterError(
                f"unsupported capabilities schemaVersion: {payload.get('schemaVersion')!r} "
                f"(expected '2.0'). Rebuild provider: `npm run build:capabilities` in wechat-typeset."
            )
        tool = payload.get("tool") or {}
        version = str(tool.get("version", ""))
        if not version or version == "unknown":
            raise AdapterError(
                f"capabilities.tool.version must be a concrete SemVer, got {version!r}. "
                "Provider did not stamp a version; rebuild with proper package.json."
            )
        personas = [
            Persona(
                id=p["id"],
                name=p["name"],
                description=p["description"],
                audience=p["audience"],
                signature_containers=tuple(p.get("signatureContainers", [])),
                variants=dict(p.get("variants", {})),
                palette_primary=p.get("palettePrimary", ""),
            )
            for p in payload.get("personas", [])
        ]
        containers = [
            ContainerSpec(
                id=c["id"],
                kind=c["kind"],
                variants=tuple(c.get("variants", [])),
                default_variant=c.get("defaultVariant", ""),
                children=tuple(c.get("children", [])),
                notes=c.get("notes", ""),
            )
            for c in payload.get("containers", [])
        ]
        return cls(
            schema_version=payload["schemaVersion"],
            tool_name=tool.get("name", ""),
            tool_version=version,
            personas=personas,
            containers=containers,
            signature_container_ids=tuple(payload.get("signatureContainerIds", [])),
            inline_extensions=list(payload.get("inlineExtensions", [])),
            hard_rules=dict(payload.get("hardRules", {})),
            docs=dict(payload.get("docs", {})),
            generated_at=payload.get("generatedAt", ""),
            raw=payload,
        )

    # 便捷查询
    def persona_ids(self) -> list[str]:
        return [p.id for p in self.personas]

    def container_ids(self) -> set[str]:
        return {c.id for c in self.containers}

    def container(self, cid: str) -> ContainerSpec | None:
        for c in self.containers:
            if c.id == cid:
                return c
        return None


@dataclass(frozen=True)
class ValidateResult:
    ok: bool
    persona: str = ""
    word_count: int = 0
    reading_time: int = 0
    html_length: int = 0
    issues: list[dict[str, Any]] = field(default_factory=list)
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class HealthResult:
    ok: bool
    tool: str = ""
    version: str = ""
    reason: str = ""


class PlatformAdapter(ABC):
    """Ink-Flow 与外部排版工具之间的稳定接口。"""

    name: str = ""
    contract_version: str = "2.0"

    @abstractmethod
    def health(self, timeout: float = 2.0) -> HealthResult: ...

    @abstractmethod
    def capabilities(self, timeout: float = 5.0) -> Capabilities: ...

    @abstractmethod
    def validate_markdown(
        self,
        md_path: str,
        *,
        persona: str,
        timeout: float = 30.0,
    ) -> ValidateResult:
        """对 annotated markdown 做 dry-run：fence 语法 + render 能否成功。"""

    @abstractmethod
    def docs_paths(self) -> dict[str, str]:
        """返回 sibling repo 内 SKILL / 参考文档的**绝对路径**，供 agent Read。"""

    # ------------------------------------------------------------------
    # 公共工具：plan 合规校验（对 v2 containers + personas）
    # ------------------------------------------------------------------
    def conform_plan(
        self,
        *,
        persona_id: str,
        signature: dict[str, str] | None,
        variant_overrides: list[dict[str, str]],
        capabilities: Capabilities,
    ) -> list[str]:
        """返回违反条目的人类可读列表；空列表即通过。

        参数：
          persona_id          对方 personas[].id
          signature           {"container": "tip", "variant": "terminal"} 或 None
          variant_overrides   [{"container":"quote-card","variant":"classic"}, ...]
        """
        violations: list[str] = []

        if persona_id not in capabilities.persona_ids():
            violations.append(
                f"persona '{persona_id}' not in capabilities "
                f"(available: {', '.join(capabilities.persona_ids())})"
            )

        def _check_container_variant(cid: str, vid: str, context: str) -> None:
            c = capabilities.container(cid)
            if c is None:
                violations.append(f"{context}: container '{cid}' not registered")
                return
            if c.kind in ("free", "nested"):
                violations.append(
                    f"{context}: container '{cid}' (kind={c.kind}) has no variant support"
                )
                return
            if not c.allows_variant(vid):
                allowed = ", ".join(c.variants)
                violations.append(
                    f"{context}: variant '{vid}' not valid for container '{cid}' "
                    f"(allowed: {allowed})"
                )

        if signature and signature.get("container") and signature.get("variant"):
            _check_container_variant(
                signature["container"], signature["variant"], "signature"
            )

        for idx, ov in enumerate(variant_overrides):
            cid = ov.get("container") or ""
            vid = ov.get("variant") or ""
            if not cid or not vid:
                violations.append(
                    f"variantOverrides[{idx}] missing container/variant"
                )
                continue
            _check_container_variant(cid, vid, f"variantOverrides[{idx}]")

        return violations
