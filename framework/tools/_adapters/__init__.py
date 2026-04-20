"""Platform adapters for InkFlow.

Each adapter bridges InkFlow (content producer) and a typesetting / rendering
tool (wechat-typeset, zhihu, xiaohongshu, ...). Adapters speak a common
contract defined in ``framework/contracts/<adapter>-v<N>.schema.json`` and
expose a uniform interface via ``base.PlatformAdapter``.

See ``README.md`` for registration semantics and how to add new platforms.
"""

from .base import PlatformAdapter, Capabilities, RenderResult, AdapterError
from .wechat_typeset import WechatTypesetAdapter

__all__ = [
    "PlatformAdapter",
    "Capabilities",
    "RenderResult",
    "AdapterError",
    "WechatTypesetAdapter",
    "get_adapter",
]


def get_adapter(name: str) -> PlatformAdapter:
    """Factory. Keep it dumb: explicit mapping, no plugin discovery magic."""
    if name in ("wechat-typeset", "wechat", "wx-md"):
        return WechatTypesetAdapter()
    raise AdapterError(f"unknown adapter: {name!r}")
