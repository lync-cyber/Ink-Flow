import type { Theme } from "../theme/themes";

export function inlineFormat(text: string, theme: Theme, isDark: boolean): string {
  const c = isDark ? theme.dark : theme.colors;
  let s = text;
  s = s.replace(
    /\*\*(.+?)\*\*/g,
    `<strong style="color:${c.primary};font-weight:600;">$1</strong>`
  );
  s = s.replace(/\*(.+?)\*/g, `<em style="font-style:italic;">$1</em>`);
  s = s.replace(
    /`([^`]+)`/g,
    `<code style="font-family:Consolas,'Courier New','Liberation Mono',monospace;font-size:13px;background:${
      isDark ? "#333" : "#f0f0f0"
    };padding:1px 5px;border-radius:2px;color:${c.primary};">$1</code>`
  );
  s = s.replace(
    /~~(.+?)~~/g,
    `<span style="border-bottom:1px dashed ${c.accent};padding-bottom:1px;">$1</span>`
  );
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" style="color:${c.accent};text-decoration:none;border-bottom:1px solid ${c.accent};">$1</a>`
  );
  s = s.replace(
    /\[(\d+)\]/g,
    `<sup style="color:${c.accent};font-size:10px;">[$1]</sup>`
  );
  return s;
}
