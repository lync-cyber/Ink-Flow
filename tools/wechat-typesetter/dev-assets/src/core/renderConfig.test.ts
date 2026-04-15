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

  it("renders footer qr image when qrImageUrl is configured", () => {
    const md = ":::footer\n欢迎关注\n:::";
    const html = buildFragmentHtml(md, THEMES.story, DEFAULT_SPEC, false, undefined, {
      elementConfig: {
        qrLabel: "扫码关注",
        qrImageUrl: "./qrcode.png",
      },
    });
    expect(html).toContain('src="./qrcode.png"');
    expect(html).toContain("onerror=");
    expect(html).toContain("扫码关注");
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
