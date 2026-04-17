#!/usr/bin/env python3
"""SVG sanitizer for WeChat public account compatibility.

WeChat editor strips id attributes, which breaks SVG internal references
(markers, gradients, clipPaths). This script removes problematic attributes
and tags to ensure SVGs display correctly after pasting.

Usage:
    python .claude/scripts/svg-sanitize.py input.svg                  # sanitize in-place
    python .claude/scripts/svg-sanitize.py input.svg -o output.svg    # write to new file
    python .claude/scripts/svg-sanitize.py input.svg --check-only     # report issues, exit 1 if any
    cat input.svg | python .claude/scripts/svg-sanitize.py -           # read from stdin, write to stdout
"""

import argparse
import re
import sys


def sanitize_svg(svg_text):
    """Remove WeChat-incompatible attributes and tags from SVG string.

    Returns (sanitized_svg, issues_list).
    """
    issues = []
    result = svg_text

    # 1. Remove <style>...</style> blocks
    style_count = len(re.findall(r'<style[^>]*>[\s\S]*?</style>', result, re.IGNORECASE))
    if style_count:
        issues.append(f"Removed {style_count} <style> block(s)")
        result = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', result, flags=re.IGNORECASE)

    # 2. Remove <script>...</script> blocks
    script_count = len(re.findall(r'<script[^>]*>[\s\S]*?</script>', result, re.IGNORECASE))
    if script_count:
        issues.append(f"Removed {script_count} <script> block(s)")
        result = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', result, flags=re.IGNORECASE)

    # 3. Unwrap <a> tags (keep inner content)
    a_count = len(re.findall(r'<a\b[^>]*>', result, re.IGNORECASE))
    if a_count:
        issues.append(f"Unwrapped {a_count} <a> tag(s)")
        result = re.sub(r'<a\b[^>]*>([\s\S]*?)</a>', r'\1', result, flags=re.IGNORECASE)

    # 4. Remove all id attributes
    id_count = len(re.findall(r'\s+id\s*=\s*"[^"]*"', result, re.IGNORECASE))
    if id_count:
        issues.append(f"Removed {id_count} id attribute(s)")
        result = re.sub(r'\s+id\s*=\s*"[^"]*"', '', result, flags=re.IGNORECASE)
    # Also handle single-quoted ids
    id_sq_count = len(re.findall(r"\s+id\s*=\s*'[^']*'", result, re.IGNORECASE))
    if id_sq_count:
        issues.append(f"Removed {id_sq_count} id attribute(s) (single-quoted)")
        result = re.sub(r"\s+id\s*=\s*'[^']*'", '', result, flags=re.IGNORECASE)

    # 5. Remove all class attributes
    class_count = len(re.findall(r'\s+class\s*=\s*"[^"]*"', result, re.IGNORECASE))
    if class_count:
        issues.append(f"Removed {class_count} class attribute(s)")
        result = re.sub(r'\s+class\s*=\s*"[^"]*"', '', result, flags=re.IGNORECASE)
    class_sq_count = len(re.findall(r"\s+class\s*=\s*'[^']*'", result, re.IGNORECASE))
    if class_sq_count:
        issues.append(f"Removed {class_sq_count} class attribute(s) (single-quoted)")
        result = re.sub(r"\s+class\s*=\s*'[^']*'", '', result, flags=re.IGNORECASE)

    # 6. Fix background url() quotes: url("...") or url('...') → url(...)
    url_quote_count = len(re.findall(r'url\(["\']', result))
    if url_quote_count:
        issues.append(f"Fixed {url_quote_count} quoted url() value(s)")
        result = re.sub(r'url\("([^"]*?)"\)', r'url(\1)', result)
        result = re.sub(r"url\('([^']*?)'\)", r'url(\1)', result)

    return result, issues


def main():
    parser = argparse.ArgumentParser(
        description="Sanitize SVG for WeChat public account compatibility"
    )
    parser.add_argument(
        "input",
        help="SVG file path, or '-' to read from stdin"
    )
    parser.add_argument(
        "-o", "--output",
        help="Output file path (default: overwrite input, or stdout for stdin mode)"
    )
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Only report issues without modifying; exit 1 if issues found"
    )
    args = parser.parse_args()

    # Read input
    if args.input == '-':
        svg_text = sys.stdin.read()
    else:
        try:
            with open(args.input, 'r', encoding='utf-8') as f:
                svg_text = f.read()
        except FileNotFoundError:
            print(f"Error: file not found: {args.input}", file=sys.stderr)
            sys.exit(2)

    sanitized, issues = sanitize_svg(svg_text)

    if args.check_only:
        if issues:
            print(f"Found {len(issues)} issue(s):", file=sys.stderr)
            for issue in issues:
                print(f"  - {issue}", file=sys.stderr)
            sys.exit(1)
        else:
            print("No issues found.", file=sys.stderr)
            sys.exit(0)

    # Write output
    if args.input == '-':
        out_path = args.output
        if out_path:
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(sanitized)
        else:
            sys.stdout.write(sanitized)
    else:
        out_path = args.output or args.input
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(sanitized)

    if issues:
        print(f"Sanitized ({len(issues)} fix(es)):", file=sys.stderr)
        for issue in issues:
            print(f"  - {issue}", file=sys.stderr)
    else:
        print("No issues found, file unchanged.", file=sys.stderr)


if __name__ == "__main__":
    main()
