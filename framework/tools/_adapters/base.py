"""PlatformAdapter 接口（平台无关）。

任何新平台（知乎 / 小红书 / Medium）只需实现 ``PlatformAdapter`` 子类，
并在 ``__init__.py`` 的 ``get_adapter`` 工厂里注册。

设计原则：
- **无状态**：adapter 不持有会话或鉴权；所有调用都是单次 IO
- **失败即告知**：`health()` 返回布尔 + 原因，上游可据此降级
- **能力对账，不做决策**：adapter 只负责把外部工具的 capabilities.json 搬到
  InkFlow 侧（缓存到 runtime/typeset-capabilities.json），变成 lint.py 消费的
  variant 白名单。主题 / variant / 组件选择是运行时用户动作，不由 pipeline 决定。
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
    """来自对方 capabilities.json 的结构化快照。字段来自 v1 schema。"""

    schema_version: str
    tool_name: str
    tool_version: str
    variants: dict[str, list[str]]
    raw: dict[str, Any] = field(repr=False, default_factory=dict)

    @classmethod
    def from_json(cls, payload: dict[str, Any]) -> "Capabilities":
        return cls(
            schema_version=payload["schemaVersion"],
            tool_name=payload["tool"]["name"],
            tool_version=payload["tool"]["version"],
            variants={k: list(v) for k, v in payload.get("variants", {}).items()},
            raw=payload,
        )


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
