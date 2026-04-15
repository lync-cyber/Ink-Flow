import type { ThemeId } from "../core/types";
import type { TypographySpec } from "../theme/themes";
import { DEFAULT_SPEC, isThemeId } from "../theme/themes";
import type { ElementConfig } from "./elements";

const KEY = "wechat-typesetter:v2";

export interface PersistedConfig {
  defaultTheme?: ThemeId;
  isDark?: boolean;
  spec?: Partial<TypographySpec>;
  codeHighlight?: boolean;
  imageBorderRadius?: number;
  imageShadow?: boolean;
  elementConfig?: Partial<ElementConfig>;
}

export function loadPersisted(): PersistedConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as PersistedConfig;
    if (o.defaultTheme && !isThemeId(o.defaultTheme)) delete o.defaultTheme;
    return o;
  } catch {
    return {};
  }
}

export function savePersisted(cfg: PersistedConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    /* ignore quota */
  }
}

export function mergeSpec(partial?: Partial<TypographySpec>): TypographySpec {
  return { ...DEFAULT_SPEC, ...partial };
}
