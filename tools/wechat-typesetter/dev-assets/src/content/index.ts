import type { ThemeId } from "../core/types";
import academic from "./academic.md?raw";
import industry from "./industry.md?raw";
import story from "./story.md?raw";
import tech from "./tech.md?raw";

export const DEFAULT_MDS: Record<ThemeId, string> = {
  academic,
  industry,
  tech,
  story,
};
