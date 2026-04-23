#!/usr/bin/env python3
"""InkFlow Markdown Lint — 文章格式校验工具

用法: python .claude/skills/quality-linting/scripts/lint.py <markdown-file> \
           [--column <栏目名>] [--platform <wechat|xiaohongshu|zhihu|juejin>] [--config <config.yaml>]

数据来源：
- .claude/skills/quality-linting/scripts/config.yaml       规则开关与严重级别（基础）
- .claude/rules/data/*.yaml           禁用词、CSS 安全、排版阈值（单一事实来源）
- framework/config/platform-lint-rules.yaml               平台差异规则（渐进披露）
- framework/config/columns/{column}.platforms.yaml         length_limit 硬上限

平台规则合并顺序（后者覆盖前者）：
  DEFAULT_CONFIG → .claude/rules/data/*.yaml → config.yaml → platform-lint-rules.{platform}

输出: JSON (stdout), 人类可读摘要 (stderr)
退出码: 0=通过, 1=有 error, 2=仅 warning
"""

import argparse
import copy
import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None

# ============================================================
# 常量
# ============================================================

# GFM Alert 合法类型清单（权威来源：framework/contracts/writing-contract.md § 3）
# 修改本清单前务必同步契约文件与 platform-lint-rules.yaml 的 allowed_types 字段
GFM_ALERT_TYPES = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"]

# ============================================================
# 配置加载
# ============================================================

DEFAULT_CONFIG = {
    "rules": {
        "forbidden_blocks": {
            "enabled": True,
            "severity": "error",
            # 任何 ^::: 残留都视为错误（粘贴微信必失效）。
        },
        "gfm_alerts": {
            "enabled": True,
            "severity": "warning",
            "allowed_types": GFM_ALERT_TYPES,
        },
        "typography": {
            "enabled": True,
            "severity": "warning",
            "max_paragraph_chars": 120,
            "max_sentence_chars": 40,
            "allowed_headings": [2, 3, 4],
        },
        "theme_constraints": {"enabled": True, "severity": "error"},
        "image_references": {"enabled": True, "severity": "warning"},
        "css_safety": {
            "enabled": True,
            "severity": "error",
            "forbidden_css": ["position:", "@media", "@keyframes", ":hover", ":active", "float:", "gap:"],
            "forbidden_tags": ["<style", "<script"],
        },
        "forbidden_patterns": {"enabled": True, "severity": "warning", "words": [
            # 与 .claude/rules/data/forbidden-phrases.yaml 同步（PyYAML 不可用时的回退）
            "值得注意的是", "显而易见", "毋庸置疑", "不难发现", "综上所述",
            "众所周知", "不可否认", "不得不说", "无可避免", "这无疑是",
            "毫无疑问", "不言而喻", "从某种意义上说", "在一定程度上",
            "未来可期", "让我们拭目以待", "相信未来", "这表明", "由此可见",
            "通过以上分析", "不难看出", "这说明", "接下来我们来看",
            "可以看到", "需要注意的是", "希望本文对你有所帮助",
        ]},
    },
    "column_overrides": {
        "学术前沿": {"theme_constraints": {"require_references": True, "require_tldr": True}},
    },
}


# 数据文件根目录（单一事实来源）
# __file__ = .claude/skills/quality-linting/scripts/lint.py
# parent^1 scripts → parent^2 quality-linting → parent^3 skills → parent^4 .claude → parent^5 仓库根
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
RULES_DATA_DIR = REPO_ROOT / ".claude" / "rules" / "data"
FRAMEWORK_CONFIG_DIR = REPO_ROOT / "framework" / "config"
PLATFORM_RULES_FILE = FRAMEWORK_CONFIG_DIR / "platform-lint-rules.yaml"
COLUMNS_DIR = FRAMEWORK_CONFIG_DIR / "columns"


def _load_yaml(path: Path) -> dict:
    if path.exists() and yaml:
        with open(path, encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}


def _merge_data_sources(config: dict) -> dict:
    """将 .claude/rules/data/*.yaml 注入 config，构造 lint 规则所需的完整结构。"""
    rules = config.setdefault("rules", {})

    # forbidden-phrases.yaml → rules.forbidden_patterns.words
    phrases = _load_yaml(RULES_DATA_DIR / "forbidden-phrases.yaml")
    if phrases:
        words = []
        for group in ("clichés", "vague", "ai_tells", "filler", "closing_cliches"):
            words.extend(phrases.get(group, []) or [])
        rules.setdefault("forbidden_patterns", {})["words"] = words

    # platform-limits.yaml 多平台结构。默认注入 wechat；
    # 其他平台由 _merge_platform_rules 按 --platform 选段覆盖。
    platform_doc = _load_yaml(RULES_DATA_DIR / "platform-limits.yaml")
    if platform_doc:
        platforms_section = platform_doc.get("platforms", {}) or {}
        wechat_cfg = platforms_section.get("wechat", {}) or {}
        _apply_platform_thresholds(rules, wechat_cfg)
        config["_platform_limits_doc"] = platform_doc

    return config


def _apply_platform_thresholds(rules: dict, p_cfg: dict) -> None:
    """把 platform-limits.yaml 单个平台段的数值阈值合并到 lint rules。"""
    if not p_cfg:
        return
    para = p_cfg.get("paragraph", {}) or {}
    sent = p_cfg.get("sentence", {}) or {}
    heads = p_cfg.get("headings", {}) or {}
    typo_rule = rules.setdefault("typography", {})
    if "max_chars" in para:
        typo_rule["max_paragraph_chars"] = para["max_chars"]
    if "max_chars" in sent:
        typo_rule["max_sentence_chars"] = sent["max_chars"]
    if "allowed" in heads:
        typo_rule["allowed_headings"] = heads["allowed"]
    svg = p_cfg.get("svg", {}) or {}
    if svg:
        svg_rule = rules.setdefault("svg_readability", {})
        if "min_font_size" in svg:
            svg_rule["min_font_size"] = svg["min_font_size"]
        if "caption_font_size" in svg:
            svg_rule["caption_font_size"] = svg["caption_font_size"]
    css_rule = rules.setdefault("css_safety", {})
    if "forbidden_css" in p_cfg:
        css_rule["forbidden_css"] = p_cfg["forbidden_css"]
    if "forbidden_tags" in p_cfg:
        forbidden_tags = p_cfg.get("forbidden_tags", []) or []
        css_rule["forbidden_tags"] = [f"<{t}" for t in forbidden_tags]


def _merge_platform_rules(config: dict, platform: str) -> dict:
    """按 platform 合并：
       (1) 数值阈值 ← .claude/rules/data/platform-limits.yaml 的 platforms.{platform}
                      （含 length_limit_factor / length_hard_factor / paragraph / sentence / svg / css）
       (2) 规则启用/严重级别/消息 ← framework/config/platform-lint-rules.yaml 的 platforms.{platform}

    渐进披露：只读取 platforms.{platform} 段，不一次性合并所有平台。
    """
    if not platform or not yaml:
        return config
    rules = config.setdefault("rules", {})

    # ---- (1) platform-limits.yaml v3：注入数值阈值 ----
    plimits_doc = config.get("_platform_limits_doc") or _load_yaml(RULES_DATA_DIR / "platform-limits.yaml")
    if plimits_doc:
        defaults = plimits_doc.get("defaults", {}) or {}
        p_limits = (plimits_doc.get("platforms", {}) or {}).get(platform, {}) or {}
        # 顶层数值字段：缺则回退 defaults
        merged_top = {}
        for key in ("length_limit_factor", "length_hard_factor"):
            if key in p_limits:
                merged_top[key] = p_limits[key]
            elif key in defaults:
                merged_top[key] = defaults[key]
        # 合并嵌套段（paragraph/sentence/headings 等），platform 段覆盖 defaults
        for section in ("paragraph", "sentence", "headings"):
            base_seg = defaults.get(section, {}) or {}
            plat_seg = p_limits.get(section, {}) or {}
            if base_seg or plat_seg:
                merged_top[section] = {**base_seg, **plat_seg}
        # 把数值阈值注入 lint rules
        merged_for_apply = {**p_limits}
        for k in ("paragraph", "sentence", "headings"):
            if k in merged_top:
                merged_for_apply[k] = merged_top[k]
        _apply_platform_thresholds(rules, merged_for_apply)
        # 顶层字段（length_limit_factor 等）放入 _platform_cfg 供 rule_length_limit 读取
        platform_top = {**merged_top}
    else:
        platform_top = {}

    # ---- (2) platform-lint-rules.yaml：覆盖规则 enabled/severity/messages ----
    if PLATFORM_RULES_FILE.exists():
        platform_data = _load_yaml(PLATFORM_RULES_FILE)
        if platform_data:
            platforms_section = platform_data.get("platforms", {}) or {}
            p_cfg = platforms_section.get(platform)
            if p_cfg is None:
                p_cfg = platform_data.get("base", {}) or {}
            for rule_name, rule_override in p_cfg.items():
                if not isinstance(rule_override, dict):
                    continue
                if rule_name not in rules:
                    rules[rule_name] = {}
                for k, v in rule_override.items():
                    rules[rule_name][k] = v
            # platform-lint-rules 的顶层字段（如向后兼容残留）也并入 platform_top
            for k, v in p_cfg.items():
                if not isinstance(v, dict):
                    platform_top.setdefault(k, v)

    config["_platform"] = platform
    config["_platform_cfg"] = platform_top
    return config


def _load_platform_length_limit(column: str, platform: str) -> int | None:
    """从 framework/config/columns/{column}.platforms.yaml 读 length_limit"""
    if not column or not platform or not yaml:
        return None
    col_file = COLUMNS_DIR / f"{column}.platforms.yaml"
    if not col_file.exists():
        return None
    data = _load_yaml(col_file)
    p = (data.get("platforms", {}) or {}).get(platform, {}) or {}
    return p.get("length_limit")


def load_config(config_path: str | None, platform: str = "") -> dict:
    # 深拷贝避免跨 run_lint 调用污染模块级 DEFAULT_CONFIG（合并逻辑会就地改 rules）
    if config_path and Path(config_path).exists() and yaml:
        with open(config_path, encoding="utf-8") as f:
            config = yaml.safe_load(f) or copy.deepcopy(DEFAULT_CONFIG)
    else:
        config = copy.deepcopy(DEFAULT_CONFIG)
    config = _merge_data_sources(config)
    config = _merge_platform_rules(config, platform)
    return config


def get_forbidden_words(config: dict) -> list[str]:
    """从配置中读取禁用词列表（单一事实来源: .claude/rules/data/forbidden-phrases.yaml）"""
    fp = config.get("rules", {}).get("forbidden_patterns", {})
    return fp.get("words", [])


def get_column_overrides(config: dict, column: str) -> dict:
    overrides = config.get("column_overrides", {})
    # 先直接查找，再通过别名反查（column_overrides 用中文 key，但 frontmatter 可能用英文 ID）
    result = overrides.get(column)
    if result is None:
        alias_to_cn = {v: k for k, v in COLUMN_ALIASES.items() if k != v}
        cn_name = alias_to_cn.get(column, "")
        result = overrides.get(cn_name, {})
    return result


# ============================================================
# Markdown 解析器 — 单遍扫描，追踪上下文状态
# ============================================================

class LineContext:
    """每行的上下文状态"""
    __slots__ = ("line_num", "text", "stripped", "in_frontmatter", "in_code_block")

    def __init__(self, line_num: int, text: str, stripped: str,
                 in_frontmatter: bool, in_code_block: bool):
        self.line_num = line_num
        self.text = text
        self.stripped = stripped
        self.in_frontmatter = in_frontmatter
        self.in_code_block = in_code_block


def parse_frontmatter(lines: list[str]) -> dict:
    """从文件行中提取 YAML frontmatter"""
    if not lines or lines[0].strip() != "---":
        return {}
    fm_lines = []
    for line in lines[1:]:
        if line.strip() == "---":
            break
        fm_lines.append(line)
    if not fm_lines:
        return {}
    if yaml:
        try:
            return yaml.safe_load("\n".join(fm_lines)) or {}
        except Exception:
            pass
    # 简易正则回退
    result = {}
    for line in fm_lines:
        m = re.match(r'^(\w+):\s*"?([^"]*)"?\s*$', line)
        if m:
            result[m.group(1)] = m.group(2)
    return result


def iter_lines(lines: list[str]):
    """单遍迭代所有行，生成带上下文状态的 LineContext"""
    in_frontmatter = False
    frontmatter_seen = 0
    in_code_block = False

    for i, raw_line in enumerate(lines, 1):
        text = raw_line.rstrip("\n\r")
        stripped = text.strip()

        # frontmatter 追踪
        if stripped == "---":
            if frontmatter_seen == 0:
                in_frontmatter = True
                frontmatter_seen = 1
                yield LineContext(i, text, stripped, True, False)
                continue
            elif in_frontmatter:
                in_frontmatter = False
                frontmatter_seen = 2
                yield LineContext(i, text, stripped, True, False)
                continue

        if in_frontmatter:
            yield LineContext(i, text, stripped, True, False)
            continue

        # 代码块追踪
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            yield LineContext(i, text, stripped, False, True)
            continue

        if in_code_block:
            yield LineContext(i, text, stripped, False, True)
            continue

        yield LineContext(i, text, stripped, False, False)


# ============================================================
# 违规记录
# ============================================================

class Violation:
    __slots__ = ("rule", "severity", "line", "message")

    def __init__(self, rule: str, severity: str, line: int, message: str):
        self.rule = rule
        self.severity = severity
        self.line = line
        self.message = message

    def to_dict(self) -> dict:
        return {"rule": self.rule, "severity": self.severity, "line": self.line, "message": self.message}


class LintResult:
    def __init__(self, file_path: str, column: str, platform: str = ""):
        self.file_path = file_path
        self.column = column
        self.platform = platform
        self.violations: list[Violation] = []

    def add(self, rule: str, severity: str, line: int, message: str):
        self.violations.append(Violation(rule, severity, line, message))

    @property
    def error_count(self) -> int:
        return sum(1 for v in self.violations if v.severity == "error")

    @property
    def warning_count(self) -> int:
        return sum(1 for v in self.violations if v.severity == "warning")

    def to_json(self) -> str:
        return json.dumps({
            "file": self.file_path,
            "column": self.column,
            "platform": self.platform,
            "summary": {"errors": self.error_count, "warnings": self.warning_count},
            "violations": [v.to_dict() for v in self.violations],
        }, ensure_ascii=False)

    def to_human(self) -> str:
        name = Path(self.file_path).name
        lines = [f"{name}: {self.error_count} errors, {self.warning_count} warnings"]
        for v in self.violations:
            sev = "ERROR" if v.severity == "error" else "WARN "
            lines.append(f"  L{v.line:<4} {sev} [{v.rule}] {v.message}")
        return "\n".join(lines)


# ============================================================
# 规则实现
# ============================================================

def count_display_chars(text: str) -> int:
    """统计显示字符数（中文算 1 字符，英文/数字算 1 字符）"""
    return len(text)


def split_sentences(text: str) -> list[str]:
    """按中文句末标点切分句子"""
    parts = re.split(r"[。！？]", text)
    return [s for s in parts if s.strip()]


def rule_forbidden_blocks(lines: list[str], config: dict, result: LintResult):
    """规则 A: 禁止所有 ^::: 容器语法（除 wechat 外所有平台都禁）。

    wechat 平台在 platform-lint-rules.yaml 中显式关闭本规则，改走 container_whitelist。
    """
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue
        if ctx.stripped.startswith(":::"):
            tag = ctx.stripped.lstrip(":").strip() or "(close)"
            result.add("A1", "error", ctx.line_num,
                       f"检测到禁用的 ::: 容器语法 ({tag})；本平台不支持，请改用标准 Markdown 或 GFM Alerts")


# ============================================================
# 容器 parse + 白名单校验（仅 wechat 平台）
# ============================================================

_CONTAINER_OPEN_RE = re.compile(r'^(:{3,})\s*([a-z][a-z0-9-]*)(\s+.*)?$')
_VARIANT_ATTR_RE = re.compile(r'\bvariant\s*=\s*"?([A-Za-z0-9-]+)"?')


def _load_container_whitelist() -> dict:
    """读 .claude/rules/domains/wechat-article/containers.yaml"""
    wl_file = REPO_ROOT / ".claude" / "rules" / "domains" / "wechat-article" / "containers.yaml"
    return _load_yaml(wl_file)


def _load_capabilities_variants() -> dict[str, list[str]] | None:
    """读 runtime/typeset-capabilities.json 的 variants 字段（可能不存在）"""
    caps_file = REPO_ROOT / "runtime" / "typeset-capabilities.json"
    if not caps_file.exists():
        return None
    try:
        data = json.loads(caps_file.read_text(encoding="utf-8"))
        return {k: list(v) for k, v in (data.get("variants") or {}).items()}
    except Exception:
        return None


def rule_container_whitelist(lines: list[str], config: dict, result: LintResult):
    """规则 W: 微信 ::: 容器白名单校验

    仅 wechat 平台启用（通过 platform-lint-rules.yaml 的 wechat.container_whitelist.enabled=true）。
    校验维度：
    - W1: 容器 id 必须在 25 个合法白名单内
    - W2: variant=X 必须在 capabilities.json 或 containers.yaml 的 variant_whitelist 内
    - W3: pros / cons 必须嵌在 compare 内（外层冒号数 > 内层）
    - W4: 容器开合配对（open/close 冒号数匹配）
    """
    wl = _load_container_whitelist()
    if not wl:
        return

    valid_ids = set(wl.get("containers", []) or [])
    must_nest = wl.get("must_nest", {}) or {}
    admonition_kinds = set(wl.get("admonition_kinds", []) or [])
    fallback_variants = wl.get("variant_whitelist", {}) or {}

    runtime_variants = _load_capabilities_variants()
    variants = runtime_variants if runtime_variants else fallback_variants

    # 栈追踪嵌套：每项 (colon_count, name, line_num)
    stack: list[tuple[int, str, int]] = []

    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue
        stripped = ctx.stripped
        if not stripped.startswith(":::"):
            continue

        m = _CONTAINER_OPEN_RE.match(stripped)
        if m:
            colons = len(m.group(1))
            name = m.group(2)
            rest = m.group(3) or ""

            if name not in valid_ids:
                result.add("W1", "error", ctx.line_num,
                           f"未知容器 '::: {name}'（不在 25 个合法白名单内）")
                continue

            vm = _VARIANT_ATTR_RE.search(rest)
            if vm:
                vid = vm.group(1)
                if name in admonition_kinds:
                    kind = "admonition"
                elif name == "quote-card":
                    kind = "quote-card" if "quote-card" in variants else "quote"
                else:
                    kind = name
                allowed = variants.get(kind)
                if allowed is None:
                    result.add("W2", "warning", ctx.line_num,
                               f"容器 '{name}' 不支持 variant 属性或清单缺失")
                elif vid not in allowed:
                    result.add("W2", "error", ctx.line_num,
                               f"variant='{vid}' 不在 '{kind}' 合法清单（{', '.join(allowed)}）")

            if name in must_nest:
                expected_parent = must_nest[name]
                if not stack or stack[-1][1] != expected_parent:
                    result.add("W3", "error", ctx.line_num,
                               f"'::: {name}' 必须嵌在 ':::: {expected_parent}' 内")
                elif stack[-1][0] <= colons:
                    result.add("W3", "error", ctx.line_num,
                               f"外层 '{expected_parent}' 的冒号数必须严格多于内层 '{name}'")

            stack.append((colons, name, ctx.line_num))
        elif re.match(r'^:{3,}\s*$', stripped):
            if not stack:
                result.add("W4", "error", ctx.line_num, "孤立的容器闭合行（无对应 open）")
                continue
            close_colons = len(stripped.rstrip())
            top_colons, top_name, top_line = stack[-1]
            if close_colons != top_colons:
                result.add("W4", "error", ctx.line_num,
                           f"闭合冒号数 {close_colons} 与 '::: {top_name}' (L{top_line}) 的 {top_colons} 不匹配")
            stack.pop()

    for colons, name, line in stack:
        result.add("W4", "error", line,
                   f"'::: {name}' 未闭合（需要 {':' * colons} 结束）")


def rule_gfm_alerts(lines: list[str], config: dict, result: LintResult):
    """规则 N: GFM Alert 语法校验

    合法语法：`> [!TYPE]` 位于 blockquote 首行，TYPE ∈ {NOTE, TIP, IMPORTANT, WARNING, CAUTION}
    小写或未知类型视为 warning（某些渲染器会静默降级为普通 blockquote）。
    """
    alert_cfg = config["rules"].get("gfm_alerts", {})
    allowed = {t.upper() for t in alert_cfg.get("allowed_types", GFM_ALERT_TYPES)}

    # 形如 > [!NOTE] 或 > [!tip] ；允许 blockquote 前导空格
    pattern = re.compile(r"^\s*>\s*\[!([A-Za-z]+)\]\s*$")

    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue
        m = pattern.match(ctx.text)
        if not m:
            continue
        raw = m.group(1)
        if raw != raw.upper():
            result.add("N1", "warning", ctx.line_num,
                       f"GFM Alert 类型应为大写: [!{raw}] → [!{raw.upper()}]")
        if raw.upper() not in allowed:
            result.add("N2", "warning", ctx.line_num,
                       f"未知 GFM Alert 类型: [!{raw}]（允许: {sorted(allowed)}）")


def rule_typography(lines: list[str], config: dict, result: LintResult):
    """规则 C: 排版约束"""
    typo_cfg = config["rules"]["typography"]
    max_para = typo_cfg.get("max_paragraph_chars", 120)
    max_sent = typo_cfg.get("max_sentence_chars", 40)
    allowed_h = set(typo_cfg.get("allowed_headings", [2, 3, 4]))

    h1_count = 0
    paragraph_lines: list[str] = []
    paragraph_start = 0

    def flush_paragraph():
        nonlocal paragraph_lines, paragraph_start
        if not paragraph_lines:
            return
        text = "".join(paragraph_lines)
        # C1: 段落长度
        clen = count_display_chars(text)
        if clen > max_para:
            result.add("C1", "warning", paragraph_start,
                        f"段落超过 {max_para} 字符（{clen} 字符），建议拆分")
        # C2: 句子长度
        for sent in split_sentences(text):
            slen = count_display_chars(sent.strip())
            if slen > max_sent:
                preview = sent.strip()[:30]
                result.add("C2", "warning", paragraph_start,
                            f"句子超过 {max_sent} 字符（{slen} 字符）: {preview}...")
        # C3: 首行缩进
        first_line = paragraph_lines[0] if paragraph_lines else ""
        if re.match(r"^[ \t]{2,}", first_line) and not re.match(r"^\s*[-*]", first_line):
            result.add("C3", "warning", paragraph_start, "检测到首行缩进（移动端显示错位）")
        paragraph_lines = []
        paragraph_start = 0

    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            flush_paragraph()
            continue

        # C4: 标题层级
        hm = re.match(r"^(#{1,6})\s", ctx.text)
        if hm:
            level = len(hm.group(1))
            if level == 1:
                h1_count += 1
                if h1_count > 1:
                    result.add("C4", "error", ctx.line_num, "正文中出现多个 H1 标题")
            elif level not in allowed_h:
                result.add("C4", "error", ctx.line_num,
                            f"禁止使用 H{level} 标题（允许: {sorted(allowed_h)}）")
            flush_paragraph()
            # 对标题行也做句子长度检查
            for sent in split_sentences(ctx.stripped.lstrip("# ")):
                slen = count_display_chars(sent.strip())
                if slen > max_sent:
                    preview = sent.strip()[:30]
                    result.add("C2", "warning", ctx.line_num,
                                f"句子超过 {max_sent} 字符（{slen} 字符）: {preview}...")
            continue

        # 空行 → 段落分隔
        if not ctx.stripped:
            flush_paragraph()
            continue

        # 跳过列表、引用、表格、图片行（不参与段落合并）
        if re.match(r"^[>\-*|!]|^\d+\.", ctx.stripped):
            flush_paragraph()
            # 对这些行也做句子长度检查
            for sent in split_sentences(ctx.stripped):
                slen = count_display_chars(sent.strip())
                if slen > max_sent:
                    preview = sent.strip()[:30]
                    result.add("C2", "warning", ctx.line_num,
                                f"句子超过 {max_sent} 字符（{slen} 字符）: {preview}...")
            continue

        # 累积段落
        if not paragraph_lines:
            paragraph_start = ctx.line_num
        paragraph_lines.append(ctx.text)

    flush_paragraph()

    # T1: 文章必须有恰好一个 H1
    if h1_count == 0:
        result.add("T1", "error", 0, "文章缺少 H1 标题行")


def rule_theme_constraints(lines: list[str], column: str, config: dict, result: LintResult):
    """规则 B: 栏目特有约束"""
    if not column:
        return

    overrides = get_column_overrides(config, column)
    tc = overrides.get("theme_constraints", {})
    theme_id = COLUMN_ALIASES.get(column, column)
    full_text = "\n".join(lines)

    # B1: 学术前沿 — 参考文献
    if tc.get("require_references") or theme_id == "academic":
        if not re.search(r"\[\d+\]", full_text):
            result.add("B1", "error", 0, "学术前沿栏目缺少参考文献引用（[N] 标记）")

    # B2: 学术前沿 — H1 后 blockquote 作摘要引言
    if tc.get("require_tldr") or theme_id == "academic":
        _check_h1_blockquote(lines, result, required=True,
                             rule="B2", msg="学术前沿栏目 H1 后应紧跟 blockquote 作摘要引言")

    # B3: 仅当 column_overrides 显式配置 require_code_block=true 时才强制。
    # tech 栏目不再强制（技术不等于软件，可能是工业、硬件、材料等无代码场景）。
    if tc.get("require_code_block"):
        if "```" not in full_text:
            result.add("B3", "error", 0, "该栏目配置了必须有代码块")


def _check_h1_blockquote(lines: list[str], result: LintResult, required: bool, rule: str, msg: str):
    """检查 H1 后是否紧跟 blockquote"""
    h1_line = None
    for i, line in enumerate(lines):
        if re.match(r"^# [^#]", line):
            h1_line = i
            break
    if h1_line is None:
        return

    # 找 H1 之后的第一个非空行
    for j in range(h1_line + 1, len(lines)):
        stripped = lines[j].strip()
        if stripped:
            has_bq = stripped.startswith(">")
            if required and not has_bq:
                result.add(rule, "error", j + 1, msg)
            elif not required and has_bq:
                result.add(rule, "warning", j + 1, msg)
            break


def rule_css_safety(lines: list[str], config: dict, result: LintResult):
    """规则 F: 微信 CSS 安全"""
    css_cfg = config["rules"]["css_safety"]
    forbidden_css = css_cfg.get("forbidden_css", [])
    forbidden_tags = css_cfg.get("forbidden_tags", [])

    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue

        # F1: 禁用 CSS 属性（仅在 HTML/style 上下文中检查）
        if re.search(r"<[^>]+style=|<style|<svg", ctx.text, re.IGNORECASE):
            for prop in forbidden_css:
                if prop.lower() in ctx.text.lower():
                    result.add("F1", "error", ctx.line_num, f"禁用 CSS 属性: {prop}")

        # F2: 禁用标签
        text_lower = ctx.text.lower()
        for tag in forbidden_tags:
            if tag.lower() in text_lower:
                result.add("F2", "error", ctx.line_num, f"禁止使用 {tag}> 标签")
        # class 由栏目 theme.css 的 juice 胶水层内联到 style，允许使用；
        # 后续如需严格校验，可在此处按栏目 theme.css 白名单过滤

        # F3: SVG id 属性
        if re.search(r"<svg|<[a-z]+\s[^>]*id=", ctx.text, re.IGNORECASE):
            if re.search(r"\sid=", ctx.text):
                result.add("F3", "error", ctx.line_num, "SVG 中禁止使用 id 属性")


def rule_image_references(lines: list[str], _config: dict, result: LintResult):
    """规则 E: 图片与引用"""
    has_citation_in_text = False
    has_ref_list = False

    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue

        # E1: 图片缺少 alt 文本（alt 约定作为图注，下游排版器多渲染为 <figcaption>）
        if re.search(r"!\[\]\(", ctx.text):
            result.add("E1", "warning", ctx.line_num,
                       "图片缺少 alt 文本（alt 约定作为图注 figcaption）")

        # E3: 绝对路径
        if re.search(r"!\[.*\]\(file://", ctx.text) or re.search(r"!\[.*\]\([A-Z]:\\", ctx.text):
            result.add("E3", "warning", ctx.line_num, "图片路径应使用相对路径")

        # 追踪引用标记和编号列表
        if re.search(r"\[\d+\]", ctx.text):
            has_citation_in_text = True
        if re.match(r"^\d+\.\s", ctx.stripped):
            has_ref_list = True

    # E2: 引用完整性
    if has_citation_in_text and not has_ref_list:
        result.add("E2", "warning", 0, "文中有 [N] 引用标记但缺少文末编号列表")


def rule_article_structure(lines: list[str], column: str, config: dict, result: LintResult):
    """规则 S: 文章结构完整性（确定性检查，减少 LLM 验证负担）"""
    theme_id = COLUMN_ALIASES.get(column, column) if column else ""
    full_text = "\n".join(lines)
    fm = parse_frontmatter(lines)

    # S1: frontmatter 必须字段
    required_fm = ["column", "title"]
    for field in required_fm:
        if field not in fm:
            result.add("S1", "error", 1, f"frontmatter 缺少必须字段: {field}")

    # S2: 非 story 栏目建议在 frontmatter 中包含摘要字段（story 可选）
    if theme_id and theme_id != "story" and "tldr" not in fm:
        result.add("S2", "warning", 1, "非 story 栏目建议在 frontmatter 中包含 tldr 字段（摘要引言）")

    # S3: H1 后应紧跟 blockquote (非 story)  —— 与 B2 互补，此处检查 article.md 最终输出
    # (B2 只检查 academic，此处扩展到所有非 story)
    if theme_id and theme_id != "story":
        h1_idx = None
        for i, line in enumerate(lines):
            if re.match(r"^# [^#]", line):
                h1_idx = i
                break
        if h1_idx is not None:
            found_bq = False
            for j in range(h1_idx + 1, len(lines)):
                stripped = lines[j].strip()
                if stripped:
                    found_bq = stripped.startswith(">")
                    break
            if not found_bq:
                result.add("S3", "warning", h1_idx + 1,
                            "H1 标题后建议紧跟 > blockquote 作为文章摘要")

    # S4: 代码块必须标注语言
    in_code = False
    for ctx in iter_lines(lines):
        if ctx.stripped.startswith("```"):
            if not in_code:
                lang = ctx.stripped[3:].strip()
                if not lang:
                    result.add("S4", "warning", ctx.line_num,
                                "代码块缺少语言标注（如 ```python）")
            in_code = not in_code

    # S5: USER_FILL / TODO 残留
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter:
            continue
        if "<!-- USER_FILL:" in ctx.text:
            result.add("S5", "warning", ctx.line_num,
                        "检测到 USER_FILL 占位符（发布前应替换为实际内容或删除）")
        if not ctx.in_code_block and "TODO" in ctx.text:
            result.add("S5", "warning", ctx.line_num,
                        "检测到 TODO 标记（发布前应处理）")

    # S7: frontmatter column 与文件实际栏目一致性（信息性）
    if fm.get("column") and column and fm["column"] != column:
        fm_col = fm["column"]
        result.add("S7", "warning", 1,
                    f"frontmatter column={fm_col} 与命令行参数 column={column} 不一致")


def rule_svg_readability(lines: list[str], config: dict, result: LintResult):
    """规则 V: SVG 可读性 — 640px 画布缩到手机 375px 后的字号硬约束

    platform-base.md "SVG 可读性" 段：
    - 正文/数据标签 ≥14px（硬下限，低于此值报 error）
    - 图注/脚注 12-13px 报 warning（允许人工审核放行）
    - <12px 一律 error（手机端必然糊成团）
    """
    svg_cfg = config["rules"].get("svg_readability", {})
    min_font = svg_cfg.get("min_font_size", 14)          # 正文硬下限
    caption_font = svg_cfg.get("caption_font_size", 12)  # 图注允许下限

    def _check(size: float, line_num: int, form: str):
        if size < caption_font:
            result.add("V1", "error", line_num,
                       f"SVG {form} {size}px 低于硬下限 {caption_font}px（手机端不可读）")
        elif size < min_font:
            result.add("V1", "warning", line_num,
                       f"SVG {form} {size}px 低于正文下限 {min_font}px（如为图注/脚注可忽略）")

    in_svg = False
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue
        text = ctx.text
        if re.search(r"<svg\b", text, re.IGNORECASE):
            in_svg = True
        if not in_svg:
            continue
        # attribute 形式 font-size="10"
        for m in re.finditer(r'font-size\s*=\s*["\']?(\d+(?:\.\d+)?)', text, re.IGNORECASE):
            _check(float(m.group(1)), ctx.line_num, "文字字号")
        # inline style 形式 font-size:10px
        for m in re.finditer(r'font-size\s*:\s*(\d+(?:\.\d+)?)', text, re.IGNORECASE):
            _check(float(m.group(1)), ctx.line_num, "内联 font-size")
        if re.search(r"</svg>", text, re.IGNORECASE):
            in_svg = False


def rule_forbidden_patterns(lines: list[str], config: dict, result: LintResult):
    """规则 G: 禁用词检查（从 .claude/rules/data/forbidden-phrases.yaml 读取）"""
    words = get_forbidden_words(config)
    if not words:
        return
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue
        for word in words:
            if word in ctx.text:
                result.add("G1", "warning", ctx.line_num, f"检测到禁用词: {word}")


# ============================================================
# 平台专属规则（按需启用，config.rules.{name}.enabled 控制）
# ============================================================

def rule_forbidden_code_blocks(lines: list[str], config: dict, result: LintResult):
    """规则 P1: 平台不支持代码块（如小红书）。仅在该规则 enabled 时生效。"""
    cfg = config["rules"].get("forbidden_code_blocks", {})
    severity = cfg.get("severity", "error")
    msg = cfg.get("message", "本平台不支持代码块")
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter:
            continue
        # 在 in_code_block 的首行（即 ``` 开始行）即触发
        if ctx.stripped.startswith("```"):
            result.add("P1", severity, ctx.line_num, msg)
            return   # 首个触发即停，避免闭合行重复报


def rule_required_hashtags(lines: list[str], config: dict, result: LintResult):
    """规则 P2: 小红书话题标签要求（3-5 个 #topic 形式）"""
    cfg = config["rules"].get("required_hashtags", {})
    min_n = cfg.get("min_count", 3)
    max_n = cfg.get("max_count", 5)
    severity = cfg.get("severity", "warning")
    pattern = re.compile(cfg.get("pattern", r"^#[^\s]+$"))
    # 尾部 20 行内寻找 #xxx 格式
    tail = [l.strip() for l in lines[-20:] if l.strip()]
    hashtags = [l for l in tail if pattern.match(l) or re.search(r"(?:^|\s)#[^\s#]+", l)]
    count = sum(len(re.findall(r"#[^\s#]+", l)) for l in hashtags)
    if count < min_n:
        result.add("P2", severity, len(lines), f"话题标签数 {count} < {min_n}（文末应有 {min_n}-{max_n} 个 #topic）")
    elif count > max_n:
        result.add("P2", "warning", len(lines), f"话题标签数 {count} > {max_n}（建议控制在 {min_n}-{max_n} 个）")


def rule_code_block_must_lang(lines: list[str], config: dict, result: LintResult):
    """规则 P3: 代码块必须标语言（掘金要求）"""
    cfg = config["rules"].get("code_block_must_lang", {})
    severity = cfg.get("severity", "error")
    msg = cfg.get("message", "代码块必须标注语言")
    in_code = False
    for ctx in iter_lines(lines):
        if ctx.stripped.startswith("```"):
            if not in_code:
                lang = ctx.stripped[3:].strip()
                if not lang:
                    result.add("P3", severity, ctx.line_num, msg)
            in_code = not in_code


def rule_heading_skip_level(lines: list[str], config: dict, result: LintResult):
    """规则 P8: H2→H4 跳级检测（禁止 H2 后直接出现 H4）。

    允许的层级转换：
      任意 H1 → H2（章节）
      H2 → H2（同级）
      H2 → H3（下钻）
      H3 → H3/H4（同级或下钻）
      H3 → H2（回到章节）
      H4 → H2/H3/H4

    禁止：H2 → H4（跳过 H3）；H1 → H3/H4（跳过 H2）。
    """
    cfg = config["rules"].get("heading_skip_level", {})
    severity = cfg.get("severity", "warning")
    msg_tpl = cfg.get("message", "H{prev} 后直接出现 H{cur}，跳过了 H{missing}")
    prev_level = 0
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue
        m = re.match(r"^(#{1,6})\s+", ctx.stripped)
        if not m:
            continue
        cur = len(m.group(1))
        if prev_level and cur > prev_level + 1:
            missing = prev_level + 1
            result.add(
                "P8",
                severity,
                ctx.line_num,
                msg_tpl.replace("{prev}", str(prev_level)).replace("{cur}", str(cur)).replace("{missing}", str(missing)),
            )
        prev_level = cur


def rule_require_frontmatter_fields(lines: list[str], config: dict, result: LintResult):
    """规则 P4: frontmatter 必须字段（掘金要求 title/description/tags）"""
    cfg = config["rules"].get("require_frontmatter_fields", {})
    fields = cfg.get("fields", [])
    severity = cfg.get("severity", "error")
    msg_template = cfg.get("message", "frontmatter 缺少必需字段: {field}")
    fm = parse_frontmatter(lines)
    for field in fields:
        if field not in fm or not fm.get(field):
            result.add("P4", severity, 1, msg_template.replace("{field}", field))


def rule_require_counter_argument(lines: list[str], config: dict, result: LintResult):
    """规则 P5: 知乎建议包含反方观点"""
    cfg = config["rules"].get("require_counter_argument", {})
    severity = cfg.get("severity", "warning")
    msg = cfg.get("message", "建议包含至少 1 个反方观点")
    keywords = cfg.get("detect_keywords", [])
    full = "\n".join(lines)
    if not any(kw in full for kw in keywords):
        result.add("P5", severity, 0, msg)


def rule_require_github_link(lines: list[str], config: dict, result: LintResult):
    """规则 P6: 掘金建议文末附 GitHub/文档链接"""
    cfg = config["rules"].get("require_github_link", {})
    severity = cfg.get("severity", "warning")
    msg = cfg.get("message", "文末建议附 GitHub/文档链接")
    full = "\n".join(lines)
    if not re.search(r"https?://(github\.com|[\w.-]+\.(?:io|dev|org|docs\.[\w.-]+))", full):
        result.add("P6", severity, 0, msg)


def rule_length_limit(lines: list[str], config: dict, result: LintResult, length_limit: int | None):
    """规则 P7: 平台字数硬上限（来自 columns/{column}.platforms.yaml）"""
    if not length_limit:
        return
    p_cfg = (config.get("_platform_cfg") or {})
    soft_factor = p_cfg.get("length_limit_factor", 1.05)
    hard_factor = p_cfg.get("length_hard_factor", 1.10)
    # 简单估算：非 frontmatter/非 code_block 的字符总数
    total = 0
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter:
            continue
        total += len(ctx.stripped)
    soft = int(length_limit * soft_factor)
    hard = int(length_limit * hard_factor)
    if total > hard:
        result.add("P7", "error", 0, f"字数 {total} 超过硬上限 {hard}（length_limit={length_limit}，factor={hard_factor}）")
    elif total > soft:
        result.add("P7", "warning", 0, f"字数 {total} 超过软上限 {soft}（length_limit={length_limit}，factor={soft_factor}）")


# 栏目名 → theme id 映射
COLUMN_ALIASES = {
    "学术前沿": "academic",
    "行业趋势": "industry",
    "技术专题": "tech",
    "人物故事": "story",
    "academic": "academic",
    "industry": "industry",
    "tech": "tech",
    "story": "story",
}


# ============================================================
# 主流程
# ============================================================

def run_lint(file_path: str, column: str = "", platform: str = "",
             config_path: str | None = None) -> LintResult:
    config = load_config(config_path, platform=platform)
    rules_cfg = config.get("rules", {})

    path = Path(file_path)
    lines = path.read_text(encoding="utf-8").splitlines()

    # 自动检测栏目
    if not column:
        fm = parse_frontmatter(lines)
        column = fm.get("column", "")

    result = LintResult(file_path, column, platform=platform)

    def is_on(rule: str, default: bool = True) -> bool:
        return rules_cfg.get(rule, {}).get("enabled", default)

    # 跨平台基础规则（默认开；平台段可关闭）
    if is_on("forbidden_blocks"):
        rule_forbidden_blocks(lines, config, result)
    if is_on("container_whitelist", default=False):
        rule_container_whitelist(lines, config, result)
    if is_on("gfm_alerts"):
        rule_gfm_alerts(lines, config, result)
    if is_on("typography"):
        rule_typography(lines, config, result)
    if is_on("theme_constraints"):
        rule_theme_constraints(lines, column, config, result)
    if is_on("css_safety"):
        rule_css_safety(lines, config, result)
    if is_on("image_references"):
        rule_image_references(lines, config, result)
    if is_on("heading_skip_level", default=True):
        rule_heading_skip_level(lines, config, result)
    if is_on("forbidden_patterns"):
        rule_forbidden_patterns(lines, config, result)
    if is_on("article_structure"):
        rule_article_structure(lines, column, config, result)
    if is_on("svg_readability"):
        rule_svg_readability(lines, config, result)

    # 平台专属规则（默认关；平台段显式 enabled=true 才运行）
    if is_on("forbidden_code_blocks", default=False):
        rule_forbidden_code_blocks(lines, config, result)
    if is_on("required_hashtags", default=False):
        rule_required_hashtags(lines, config, result)
    if is_on("code_block_must_lang", default=False):
        rule_code_block_must_lang(lines, config, result)
    if is_on("require_frontmatter_fields", default=False):
        rule_require_frontmatter_fields(lines, config, result)
    if is_on("require_counter_argument", default=False):
        rule_require_counter_argument(lines, config, result)
    if is_on("require_github_link", default=False):
        rule_require_github_link(lines, config, result)

    # 字数上限（读 columns/{column}.platforms.yaml）
    length_limit = _load_platform_length_limit(column, platform)
    if length_limit:
        rule_length_limit(lines, config, result, length_limit)

    return result


def main():
    parser = argparse.ArgumentParser(description="InkFlow Markdown Lint — 文章格式校验工具")
    parser.add_argument("file", help="要校验的 Markdown 文件路径")
    parser.add_argument("--column", default="", help="栏目名（如未指定，从 frontmatter 读取）")
    parser.add_argument("--platform", default="",
                        help="目标平台（wechat/xiaohongshu/zhihu/juejin），决定规则集")
    parser.add_argument("--config", default=None,
                        help="配置文件路径（默认: .claude/skills/quality-linting/scripts/config.yaml）")
    args = parser.parse_args()

    if not Path(args.file).exists():
        print(f"错误: 文件不存在: {args.file}", file=sys.stderr)
        sys.exit(1)

    # 默认平台：从文件名推断（08-{platform}-publish.md）
    platform = args.platform
    if not platform:
        fname = Path(args.file).name
        m = re.match(r"08-(wechat|xiaohongshu|zhihu|juejin)-publish\.md$", fname)
        if m:
            platform = m.group(1)

    # 默认配置路径
    config_path = args.config
    if not config_path:
        default_cfg = Path(__file__).parent / "config.yaml"
        if default_cfg.exists():
            config_path = str(default_cfg)

    result = run_lint(args.file, args.column, platform, config_path)

    # JSON to stdout
    print(result.to_json())

    # Human-readable to stderr
    print(result.to_human(), file=sys.stderr)

    # 退出码
    if result.error_count > 0:
        sys.exit(1)
    elif result.warning_count > 0:
        sys.exit(2)
    else:
        sys.exit(0)


if __name__ == "__main__":
    # 确保 Windows 下 stdout/stderr 使用 UTF-8
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")
    main()
