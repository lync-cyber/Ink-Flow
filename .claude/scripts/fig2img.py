#!/usr/bin/env python3
"""fig2img.py — 将目录下的 SVG / HTML 文件批量转为 PNG 图片。

用法:
    python fig2img.py <目录> [--width 1280] [--suffix .png]

依赖（按优先级自动选择）:
    SVG:  cairosvg > inkscape > chromium
    HTML: playwright > chromium

退出码:
    0 = 全部成功
    1 = 部分失败（见 stderr）
    2 = 目录不存在或无可转换文件
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


# ------------------------------------------------------------
# 工具探测
# ------------------------------------------------------------
def _have_cairosvg():
    try:
        import cairosvg  # noqa: F401
        return True
    except ImportError:
        return False


def _have_inkscape():
    return shutil.which("inkscape") is not None


def _find_chromium():
    for name in ("chrome", "chromium", "chromium-browser", "google-chrome",
                 "msedge", "chrome.exe", "msedge.exe"):
        path = shutil.which(name)
        if path:
            return path
    # Windows 常见安装路径兜底
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None


def _have_playwright():
    try:
        import playwright  # noqa: F401
        return True
    except ImportError:
        return False


# ------------------------------------------------------------
# SVG → PNG
# ------------------------------------------------------------
def _svg_via_cairosvg(src: Path, dst: Path, width: int) -> tuple[bool, str]:
    try:
        import cairosvg
        cairosvg.svg2png(
            url=str(src),
            write_to=str(dst),
            output_width=width,
        )
        return True, ""
    except Exception as e:
        return False, f"cairosvg: {e}"


def _svg_via_inkscape(src: Path, dst: Path, width: int) -> tuple[bool, str]:
    try:
        result = subprocess.run(
            [
                "inkscape", str(src),
                "--export-type=png",
                f"--export-filename={dst}",
                f"--export-width={width}",
            ],
            capture_output=True, text=True, timeout=60,
        )
        if result.returncode == 0 and dst.exists():
            return True, ""
        return False, f"inkscape rc={result.returncode}: {result.stderr.strip()[:160]}"
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        return False, f"inkscape: {e}"


def _svg_via_chromium(src: Path, dst: Path, width: int, chromium: str) -> tuple[bool, str]:
    # Chrome 截图以 file:// 访问 svg；高度未知，让 Chrome 默认推断再裁剪会失真，
    # 这里直接用 window-size=width×ceil(width*0.75) 作为保守画布，适合常见 4:3/3:2。
    height = int(width * 0.75)
    try:
        result = subprocess.run(
            [
                chromium,
                "--headless=new",
                "--disable-gpu",
                "--no-sandbox",
                "--hide-scrollbars",
                f"--window-size={width},{height}",
                f"--screenshot={dst}",
                src.resolve().as_uri(),
            ],
            capture_output=True, text=True, timeout=90,
        )
        if dst.exists():
            return True, ""
        return False, f"chromium rc={result.returncode}: {result.stderr.strip()[:160]}"
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        return False, f"chromium: {e}"


def convert_svg(src: Path, dst: Path, width: int, tools: dict) -> tuple[bool, str]:
    if tools["cairosvg"]:
        ok, err = _svg_via_cairosvg(src, dst, width)
        if ok:
            return True, "cairosvg"
        last_err = err
    else:
        last_err = "cairosvg not installed"

    if tools["inkscape"]:
        ok, err = _svg_via_inkscape(src, dst, width)
        if ok:
            return True, "inkscape"
        last_err = err

    if tools["chromium"]:
        ok, err = _svg_via_chromium(src, dst, width, tools["chromium"])
        if ok:
            return True, "chromium"
        last_err = err

    return False, last_err


# ------------------------------------------------------------
# HTML → PNG
# ------------------------------------------------------------
def _html_via_playwright(src: Path, dst: Path, width: int) -> tuple[bool, str]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as e:
        return False, f"playwright import: {e}"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            ctx = browser.new_context(viewport={"width": width, "height": 800},
                                      device_scale_factor=1)
            page = ctx.new_page()
            page.goto(src.resolve().as_uri())
            page.wait_for_load_state("networkidle", timeout=15000)
            # full_page=True 会按实际内容高度截图
            page.screenshot(path=str(dst), full_page=True, omit_background=False)
            browser.close()
        return True, ""
    except Exception as e:
        return False, f"playwright: {e}"


def _html_via_chromium(src: Path, dst: Path, width: int, chromium: str) -> tuple[bool, str]:
    # headless Chrome 对 HTML 的截图可以通过 --screenshot 直接拿到 viewport 截图
    height = int(width * 1.5)  # 给 HTML 足够高的画布，自动裁剪空白在后续步骤不做
    try:
        result = subprocess.run(
            [
                chromium,
                "--headless=new",
                "--disable-gpu",
                "--no-sandbox",
                "--hide-scrollbars",
                "--default-background-color=00000000",
                f"--window-size={width},{height}",
                f"--screenshot={dst}",
                src.resolve().as_uri(),
            ],
            capture_output=True, text=True, timeout=90,
        )
        if dst.exists():
            return True, ""
        return False, f"chromium rc={result.returncode}: {result.stderr.strip()[:160]}"
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        return False, f"chromium: {e}"


def convert_html(src: Path, dst: Path, width: int, tools: dict) -> tuple[bool, str]:
    if tools["playwright"]:
        ok, err = _html_via_playwright(src, dst, width)
        if ok:
            return True, "playwright"
        last_err = err
    else:
        last_err = "playwright not installed"

    if tools["chromium"]:
        ok, err = _html_via_chromium(src, dst, width, tools["chromium"])
        if ok:
            return True, "chromium"
        last_err = err

    return False, last_err


# ------------------------------------------------------------
# 主流程
# ------------------------------------------------------------
def detect_tools() -> dict:
    return {
        "cairosvg": _have_cairosvg(),
        "inkscape": _have_inkscape(),
        "playwright": _have_playwright(),
        "chromium": _find_chromium(),
    }


def should_skip(src: Path, dst: Path) -> bool:
    """若产物存在且比源文件新，则跳过。"""
    if not dst.exists():
        return False
    try:
        return dst.stat().st_mtime >= src.stat().st_mtime
    except OSError:
        return False


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert SVG/HTML files in a directory to PNG images.",
    )
    parser.add_argument("directory", help="目录路径（含 .svg / .html 源文件）")
    parser.add_argument("--width", type=int, default=1280,
                        help="输出宽度像素（默认 1280，2× 高清）")
    parser.add_argument("--suffix", default=".png",
                        help="输出后缀（默认 .png）")
    args = parser.parse_args()

    root = Path(args.directory)
    if not root.is_dir():
        print(f"[ERR] 目录不存在: {root}", file=sys.stderr)
        return 2

    svg_files = sorted(root.glob("*.svg"))
    html_files = sorted(root.glob("*.html"))
    sources = [(s, "svg") for s in svg_files] + [(h, "html") for h in html_files]

    if not sources:
        print(f"[WARN] 目录内无 .svg / .html 可转换: {root}", file=sys.stderr)
        return 2

    tools = detect_tools()
    print(f"[INFO] 工具探测: "
          f"cairosvg={tools['cairosvg']}, inkscape={tools['inkscape']}, "
          f"playwright={tools['playwright']}, chromium={bool(tools['chromium'])}",
          file=sys.stderr)

    ok_count = 0
    skip_count = 0
    fail_count = 0

    for src, kind in sources:
        dst = src.with_suffix(args.suffix)

        if should_skip(src, dst):
            print(f"[SKIP] {src.name} → {dst.name}（产物已是最新）")
            skip_count += 1
            continue

        if kind == "svg":
            ok, info = convert_svg(src, dst, args.width, tools)
        else:
            ok, info = convert_html(src, dst, args.width, tools)

        if ok:
            print(f"[OK]   {src.name} → {dst.name}（{info}）")
            ok_count += 1
        else:
            print(f"[FAIL] {src.name}: {info}", file=sys.stderr)
            fail_count += 1

    print(f"\n转换完成：{ok_count} 成功，{skip_count} 跳过，{fail_count} 失败",
          file=sys.stderr)

    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
