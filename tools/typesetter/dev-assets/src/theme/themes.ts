import type { ThemeId } from "../core/types";

export interface ThemeColors {
  primary: string;
  accent: string;
  text: string;
  textSec: string;
  textTer: string;
  bg: string;
  bgDeep: string;
  border: string;
}

export interface ThemeDark {
  bg: string;
  surface: string;
  text: string;
  textSec: string;
  border: string;
  accent: string;
  primary: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  icon: string;
  colors: ThemeColors;
  dark: ThemeDark;
}

export interface TypographySpec {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  pageMargin: number;
}

export const DEFAULT_SPEC: TypographySpec = {
  fontSize: 15,
  lineHeight: 1.75,
  letterSpacing: 1,
  pageMargin: 12,
};

export const THEMES: Record<ThemeId, Theme> = {
  academic: {
    id: "academic",
    name: "学术前沿",
    icon: "📐",
    colors: {
      primary: "#1a5276",
      accent: "#c0782b",
      text: "#3f3f3f",
      textSec: "#595959",
      textTer: "#888888",
      bg: "#e4edf4",
      bgDeep: "#c5d9e8",
      border: "#bfc5cb",
    },
    dark: {
      bg: "#191919",
      surface: "#222222",
      text: "#c3c3c3",
      textSec: "#8a8a8a",
      border: "#3a3a3a",
      accent: "#c0782b",
      primary: "#4a9fd4",
    },
  },
  industry: {
    id: "industry",
    name: "行业趋势",
    icon: "📡",
    colors: {
      primary: "#0e6655",
      accent: "#b9770e",
      text: "#3f3f3f",
      textSec: "#595959",
      textTer: "#888888",
      bg: "#dceee8",
      bgDeep: "#b8ddd3",
      border: "#b5bfba",
    },
    dark: {
      bg: "#191919",
      surface: "#222222",
      text: "#c3c3c3",
      textSec: "#8a8a8a",
      border: "#3a3a3a",
      accent: "#b9770e",
      primary: "#2ecc9a",
    },
  },
  tech: {
    id: "tech",
    name: "技术专题",
    icon: "⚙️",
    colors: {
      primary: "#4a235a",
      accent: "#1a5276",
      text: "#3f3f3f",
      textSec: "#595959",
      textTer: "#888888",
      bg: "#ece3f0",
      bgDeep: "#d4c2dd",
      border: "#b5b5bf",
    },
    dark: {
      bg: "#191919",
      surface: "#222222",
      text: "#c3c3c3",
      textSec: "#8a8a8a",
      border: "#3a3a3a",
      accent: "#5dade2",
      primary: "#bb8fce",
    },
  },
  story: {
    id: "story",
    name: "人物故事",
    icon: "✍️",
    colors: {
      primary: "#784212",
      accent: "#1a5276",
      text: "#3f3f3f",
      textSec: "#6e5c50",
      textTer: "#888888",
      bg: "#f0e0d0",
      bgDeep: "#e8cdb3",
      border: "#c4b5a5",
    },
    dark: {
      bg: "#191919",
      surface: "#222222",
      text: "#c3c3c3",
      textSec: "#8a8a8a",
      border: "#3a3a3a",
      accent: "#5dade2",
      primary: "#e8b87a",
    },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export function isThemeId(id: string): id is ThemeId {
  return id in THEMES;
}
