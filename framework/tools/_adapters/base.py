"""PlatformAdapter 接口（平台无关）。

任何新平台（知乎 / 小红书 / Medium）只需实现 ``PlatformAdapter`` 子类，
并在 ``__init__.py`` 的 ``get_adapter`` 工厂里注册。

设计原则：
- **无状态**：adapter 不持有会话或鉴权；所有调用都是单次 HTTP。
- **失败即告知**：`health()` 返回布尔 + 原因；`render()` 不可用时返回 None
  并在 warnings 里说明，而不是抛异常。上游 agent 可据此降级。
- **合约锁定**：capabilities 字段读自 JSON Schema，Agent 读取前必须调用
  ``conform_plan`` 做静态校验，拒绝 hallucinated id。
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
class Capabilities:
    """来自 GET /api/capabilities 的结构化快照。字段来自 v1 schema。"""

    schema_version: str
    tool_name: str
    tool_version: str
    themes: list[dict[str, Any]]
    variants: dict[str, list[str]]
    default_variants: dict[str, str]
    components: list[dict[str, Any]]
    raw: dict[str, Any] = field(repr=False, default_factory=dict)

    @classmethod
    def from_json(cls, payload: dict[str, Any]) -> "Capabilities":
        return cls(
            schema_version=payload["schemaVersion"],
            tool_name=payload["tool"]["name"],
            tool_version=payload["tool"]["version"],
            themes=list(payload.get("themes", [])),
            variants={k: list(v) for k, v in payload.get("variants", {}).items()},
            default_variants=dict(payload.get("defaultVariants", {})),
            components=list(payload.get("components", [])),
            raw=payload,
        )

    def theme_ids(self) -> list[str]:
        return [t["id"] for t in self.themes]

    def component_ids(self) -> set[str]:
        return {c["id"] for c in self.components}


@dataclass(frozen=True)
class RenderResult:
    """v2 预留；v1 下 adapter.render() 返回 None，agent 按降级路径继续。"""

    html: str
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class HealthResult:
    ok: bool
    tool: str = ""
    version: str = ""
    reason: str = ""


class PlatformAdapter(ABC):
    """Ink-Flow 与外部排版工具之间的稳定接口。"""

    #: adapter 在注册表里的 canonical name
    name: str = ""

    #: 契约版本（与 capabilities.schemaVersion 对齐）
    contract_version: str = "1.0"

    @abstractmethod
    def health(self, timeout: float = 2.0) -> HealthResult: ...

    @abstractmethod
    def capabilities(self, timeout: float = 5.0) -> Capabilities: ...

    @abstractmethod
    def render(
        self,
        md: str,
        theme: str,
        *,
        timeout: float = 10.0,
    ) -> RenderResult | None:
        """v1 可返回 None 表示"当前工具版本不支持服务端渲染"。"""

    # ------------------------------------------------------------------
    # 公共工具：plan 合规校验。实现放在基类，子类不用重复。
    # ------------------------------------------------------------------
    def conform_plan(
        self,
        *,
        theme_id: str,
        variant_choices: dict[str, str],
        component_ids: list[str],
        capabilities: Capabilities,
    ) -> list[str]:
        """返回违反条目的人类可读列表；空列表即通过。"""
        violations: list[str] = []

        if theme_id not in capabilities.theme_ids():
            violations.append(
                f"theme '{theme_id}' not in capabilities (available: {', '.join(capabilities.theme_ids())})"
            )

        for kind, vid in variant_choices.items():
            allowed = capabilities.variants.get(kind)
            if allowed is None:
                violations.append(f"unknown container kind '{kind}'")
                continue
            if vid not in allowed:
                violations.append(
                    f"variant '{vid}' not valid for kind '{kind}' (allowed: {', '.join(allowed)})"
                )

        known = capabilities.component_ids()
        for cid in component_ids:
            if cid not in known:
                violations.append(f"component id '{cid}' not registered in tool")

        return violations
