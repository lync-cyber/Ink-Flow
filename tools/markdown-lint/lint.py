#!/usr/bin/env python3
"""InkFlow Markdown Lint — 文章格式校验工具

用法: python tools/markdown-lint/lint.py <markdown-file> [--column <栏目名>] [--config <config.yaml>]

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
    print("错误: 需要 PyYAML 依赖。请运行 pip install pyyaml", file=sys.stderr)
    sys.exit(1)

# ============================================================
# 配置加载
# ============================================================


def load_config(config_path: str | None) -> dict:
    """从 lint-config.yaml 加载配置（单一事实来源）"""
    if config_path and Path(config_path).exists():
        with open(config_path, encoding="utf-8") as f:
            config = yaml.safe_load(f)
            if config:
                return config
    # 尝试默认路径
    default_path = Path(__file__).parent / "lint-config.yaml"
    if default_path.exists():
        with open(default_path, encoding="utf-8") as f:
            config = yaml.safe_load(f)
            if config:
                return config
    print("错误: 找不到 lint-config.yaml 配置文件", file=sys.stderr)
    sys.exit(1)


def get_forbidden_words(config: dict) -> list[str]:
    """从配置中读取禁用词列表（单一事实来源: lint-config.yaml）"""
    fp = config.get("rules", {}).get("forbidden_patterns", {})
    return fp.get("words", [])


def get_column_overrides(config: dict, column: str) -> dict:
    overrides = config.get("column_overrides", {})
    # column_overrides 使用英文 ID（academic/industry/tech/story）
    # 若传入中文名或别名，先解析为英文 ID
    theme_id = COLUMN_ALIASES.get(column, column) if column else ""
    return overrides.get(theme_id, {})


# ============================================================
# Markdown 解析器 — 单遍扫描，追踪上下文状态
# ============================================================

class LineContext:
    """每行的上下文状态"""
    __slots__ = ("line_num", "text", "stripped", "in_frontmatter", "in_code_block", "in_custom_block")

    def __init__(self, line_num: int, text: str, stripped: str,
                 in_frontmatter: bool, in_code_block: bool, in_custom_block: bool):
        self.line_num = line_num
        self.text = text
        self.stripped = stripped
        self.in_frontmatter = in_frontmatter
        self.in_code_block = in_code_block
        self.in_custom_block = in_custom_block


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
    in_custom_block = False

    for i, raw_line in enumerate(lines, 1):
        text = raw_line.rstrip("\n\r")
        stripped = text.strip()

        # frontmatter 追踪
        if stripped == "---":
            if frontmatter_seen == 0:
                in_frontmatter = True
                frontmatter_seen = 1
                yield LineContext(i, text, stripped, True, False, False)
                continue
            elif in_frontmatter:
                in_frontmatter = False
                frontmatter_seen = 2
                yield LineContext(i, text, stripped, True, False, False)
                continue

        if in_frontmatter:
            yield LineContext(i, text, stripped, True, False, False)
            continue

        # 代码块追踪
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            yield LineContext(i, text, stripped, False, True, in_custom_block)
            continue

        if in_code_block:
            yield LineContext(i, text, stripped, False, True, in_custom_block)
            continue

        # :::block 追踪
        if re.match(r"^:::\w+", stripped):
            in_custom_block = True
            yield LineContext(i, text, stripped, False, False, False)  # block opener 自身不算 "in block"
            continue
        if stripped == ":::":
            in_custom_block = False
            yield LineContext(i, text, stripped, False, False, False)
            continue

        yield LineContext(i, text, stripped, False, False, in_custom_block)


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


def rule_block_syntax(lines: list[str], config: dict, result: LintResult):
    """规则 A: :::block 语法正确性"""
    valid_types = set(config["rules"]["block_syntax"].get("valid_types", []))
    in_block = False
    block_type = ""
    block_start = 0

    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue

        m = re.match(r"^:::(\S+)$", ctx.stripped)
        if m:
            new_type = m.group(1)
            if not in_block:
                # 开始标记
                in_block = True
                block_type = new_type
                block_start = ctx.line_num
                # A2: 类型合法性
                if new_type not in valid_types:
                    result.add("A2", "warning", ctx.line_num, f"未知 :::block 类型: {new_type}")
            else:
                # A3: 嵌套
                result.add("A3", "error", ctx.line_num,
                           f"检测到 :::block 嵌套（外层 {block_type} 从 L{block_start} 开始）")
                block_type = new_type
                block_start = ctx.line_num
        elif ctx.stripped == ":::" and in_block:
            # 闭合标记
            in_block = False
            block_type = ""

    # A1: 文件结束时未闭合
    if in_block:
        result.add("A1", "error", block_start,
                    f"未闭合的 :::{block_type} block（从第 {block_start} 行开始）")


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
        if ctx.in_frontmatter or ctx.in_code_block or ctx.in_custom_block:
            flush_paragraph()
            continue

        # 跳过 :::block 开闭标记行
        if re.match(r"^:::", ctx.stripped):
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
        if re.search(r"!\[\]\(", ctx.text):
            result.add("E1", "warning", ctx.line_num, "图片缺少 alt 文本（用作图注）")

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


def rule_block_content(lines: list[str], _config: dict, result: LintResult):
    """规则 D: 自定义 block 内容结构"""
    current_block_type = None
    block_start = 0
    block_content: list[str] = []

    def check_block():
        if not current_block_type or not block_content:
            return
        content = "\n".join(block_content)

        # D1: :::vote 格式
        if current_block_type == "vote":
            if "？" not in content and "?" not in content:
                result.add("D1", "warning", block_start,
                            ":::vote 缺少问题分隔符（？或 ?）")
            if "/" not in content:
                result.add("D1", "warning", block_start,
                            ":::vote 缺少选项分隔符（/）")

        # D2: :::collection 格式
        elif current_block_type == "collection":
            if "：" not in content and ":" not in content:
                result.add("D2", "warning", block_start,
                            ":::collection 缺少系列标题分隔符（：）")
            if "本篇" not in content:
                result.add("D2", "warning", block_start,
                            ":::collection 缺少当前文章标记（本篇）")

        # D3: :::hashtag 格式
        elif current_block_type == "hashtag":
            if "#" not in content:
                result.add("D3", "warning", block_start,
                            ":::hashtag 缺少 # 前缀标签")

    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue

        m = re.match(r"^:::(\S+)$", ctx.stripped)
        if m:
            check_block()
            current_block_type = m.group(1)
            block_start = ctx.line_num
            block_content = []
        elif ctx.stripped == ":::":
            check_block()
            current_block_type = None
            block_content = []
        elif current_block_type:
            block_content.append(ctx.text)

    # 处理未闭合 block 的内容（A1 已报告未闭合）
    check_block()


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

    # S6: :::block 闭合后无空行（影响后续段落解析）
    prev_was_close = False
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            prev_was_close = False
            continue
        if ctx.stripped == ":::":
            prev_was_close = True
            continue
        if prev_was_close and ctx.stripped:
            # 紧接 ::: 闭合标记后有内容但无空行
            result.add("S6", "warning", ctx.line_num,
                        ":::block 闭合标记后建议空一行再写正文（避免解析粘连）")
        prev_was_close = False

    # S7: frontmatter column 与文件实际栏目一致性（信息性）
    if fm.get("column") and column and fm["column"] != column:
        fm_col = fm["column"]
        result.add("S7", "warning", 1,
                    f"frontmatter column={fm_col} 与命令行参数 column={column} 不一致")


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
                        "检测到未替换的图表占位符（format-exporting 应已替换为内联内容）")

    # T6: 引用文献应使用 :::references
    has_citation = bool(re.search(r"\[\d+\]", full_text))
    has_ref_block = bool(re.search(r"^:::references", full_text, re.MULTILINE))
    if has_citation and not has_ref_block:
        # 检查是否有普通有序列表形式的引用
        has_trailing_ol = False
        for ctx in iter_lines(lines):
            if ctx.in_frontmatter or ctx.in_code_block or ctx.in_custom_block:
                continue
            if re.match(r"^\d+\.\s+.*\[.*\]\(http", ctx.stripped):
                has_trailing_ol = True
                break
        if has_trailing_ol:
            result.add("T6", "warning", 0,
                        "引用文献建议使用 :::references 块包裹（紧凑排版，提升移动端体验）")


def rule_svg_validation(lines: list[str], config: dict, result: LintResult):
    """规则 V: SVG 图表质量校验"""
    in_svg = False
    svg_start = 0
    svg_has_viewbox = False
    svg_lines: list[tuple[int, str]] = []

    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block:
            continue

        # 检测 SVG 开始
        if re.search(r"<svg[\s>]", ctx.text, re.IGNORECASE) and not in_svg:
            in_svg = True
            svg_start = ctx.line_num
            svg_has_viewbox = bool(re.search(r"viewBox\s*=", ctx.text, re.IGNORECASE))
            svg_lines = [(ctx.line_num, ctx.text)]

            # V2: SVG width 检查（不应硬编码大于 680）
            w_match = re.search(r'\bwidth\s*=\s*["\']?(\d+)', ctx.text)
            if w_match:
                w_val = int(w_match.group(1))
                if w_val > 680:
                    result.add("V2", "warning", ctx.line_num,
                               f"SVG width={w_val} 超过 680px 上限（建议用 width=\"100%\" + viewBox）")
            continue

        if in_svg:
            svg_lines.append((ctx.line_num, ctx.text))

            # 补充检测 viewBox（可能不在第一行）
            if re.search(r"viewBox\s*=", ctx.text, re.IGNORECASE):
                svg_has_viewbox = True

        # 检测 SVG 结束
        if in_svg and re.search(r"</svg>", ctx.text, re.IGNORECASE):
            # V1: viewBox 缺失
            if not svg_has_viewbox:
                result.add("V1", "warning", svg_start,
                           "SVG 缺少 viewBox 属性（移动端缩放不可控）")

            # 逐行检查 SVG 内容
            for line_num, line_text in svg_lines:
                # V3: CSS 变量
                if "var(--" in line_text:
                    result.add("V3", "warning", line_num,
                               "SVG 中使用了 CSS 变量 var(--...)（微信不支持）")

                # V4: 事件属性
                if re.search(r'\bon(click|load|mouseover|mouseout|error)\s*=', line_text, re.IGNORECASE):
                    result.add("V4", "warning", line_num,
                               "SVG 中检测到事件属性（微信会剥除）")

                # V5: <text> 缺少 font-size
                if re.search(r"<text[\s>]", line_text, re.IGNORECASE):
                    if not re.search(r"font-size", line_text, re.IGNORECASE):
                        result.add("V5", "warning", line_num,
                                   "SVG <text> 缺少 font-size（将继承默认值，显示不可控）")

            # V6: <defs> 中的 id 引用（sanitizer 会剥除 id 导致引用失效）
            svg_block = "\n".join(t for _, t in svg_lines)
            if re.search(r"<defs[\s>]", svg_block, re.IGNORECASE):
                if re.search(r'url\(#', svg_block):
                    result.add("V6", "warning", svg_start,
                               "SVG <defs> 使用 id 引用（url(#...)），微信剥除 id 后引用将失效")

            in_svg = False
            svg_lines = []


def rule_forbidden_patterns(lines: list[str], config: dict, result: LintResult):
    """规则 G: 禁用词检查（从 lint-config.yaml 的 forbidden_patterns.words 读取）"""
    words = get_forbidden_words(config)
    if not words:
        return
    for ctx in iter_lines(lines):
        if ctx.in_frontmatter or ctx.in_code_block or ctx.in_custom_block:
            continue
        for word in words:
            if word in ctx.text:
                result.add("G1", "warning", ctx.line_num, f"检测到禁用词: {word}")


# 栏目名 → theme id 映射（从 columns.yaml 动态构建，避免硬编码）
def _build_column_aliases() -> dict[str, str]:
    """从 columns.yaml 读取栏目定义，构建 中文名→ID 和 ID→ID 的双向映射"""
    aliases: dict[str, str] = {}
    # 查找 columns.yaml（相对于仓库根目录）
    repo_root = Path(__file__).resolve().parent.parent.parent
    columns_path = repo_root / "styles" / "default" / "columns.yaml"
    if columns_path.exists():
        try:
            with open(columns_path, encoding="utf-8") as f:
                data = yaml.safe_load(f)
            columns = data.get("columns", {}) if data else {}
            for col_id, col_def in columns.items():
                aliases[col_id] = col_id  # ID → ID
                name = col_def.get("name", "") if isinstance(col_def, dict) else ""
                if name:
                    aliases[name] = col_id  # 中文名 → ID
            # column_aliases 段（如 personal → 人物故事）
            for alias, cn_name in (data.get("column_aliases", {}) or {}).items():
                if cn_name in aliases:
                    aliases[alias] = aliases[cn_name]
            # column_map 段（如 personal → story）
            for alias, target_id in (data.get("column_map", {}) or {}).items():
                if target_id in aliases:
                    aliases[alias] = aliases[target_id]
        except Exception:
            pass
    # 硬编码回退（columns.yaml 不可用时）
    if not aliases:
        aliases = {
            "学术前沿": "academic", "行业趋势": "industry",
            "技术专题": "tech", "人物故事": "story",
            "academic": "academic", "industry": "industry",
            "tech": "tech", "story": "story",
        }
    return aliases

COLUMN_ALIASES = _build_column_aliases()


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
    if rules_cfg.get("block_syntax", {}).get("enabled", True):
        rule_block_syntax(lines, config, result)

    if rules_cfg.get("typography", {}).get("enabled", True):
        rule_typography(lines, config, result)

    if rules_cfg.get("theme_constraints", {}).get("enabled", True):
        rule_theme_constraints(lines, column, config, result)

    if rules_cfg.get("css_safety", {}).get("enabled", True):
        rule_css_safety(lines, config, result)

    if rules_cfg.get("image_references", {}).get("enabled", True):
        rule_image_references(lines, config, result)

    if rules_cfg.get("block_content", {}).get("enabled", True):
        rule_block_content(lines, config, result)

    if rules_cfg.get("forbidden_patterns", {}).get("enabled", True):
        rule_forbidden_patterns(lines, config, result)

    if rules_cfg.get("article_structure", {}).get("enabled", True):
        rule_article_structure(lines, column, config, result)

    if rules_cfg.get("typesetter_compat", {}).get("enabled", True):
        rule_typesetter_compat(lines, column, config, result)

    if rules_cfg.get("svg_validation", {}).get("enabled", True):
        rule_svg_validation(lines, config, result)

    return result


def main():
    parser = argparse.ArgumentParser(description="InkFlow Markdown Lint — 文章格式校验工具")
    parser.add_argument("file", help="要校验的 Markdown 文件路径")
    parser.add_argument("--column", default="", help="栏目名（如未指定，从 frontmatter 读取）")
    parser.add_argument("--config", default=None, help="配置文件路径（默认: lint-config.yaml）")
    args = parser.parse_args()

    if not Path(args.file).exists():
        print(f"错误: 文件不存在: {args.file}", file=sys.stderr)
        sys.exit(1)

    # 默认配置路径
    config_path = args.config
    if not config_path:
        default_cfg = Path(__file__).parent / "lint-config.yaml"
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
