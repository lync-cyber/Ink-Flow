import { describe, expect, it } from "vitest";
import { sanitizeForWechat } from "./sanitize";

describe("sanitizeForWechat", () => {
  it("removes style/script/id/class and keeps semantic tags", () => {
    const html = '<div id="x" class="y"><style>.a{}</style><script>alert(1)</script><p>ok</p><a href="https://x.com">link</a></div>';
    const out = sanitizeForWechat(html);
    expect(out).not.toContain("<style");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("id=");
    expect(out).not.toContain("class=");
    expect(out).toContain("<p>ok</p>");
    expect(out).toContain("<a href=");
  });
});
