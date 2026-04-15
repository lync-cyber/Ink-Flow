import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "./htmlToMarkdown";

describe("htmlToMarkdown", () => {
  it("converts core html blocks into markdown", () => {
    const html = `
      <article>
        <h1>主标题</h1>
        <p>第一段</p>
        <ul><li>A</li><li>B</li></ul>
        <blockquote>一句引用</blockquote>
        <img src="https://example.com/a.png" alt="图注" />
      </article>
    `;
    const md = htmlToMarkdown(html);
    expect(md).toContain("# 主标题");
    expect(md).toContain("第一段");
    expect(md).toContain("- A");
    expect(md).toContain("> 一句引用");
    expect(md).toContain("![图注](https://example.com/a.png)");
  });
});
