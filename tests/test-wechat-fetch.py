#!/usr/bin/env python3
"""test-wechat-fetch.py — 离线验证 .claude/skills/style-learning/scripts/wechat.py 的解析链路

不依赖网络：读取 tests/fixtures/wechat-sample.html（模拟真实 WeChat DOM），
直接走 html_to_markdown → save_article 路径，校验：

  1. 元数据（title、作者、公众号 ID、publish_time）是否正确提取
  2. #js_content 正文转换为合法 Markdown（H2/加粗/列表/代码块/表格/引用）
  3. 懒加载 img 的 data-src 被正确识别
  4. 关注卡、二维码、分享栏等噪声被剥离
  5. visual_metrics 数值合理（paragraph_count / chars_per_paragraph_avg 等）
  6. 产出文件的 frontmatter 包含 visual_metrics 字段供 style-analyzer 消费
"""

from __future__ import annotations
import io
import json
import sys
import tempfile
from pathlib import Path

# Windows 控制台默认 GBK，强制 UTF-8 以输出 ✓/✗ 等符号
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# 允许从 .claude/skills/style-learning/scripts 导入
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / ".claude" / "skills" / "style-learning" / "scripts"))

from wechat import html_to_markdown, save_article  # noqa: E402

FIXTURE = ROOT / "tests" / "fixtures" / "wechat-sample.html"
SOURCE_URL = (
    "https://mp.weixin.qq.com/s?__biz=MzI3MTA0MTk1MA==&mid=2652482718"
    "&idx=2&sn=e0229fbcf11fe3312aa765ad614825d9"
)

failures: list[str] = []
passed = 0


def check(cond: bool, msg: str):
    global passed
    status = "✓" if cond else "✗"
    print(f"  {status} {msg}")
    if cond:
        passed += 1
    else:
        failures.append(msg)


def main():
    assert FIXTURE.exists(), f"fixture 缺失: {FIXTURE}"
    html = FIXTURE.read_text(encoding="utf-8")

    md, meta, visual = html_to_markdown(html, SOURCE_URL)

    print("\n=== 1. 元数据提取 ===")
    check(meta.get("title") == "大模型应用开发的 7 个实战陷阱",
          f"title = {meta.get('title')!r}")
    check(meta.get("author") == "算法周刊", f"author = {meta.get('author')!r}")
    check(meta.get("wechat_id") == "Algorithm_Weekly",
          f"wechat_id = {meta.get('wechat_id')!r}")
    check("2025-04-16" in (meta.get("publish_time") or ""),
          f"publish_time = {meta.get('publish_time')!r}")
    check(meta.get("source_url") == SOURCE_URL, "source_url 正确回写")
    check(meta.get("platform") == "wechat", "platform = wechat")

    print("\n=== 2. Markdown 结构 ===")
    check("# 大模型应用开发的 7 个实战陷阱" not in md or md.count("## ") >= 5,
          "H2 标题（章节标题）被识别")
    check(md.count("## ") == 7, f"7 个 H2 小节都在（实际 {md.count('## ')}）")
    check("**真正难的是生产化**" in md, "加粗被保留")
    check("![召回率对比图](https://mmbiz.qpic.cn/" in md,
          "懒加载图 data-src → Markdown img")
    check("> " in md, "blockquote 被识别为 > 引用")
    check("```" in md and "def eval_answer" in md, "代码块被包裹")
    check("- 预先压缩" in md or "- 预先压缩 — 先用小模型做摘要" in md,
          "无序列表被识别")

    print("\n=== 3. 噪声剥离 ===")
    check("二维码" not in md, "qr_code_pc 二维码被剥离")
    check("分享 收藏 在看 点赞" not in md, "rich_media_tool 工具栏被剥离")
    check("赞赏区" not in md, "reward_area 被剥离（在 #js_content 外，本就不会进来）")
    check("visibility: hidden" not in md, "inline style 不应进 Markdown")

    print("\n=== 4. 视觉指标 ===")
    check(visual.get("paragraph_count", 0) >= 10,
          f"paragraph_count = {visual.get('paragraph_count')}（应 ≥10）")
    check(visual.get("heading_count", 0) == 7,
          f"heading_count = {visual.get('heading_count')}（7 个 H2）")
    check(visual.get("image_count", 0) == 1, f"image_count = {visual.get('image_count')}")
    check(visual.get("blockquote_count", 0) == 1,
          f"blockquote_count = {visual.get('blockquote_count')}")
    check(visual.get("char_count", 0) > 400,
          f"char_count = {visual.get('char_count')}（应 >400）")
    check(visual.get("chars_per_paragraph_avg", 0) > 20,
          f"chars_per_paragraph_avg = {visual.get('chars_per_paragraph_avg')}")
    top = visual.get("top_colors") or []
    hexes = {c["hex"] for c in top}
    check("#0f6ab4" in hexes, f"主色 #0f6ab4 出现在 top_colors: {hexes}")
    check("#e74c3c" in hexes, f"强调色 #e74c3c 出现在 top_colors: {hexes}")

    print("\n=== 5. 文件落地 ===")
    with tempfile.TemporaryDirectory() as td:
        path = save_article(SOURCE_URL, md, meta, visual, Path(td))
        text = path.read_text(encoding="utf-8")
        check(path.name.startswith("wechat-"), f"文件名前缀 wechat-: {path.name}")
        check(path.name.endswith(".md"), "后缀 .md")
        check(text.startswith("---\n"), "frontmatter 开头")
        check("visual_metrics:" in text, "frontmatter 包含 visual_metrics 段")
        check("top_colors:" in text, "frontmatter 包含 top_colors 段")
        check("source_url:" in text, "frontmatter 包含 source_url")
        check("content_hash:" in text, "frontmatter 包含 content_hash")
        # 正文应在 frontmatter 后
        body_start = text.index("---\n", 4) + 4
        body = text[body_start:].strip()
        check(body.startswith("##") or "## 一、" in body,
              "正文以 H2 起始（H1 保留在 frontmatter title）")

    print()
    if failures:
        print(f"❌ {len(failures)} 项未通过:")
        for f in failures:
            print(f"   - {f}")
        sys.exit(1)
    else:
        print(f"✅ 全部 {passed} 项检查通过")
        print("   Markdown 长度:", len(md))
        print("   Visual metrics:", json.dumps(visual, ensure_ascii=False))
        sys.exit(0)


if __name__ == "__main__":
    main()
