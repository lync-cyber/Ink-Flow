/**
 * 75×75 SVG 缩略图工厂
 *
 * 约定：
 *   - 外层统一 viewBox 0 0 75 75，width/height 75（UI 显示时可再次等比缩放）
 *   - 所有颜色以参数传入，避免在缩略图里硬编码（方便主题化时用主题色预览）
 *   - 不用 <defs> / id / style（未来若要嵌入 markdown 产出时仍安全）
 *   - 每个缩略图 ≤ 400 字符，避免组件库总体积失控
 *
 * 风格化原则：让每种骨架在 75×75 里"一眼认出自己是谁"——
 *   accent-bar → 左边粗竖条
 *   pill-tag → 顶边悬浮小条
 *   terminal → 顶部三圆点条
 *   frame-brackets → 四角 L
 *   ledger → 左右双色格
 * 缩略图不是主题预览——它只传达"骨架身份"。
 */

export interface ThumbArgs {
  accent?: string
  soft?: string
  text?: string
}

const DEFAULTS = { accent: '#2d6fdd', soft: '#eef4ff', text: '#6a737d' }

function merge(a: ThumbArgs): Required<ThumbArgs> {
  return { ...DEFAULTS, ...a }
}

function svg(inner: string): string {
  return (
    '<svg viewBox="0 0 75 75" width="75" height="75" xmlns="http://www.w3.org/2000/svg">' +
    inner +
    '</svg>'
  )
}

export const thumb = {
  accentBar: (a: ThumbArgs = {}) => {
    const { accent, soft } = merge(a)
    return svg(
      `<rect x="6" y="14" width="63" height="47" rx="3" fill="${soft}"/>` +
      `<rect x="6" y="14" width="3" height="47" fill="${accent}"/>` +
      `<rect x="16" y="22" width="30" height="3" fill="${accent}"/>` +
      `<rect x="16" y="32" width="46" height="2" fill="#c0c6cf"/>` +
      `<rect x="16" y="39" width="40" height="2" fill="#c0c6cf"/>` +
      `<rect x="16" y="46" width="32" height="2" fill="#c0c6cf"/>`,
    )
  },
  pillTag: (a: ThumbArgs = {}) => {
    const { accent, soft } = merge(a)
    return svg(
      `<rect x="6" y="20" width="63" height="45" rx="4" fill="${soft}" stroke="${accent}" stroke-width="1"/>` +
      `<rect x="14" y="14" width="28" height="14" rx="7" fill="${accent}"/>` +
      `<rect x="14" y="38" width="46" height="2" fill="#c0c6cf"/>` +
      `<rect x="14" y="46" width="40" height="2" fill="#c0c6cf"/>` +
      `<rect x="14" y="54" width="32" height="2" fill="#c0c6cf"/>`,
    )
  },
  ticketNotch: (a: ThumbArgs = {}) => {
    const { accent, soft } = merge(a)
    return svg(
      `<rect x="8" y="14" width="59" height="47" fill="${soft}" stroke="${accent}" stroke-width="1" stroke-dasharray="3 2"/>` +
      `<rect x="8" y="14" width="2" height="47" fill="${accent}"/>` +
      `<rect x="65" y="14" width="2" height="47" fill="${accent}"/>` +
      `<circle cx="28" cy="22" r="1.4" fill="${accent}"/>` +
      `<circle cx="37" cy="22" r="1.4" fill="${accent}"/>` +
      `<circle cx="46" cy="22" r="1.4" fill="${accent}"/>` +
      `<rect x="17" y="36" width="41" height="2" fill="#c0c6cf"/>` +
      `<rect x="17" y="44" width="35" height="2" fill="#c0c6cf"/>`,
    )
  },
  cardShadow: (a: ThumbArgs = {}) => {
    const { accent } = merge(a)
    return svg(
      `<rect x="8" y="16" width="59" height="47" rx="4" fill="#fafafa"/>` +
      `<rect x="8" y="16" width="59" height="2" fill="${accent}"/>` +
      `<rect x="8" y="63" width="59" height="2" fill="rgba(0,0,0,0.08)"/>` +
      `<rect x="16" y="26" width="30" height="3" fill="${accent}"/>` +
      `<rect x="16" y="36" width="42" height="2" fill="#c0c6cf"/>` +
      `<rect x="16" y="44" width="36" height="2" fill="#c0c6cf"/>`,
    )
  },
  minimalUnderline: (a: ThumbArgs = {}) => {
    const { accent } = merge(a)
    return svg(
      `<rect x="14" y="20" width="24" height="3" fill="${accent}"/>` +
      `<rect x="14" y="26" width="2" height="30" fill="${accent}"/>` +
      `<rect x="20" y="32" width="40" height="2" fill="#c0c6cf"/>` +
      `<rect x="20" y="40" width="34" height="2" fill="#c0c6cf"/>` +
      `<rect x="20" y="48" width="28" height="2" fill="#c0c6cf"/>`,
    )
  },
  terminal: () =>
    svg(
      `<rect x="6" y="14" width="63" height="47" rx="4" fill="#1f2937"/>` +
      `<rect x="6" y="14" width="63" height="11" fill="#2d3748"/>` +
      `<circle cx="12" cy="20" r="1.8" fill="#ff5f56"/>` +
      `<circle cx="18" cy="20" r="1.8" fill="#ffbd2e"/>` +
      `<circle cx="24" cy="20" r="1.8" fill="#27c93f"/>` +
      `<rect x="12" y="34" width="36" height="2" fill="#9ca3af"/>` +
      `<rect x="12" y="42" width="46" height="2" fill="#9ca3af"/>` +
      `<rect x="12" y="50" width="28" height="2" fill="#9ca3af"/>`,
    ),
  quoteClassic: (a: ThumbArgs = {}) => {
    const { accent, soft } = merge(a)
    return svg(
      `<rect x="6" y="14" width="63" height="47" rx="5" fill="${soft}"/>` +
      `<text x="14" y="35" font-size="22" fill="${accent}" opacity="0.4">&#8220;</text>` +
      `<rect x="16" y="40" width="42" height="2" fill="#c0c6cf"/>` +
      `<rect x="16" y="48" width="34" height="2" fill="#c0c6cf"/>`,
    )
  },
  quoteMagazine: (a: ThumbArgs = {}) => {
    const { accent } = merge(a)
    return svg(
      `<rect x="8" y="16" width="59" height="2" fill="${accent}"/>` +
      `<rect x="8" y="20" width="59" height="2" fill="${accent}"/>` +
      `<rect x="8" y="58" width="59" height="2" fill="${accent}"/>` +
      `<rect x="8" y="62" width="59" height="2" fill="${accent}"/>` +
      `<text x="16" y="42" font-size="20" font-style="italic" fill="${accent}" opacity="0.3">A</text>` +
      `<rect x="28" y="32" width="32" height="2" fill="#c0c6cf"/>` +
      `<rect x="28" y="40" width="26" height="2" fill="#c0c6cf"/>` +
      `<rect x="28" y="48" width="30" height="2" fill="#c0c6cf"/>`,
    )
  },
  quoteColumnRule: (a: ThumbArgs = {}) => {
    const { accent } = merge(a)
    return svg(
      `<rect x="12" y="18" width="2" height="40" fill="${accent}"/>` +
      `<rect x="61" y="18" width="2" height="40" fill="${accent}"/>` +
      `<rect x="22" y="30" width="32" height="2" fill="#c0c6cf"/>` +
      `<rect x="22" y="38" width="30" height="2" fill="#c0c6cf"/>` +
      `<rect x="22" y="46" width="26" height="2" fill="#c0c6cf"/>`,
    )
  },
  quoteFrameBrackets: (a: ThumbArgs = {}) => {
    const { accent } = merge(a)
    return svg(
      `<path d="M10,14 L10,10 L16,10 M59,10 L65,10 L65,14 M10,61 L10,65 L16,65 M59,65 L65,65 L65,61" stroke="${accent}" stroke-width="1.5" fill="none"/>` +
      `<rect x="22" y="30" width="32" height="2" fill="#c0c6cf"/>` +
      `<rect x="22" y="38" width="30" height="2" fill="#c0c6cf"/>` +
      `<rect x="22" y="46" width="26" height="2" fill="#c0c6cf"/>`,
    )
  },
  compareColumn: (a: ThumbArgs = {}) => {
    const { soft } = merge(a)
    return svg(
      `<rect x="6" y="16" width="29" height="45" rx="3" fill="${soft}"/>` +
      `<rect x="40" y="16" width="29" height="45" rx="3" fill="${soft}"/>` +
      `<rect x="12" y="22" width="15" height="2" fill="#1a8450"/>` +
      `<rect x="12" y="30" width="18" height="2" fill="#c0c6cf"/>` +
      `<rect x="12" y="36" width="14" height="2" fill="#c0c6cf"/>` +
      `<rect x="46" y="22" width="15" height="2" fill="#b42318"/>` +
      `<rect x="46" y="30" width="18" height="2" fill="#c0c6cf"/>` +
      `<rect x="46" y="36" width="14" height="2" fill="#c0c6cf"/>`,
    )
  },
  compareStacked: () =>
    svg(
      `<rect x="6" y="14" width="63" height="20" rx="3" fill="#eef7f0"/>` +
      `<rect x="6" y="14" width="3" height="20" fill="#1a8450"/>` +
      `<rect x="14" y="20" width="28" height="2" fill="#1a8450"/>` +
      `<rect x="14" y="26" width="40" height="2" fill="#c0c6cf"/>` +
      `<rect x="6" y="41" width="63" height="20" rx="3" fill="#fdecea"/>` +
      `<rect x="6" y="41" width="3" height="20" fill="#b42318"/>` +
      `<rect x="14" y="47" width="28" height="2" fill="#b42318"/>` +
      `<rect x="14" y="53" width="36" height="2" fill="#c0c6cf"/>`,
    ),
  compareLedger: () =>
    svg(
      `<rect x="8" y="16" width="59" height="43" rx="3" fill="#fff" stroke="#c0c6cf"/>` +
      `<rect x="8" y="16" width="30" height="43" fill="#eef7f0"/>` +
      `<rect x="38" y="16" width="29" height="43" fill="#fdecea"/>` +
      `<rect x="14" y="24" width="16" height="2" fill="#1a8450"/>` +
      `<rect x="14" y="32" width="18" height="2" fill="#c0c6cf"/>` +
      `<rect x="44" y="24" width="16" height="2" fill="#b42318"/>` +
      `<rect x="44" y="32" width="18" height="2" fill="#c0c6cf"/>`,
    ),
  stepsCircle: (a: ThumbArgs = {}) => {
    const { accent } = merge(a)
    return svg(
      `<circle cx="14" cy="22" r="5" fill="${accent}"/>` +
      `<text x="14" y="25" text-anchor="middle" font-size="7" font-weight="700" fill="#fff">1</text>` +
      `<rect x="24" y="21" width="34" height="2" fill="#c0c6cf"/>` +
      `<circle cx="14" cy="42" r="5" fill="${accent}"/>` +
      `<text x="14" y="45" text-anchor="middle" font-size="7" font-weight="700" fill="#fff">2</text>` +
      `<rect x="24" y="41" width="30" height="2" fill="#c0c6cf"/>`,
    )
  },
  stepsRibbon: (a: ThumbArgs = {}) => {
    const { accent } = merge(a)
    return svg(
      `<rect x="10" y="14" width="3" height="47" fill="${accent}"/>` +
      `<rect x="7" y="20" width="22" height="10" rx="5" fill="${accent}"/>` +
      `<rect x="7" y="36" width="22" height="10" rx="5" fill="${accent}"/>` +
      `<rect x="34" y="24" width="28" height="2" fill="#c0c6cf"/>` +
      `<rect x="34" y="40" width="28" height="2" fill="#c0c6cf"/>`,
    )
  },
  stepsTimeline: (a: ThumbArgs = {}) => {
    const { accent } = merge(a)
    return svg(
      `<line x1="14" y1="14" x2="14" y2="61" stroke="${accent}" stroke-width="2" stroke-dasharray="2 2"/>` +
      `<circle cx="14" cy="22" r="3" fill="${accent}"/>` +
      `<circle cx="14" cy="42" r="3" fill="${accent}"/>` +
      `<rect x="22" y="21" width="36" height="2" fill="#c0c6cf"/>` +
      `<rect x="22" y="41" width="32" height="2" fill="#c0c6cf"/>`,
    )
  },
  dividerWave: () =>
    svg(
      `<path d="M4,38 Q12,30 22,38 T40,38 T58,38 T72,38" fill="none" stroke="#c0c6cf" stroke-width="1.5"/>`,
    ),
  dividerDots: () =>
    svg(
      [18, 30, 42, 54]
        .map((cx) => `<circle cx="${cx}" cy="37" r="2" fill="#c0c6cf"/>`)
        .join(''),
    ),
  dividerFlower: () =>
    svg(
      `<line x1="6" y1="37" x2="28" y2="37" stroke="#c0c6cf"/>` +
      `<line x1="46" y1="37" x2="68" y2="37" stroke="#c0c6cf"/>` +
      `<path d="M37,30 L41,37 L37,44 L33,37 Z" fill="#c0c6cf"/>`,
    ),
  dividerRule: () => svg(`<rect x="6" y="36" width="63" height="1" fill="#c0c6cf"/>`),
  dividerGlyph: (a: ThumbArgs = {}) => {
    const { accent } = merge(a)
    return svg(
      `<line x1="6" y1="37" x2="28" y2="37" stroke="#c0c6cf"/>` +
      `<line x1="46" y1="37" x2="68" y2="37" stroke="#c0c6cf"/>` +
      `<text x="37" y="42" text-anchor="middle" font-size="11" fill="${accent}">&#10086;</text>`,
    )
  },
  sectionBordered: (a: ThumbArgs = {}) => {
    const { accent } = merge(a)
    return svg(
      `<rect x="10" y="20" width="30" height="5" fill="${accent}"/>` +
      `<rect x="10" y="30" width="55" height="2" fill="${accent}"/>` +
      `<rect x="10" y="40" width="40" height="2" fill="#c0c6cf"/>` +
      `<rect x="10" y="48" width="48" height="2" fill="#c0c6cf"/>`,
    )
  },
  sectionCornered: (a: ThumbArgs = {}) => {
    const { accent } = merge(a)
    return svg(
      `<path d="M8,8 L26,8 L26,14 L14,14 L14,28 L8,28 Z" fill="${accent}"/>` +
      `<rect x="30" y="16" width="35" height="5" fill="${accent}"/>` +
      `<rect x="10" y="38" width="55" height="2" fill="#c0c6cf"/>` +
      `<rect x="10" y="48" width="48" height="2" fill="#c0c6cf"/>`,
    )
  },
  intro: () =>
    svg(
      `<rect x="6" y="14" width="63" height="47" rx="4" fill="#f7f8fa"/>` +
      `<rect x="6" y="14" width="2" height="47" fill="#2d6fdd"/>` +
      `<rect x="14" y="24" width="40" height="2" fill="#c0c6cf"/>` +
      `<rect x="14" y="32" width="46" height="2" fill="#c0c6cf"/>` +
      `<rect x="14" y="40" width="34" height="2" fill="#c0c6cf"/>`,
    ),
  author: () =>
    svg(
      `<rect x="6" y="22" width="63" height="32" rx="4" fill="#f7f8fa"/>` +
      `<circle cx="16" cy="38" r="6" fill="#c0c6cf"/>` +
      `<rect x="28" y="32" width="24" height="3" fill="#1f2328"/>` +
      `<rect x="28" y="40" width="34" height="2" fill="#c0c6cf"/>`,
    ),
  footerCTA: () =>
    svg(
      `<rect x="6" y="16" width="63" height="43" rx="4" fill="#f7f8fa"/>` +
      `<rect x="20" y="24" width="34" height="3" fill="#1f2328"/>` +
      `<rect x="20" y="32" width="34" height="2" fill="#c0c6cf"/>` +
      `<rect x="26" y="42" width="22" height="10" rx="5" fill="#2d6fdd"/>`,
    ),
  highlight: () =>
    svg(
      `<rect x="6" y="22" width="63" height="33" rx="3" fill="#fff3b0"/>` +
      `<rect x="14" y="30" width="46" height="2" fill="#856404"/>` +
      `<rect x="14" y="38" width="38" height="2" fill="#856404"/>`,
    ),
}
