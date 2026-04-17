#!/usr/bin/env python3
"""wechat.py — 抓取并清洗微信公众号文章为 Markdown

用法:
    python .claude/skills/style-learning/scripts/wechat.py <URL> [--out DIR]
    python .claude/skills/style-learning/scripts/wechat.py --list urls.txt [--out DIR]

功能:
  1. 用浏览器 UA 请求微信文章 HTML（mp.weixin.qq.com/s?...）
  2. 抽取 <div id="js_content"> 正文，转换为 Markdown
  3. 剥离关注卡、分享栏、相关阅读、二维码等噪音
  4. <img data-src="..."> → ![alt](url)（微信懒加载）
  5. 抓取标题、作者、公众号、发布时间写入 frontmatter
  6. 同时产出 meta.json（visual metrics 供 style-analyzer 消费）
  7. 落地到 content/references/articles/wechat-{yyyymmdd}-{slug}.md

依赖: requests + beautifulsoup4
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

try:
    import requests
    from bs4 import BeautifulSoup, NavigableString, Tag
except ImportError as e:
    print(f"错误: 缺少依赖 ({e})。请运行: pip install requests beautifulsoup4", file=sys.stderr)
    sys.exit(2)


DEFAULT_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 "
    "MicroMessenger/8.0.40 NetType/WIFI Language/zh_CN"
)

# 要整块删除的 class/id 片段（子串匹配）
DROP_PATTERNS = [
    "qr_code_pc", "rich_media_tool", "rich_media_area_extra",
    "share_notice", "weapp_text_link", "weapp_display_element",
    "js_pc_qr_code", "reward_area", "qr_code_area", "promotion_area",
    "js_share_content_page_hide", "rich_media_meta_list",  # 发布时间/公众号栏另存
    "profile_container",
]


# ============================================================
# 抓取
# ============================================================

def fetch_html(url: str, timeout: int = 30) -> str:
    headers = {
        "User-Agent": DEFAULT_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Cache-Control": "no-cache",
    }
    resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
    resp.raise_for_status()
    if resp.encoding is None or resp.encoding.lower() == "iso-8859-1":
        resp.encoding = "utf-8"
    return resp.text


# ============================================================
# 元数据提取（HTML <head> + 内联 JS）
# ============================================================

def extract_metadata(soup: BeautifulSoup, html: str, url: str) -> dict:
    meta: dict = {"source_url": url, "platform": "wechat"}

    # 标题：优先 rich_media_title，其次 og:title
    t = soup.select_one("#activity-name, h1.rich_media_title, h2.rich_media_title")
    if t:
        meta["title"] = t.get_text(strip=True)
    if "title" not in meta:
        og = soup.find("meta", property="og:title")
        if og and og.get("content"):
            meta["title"] = og["content"].strip()
    if "title" not in meta and soup.title:
        meta["title"] = soup.title.get_text(strip=True)

    # 作者：#js_name / .rich_media_meta_nickname
    for sel in ("#js_name", "a.rich_media_meta_nickname", ".rich_media_meta_nickname"):
        el = soup.select_one(sel)
        if el:
            meta["author"] = el.get_text(strip=True)
            break

    # 公众号 ID 和时间戳在内联 JS 里
    m = re.search(r"var user_name\s*=\s*['\"]([^'\"]+)['\"]", html)
    if m:
        meta["wechat_id"] = m.group(1)
    m = re.search(r"var nickname\s*=\s*htmlDecode\(['\"]([^'\"]+)['\"]\)", html)
    if m and "author" not in meta:
        meta["author"] = m.group(1)
    m = re.search(r"var ct\s*=\s*['\"](\d+)['\"]", html)
    if m:
        try:
            ts = int(m.group(1))
            meta["publish_time"] = time.strftime("%Y-%m-%d %H:%M", time.localtime(ts))
        except Exception:
            pass

    # 描述
    desc = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "description"})
    if desc and desc.get("content"):
        meta["description"] = desc["content"].strip()

    return meta


def extract_visual_metrics(content: Tag) -> dict:
    """统计视觉节奏特征（供 style-analyzer 消费）"""
    paragraphs = content.find_all(["p", "section"])
    images = content.find_all("img")
    headings = content.find_all(["h1", "h2", "h3", "h4"])
    blockquotes = content.find_all("blockquote")

    # 正文字符数
    text = content.get_text()
    text = re.sub(r"\s+", " ", text).strip()
    char_count = len(text)

    # 颜色使用统计（style 属性中出现的 color/#xxx）
    style_colors: dict[str, int] = {}
    for el in content.find_all(attrs={"style": True}):
        for c in re.findall(r"#[0-9a-fA-F]{3,6}", el.get("style", "")):
            c = c.lower()
            # 归一化 3 位 hex → 6 位
            if len(c) == 4:
                c = "#" + "".join(ch * 2 for ch in c[1:])
            style_colors[c] = style_colors.get(c, 0) + 1
    top_colors = sorted(style_colors.items(), key=lambda x: -x[1])[:5]

    return {
        "char_count": char_count,
        "paragraph_count": len(paragraphs),
        "image_count": len(images),
        "heading_count": len(headings),
        "blockquote_count": len(blockquotes),
        "chars_per_paragraph_avg": round(char_count / max(len(paragraphs), 1), 1),
        "images_per_1000_chars": round(len(images) / max(char_count / 1000, 0.1), 2),
        "top_colors": [{"hex": c, "count": n} for c, n in top_colors],
    }


# ============================================================
# 噪声过滤
# ============================================================

def clean_noise(content: Tag) -> None:
    """原地删除广告、关注卡、分享栏、二维码等"""
    # 1. 按 class/id 模式删除
    for el in list(content.find_all(True)):
        cls = " ".join(el.get("class") or [])
        _id = el.get("id") or ""
        combined = f"{cls} {_id}".lower()
        if any(p in combined for p in DROP_PATTERNS):
            el.decompose()
            continue
        # 2. display:none
        style = (el.get("style") or "").lower()
        if "display:none" in style or "display: none" in style:
            el.decompose()

    # 3. 删除脚本、样式
    for tag in content.find_all(["script", "style", "iframe", "noscript"]):
        tag.decompose()

    # 4. 微信内嵌小程序、视频号卡片：mpvoice/mpvideo 保留标签，其他 mp* 转纯文本
    for tag in content.find_all(re.compile(r"^mp")):
        if tag.name not in ("mpvoice", "mpvideo"):
            tag.unwrap()


# ============================================================
# HTML → Markdown（递归遍历 bs4 树）
# ============================================================

INLINE_WRAP = {"strong": "**", "b": "**", "em": "_", "i": "_"}


def _render(node, state: dict) -> str:
    """递归把 BeautifulSoup 节点渲染为 Markdown 字符串。"""
    if isinstance(node, NavigableString):
        text = str(node)
        # 代码块内保留原始空白
        if state.get("in_pre"):
            return text
        return re.sub(r"[ \t\u00A0]+", " ", text)

    if not isinstance(node, Tag):
        return ""

    name = node.name.lower()

    # 块级元素 → 前后换行
    if name in ("h1", "h2", "h3", "h4", "h5", "h6"):
        level = int(name[1])
        inner = "".join(_render(c, state) for c in node.children).strip()
        return f"\n\n{'#' * level} {inner}\n\n"

    if name == "p":
        inner = "".join(_render(c, state) for c in node.children).strip()
        return f"\n\n{inner}\n\n" if inner else "\n"

    if name == "section":
        inner = "".join(_render(c, state) for c in node.children)
        # 有些文章用 section 当段落 — 前后加空行
        return f"\n{inner}\n" if inner.strip() else ""

    if name == "br":
        return "  \n"

    if name == "hr":
        return "\n\n---\n\n"

    if name == "blockquote":
        inner = "".join(_render(c, state) for c in node.children).strip()
        quoted = "\n".join("> " + line for line in inner.splitlines() if line.strip())
        return f"\n\n{quoted}\n\n"

    if name in INLINE_WRAP:
        w = INLINE_WRAP[name]
        inner = "".join(_render(c, state) for c in node.children)
        return f"{w}{inner.strip()}{w}" if inner.strip() else ""

    if name == "code":
        if state.get("in_pre"):
            return "".join(_render(c, state) for c in node.children)
        inner = "".join(_render(c, state) for c in node.children)
        return f"`{inner}`"

    if name == "pre":
        state["in_pre"] = True
        inner = "".join(_render(c, state) for c in node.children)
        state["in_pre"] = False
        return f"\n\n```\n{inner.strip()}\n```\n\n"

    if name == "a":
        inner = "".join(_render(c, state) for c in node.children).strip()
        href = node.get("href", "") or ""
        if not inner:
            return ""
        if not href or href.startswith("javascript:"):
            return inner
        return f"[{inner}]({href})"

    if name == "img":
        src = node.get("data-src") or node.get("src") or ""
        alt = node.get("alt") or "image"
        if not src or src.startswith("data:"):
            return ""
        return f"\n\n![{alt}]({src})\n\n"

    if name == "ul":
        items = [_render(li, state).strip() for li in node.find_all("li", recursive=False)]
        return "\n\n" + "\n".join(f"- {i}" for i in items if i) + "\n\n"

    if name == "ol":
        items = [_render(li, state).strip() for li in node.find_all("li", recursive=False)]
        return "\n\n" + "\n".join(f"{idx}. {i}" for idx, i in enumerate(items, 1) if i) + "\n\n"

    if name == "li":
        inner = "".join(_render(c, state) for c in node.children).strip()
        return inner

    if name == "table":
        # 转 GFM table（仅简单情形）
        rows = node.find_all("tr")
        if not rows:
            return ""
        out_lines = []
        for i, tr in enumerate(rows):
            cells = [td.get_text(" ", strip=True).replace("|", r"\|")
                     for td in tr.find_all(["td", "th"])]
            if not cells:
                continue
            out_lines.append("| " + " | ".join(cells) + " |")
            if i == 0:
                out_lines.append("|" + "|".join([" --- "] * len(cells)) + "|")
        return "\n\n" + "\n".join(out_lines) + "\n\n"

    # 默认：透明容器
    return "".join(_render(c, state) for c in node.children)


def html_to_markdown(html: str, url: str) -> tuple[str, dict, dict]:
    """返回 (markdown, metadata, visual_metrics)"""
    soup = BeautifulSoup(html, "html.parser")
    meta = extract_metadata(soup, html, url)

    # 定位正文容器
    content = soup.select_one("#js_content") or soup.select_one(".rich_media_content")
    if not content:
        return "", meta, {}

    clean_noise(content)
    visual = extract_visual_metrics(content)

    md = _render(content, state={})
    # 清洗：多空行压缩、尾空格
    md = re.sub(r"\n{3,}", "\n\n", md)
    md = re.sub(r"[ \t]+\n", "\n", md)
    md = md.strip() + "\n"

    return md, meta, visual


# ============================================================
# 落地
# ============================================================

def slugify(text: str, max_len: int = 40) -> str:
    text = unicodedata.normalize("NFKC", text or "")
    text = re.sub(r"[\s\t\r\n]+", "-", text.strip())
    text = re.sub(r"[^\w\u4e00-\u9fff-]+", "", text)
    text = text.strip("-")
    if len(text) > max_len:
        text = text[:max_len]
    return text or "untitled"


def url_hash(url: str) -> str:
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:8]


def save_article(url: str, md: str, meta: dict, visual: dict, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    date_part = time.strftime("%Y%m%d", time.localtime())
    slug = slugify(meta.get("title", "")) or url_hash(url)
    path = out_dir / f"wechat-{date_part}-{slug}.md"

    front = ["---"]
    for k in ("source_url", "platform", "title", "author", "wechat_id",
              "publish_time", "description"):
        v = meta.get(k, "")
        if v:
            v = str(v).replace('"', '\\"').replace("\n", " ")
            front.append(f'{k}: "{v}"')
    front.append(f"fetched_at: \"{time.strftime('%Y-%m-%d %H:%M:%S')}\"")
    front.append(f"content_hash: \"{hashlib.sha1(md.encode('utf-8')).hexdigest()[:12]}\"")
    # 视觉指标用独立 YAML 段
    front.append("visual_metrics:")
    for k in ("char_count", "paragraph_count", "image_count", "heading_count",
              "blockquote_count", "chars_per_paragraph_avg", "images_per_1000_chars"):
        front.append(f"  {k}: {visual.get(k, 0)}")
    if visual.get("top_colors"):
        front.append("  top_colors:")
        for c in visual["top_colors"]:
            front.append(f"    - {{ hex: '{c['hex']}', count: {c['count']} }}")
    front.append("---")

    path.write_text("\n".join(front) + "\n\n" + md, encoding="utf-8")
    return path


# ============================================================
# CLI
# ============================================================

def process_url(url: str, out_dir: Path, verbose: bool = False) -> dict:
    result = {"url": url, "ok": False, "path": None, "title": None,
              "word_count": 0, "error": None, "visual": {}}
    try:
        html = fetch_html(url)
        md, meta, visual = html_to_markdown(html, url)
        if not md.strip():
            result["error"] = "正文为空（可能被反爬/登录拦截，或页面结构已变）"
            return result
        path = save_article(url, md, meta, visual, out_dir)
        result.update(
            ok=True,
            path=str(path),
            title=meta.get("title", ""),
            author=meta.get("author", ""),
            word_count=len(md),
            visual=visual,
        )
        if verbose:
            print(f"[OK] {path} ({len(md)} chars)  «{meta.get('title','')}»")
    except requests.HTTPError as e:
        result["error"] = f"HTTP {e.response.status_code if e.response is not None else '?'}"
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {e}"
    return result


def main():
    ap = argparse.ArgumentParser(description="抓取并清洗微信公众号文章为 Markdown")
    ap.add_argument("url", nargs="?", help="微信文章 URL")
    ap.add_argument("--list", help="URL 清单文件（每行一个，# 开头为注释）")
    ap.add_argument("--out", default="content/references/articles",
                    help="输出目录（默认 content/references/articles）")
    ap.add_argument("--json", action="store_true", help="JSON 输出（便于其他脚本/agent 消费）")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    urls: list[str] = []
    if args.url:
        urls.append(args.url)
    if args.list:
        for line in Path(args.list).read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                urls.append(line)

    if not urls:
        ap.print_help()
        sys.exit(1)

    for u in urls:
        host = urlparse(u).hostname or ""
        if "mp.weixin.qq.com" not in host:
            print(f"[WARN] {u} 非微信公众号 URL，清洗规则可能不适配", file=sys.stderr)

    out_dir = Path(args.out).resolve()
    results = [process_url(u, out_dir, args.verbose) for u in urls]

    if args.json:
        # JSON 模式下 visual 里嵌套字段按原样输出
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        ok = sum(1 for r in results if r["ok"])
        fail = len(results) - ok
        for r in results:
            if r["ok"]:
                print(f"✓ {r['path']}")
                print(f"    title: {r['title']}")
                print(f"    chars: {r['word_count']}  paragraphs: {r['visual'].get('paragraph_count')}  images: {r['visual'].get('image_count')}")
            else:
                print(f"✗ {r['url']}")
                print(f"    error: {r['error']}")
        print(f"\n共 {len(results)} 篇：成功 {ok}，失败 {fail}")

    sys.exit(0 if all(r["ok"] for r in results) else 1)


if __name__ == "__main__":
    main()
