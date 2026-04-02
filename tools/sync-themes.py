#!/usr/bin/env python3
"""Sync theme data from columns.yaml to index.html THEMES object.

Single source of truth: styles/default/columns.yaml
Target: tools/wechat-typesetter/index.html (between THEME_START/THEME_END markers)

Usage:
    python tools/sync-themes.py              # sync and overwrite index.html
    python tools/sync-themes.py --check      # check if in sync, exit 1 if not
    python tools/sync-themes.py --dry-run    # show what would change without writing
"""

import argparse
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
COLUMNS_YAML = os.path.join(ROOT_DIR, "styles", "default", "columns.yaml")
INDEX_HTML = os.path.join(ROOT_DIR, "tools", "wechat-typesetter", "index.html")

# Field name mapping: columns.yaml (full) → typesetter (short)
FIELD_MAP = {
    "textSecondary": "textSec",
    "textTertiary": "textTer",
    "background": "bg",
    "backgroundDeep": "bgDeep",
}

THEME_START = "// THEME_START — auto-generated from columns.yaml, do not edit manually"
THEME_END = "// THEME_END"
SPEC_START = "// SPEC_START — auto-generated from columns.yaml, do not edit manually"
SPEC_END = "// SPEC_END"


def parse_yaml_simple(text):
    """Minimal YAML parser using regex. Handles the columns.yaml structure."""
    data = {"columns": {}, "typography": {}, "syntax_highlighting": {}}

    # Parse typography section
    typo_match = re.search(r'^typography:\s*\n((?:\s+\w.*\n)+)', text, re.MULTILINE)
    if typo_match:
        for m in re.finditer(r'^\s{2}(\w+):\s*(.+)', typo_match.group(1), re.MULTILINE):
            key, val = m.group(1), m.group(2).strip()
            if val.replace('.', '').isdigit():
                data["typography"][key] = float(val) if '.' in val else int(val)
            else:
                data["typography"][key] = val.strip('"').strip("'")

    # Parse syntax_highlighting section
    sh_match = re.search(r'^syntax_highlighting:\s*\n((?:\s+\w.*\n)+)', text, re.MULTILINE)
    if sh_match:
        for m in re.finditer(r'^\s{2}(\w+):\s*"?([^"\n]+)"?', sh_match.group(1), re.MULTILINE):
            data["syntax_highlighting"][m.group(1)] = m.group(2).strip().strip('"')

    # Parse columns
    col_pattern = re.compile(r'^  (\w+):\s*\n((?:\s{4,}.*\n)+)', re.MULTILINE)
    columns_section = re.search(r'^columns:\s*\n((?:\s{2,}.*\n)+)', text, re.MULTILINE)
    if not columns_section:
        return data

    for col_match in col_pattern.finditer(columns_section.group(1)):
        col_id = col_match.group(1)
        col_text = col_match.group(2)
        col_data = {"colors": {}, "dark": {}}

        # Parse simple fields
        for m in re.finditer(r'^\s{4}(\w+):\s*"?([^"\n#]+)"?', col_text, re.MULTILINE):
            key, val = m.group(1), m.group(2).strip().strip('"').strip("'")
            if key not in ("colors", "dark", "kpi_targets", "suggested_components"):
                if val.replace('.', '').replace('-', '').isdigit():
                    col_data[key] = float(val) if '.' in val else int(val)
                elif val == "null":
                    col_data[key] = None
                else:
                    col_data[key] = val

        # Parse colors block
        colors_match = re.search(r'^\s{4}colors:\s*\n((?:\s{6}.*\n)+)', col_text, re.MULTILINE)
        if colors_match:
            for m in re.finditer(r'^\s{6}(\w+):\s*"([^"]+)"', colors_match.group(1), re.MULTILINE):
                col_data["colors"][m.group(1)] = m.group(2)

        # Parse dark block
        dark_match = re.search(r'^\s{4}dark:\s*\n((?:\s{6}.*\n)+)', col_text, re.MULTILINE)
        if dark_match:
            for m in re.finditer(r'^\s{6}(\w+):\s*"([^"]+)"', dark_match.group(1), re.MULTILINE):
                col_data["dark"][m.group(1)] = m.group(2)

        data["columns"][col_id] = col_data

    return data


def map_colors(colors):
    """Map columns.yaml color field names to typesetter short names."""
    mapped = {}
    for k, v in colors.items():
        mapped[FIELD_MAP.get(k, k)] = v
    return mapped


def generate_themes_js(data):
    """Generate JavaScript THEMES object from parsed YAML data."""
    lines = ["const THEMES = {"]
    for col_id, col in data["columns"].items():
        colors = map_colors(col.get("colors", {}))
        dark = map_colors(col.get("dark", {}))
        name = col.get("name", col_id)
        icon = col.get("icon", "")

        c_parts = ", ".join(f'{k}: "{v}"' for k, v in colors.items())
        d_parts = ", ".join(f'{k}: "{v}"' for k, v in dark.items())

        lines.append(f'  {col_id}: {{')
        lines.append(f'    id: "{col_id}", name: "{name}", icon: "{icon}",')
        lines.append(f'    colors: {{ {c_parts} }},')
        lines.append(f'    dark: {{ {d_parts} }},')
        lines.append(f'  }},')
    lines.append("};")
    return "\n".join(lines)


def generate_spec_js(data):
    """Generate JavaScript DEFAULT_SPEC from parsed typography data."""
    typo = data.get("typography", {})
    fs = typo.get("fontSize", 15)
    lh = typo.get("lineHeight", 1.75)
    ls = typo.get("letterSpacing", 1)
    pm = typo.get("pageMargin", 12)
    return f"const DEFAULT_SPEC = {{ fontSize: {fs}, lineHeight: {lh}, letterSpacing: {ls}, pageMargin: {pm} }};"


def replace_between_markers(content, start_marker, end_marker, replacement):
    """Replace content between start and end markers (inclusive of markers)."""
    pattern = re.compile(
        re.escape(start_marker) + r'.*?' + re.escape(end_marker),
        re.DOTALL
    )
    new_block = f"{start_marker}\n{replacement}\n{end_marker}"
    new_content, count = pattern.subn(new_block, content)
    return new_content, count


def main():
    parser = argparse.ArgumentParser(description="Sync columns.yaml themes to index.html")
    parser.add_argument("--check", action="store_true", help="Check sync status without modifying")
    parser.add_argument("--dry-run", action="store_true", help="Show changes without writing")
    args = parser.parse_args()

    if not os.path.isfile(COLUMNS_YAML):
        print(f"Error: columns.yaml not found: {COLUMNS_YAML}", file=sys.stderr)
        sys.exit(2)
    if not os.path.isfile(INDEX_HTML):
        print(f"Error: index.html not found: {INDEX_HTML}", file=sys.stderr)
        sys.exit(2)

    with open(COLUMNS_YAML, 'r', encoding='utf-8') as f:
        yaml_text = f.read()
    with open(INDEX_HTML, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Check markers exist
    if THEME_START not in html_content:
        print(f"Error: THEME_START marker not found in index.html", file=sys.stderr)
        print(f"Expected: {THEME_START}", file=sys.stderr)
        sys.exit(2)
    if THEME_END not in html_content:
        print(f"Error: THEME_END marker not found in index.html", file=sys.stderr)
        sys.exit(2)

    data = parse_yaml_simple(yaml_text)
    if not data["columns"]:
        print("Error: no columns parsed from columns.yaml", file=sys.stderr)
        sys.exit(2)

    themes_js = generate_themes_js(data)
    spec_js = generate_spec_js(data)

    new_content = html_content
    new_content, t_count = replace_between_markers(new_content, THEME_START, THEME_END, themes_js)
    if t_count == 0:
        print("Error: failed to replace THEMES block", file=sys.stderr)
        sys.exit(2)

    if SPEC_START in new_content:
        new_content, s_count = replace_between_markers(new_content, SPEC_START, SPEC_END, spec_js)

    if args.check:
        if new_content == html_content:
            print("Themes are in sync.", file=sys.stderr)
            sys.exit(0)
        else:
            print("Themes are OUT OF SYNC. Run: python tools/sync-themes.py", file=sys.stderr)
            sys.exit(1)

    if new_content == html_content:
        print("No changes needed — themes already in sync.", file=sys.stderr)
        return

    if args.dry_run:
        print("Would update index.html with:", file=sys.stderr)
        print(themes_js, file=sys.stderr)
        print(spec_js, file=sys.stderr)
        return

    with open(INDEX_HTML, 'w', encoding='utf-8') as f:
        f.write(new_content)

    col_names = ", ".join(data["columns"].keys())
    print(f"Synced {len(data['columns'])} themes ({col_names}) to index.html", file=sys.stderr)


if __name__ == "__main__":
    main()
