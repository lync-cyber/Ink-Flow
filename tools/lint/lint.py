#!/usr/bin/env python3
"""InkFlow Markdown Lint — 文章格式校验工具

用法: python tools/lint/lint.py <markdown-file> [--column <栏目名>] [--config <config.yaml>]

数据来源：
- tools/lint/config.yaml       规则开关与严重级别
- .claude/rules/data/*.yaml    禁用词、CSS 安全、排版阈值（单一事实来源）

输出: JSON (stdout), 人类可读摘要 (stderr)
退出码: 0=通过, 1=有 error, 2=仅 warning
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None

# ============================================================
# 配置加载
# ============================================================

DEFAULT_CONFIG = {
    "rules": {
        "forbidden_blocks": {
            "enabled": True,
            "severity": "error",
            # 任何 ^::: 残留都视为错误。:::block 扩展已退役，迁移表见 config/markdown-extensions.md § 10。
        },
        "gfm_alerts": {
            "enabled": True,
            "severity": "warning",
            "allowed_types": ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"],
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
        "人物故事": {"theme_constraints": {"forbid_tldr": True}},
        "技术专题": {"theme_constraints": {"require_code_block": True}},
    },
}


# 数据文件根目录（单一事实来源）
RULES_DATA_DIR = Path(__file__).resolve().parent.parent.parent / ".claude" / "rules" / "data"


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

    # typography-limits.yaml → rules.typography + rules.svg_readability
    typo = _load_yaml(RULES_DATA_DIR / "typography-limits.yaml")
    if typo:
        para = typo.get("paragraph", {}) or {}
        sent = typo.get("sentence", {}) or {}
        heads = typo.get("headings", {}) or {}
        typo_rule = rules.setdefault("typography", {})
        typo_rule.setdefault("max_paragraph_chars", para.get("max_chars", 120))
        typo_rule.setdefault("max_sentence_chars", sent.get("max_chars", 40))
        typo_rule.setdefault("allowed_headings", heads.get("allowed", [2, 3, 4]))
        svg = typo.get("svg", {}) or {}
        svg_rule = rules.setdefault("svg_readability", {})
        svg_rule.setdefault("min_font_size", svg.get("min_font_size", 14))
        svg_rule.setdefault("caption_font_size", svg.get("caption_font_size", 12))

    # css-safety.yaml → rules.css_safety
    css = _load_yaml(RULES_DATA_DIR / "css-safety.yaml")
    if css:
        css_rule = rules.setdefault("css_safety", {})
        # forbidden_css: 值级别黑名单（字符串模式）
        css_rule.setdefault("forbidden_css", css.get("forbidden_css", []))
        # forbidden_tags: 危险 HTML 标签，统一为 "<tag" 形式
        forbidden_tags = css.get("forbidden_tags", []) or []
        css_rule.setdefault("forbidden_tags", [f"<{t}" for t in forbidden_tags] or ["<style", "<script"])

    return config


def load_config(config_path: str | None) -> dict:
    if config_path and Path(config_path).exists() and yaml:
        with open(config_path, encoding="utf-8") as f:
            config = yaml.safe_load(f) or DEFAULT_CONFIG
    else:
        config = DEFAULT_CONFIG
    return _merge_data_sources(config)


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
    def __init__(self, file_path: str, column: str):
        self.file_path = file_path
        self.column = column
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
    """规则 A: :::block 扩展已退役，任何 ^::: 残留都视为错误

    迁移指引见 config/markdown-extensions.md § 10：
    - :::note/:::warning → GFM Alert `> [!NOTE]` / `> [!WARNING]`
    - :::card / :::cta → 普通段落或 Markdown 表格
    - :::references → H3 "参考文献" + 标准有序列表
    - :::footer / :::readmore → H3 "关于作者" / H3 "阅读原文"
    - :::timeline / :::steps → 有序列表
    """
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue
        if ctx.stripped.startswith(":::"):
            tag = ctx.stripped.lstrip(":").strip() or "(close)"
            result.add("A1", "error", ctx.line_num,
                       f"检测到已废弃的 :::block 语法 ({tag})；"
                       "请改用标准 Markdown / GFM Alerts，见 config/markdown-extensions.md § 10 迁移表")


def rule_gfm_alerts(lines: list[str], config: dict, result: LintResult):
    """规则 N: GFM Alert 语法校验

    合法语法：`> [!TYPE]` 位于 blockquote 首行，TYPE ∈ {NOTE, TIP, IMPORTANT, WARNING, CAUTION}
    小写或未知类型视为 warning（某些渲染器会静默降级为普通 blockquote）。
    """
    alert_cfg = config["rules"].get("gfm_alerts", {})
    allowed = {t.upper() for t in alert_cfg.get("allowed_types",
                                                ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"])}

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

    # T1: 文章必须有恰好一个 H1（typesetter 依赖 H1 触发栏目标识区）
    if h1_count == 0:
        result.add("T1", "error", 0, "文章缺少 H1 标题行（typesetter 需要 H1 触发栏目标识区渲染）")


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

    # B2: 学术前沿 — H1 后 blockquote
    if tc.get("require_tldr") or theme_id == "academic":
        _check_h1_blockquote(lines, result, required=True,
                             rule="B2", msg="学术前沿栏目 H1 后应紧跟 blockquote 作为 TL;DR")

    # B3: 技术专题 — 代码块
    if tc.get("require_code_block") or theme_id == "tech":
        if "```" not in full_text:
            result.add("B3", "error", 0, "技术专题栏目缺少代码块")

    # B4: 人物故事 — 禁止 TL;DR
    if tc.get("forbid_tldr") or theme_id == "story":
        _check_h1_blockquote(lines, result, required=False,
                             rule="B4", msg="人物故事栏目不需要 TL;DR（H1 后的 blockquote）")


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
        if re.search(r'class="[^"]*"', ctx.text):
            result.add("F2", "warning", ctx.line_num, "检测到 class 属性（微信不支持）")

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

        # E1: 图片缺少 alt 文本
        # typesetter 的 figureCaption decorator 会把 alt 自动渲染为 <figcaption>，
        # 缺 alt 就丢失图注，需要警告。
        if re.search(r"!\[\]\(", ctx.text):
            result.add("E1", "warning", ctx.line_num,
                       "图片缺少 alt 文本（typesetter 会把 alt 自动渲染为图注 figcaption）")

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

    # S2: 非 story 栏目应有 tldr
    if theme_id and theme_id != "story" and "tldr" not in fm:
        result.add("S2", "warning", 1, "非 story 栏目建议在 frontmatter 中包含 tldr 字段")

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
                            "H1 标题后建议紧跟 > blockquote 作为文章摘要（typesetter 会渲染为摘要区）")

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


def rule_typesetter_compat(lines: list[str], column: str, config: dict, result: LintResult):
    """规则 T: typesetter 兼容性检查"""
    theme_id = COLUMN_ALIASES.get(column, column) if column else ""
    full_text = "\n".join(lines)

    # T4: 本地文件路径引用
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue
        if re.search(r'<img\s[^>]*src=["\']\.\./', ctx.text, re.IGNORECASE):
            result.add("T4", "error", ctx.line_num,
                        "检测到本地路径 <img> 引用（typesetter 无法访问本地文件，需内联 SVG）")
        if re.search(r'!\[.*\]\(\.\./figures/', ctx.text):
            result.add("T4", "error", ctx.line_num,
                        "检测到本地 figures 路径引用（需内联 SVG 或使用远程 URL）")

    # T5: 残留占位符
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue
        if "<!-- FIGURE:" in ctx.text:
            result.add("T5", "warning", ctx.line_num,
                        "检测到未替换的图表占位符（publisher 阶段应已替换为内联内容）")

    # T6: 有 [N] 引用标记时应有 H3 "参考文献" 区（标准 Markdown，取代旧 :::references）
    has_citation = bool(re.search(r"\[\d+\]", full_text))
    has_ref_heading = bool(re.search(r"^#{2,4}\s*参考文献\s*$", full_text, re.MULTILINE))
    if has_citation and not has_ref_heading:
        result.add("T6", "warning", 0,
                    "文中含 [N] 引用但缺少 H3 '参考文献' 段（publisher 会基于此段生成引用列表）")


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

def run_lint(file_path: str, column: str = "", config_path: str | None = None) -> LintResult:
    config = load_config(config_path)
    rules_cfg = config.get("rules", {})

    path = Path(file_path)
    lines = path.read_text(encoding="utf-8").splitlines()

    # 自动检测栏目
    if not column:
        fm = parse_frontmatter(lines)
        column = fm.get("column", "")

    result = LintResult(file_path, column)

    # 按类别执行规则
    if rules_cfg.get("forbidden_blocks", {}).get("enabled", True):
        rule_forbidden_blocks(lines, config, result)

    if rules_cfg.get("gfm_alerts", {}).get("enabled", True):
        rule_gfm_alerts(lines, config, result)

    if rules_cfg.get("typography", {}).get("enabled", True):
        rule_typography(lines, config, result)

    if rules_cfg.get("theme_constraints", {}).get("enabled", True):
        rule_theme_constraints(lines, column, config, result)

    if rules_cfg.get("css_safety", {}).get("enabled", True):
        rule_css_safety(lines, config, result)

    if rules_cfg.get("image_references", {}).get("enabled", True):
        rule_image_references(lines, config, result)

    if rules_cfg.get("forbidden_patterns", {}).get("enabled", True):
        rule_forbidden_patterns(lines, config, result)

    if rules_cfg.get("article_structure", {}).get("enabled", True):
        rule_article_structure(lines, column, config, result)

    if rules_cfg.get("typesetter_compat", {}).get("enabled", True):
        rule_typesetter_compat(lines, column, config, result)

    if rules_cfg.get("svg_readability", {}).get("enabled", True):
        rule_svg_readability(lines, config, result)

    return result


def main():
    parser = argparse.ArgumentParser(description="InkFlow Markdown Lint — 文章格式校验工具")
    parser.add_argument("file", help="要校验的 Markdown 文件路径")
    parser.add_argument("--column", default="", help="栏目名（如未指定，从 frontmatter 读取）")
    parser.add_argument("--config", default=None, help="配置文件路径（默认: tools/lint/config.yaml）")
    args = parser.parse_args()

    if not Path(args.file).exists():
        print(f"错误: 文件不存在: {args.file}", file=sys.stderr)
        sys.exit(1)

    # 默认配置路径
    config_path = args.config
    if not config_path:
        default_cfg = Path(__file__).parent / "config.yaml"
        if default_cfg.exists():
            config_path = str(default_cfg)

    result = run_lint(args.file, args.column, config_path)

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
