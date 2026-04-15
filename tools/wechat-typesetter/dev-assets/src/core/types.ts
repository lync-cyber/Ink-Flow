export type ThemeId = "academic" | "industry" | "tech" | "story";

/** Frontmatter / runtime meta merged for rendering */
export type ArticleMeta = Record<string, string | string[] | undefined>;

export type MdToken =
  | { type: "heading"; level: number; content: string }
  | { type: "paragraph"; content: string }
  | { type: "blockquote"; content: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "hr" }
  | { type: "image"; alt: string; src: string }
  | { type: "svg"; content: string }
  | { type: "code"; lang: string; content: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "custom"; block: string; content: string };
