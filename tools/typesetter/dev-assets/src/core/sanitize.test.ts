import { describe, expect, it } from "vitest";
import { sanitizeForWechat } from "./sanitize";

describe("sanitizeForWechat — whitelist DOM sanitizer", () => {
  it("strips <style> and <script> blocks", () => {
    const html = '<div><style>.a{}</style><script>alert(1)</script><p>ok</p></div>';
    const out = sanitizeForWechat(html);
    expect(out).not.toContain("<style");
    expect(out).not.toContain("<script");
    expect(out).toContain("<p>ok</p>");
  });

  it("removes id, class, and on* event handlers", () => {
    const html = '<div id="x" class="y"><img onerror="x()" onload="y()" src="a.png" /></div>';
    const out = sanitizeForWechat(html);
    expect(out).not.toContain("id=");
    expect(out).not.toContain("class=");
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("onload");
    expect(out).toContain('src="a.png"');
  });

  it("keeps <a> on whitelisted domains", () => {
    const html = '<a href="https://mp.weixin.qq.com/s/xxx">link</a>';
    const out = sanitizeForWechat(html);
    expect(out).toContain('href="https://mp.weixin.qq.com/s/xxx"');
  });

  it("downgrades <a> on non-whitelisted hrefs to <span> and keeps children", () => {
    const html = '<a href="https://example.com/blog">外链文字</a>';
    const out = sanitizeForWechat(html);
    expect(out).not.toContain("<a ");
    expect(out).toContain("外链文字");
    expect(out).toContain("<span");
  });

  it("filters forbidden CSS declarations but keeps safe ones", () => {
    const html = '<p style="color:red;position:absolute;font-size:14px;transform:translateY(-50%);">hi</p>';
    const out = sanitizeForWechat(html);
    expect(out).toContain("color:red");
    expect(out).toContain("font-size:14px");
    expect(out).not.toMatch(/position\s*:\s*absolute/);
    expect(out).not.toMatch(/translate[XY]?\([^)]*%/);
  });

  it("drops disallowed CSS properties (e.g. -webkit-foo, random-prop)", () => {
    const html = '<p style="color:red;-webkit-touch-callout:none;random-prop:abc;">x</p>';
    const out = sanitizeForWechat(html);
    expect(out).toContain("color:red");
    expect(out).not.toContain("-webkit-");
    expect(out).not.toContain("random-prop");
  });

  it("replaces unknown tags with <span> preserving children", () => {
    const html = '<unknown>inner<strong>bold</strong></unknown>';
    const out = sanitizeForWechat(html);
    expect(out).not.toContain("<unknown");
    expect(out).toContain("<strong>bold</strong>");
  });

  it("drops url('...') values that would poison the whole style block", () => {
    const html = `<p style="background:url('x.png');color:red;">x</p>`;
    const out = sanitizeForWechat(html);
    // the background decl is dropped, but color survives
    expect(out).not.toContain("url('");
    expect(out).toContain("color:red");
  });
});
