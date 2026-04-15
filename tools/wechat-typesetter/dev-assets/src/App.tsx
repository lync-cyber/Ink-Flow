import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MDS } from "./content";
import { loadPersisted, mergeSpec, savePersisted, type PersistedConfig } from "./config/storage";
import { DEFAULT_ELEMENT_CONFIG, mergeElementConfig, type ElementConfig } from "./config/elements";
import { buildFragmentHtml, parseArticle, wrapArticleHtml } from "./core/pipeline";
import { sanitizeForWechat } from "./core/sanitize";
import { svgToPngDataUrl } from "./core/svgToPng";
import { htmlToMarkdown } from "./core/htmlToMarkdown";
import { isThemeId, THEME_IDS, THEMES, type TypographySpec } from "./theme/themes";
import type { ThemeId } from "./core/types";

interface MermaidApi {
  render: (id: string, code: string) => Promise<{ svg: string }>;
}

declare global {
  interface Window {
    mermaid?: MermaidApi;
  }
}

function detectInputKind(name: string, text: string): "markdown" | "html" | "text" {
  const lower = name.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  const t = text.trim();
  if (t.startsWith("<") && /<\/?[a-z][\s\S]*>/i.test(t)) return "html";
  if (/^#{1,6}\s+/m.test(text) || /^```/m.test(text) || /^\s*[-*+]\s+/m.test(text)) return "markdown";
  return "text";
}

function plainTextToMarkdown(text: string): string {
  return text
    .split(/\r?\n\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");
}

type UiLang = "zh" | "en";

const I18N = {
  zh: {
    importFile: "导入文件",
    hintsOn: "提示开",
    hintsOff: "提示关",
    light: "浅色",
    dark: "深色",
    copyRichText: "复制富文本",
    copiedRichText: "已复制富文本",
    copiedHtmlSource: "已复制 HTML 源码",
    font: "字号",
    line: "行高",
    space: "字距",
    margin: "边距",
    codeHighlight: "代码高亮",
    imgRadius: "图片圆角",
    imgShadow: "图片阴影",
    accountName: "公众号名",
    footerPlaceholder: "用于文末署名",
    resetSpec: "重置参数",
    elementConfig: "元素配置",
    close: "关闭",
    dividerStyle: "分割线样式",
    dividerText: "分割线文字",
    footerContact: "文末联系文案",
    qrImageUrl: "二维码图片路径",
    footerCopyright: "版权模板",
    ctaDefault: "CTA默认按钮",
    readmoreDefault: "Readmore默认文案",
    noteLabel: "提示标签",
    fallbackHint: "扩展块兜底提示",
    exportConfig: "导出配置JSON",
    importConfig: "导入配置JSON",
    importConfigFailed: "配置导入失败，请检查 JSON 格式",
    importConfigSuccess: "配置导入成功",
    resetElementConfig: "恢复默认配置",
    loadSidecarConfig: "加载同目录配置",
    dividerTheme: "跟随主题",
    dividerLine: "直线",
    dividerDot: "圆点",
    dividerTextStyle: "文本",
    inputTitle: "输入（Markdown / HTML / Text）",
    chars: "字符",
    preview: "预览",
    darkPreview: "深色预览",
    phonePreview: "微信公众号文章预览",
    help1: "#/##/### 标题",
    help2: "> 引用",
    help3: "- 和 1. 列表",
    help4: "``` 代码块",
    help5: "| 表格",
    help6: ":::card / :::cta / :::footer 扩展块",
    help7: "复制内容已做微信兼容清洗",
    themeAcademic: "学术前沿",
    themeIndustry: "行业趋势",
    themeTech: "技术专题",
    themeStory: "人物故事",
    language: "语言",
    langZh: "中",
    langEn: "EN",
  },
  en: {
    importFile: "Import file",
    hintsOn: "Hints on",
    hintsOff: "Hints off",
    light: "Light",
    dark: "Dark",
    copyRichText: "Copy rich text",
    copiedRichText: "Copied rich text",
    copiedHtmlSource: "Copied HTML source",
    font: "Font",
    line: "Line",
    space: "Space",
    margin: "Margin",
    codeHighlight: "Code highlight",
    imgRadius: "Image radius",
    imgShadow: "Image shadow",
    accountName: "Account name",
    footerPlaceholder: "used in footer",
    resetSpec: "Reset spec",
    elementConfig: "Elements",
    close: "Close",
    dividerStyle: "Divider style",
    dividerText: "Divider text",
    footerContact: "Footer contact",
    qrImageUrl: "QR image path",
    footerCopyright: "Copyright template",
    ctaDefault: "CTA default button",
    readmoreDefault: "Readmore default text",
    noteLabel: "Note label",
    fallbackHint: "Fallback hint",
    exportConfig: "Export config JSON",
    importConfig: "Import config JSON",
    importConfigFailed: "Import failed: invalid JSON",
    importConfigSuccess: "Config imported",
    resetElementConfig: "Reset element config",
    loadSidecarConfig: "Load sibling config",
    dividerTheme: "Follow theme",
    dividerLine: "Line",
    dividerDot: "Dots",
    dividerTextStyle: "Text",
    inputTitle: "Input (Markdown / HTML / Text)",
    chars: "chars",
    preview: "Preview",
    darkPreview: "Dark preview",
    phonePreview: "WeChat article preview",
    help1: "#/##/### headings",
    help2: "> quote",
    help3: "- and 1. lists",
    help4: "``` code block",
    help5: "| table",
    help6: ":::card / :::cta / :::footer custom blocks",
    help7: "Copied content is sanitized for WeChat editor",
    themeAcademic: "Academic Frontier",
    themeIndustry: "Industry Trends",
    themeTech: "Tech Focus",
    themeStory: "Storytelling",
    language: "Language",
    langZh: "中",
    langEn: "EN",
  },
} as const;

export function App() {
  const persisted = useMemo(() => loadPersisted(), []);

  const [themeId, setThemeId] = useState<ThemeId>(persisted.defaultTheme ?? "academic");
  const [md, setMd] = useState<string>(DEFAULT_MDS[persisted.defaultTheme ?? "academic"]);
  const [isDark, setIsDark] = useState<boolean>(persisted.isDark ?? false);
  const [spec, setSpec] = useState<TypographySpec>(mergeSpec(persisted.spec));
  const [showSource, setShowSource] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  const [showDevHints, setShowDevHints] = useState(false);
  const [userEdited, setUserEdited] = useState(false);
  const [codeHighlight, setCodeHighlight] = useState<boolean>(persisted.codeHighlight ?? true);
  const [imageBorderRadius, setImageBorderRadius] = useState<number>(persisted.imageBorderRadius ?? 2);
  const [imageShadow, setImageShadow] = useState<boolean>(persisted.imageShadow ?? true);
  const [elementConfig, setElementConfig] = useState(() => mergeElementConfig(persisted.elementConfig));
  const [lang, setLang] = useState<UiLang>(() => {
    const saved = localStorage.getItem("wechat-typesetter-ui-lang");
    return saved === "en" ? "en" : "zh";
  });
  const [showElementConfig, setShowElementConfig] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const elementConfigInputRef = useRef<HTMLInputElement>(null);

  const theme = THEMES[themeId];
  const i18n = I18N[lang];
  const themeName = useMemo(() => {
    if (lang === "zh") return theme.name;
    const map: Record<ThemeId, string> = {
      academic: I18N.en.themeAcademic,
      industry: I18N.en.themeIndustry,
      tech: I18N.en.themeTech,
      story: I18N.en.themeStory,
    };
    return map[themeId];
  }, [lang, theme.name, themeId]);

  useEffect(() => {
    const next: PersistedConfig = {
      defaultTheme: themeId,
      isDark,
      spec,
      codeHighlight,
      imageBorderRadius,
      imageShadow,
      elementConfig,
    };
    savePersisted(next);
  }, [themeId, isDark, spec, codeHighlight, imageBorderRadius, imageShadow, elementConfig]);

  useEffect(() => {
    localStorage.setItem("wechat-typesetter-ui-lang", lang);
  }, [lang]);

  const handleEditorScroll = useCallback(() => {
    if (syncingRef.current) return;
    const ed = editorRef.current;
    const pv = previewScrollRef.current;
    if (!ed || !pv) return;
    const edMax = ed.scrollHeight - ed.clientHeight;
    if (edMax <= 0) return;
    const ratio = ed.scrollTop / edMax;
    const pvMax = pv.scrollHeight - pv.clientHeight;
    syncingRef.current = true;
    pv.scrollTop = ratio * pvMax;
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, []);

  const handlePreviewScroll = useCallback(() => {
    if (syncingRef.current) return;
    const ed = editorRef.current;
    const pv = previewScrollRef.current;
    if (!ed || !pv) return;
    const pvMax = pv.scrollHeight - pv.clientHeight;
    if (pvMax <= 0) return;
    const ratio = pv.scrollTop / pvMax;
    const edMax = ed.scrollHeight - ed.clientHeight;
    syncingRef.current = true;
    ed.scrollTop = ratio * edMax;
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, []);

  const handleThemeChange = useCallback(
    (nextId: ThemeId) => {
      setThemeId(nextId);
      if (!userEdited) {
        setMd(DEFAULT_MDS[nextId]);
      }
    },
    [userEdited]
  );

  const handleMdChange = useCallback(
    (value: string) => {
      setMd(value);
      setUserEdited(true);
      const parsed = parseArticle(value);
      const column = typeof parsed.meta.column === "string" ? parsed.meta.column : "";
      if (column && isThemeId(column) && column !== themeId) {
        setThemeId(column);
      }
    },
    [themeId]
  );

  const handleImportFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      const kind = detectInputKind(file.name, text);
      if (kind === "html") {
        handleMdChange(htmlToMarkdown(text));
      } else if (kind === "text") {
        handleMdChange(plainTextToMarkdown(text));
      } else {
        handleMdChange(text);
      }
    },
    [handleMdChange]
  );

  const handleExportElementConfig = useCallback(() => {
    const payload = JSON.stringify(elementConfig, null, 2);
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wechat-typesetter-element-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [elementConfig]);

  const handleImportElementConfig = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as Partial<ElementConfig>;
        setElementConfig(mergeElementConfig(parsed));
        window.alert(i18n.importConfigSuccess);
      } catch {
        window.alert(i18n.importConfigFailed);
      }
    },
    [i18n.importConfigFailed, i18n.importConfigSuccess]
  );

  const loadSidecarConfig = useCallback(async () => {
    try {
      const resp = await fetch(`./element-config.json?t=${Date.now()}`, { cache: "no-store" });
      if (!resp.ok) return;
      const parsed = (await resp.json()) as Partial<ElementConfig>;
      setElementConfig((old) =>
        mergeElementConfig({
          ...old,
          ...(parsed || {}),
          divider: {
            ...(old.divider || {}),
            ...(parsed?.divider || {}),
          },
          footerTaglines: {
            ...(old.footerTaglines || {}),
            ...(parsed?.footerTaglines || {}),
          },
        })
      );
    } catch {
      // optional sidecar config, ignore if absent/invalid
    }
  }, []);

  useEffect(() => {
    void loadSidecarConfig();
  }, [loadSidecarConfig]);

  const fragmentHtml = useMemo(() => {
    return buildFragmentHtml(
      md,
      theme,
      spec,
      isDark,
      undefined,
      {
        showDevHints,
        codeHighlight,
        imageBorderRadius,
        imageShadow,
        elementConfig,
      }
    );
  }, [md, theme, spec, isDark, showDevHints, codeHighlight, imageBorderRadius, imageShadow, elementConfig]);

  const wrappedHtml = useMemo(() => wrapArticleHtml(fragmentHtml, theme, spec, isDark), [fragmentHtml, theme, spec, isDark]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el || !window.mermaid) return;
    const pending = el.querySelectorAll(".mermaid-pending");
    if (pending.length === 0) return;
    pending.forEach(async (node, idx) => {
      const target = node as HTMLElement;
      try {
        const code = target.textContent ?? "";
        const id = `mermaid-render-${Date.now()}-${idx}`;
        const { svg } = await window.mermaid!.render(id, code);
        target.innerHTML = svg;
        target.classList.remove("mermaid-pending");
      } catch (error) {
        target.innerHTML = `<pre style="font-size:11px;color:#e74c3c;white-space:pre-wrap;">Mermaid render failed: ${String(error)}</pre>`;
        target.classList.remove("mermaid-pending");
      }
    });
  }, [wrappedHtml]);

  const handleCopy = useCallback(async () => {
    try {
      const el = previewRef.current;
      if (!el) throw new Error("Preview not ready");
      const clone = el.cloneNode(true) as HTMLElement;
      const svgs = clone.querySelectorAll("svg");
      for (let i = 0; i < svgs.length; i++) {
        try {
          const dataUrl = await svgToPngDataUrl(svgs[i] as SVGElement);
          const imgTag = document.createElement("img");
          imgTag.src = dataUrl;
          imgTag.style.cssText = "max-width:100%;height:auto;";
          svgs[i].parentNode?.replaceChild(imgTag, svgs[i]);
        } catch {
          // ignore single svg failure
        }
      }
      const renderedHtml = sanitizeForWechat(clone.innerHTML);
      const blob = new Blob([renderedHtml], { type: "text/html" });
      const textBlob = new Blob([renderedHtml], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blob, "text/plain": textBlob }),
      ]);
      setCopyMsg(i18n.copiedRichText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = wrappedHtml;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopyMsg(i18n.copiedHtmlSource);
    }
    setTimeout(() => setCopyMsg(""), 1800);
  }, [wrappedHtml, i18n.copiedHtmlSource, i18n.copiedRichText]);

  const uiBg = isDark ? "#111" : "#f4f4f5";
  const uiBorder = isDark ? "#333" : "#e0e0e0";
  const uiText = isDark ? "#ccc" : "#333";
  const uiTextSec = isDark ? "#888" : "#888";

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: uiBg,
        color: uiText,
        overflow: "hidden",
        fontFamily: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      }}
    >
      <div
        style={{
          background: isDark ? "#0a0a0a" : "#fff",
          borderBottom: `1px solid ${uiBorder}`,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {THEME_IDS.map((id) => {
            const t = THEMES[id];
            return (
              <button
                key={id}
                onClick={() => handleThemeChange(id)}
                style={{
                  border: themeId === id ? `2px solid ${t.colors.primary}` : `1px solid ${uiBorder}`,
                  background: themeId === id ? (isDark ? t.dark.surface : t.colors.bg) : "transparent",
                  color: themeId === id ? t.colors.primary : uiTextSec,
                  padding: "4px 10px",
                  fontSize: 12,
                  borderRadius: 2,
                  cursor: "pointer",
                  fontWeight: themeId === id ? 600 : 400,
                }}
              >
                {t.icon} {id === "academic"
                  ? i18n.themeAcademic
                  : id === "industry"
                    ? i18n.themeIndustry
                    : id === "tech"
                      ? i18n.themeTech
                      : i18n.themeStory}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setLang((v) => (v === "zh" ? "en" : "zh"))}
          style={{ border: `1px solid ${uiBorder}`, background: "transparent", color: uiText, padding: "4px 10px", fontSize: 11, borderRadius: 2, cursor: "pointer" }}
          title={i18n.language}
        >
          {lang === "zh" ? i18n.langEn : i18n.langZh}
        </button>
        <button
          onClick={() => setShowElementConfig((v) => !v)}
          style={{ border: `1px solid ${uiBorder}`, background: showElementConfig ? theme.colors.primary : "transparent", color: showElementConfig ? "#fff" : uiText, padding: "4px 10px", fontSize: 11, borderRadius: 2, cursor: "pointer" }}
        >
          {i18n.elementConfig}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,.html,.htm"
          style={{ display: "none" }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await handleImportFile(f);
            e.currentTarget.value = "";
          }}
        />
        <input
          ref={elementConfigInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await handleImportElementConfig(f);
            e.currentTarget.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ border: `1px solid ${uiBorder}`, background: "transparent", color: uiText, padding: "4px 10px", fontSize: 11, borderRadius: 2, cursor: "pointer" }}
        >
          {i18n.importFile}
        </button>
        <button
          onClick={() => setShowDevHints((v) => !v)}
          style={{ border: `1px solid ${uiBorder}`, background: showDevHints ? "#fff3cd" : "transparent", color: uiText, padding: "4px 10px", fontSize: 11, borderRadius: 2, cursor: "pointer" }}
        >
          {showDevHints ? i18n.hintsOn : i18n.hintsOff}
        </button>
        <button
          onClick={() => setIsDark((v) => !v)}
          style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#333" : "#f5f5f5", color: uiText, padding: "4px 10px", fontSize: 11, borderRadius: 2, cursor: "pointer" }}
        >
          {isDark ? i18n.light : i18n.dark}
        </button>
        <button onClick={handleCopy} style={{ border: "none", background: theme.colors.primary, color: "#fff", padding: "5px 14px", fontSize: 12, borderRadius: 2, cursor: "pointer", fontWeight: 600 }}>
          {copyMsg || i18n.copyRichText}
        </button>
        <button
          onClick={() => setShowSource((v) => !v)}
          style={{ border: `1px solid ${uiBorder}`, background: showSource ? theme.colors.primary : "transparent", color: showSource ? "#fff" : uiTextSec, padding: "4px 10px", fontSize: 11, borderRadius: 2, cursor: "pointer" }}
        >
          {"</>"}
        </button>
      </div>

      <div style={{ background: isDark ? "#151515" : "#fafafa", borderBottom: `1px solid ${uiBorder}`, padding: "6px 12px", display: "flex", gap: 14, alignItems: "center", overflowX: "auto", whiteSpace: "nowrap" }}>
        {[
          { label: i18n.font, key: "fontSize", min: 13, max: 18, step: 1, unit: "px" },
          { label: i18n.line, key: "lineHeight", min: 1.5, max: 2.2, step: 0.05, unit: "x" },
          { label: i18n.space, key: "letterSpacing", min: 0, max: 2, step: 0.5, unit: "px" },
          { label: i18n.margin, key: "pageMargin", min: 0, max: 24, step: 1, unit: "px" },
        ].map((item) => (
          <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: uiTextSec }}>{item.label}</span>
            <input type="range" min={item.min} max={item.max} step={item.step} value={spec[item.key as keyof TypographySpec]} onChange={(e) => setSpec((old) => ({ ...old, [item.key]: Number(e.target.value) }))} style={{ width: 64, accentColor: theme.colors.primary }} />
            <span style={{ fontSize: 11, color: uiText, fontFamily: "monospace", minWidth: 36 }}>
              {spec[item.key as keyof TypographySpec]}
              {item.unit}
            </span>
          </div>
        ))}

        <span style={{ color: uiBorder }}>|</span>
        <label style={{ fontSize: 11, color: uiTextSec }}>
          <input type="checkbox" checked={codeHighlight} onChange={(e) => setCodeHighlight(e.target.checked)} /> {i18n.codeHighlight}
        </label>
        <label style={{ fontSize: 11, color: uiTextSec }}>
          {i18n.imgRadius}
          <input type="range" min={0} max={12} step={1} value={imageBorderRadius} onChange={(e) => setImageBorderRadius(Number(e.target.value))} style={{ width: 60, marginLeft: 6, marginRight: 6, accentColor: theme.colors.primary }} />
          {imageBorderRadius}px
        </label>
        <label style={{ fontSize: 11, color: uiTextSec }}>
          <input type="checkbox" checked={imageShadow} onChange={(e) => setImageShadow(e.target.checked)} /> {i18n.imgShadow}
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: uiTextSec }}>
          {i18n.accountName}
          <input value={elementConfig.brandName} onChange={(e) => setElementConfig((old) => ({ ...old, brandName: e.target.value }))} placeholder={i18n.footerPlaceholder} style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#222" : "#fff", color: uiText, fontSize: 11, padding: "2px 6px", borderRadius: 2, width: 140 }} />
        </label>
        <button onClick={() => setSpec(mergeSpec())} style={{ border: `1px solid ${uiBorder}`, background: "transparent", color: uiTextSec, padding: "2px 8px", fontSize: 10, borderRadius: 2, cursor: "pointer" }}>
          {i18n.resetSpec}
        </button>
      </div>

      {showElementConfig && (
        <div style={{ background: isDark ? "#121212" : "#fbfbfd", borderBottom: `1px solid ${uiBorder}`, padding: "10px 12px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button onClick={() => void loadSidecarConfig()} style={{ border: `1px solid ${uiBorder}`, background: "transparent", color: uiText, padding: "4px 8px", fontSize: 11, borderRadius: 2, cursor: "pointer" }}>
              {i18n.loadSidecarConfig}
            </button>
            <button onClick={handleExportElementConfig} style={{ border: `1px solid ${uiBorder}`, background: "transparent", color: uiText, padding: "4px 8px", fontSize: 11, borderRadius: 2, cursor: "pointer" }}>
              {i18n.exportConfig}
            </button>
            <button onClick={() => elementConfigInputRef.current?.click()} style={{ border: `1px solid ${uiBorder}`, background: "transparent", color: uiText, padding: "4px 8px", fontSize: 11, borderRadius: 2, cursor: "pointer" }}>
              {i18n.importConfig}
            </button>
            <button onClick={() => setElementConfig(mergeElementConfig(DEFAULT_ELEMENT_CONFIG))} style={{ border: `1px solid ${uiBorder}`, background: "transparent", color: uiText, padding: "4px 8px", fontSize: 11, borderRadius: 2, cursor: "pointer" }}>
              {i18n.resetElementConfig}
            </button>
          </div>
          <label style={{ fontSize: 11, color: uiTextSec, display: "flex", flexDirection: "column", gap: 4 }}>
            {i18n.dividerStyle}
            <select
              value={elementConfig.divider.style}
              onChange={(e) =>
                setElementConfig((old) => ({ ...old, divider: { ...old.divider, style: e.target.value as typeof old.divider.style } }))
              }
              style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#222" : "#fff", color: uiText, fontSize: 11, padding: "4px 6px", borderRadius: 2 }}
            >
              <option value="theme">{i18n.dividerTheme}</option>
              <option value="line">{i18n.dividerLine}</option>
              <option value="dot">{i18n.dividerDot}</option>
              <option value="text">{i18n.dividerTextStyle}</option>
            </select>
          </label>

          <label style={{ fontSize: 11, color: uiTextSec, display: "flex", flexDirection: "column", gap: 4 }}>
            {i18n.dividerText}
            <input value={elementConfig.divider.text} onChange={(e) => setElementConfig((old) => ({ ...old, divider: { ...old.divider, text: e.target.value } }))} style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#222" : "#fff", color: uiText, fontSize: 11, padding: "4px 6px", borderRadius: 2 }} />
          </label>

          <label style={{ fontSize: 11, color: uiTextSec, display: "flex", flexDirection: "column", gap: 4 }}>
            {i18n.footerContact}
            <input value={elementConfig.footerContactText} onChange={(e) => setElementConfig((old) => ({ ...old, footerContactText: e.target.value }))} style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#222" : "#fff", color: uiText, fontSize: 11, padding: "4px 6px", borderRadius: 2 }} />
          </label>

          <label style={{ fontSize: 11, color: uiTextSec, display: "flex", flexDirection: "column", gap: 4 }}>
            {i18n.qrImageUrl}
            <input value={elementConfig.qrImageUrl} onChange={(e) => setElementConfig((old) => ({ ...old, qrImageUrl: e.target.value }))} placeholder="./qrcode.png" style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#222" : "#fff", color: uiText, fontSize: 11, padding: "4px 6px", borderRadius: 2 }} />
          </label>

          <label style={{ fontSize: 11, color: uiTextSec, display: "flex", flexDirection: "column", gap: 4 }}>
            {i18n.footerCopyright}
            <input value={elementConfig.footerCopyrightTemplate} onChange={(e) => setElementConfig((old) => ({ ...old, footerCopyrightTemplate: e.target.value }))} style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#222" : "#fff", color: uiText, fontSize: 11, padding: "4px 6px", borderRadius: 2 }} />
          </label>

          <label style={{ fontSize: 11, color: uiTextSec, display: "flex", flexDirection: "column", gap: 4 }}>
            {i18n.ctaDefault}
            <input value={elementConfig.ctaDefaultText} onChange={(e) => setElementConfig((old) => ({ ...old, ctaDefaultText: e.target.value }))} style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#222" : "#fff", color: uiText, fontSize: 11, padding: "4px 6px", borderRadius: 2 }} />
          </label>

          <label style={{ fontSize: 11, color: uiTextSec, display: "flex", flexDirection: "column", gap: 4 }}>
            {i18n.readmoreDefault}
            <input value={elementConfig.readmoreDefaultText} onChange={(e) => setElementConfig((old) => ({ ...old, readmoreDefaultText: e.target.value }))} style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#222" : "#fff", color: uiText, fontSize: 11, padding: "4px 6px", borderRadius: 2 }} />
          </label>

          <label style={{ fontSize: 11, color: uiTextSec, display: "flex", flexDirection: "column", gap: 4 }}>
            {i18n.noteLabel}
            <input value={elementConfig.noteLabel} onChange={(e) => setElementConfig((old) => ({ ...old, noteLabel: e.target.value }))} style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#222" : "#fff", color: uiText, fontSize: 11, padding: "4px 6px", borderRadius: 2 }} />
          </label>

          <label style={{ fontSize: 11, color: uiTextSec, display: "flex", flexDirection: "column", gap: 4 }}>
            {i18n.fallbackHint}
            <input value={elementConfig.fallbackHint} onChange={(e) => setElementConfig((old) => ({ ...old, fallbackHint: e.target.value }))} style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#222" : "#fff", color: uiText, fontSize: 11, padding: "4px 6px", borderRadius: 2 }} />
          </label>

          <label style={{ fontSize: 11, color: uiTextSec, display: "flex", flexDirection: "column", gap: 4 }}>
            QR Label
            <input value={elementConfig.qrLabel} onChange={(e) => setElementConfig((old) => ({ ...old, qrLabel: e.target.value }))} style={{ border: `1px solid ${uiBorder}`, background: isDark ? "#222" : "#fff", color: uiText, fontSize: 11, padding: "4px 6px", borderRadius: 2 }} />
          </label>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: `1px solid ${uiBorder}`, minWidth: 0 }}>
          <div style={{ padding: "6px 12px", fontSize: 11, color: uiTextSec, background: isDark ? "#151515" : "#fafafa", borderBottom: `1px solid ${uiBorder}`, display: "flex", justifyContent: "space-between" }}>
            <span>{i18n.inputTitle}</span>
            <span>{md.length} {i18n.chars}</span>
          </div>
          <textarea
            ref={editorRef}
            value={md}
            onChange={(e) => handleMdChange(e.target.value)}
            onScroll={handleEditorScroll}
            spellCheck={false}
            style={{
              flex: 1,
              width: "100%",
              border: "none",
              outline: "none",
              resize: "none",
              padding: "12px 14px",
              fontSize: 13,
              lineHeight: 1.7,
              fontFamily: "'SF Mono',Consolas,'Liberation Mono',monospace",
              background: isDark ? "#1a1a1a" : "#fff",
              color: isDark ? "#d4d4d4" : "#1e1e1e",
              overflowY: "auto",
            }}
          />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: uiBg, minWidth: 0 }}>
          <div style={{ padding: "6px 12px", fontSize: 11, color: uiTextSec, background: isDark ? "#151515" : "#fafafa", borderBottom: `1px solid ${uiBorder}`, display: "flex", justifyContent: "space-between" }}>
            <span>{isDark ? i18n.darkPreview : i18n.preview} · {themeName}</span>
            <span>375px</span>
          </div>
          <div ref={previewScrollRef} onScroll={handlePreviewScroll} style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "12px 8px" }}>
            {showSource ? (
              <pre style={{ width: "100%", maxWidth: 500, margin: "0 auto", background: isDark ? "#1a1a1a" : "#fff", border: `1px solid ${uiBorder}`, borderRadius: 4, padding: 14, fontSize: 11, lineHeight: 1.6, color: isDark ? "#d4d4d4" : "#333", fontFamily: "Consolas,monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{wrappedHtml}</pre>
            ) : (
              <div style={{ width: 375, maxWidth: "100%", margin: "0 auto", background: isDark ? theme.dark.bg : "#fff", borderRadius: 12, boxShadow: isDark ? "0 0 0 1px #333" : "0 4px 24px rgba(0,0,0,0.08)" }}>
                <div style={{ height: 28, background: isDark ? "#000" : "#f8f8f8", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px 12px 0 0", position: "sticky", top: 0, zIndex: 1 }}>
                  <span style={{ fontSize: 9, color: isDark ? "#666" : "#999" }}>{i18n.phonePreview}</span>
                </div>
                <div ref={previewRef} dangerouslySetInnerHTML={{ __html: wrappedHtml }} />
                <div style={{ height: 40 }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: isDark ? "#0a0a0a" : "#fff", borderTop: `1px solid ${uiBorder}`, padding: "5px 12px", fontSize: 10, color: uiTextSec, display: "flex", gap: 12, overflowX: "auto", whiteSpace: "nowrap" }}>
        <span>{i18n.help1}</span>
        <span>{i18n.help2}</span>
        <span>{i18n.help3}</span>
        <span>{i18n.help4}</span>
        <span>{i18n.help5}</span>
        <span>{i18n.help6}</span>
        <span style={{ marginLeft: "auto", color: theme.colors.primary }}>
          {i18n.help7}
        </span>
      </div>
    </div>
  );
}
