#!/usr/bin/env python3
"""Convert Mermaid code blocks in Markdown to sanitized inline SVG.

Replaces mermaid-render.sh with a Python implementation for cross-platform
compatibility and direct integration with svg-sanitize.py.

Usage:
    python .claude/scripts/mermaid.py <input.md> <output.md>

Dependencies:
    - npx @mermaid-js/mermaid-cli (mmdc)
    - svg-sanitize.py (imported as module)

Behavior:
    - Extracts all ```mermaid ... ``` code blocks from input.md
    - Renders each via mmdc to SVG
    - Sanitizes each SVG via svg_sanitize.sanitize_svg()
    - Replaces code blocks with inline <svg>...</svg> in output.md
    - Failed renders are kept as original code blocks with a warning comment
"""

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Import sanitize_svg from svg-sanitize.py (same directory)
# File uses hyphen in name, so use importlib
import importlib.util
_spec = importlib.util.spec_from_file_location(
    "svg_sanitize", os.path.join(SCRIPT_DIR, "svg-sanitize.py")
)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
sanitize_svg = _mod.sanitize_svg


def find_mmdc():
    """Check if mmdc (Mermaid CLI) is available via npx."""
    try:
        result = subprocess.run(
            ["npx", "mmdc", "--version"],
            capture_output=True, text=True, timeout=30
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def extract_mermaid_blocks(md_text):
    """Extract mermaid code blocks with their positions.

    Returns list of (start_pos, end_pos, mermaid_code) tuples.
    """
    blocks = []
    pattern = re.compile(r'^```mermaid\s*\n(.*?)^```\s*$', re.MULTILINE | re.DOTALL)
    for m in pattern.finditer(md_text):
        blocks.append((m.start(), m.end(), m.group(1).strip()))
    return blocks


def render_mermaid_to_svg(mermaid_code, tmp_dir, index):
    """Render a single Mermaid diagram to SVG using mmdc.

    Returns (svg_content, success) tuple.
    """
    mmd_path = os.path.join(tmp_dir, f"{index}.mmd")
    svg_path = os.path.join(tmp_dir, f"{index}.svg")

    with open(mmd_path, 'w', encoding='utf-8') as f:
        f.write(mermaid_code)

    try:
        result = subprocess.run(
            ["npx", "mmdc", "-i", mmd_path, "-o", svg_path,
             "--backgroundColor", "transparent", "-q"],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode != 0:
            return None, False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None, False

    if not os.path.isfile(svg_path):
        return None, False

    with open(svg_path, 'r', encoding='utf-8') as f:
        svg_content = f.read()

    # Sanitize for WeChat compatibility
    sanitized, issues = sanitize_svg(svg_content)
    if issues:
        print(f"  Block {index}: sanitized ({len(issues)} fix(es))", file=sys.stderr)

    return sanitized, True


def process_markdown(input_path, output_path):
    """Process a Markdown file, rendering Mermaid blocks to inline SVG."""
    with open(input_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    blocks = extract_mermaid_blocks(md_text)

    if not blocks:
        print("No mermaid code blocks found, copying input unchanged.", file=sys.stderr)
        shutil.copy2(input_path, output_path)
        return

    print(f"Found {len(blocks)} mermaid block(s), rendering...", file=sys.stderr)

    if not find_mmdc():
        print("Warning: @mermaid-js/mermaid-cli (mmdc) not available.", file=sys.stderr)
        print("Install with: npm install -g @mermaid-js/mermaid-cli", file=sys.stderr)
        print("Copying input to output unchanged.", file=sys.stderr)
        shutil.copy2(input_path, output_path)
        return

    tmp_dir = tempfile.mkdtemp(prefix="mermaid-render-")
    try:
        rendered = 0
        failed = 0

        # Process blocks in reverse order to preserve positions during replacement
        replacements = []
        for i, (start, end, code) in enumerate(blocks, 1):
            svg_content, success = render_mermaid_to_svg(code, tmp_dir, i)
            if success:
                replacements.append((start, end, svg_content))
                rendered += 1
            else:
                warning = "<!-- WARNING: Mermaid 渲染失败，保留原始代码块 -->\n"
                original = md_text[start:end]
                replacements.append((start, end, warning + original))
                failed += 1
                print(f"  Warning: render failed for block {i}, keeping code block",
                      file=sys.stderr)

        # Apply replacements in reverse order
        result = md_text
        for start, end, replacement in reversed(replacements):
            result = result[:start] + replacement + result[end:]

        print(f"Rendered: {rendered}, Failed: {failed}", file=sys.stderr)

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(result)

    print(f"Output written to: {output_path}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description="Convert Mermaid code blocks in Markdown to inline SVG"
    )
    parser.add_argument("input", help="Input Markdown file path")
    parser.add_argument("output", help="Output Markdown file path")
    args = parser.parse_args()

    if not os.path.isfile(args.input):
        print(f"Error: input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    process_markdown(args.input, args.output)


if __name__ == "__main__":
    main()
