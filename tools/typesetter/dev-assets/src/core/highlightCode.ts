const KEYWORDS = [
  "import",
  "from",
  "as",
  "def",
  "class",
  "return",
  "if",
  "else",
  "for",
  "in",
  "while",
  "try",
  "except",
  "with",
  "yield",
  "lambda",
  "not",
  "and",
  "or",
  "is",
  "None",
  "True",
  "False",
  "const",
  "let",
  "var",
  "function",
  "export",
  "default",
];

export function highlightCode(escaped: string, _lang?: string): string {
  let result = escaped;
  result = result.replace(/(#[^\n]*)/g, '<span style="color:#7c8ba1;">$1</span>');
  result = result.replace(
    /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|"[^"]*?"|'[^']*?')/g,
    '<span style="color:#c3e88d;">$1</span>'
  );
  const kwPattern = new RegExp(`\\b(${KEYWORDS.join("|")})\\b`, "g");
  result = result.replace(kwPattern, '<span style="color:#c792ea;">$1</span>');
  result = result.replace(/\b([a-zA-Z_]\w*)\(/g, '<span style="color:#82aaff;">$1</span>(');
  return result;
}
