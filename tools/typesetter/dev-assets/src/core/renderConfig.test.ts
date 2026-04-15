import { describe, expect, it } from "vitest";
import { buildFragmentHtml } from "./pipeline";
import { DEFAULT_SPEC, THEMES } from "../theme/themes";

describe("render config integration", () => {
  it("replaces placeholders with element config values", () => {
    const md = "你好，{{brand.name}}";
    const html = buildFragmentHtml(md, THEMES.academic, DEFAULT_SPEC, false, undefined, {
      elementConfig: {
        brandName: "测试公众号",
      },
    });
    expect(html).toContain("测试公众号");
  });

  it("uses configured divider style", () => {
    const md = "***";
    const html = buildFragmentHtml(md, THEMES.tech, DEFAULT_SPEC, false, undefined, {
      elementConfig: {
        divider: {
          style: "text",
          text: "—— 分割 ——",
        },
      },
    });
    expect(html).toContain("—— 分割 ——");
  });

  it("renders footer with configured brand and qr label", () => {
    const md = ":::footer\n欢迎关注\n:::";
    const html = buildFragmentHtml(md, THEMES.story, DEFAULT_SPEC, false, undefined, {
      elementConfig: {
        brandName: "品牌号",
        qrLabel: "扫码关注",
      },
    });
    expect(html).toContain("品牌号");
    expect(html).toContain("扫码关注");
  });

  it("renders footer qr image when qrImageUrl is configured (single-column, no onerror)", () => {
    const md = ":::footer\n欢迎关注\n:::";
    const html = buildFragmentHtml(md, THEMES.story, DEFAULT_SPEC, false, undefined, {
      elementConfig: {
        qrLabel: "扫码关注",
        qrImageUrl: "./qrcode.png",
      },
    });
    expect(html).toContain('src="./qrcode.png"');
    // v2: onerror is banned by sanitize; footer must not emit it
    expect(html).not.toContain("onerror");
    // v2 footer is block-level text-align:center (no flex split column)
    expect(html).not.toMatch(/display\s*:\s*flex/);
  });

  it("wraps CTA in <a href> when ctaUrl is whitelisted (mp.weixin.qq.com)", () => {
    const md = ":::cta\n查看完整报告\nhttps://mp.weixin.qq.com/s/abc123\n立即阅读\n:::";
    const html = buildFragmentHtml(md, THEMES.academic, DEFAULT_SPEC, false);
    expect(html).toContain('<a href="https://mp.weixin.qq.com/s/abc123"');
    expect(html).toContain("立即阅读");
    // No 阅读原文 hint when link is clickable
    expect(html).not.toContain("点击左下角");
  });

  it("emits 阅读原文 hint when CTA url is external (non-whitelisted)", () => {
    const md = ":::cta\n查看完整报告\nhttps://example.com/report\n立即阅读\n:::";
    const html = buildFragmentHtml(md, THEMES.academic, DEFAULT_SPEC, false);
    expect(html).not.toContain('<a href="https://example.com');
    expect(html).toContain("点击左下角");
    expect(html).toContain("阅读原文");
  });

  it("divider is centered via text-align (no flex-dependent layout)", () => {
    const md = "# title\n\nbefore\n\n***\n\nafter";
    const html = buildFragmentHtml(md, THEMES.academic, DEFAULT_SPEC, false);
    // The <hr> renders with text-align:center; flex is not required for centering
    expect(html).toMatch(/text-align\s*:\s*center/);
  });

  it("applies frontmatter element overrides over global config", () => {
    const md = `---
element.brandName: frontmatter号
element.qrLabel: front二维码
---
:::footer
尾注
:::`;
    const html = buildFragmentHtml(md, THEMES.story, DEFAULT_SPEC, false, undefined, {
      elementConfig: {
        brandName: "全局号",
        qrLabel: "全局二维码",
      },
    });
    expect(html).toContain("frontmatter号");
    expect(html).toContain("front二维码");
    expect(html).not.toContain("全局二维码");
  });
});
