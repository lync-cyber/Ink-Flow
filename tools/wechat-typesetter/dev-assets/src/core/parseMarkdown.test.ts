import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./parseMarkdown";

describe("parseMarkdown", () => {
  it("parses core block structures", () => {
    const md = [
      "# 标题",
      "",
      "段落A",
      "",
      "> 引用1",
      "> 引用2",
      "",
      "- 列表1",
      "- 列表2",
      "",
      "1. 有序1",
      "2. 有序2",
      "",
      "```js",
      "const a = 1",
      "```",
    ].join("\n");

    const tokens = parseMarkdown(md);
    expect(tokens[0]).toMatchObject({ type: "heading", level: 1 });
    expect(tokens.find((t) => t.type === "blockquote")).toBeTruthy();
    expect(tokens.find((t) => t.type === "ul")).toBeTruthy();
    expect(tokens.find((t) => t.type === "ol")).toBeTruthy();
    expect(tokens.find((t) => t.type === "code")).toBeTruthy();
  });
});
