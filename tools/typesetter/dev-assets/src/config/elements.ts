import type { ThemeId } from "../core/types";

export type DividerStyle = "theme" | "line" | "dot" | "text";

export interface ElementConfig {
  brandName: string;
  qrLabel: string;
  qrImageUrl: string;
  footerContactText: string;
  footerCopyrightTemplate: string;
  footerTaglines: Record<ThemeId, string>;
  ctaDefaultText: string;
  readmoreDefaultText: string;
  noteLabel: string;
  fallbackHint: string;
  divider: {
    style: DividerStyle;
    text: string;
  };
}

export const DEFAULT_ELEMENT_CONFIG: ElementConfig = {
  brandName: "公众号名称",
  qrLabel: "二维码",
  qrImageUrl: "",
  footerContactText: "转载授权请联系",
  footerCopyrightTemplate: "© {year} {brand} · {contact}",
  footerTaglines: {
    academic: "深度 · 前瞻 · 严谨",
    industry: "洞察 · 趋势 · 时效",
    tech: "实践 · 原理 · 工具",
    story: "温度 · 叙事 · 人文",
  },
  ctaDefaultText: "阅读原文",
  readmoreDefaultText: "",
  noteLabel: "提示",
  fallbackHint: "此组件需在公众号后台手动配置",
  divider: {
    style: "theme",
    text: "· · ·",
  },
};

export function mergeElementConfig(partial?: Partial<ElementConfig>): ElementConfig {
  return {
    ...DEFAULT_ELEMENT_CONFIG,
    ...partial,
    footerTaglines: {
      ...DEFAULT_ELEMENT_CONFIG.footerTaglines,
      ...(partial?.footerTaglines || {}),
    },
    divider: {
      ...DEFAULT_ELEMENT_CONFIG.divider,
      ...(partial?.divider || {}),
    },
  };
}
