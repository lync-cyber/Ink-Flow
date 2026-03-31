import { useState, useCallback } from "react";

const COLUMNS = {
  academic: {
    id: "academic", name: "学术前沿", nameEn: "Academic Frontier",
    primary: "#1a5276", primaryLight: "#c5d9e8", primaryUltraLight: "#e4edf4",
    accent: "#c0782b", accentLight: "#f5e1c8",
    text: "#3f3f3f", textSecondary: "#595959", textTertiary: "#888888",
    surface: "#f5f5f5", border: "#bfc5cb",
    gradient: "linear-gradient(135deg, #1a5276 0%, #2980b9 100%)",
    tagline: "深度 · 前瞻 · 严谨",
    personality: "学术期刊般的克制与精确，大量留白，强调数据与逻辑层级",
    dark: { bg: "#191919", surface: "#222222", text: "#c3c3c3", textSec: "#8a8a8a", border: "#3a3a3a", primaryLight: "#1e3344" },
  },
  industry: {
    id: "industry", name: "行业动态", nameEn: "Industry Pulse",
    primary: "#0e6655", primaryLight: "#b8ddd3", primaryUltraLight: "#dceee8",
    accent: "#b9770e", accentLight: "#f5e4c4",
    text: "#3f3f3f", textSecondary: "#595959", textTertiary: "#888888",
    surface: "#f5f5f5", border: "#b5bfba",
    gradient: "linear-gradient(135deg, #0e6655 0%, #1abc9c 100%)",
    tagline: "洞察 · 趋势 · 时效",
    personality: "简报式紧凑排布，信息密度高，卡片化，节奏明快",
    dark: { bg: "#191919", surface: "#222222", text: "#c3c3c3", textSec: "#8a8a8a", border: "#3a3a3a", primaryLight: "#1a3a30" },
  },
  tech: {
    id: "tech", name: "技术专栏", nameEn: "Tech Deep Dive",
    primary: "#4a235a", primaryLight: "#d4c2dd", primaryUltraLight: "#ece3f0",
    accent: "#1a5276", accentLight: "#c5d9e8",
    text: "#3f3f3f", textSecondary: "#595959", textTertiary: "#888888",
    surface: "#f5f5f5", border: "#b5b5bf",
    gradient: "linear-gradient(135deg, #4a235a 0%, #7d3c98 100%)",
    tagline: "实践 · 原理 · 工具",
    personality: "工具化，装饰最少，功能性最强，代码友好，Markdown兼容",
    dark: { bg: "#191919", surface: "#222222", text: "#c3c3c3", textSec: "#8a8a8a", border: "#3a3a3a", primaryLight: "#2a1a33" },
  },
  story: {
    id: "story", name: "人物故事", nameEn: "Profiles & Stories",
    primary: "#784212", primaryLight: "#e8cdb3", primaryUltraLight: "#f0e0d0",
    accent: "#1a5276", accentLight: "#c5d9e8",
    text: "#3f3f3f", textSecondary: "#6e5c50", textTertiary: "#888888",
    surface: "#f7f3ee", border: "#c4b5a5",
    gradient: "linear-gradient(135deg, #784212 0%, #ba6b2a 100%)",
    tagline: "温度 · 叙事 · 人文",
    personality: "温暖有机，大图呼吸，引言突出，段落宽松",
    dark: { bg: "#191919", surface: "#222222", text: "#c3c3c3", textSec: "#8a8a8a", border: "#3a3a3a", primaryLight: "#2e2218" },
  },
};

const SPEC = { bodyFontSize: 15, bodyLineHeight: 1.75, bodyLetterSpacing: 1, titleFontSize: { h1: 22, h2: 18, h3: 15 }, pageMargin: 12, paragraphGap: 16, imageGap: 20, sectionGap: 28, maxColors: 3, textAlign: "justify" };

const COMPONENTS = [
  { id: "header", name: "文章头部区", desc: "栏目标识+标题+摘要" },
  { id: "body", name: "正文排版", desc: "段落/加粗/两端对齐" },
  { id: "h2h3", name: "二/三级标题", desc: "章节结构" },
  { id: "blockquote", name: "引用块", desc: "引言/注释" },
  { id: "card", name: "信息卡片", desc: "要点/数据" },
  { id: "list", name: "列表样式", desc: "有序/无序" },
  { id: "divider", name: "分割线", desc: "章节分隔" },
  { id: "image", name: "图片与图注", desc: "图片/图注" },
  { id: "code", name: "代码/公式块", desc: "代码展示" },
  { id: "table", name: "表格", desc: "数据表格" },
  { id: "cta", name: "行动引导", desc: "关注/转发" },
  { id: "footer", name: "文末固定区", desc: "作者/版权" },
  { id: "media", name: "音视频嵌入", desc: "mpvoice/mpvideo", isNew: true },
  { id: "miniapp", name: "小程序卡片", desc: "小程序引用", isNew: true },
  { id: "hashtag", name: "话题标签", desc: "#话题# 分发", isNew: true },
  { id: "collection", name: "合集导航", desc: "系列文章", isNew: true },
  { id: "vote", name: "投票互动", desc: "原生投票", isNew: true },
  { id: "readmore", name: "阅读原文引导", desc: "底部入口", isNew: true },
];

function useColors(col, isDark) {
  if (!isDark) return col;
  const d = col.dark;
  return { ...col, text: d.text, textSecondary: d.textSec, textTertiary: "#555", surface: d.surface, border: d.border, primaryUltraLight: d.primaryLight, primaryLight: d.primaryLight, accentLight: "#2a2a2a" };
}

function HeaderComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  if (col.id === "academic") return (<div><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${c.border}` }}><div style={{ width: 4, height: 28, background: c.primary, borderRadius: 2 }} /><span style={{ fontSize: 12, color: c.primary, letterSpacing: 4, fontWeight: 500 }}>学术前沿</span><span style={{ fontSize: 10, color: c.textTertiary, marginLeft: "auto", fontFamily: "monospace" }}>VOL.037</span></div><h1 style={{ fontSize: SPEC.titleFontSize.h1, fontWeight: 700, lineHeight: 1.5, color: c.text, margin: "0 0 16px" }}>基于Transformer架构的工业异常检测：从注意力机制到实时部署</h1><p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.8, margin: 0, paddingLeft: 12, borderLeft: `2px solid ${c.accent}` }}>本文系统综述了Transformer在工业视觉检测领域的最新进展，涵盖模型压缩、边缘推理及产线验证。</p></div>);
  if (col.id === "industry") return (<div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><div style={{ background: c.primary, color: "#fff", fontSize: 11, padding: "4px 12px", borderRadius: 2, fontWeight: 600, letterSpacing: 2 }}>行业动态</div><div style={{ height: 1, flex: 1, background: c.border }} /><span style={{ fontSize: 10, color: c.textTertiary }}>2025.12 周报</span></div><h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, color: c.text, margin: "0 0 12px" }}>本周AI+工控领域五大事件速览</h1><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{["政策", "融资", "产品", "技术突破"].map((t) => (<span key={t} style={{ fontSize: 11, padding: "2px 10px", background: c.primaryUltraLight, color: c.primary, borderRadius: 2 }}>{t}</span>))}</div></div>);
  if (col.id === "tech") return (<div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><span style={{ fontFamily: "monospace", fontSize: 12, color: c.primary, fontWeight: 600 }}>// 技术专栏</span><span style={{ fontSize: 10, color: c.textTertiary, fontFamily: "monospace" }}>#部署 #量化</span></div><h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, color: c.text, margin: "0 0 12px" }}>ONNX Runtime在ARM边缘设备上的量化部署实战</h1><div style={{ background: c.primaryUltraLight, borderLeft: `3px solid ${c.primary}`, padding: "10px 14px", fontSize: 12, color: c.textSecondary, lineHeight: 1.7 }}><strong style={{ color: c.text }}>12分钟</strong> · 难度 ⬤⬤⬤○○ · 前置：PyTorch基础</div></div>);
  return (<div><div style={{ fontSize: 11, color: c.accent, letterSpacing: 6, marginBottom: 20, fontWeight: 500 }}>人物故事</div><h1 style={{ fontSize: 24, fontWeight: 400, lineHeight: 1.7, color: c.text, margin: "0 0 20px" }}>「我花了八年，让产线学会自己思考」</h1><p style={{ fontSize: 14, color: c.textSecondary, lineHeight: 2, margin: 0, fontStyle: "italic" }}>一位从学术界转投制造业的AI工程师，和她在噪声、粉尘与数据之间走过的路。</p></div>);
}

function BodyComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  const base = { fontSize: SPEC.bodyFontSize, lineHeight: col.id === "story" ? 2.0 : SPEC.bodyLineHeight, color: c.text, letterSpacing: SPEC.bodyLetterSpacing, textAlign: SPEC.textAlign, marginBottom: SPEC.paragraphGap };
  return (<div><p style={base}>在工业质检场景中，传统的基于规则的视觉检测方法正面临越来越大的挑战。<strong style={{ color: c.primary }}>产品迭代速度加快</strong>意味着缺陷模式不断变化，{col.id === "academic" && <sup style={{ color: c.accent, fontSize: 10 }}>[1]</sup>}而人工标注的成本居高不下。近年来，<span style={{ borderBottom: `1px dashed ${c.accent}`, paddingBottom: 1 }}>无监督异常检测</span>展现出了突破性潜力。</p><p style={{ ...base, marginBottom: 0 }}>本文将逐一拆解关键障碍，并给出<a href="#" style={{ color: c.accent, textDecoration: "none", borderBottom: `1px solid ${c.accent}` }}>经实际验证的解决路径</a>。</p></div>);
}

function H2H3Component({ col, isDark }) {
  const c = useColors(col, isDark);
  if (col.id === "academic") return (<div><h2 style={{ fontSize: SPEC.titleFontSize.h2, fontWeight: 700, color: c.text, margin: "0 0 8px", borderBottom: `2px solid ${c.primary}`, paddingBottom: 8, display: "inline-block" }}>2. 方法论与实验设计</h2><div style={{ marginTop: 20 }}><h3 style={{ fontSize: SPEC.titleFontSize.h3, fontWeight: 600, color: c.primary, margin: 0, paddingLeft: 12, borderLeft: `3px solid ${c.accent}` }}>2.1 数据集构建与预处理</h3></div></div>);
  if (col.id === "industry") return (<div><h2 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0, background: c.primary, padding: "8px 16px", borderRadius: 2, display: "inline-block" }}>融资与并购</h2><div style={{ marginTop: 20 }}><h3 style={{ fontSize: SPEC.titleFontSize.h3, fontWeight: 600, color: c.primary, margin: 0, display: "flex", alignItems: "center", gap: 8 }}><span style={{ display: "inline-block", width: 6, height: 6, background: c.accent, borderRadius: "50%" }} />西门子收购AI初创公司</h3></div></div>);
  if (col.id === "tech") return (<div><h2 style={{ fontSize: 17, fontWeight: 700, color: c.text, margin: 0, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: c.primary, fontSize: 14 }}>##</span> 环境配置与依赖安装</h2><div style={{ marginTop: 20 }}><h3 style={{ fontSize: 14, fontWeight: 600, color: c.textSecondary, margin: 0, fontFamily: "monospace" }}><span style={{ color: c.primary }}>###</span> Step 1: 交叉编译工具链</h3></div></div>);
  return (<div><h2 style={{ fontSize: 20, fontWeight: 400, color: c.text, margin: 0, textAlign: "center" }}>从实验室到车间</h2><div style={{ display: "flex", justifyContent: "center", gap: 4, margin: "8px 0 0" }}><span style={{ width: 20, height: 1.5, background: c.border, display: "block" }} /><span style={{ width: 4, height: 4, background: c.accent, borderRadius: "50%", display: "block" }} /><span style={{ width: 20, height: 1.5, background: c.border, display: "block" }} /></div><div style={{ marginTop: 24 }}><h3 style={{ fontSize: SPEC.titleFontSize.h3, fontWeight: 400, color: c.primary, margin: 0, fontStyle: "italic", textAlign: "center" }}>「那是我第一次站在产线旁边调参数」</h3></div></div>);
}

function BlockquoteComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  if (col.id === "story") return (<blockquote style={{ margin: 0, padding: "20px 24px", textAlign: "center" }}><div style={{ fontSize: 28, color: c.border, lineHeight: 1, marginBottom: 8 }}>"</div><p style={{ fontSize: 16, color: c.text, lineHeight: 2, margin: 0, fontStyle: "italic" }}>你不能只看数据。你得听机器的声音，感受车间的温度。</p><div style={{ marginTop: 12, fontSize: 12, color: c.textSecondary }}>—— 张薇，某汽车零部件厂AI负责人</div></blockquote>);
  if (col.id === "tech") return (<blockquote style={{ margin: 0, padding: "12px 16px", background: c.primaryUltraLight, borderLeft: `3px solid ${c.primary}`, borderRadius: "0 2px 2px 0" }}><p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.7, margin: 0 }}><span style={{ fontFamily: "monospace", background: isDark ? "#333" : "#fff", padding: "1px 6px", borderRadius: 2, fontSize: 12, color: c.primary }}>💡 提示</span>&nbsp; ARM v8架构建议直接使用预编译包，可跳过本节。</p></blockquote>);
  return (<blockquote style={{ margin: 0, padding: "14px 18px", background: c.primaryUltraLight, borderLeft: `3px solid ${col.id === "industry" ? c.accent : c.primary}`, borderRadius: "0 2px 2px 0" }}><p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.8, margin: 0, textAlign: SPEC.textAlign }}>{col.id === "academic" ? (<><strong style={{ color: c.text }}>研究者注：</strong>该结论基于MVTec AD数据集验证，尚未大规模产线测试。</>) : (<><strong style={{ color: c.text }}>关键信息：</strong>工信部新规将于2026年Q1实施，涉及工业AI安全认证。</>)}</p></blockquote>);
}

function CardComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  const bg = isDark ? c.dark?.surface || "#222" : "#fff";
  if (col.id === "academic") return (<div style={{ border: `1px solid ${c.border}`, borderRadius: 2, overflow: "hidden", background: bg }}><div style={{ background: c.primaryUltraLight, padding: "10px 16px", borderBottom: `1px solid ${c.border}` }}><span style={{ fontSize: 12, fontWeight: 600, color: c.primary }}>表1：主流方法性能对比</span></div><div style={{ padding: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>{[{ l: "PatchCore", v: "99.1%" }, { l: "EfficientAD", v: "98.8%" }, { l: "本文方法", v: "99.6%", hi: true }].map((d) => (<div key={d.l} style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 700, color: d.hi ? c.accent : c.primary }}>{d.v}</div><div style={{ fontSize: 11, color: c.textSecondary, marginTop: 4 }}>{d.l}</div></div>))}</div><div style={{ fontSize: 11, color: c.textTertiary, borderTop: `1px solid ${c.border}`, paddingTop: 8 }}>* AUROC指标，15类缺陷加权平均</div></div></div>);
  if (col.id === "industry") return (<div style={{ border: `1px solid ${c.border}`, borderRadius: 2, padding: 16, background: c.primaryUltraLight }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 11, padding: "2px 8px", background: c.primary, color: "#fff", borderRadius: 2 }}>融资</span><span style={{ fontSize: 11, color: c.textTertiary }}>12月13日</span></div><h4 style={{ fontSize: 15, fontWeight: 600, color: c.text, margin: "0 0 8px", lineHeight: 1.5 }}>某工业AI公司完成B轮2.5亿融资</h4><p style={{ fontSize: 13, color: c.textSecondary, margin: 0, lineHeight: 1.7, textAlign: SPEC.textAlign }}>红杉中国领投，用于扩大制造业AI质检覆盖......</p></div>);
  if (col.id === "tech") return (<div style={{ border: `1px solid ${c.border}`, borderRadius: 2, overflow: "hidden", background: bg }}><div style={{ background: c.primaryUltraLight, padding: "8px 16px", borderBottom: `1px solid ${c.border}` }}><span style={{ fontFamily: "monospace", fontSize: 12, color: c.primary, fontWeight: 600 }}>⚙️ 环境要求</span></div><div style={{ padding: "12px 16px" }}>{[{ k: "OS", v: "Ubuntu 20.04+" }, { k: "Python", v: "3.8 - 3.11" }, { k: "RAM", v: "≥ 4GB" }].map((item) => (<div key={item.k} style={{ display: "flex", fontSize: 13, marginBottom: 6 }}><span style={{ fontFamily: "monospace", color: c.primary, fontWeight: 600, width: 70, flexShrink: 0 }}>{item.k}</span><span style={{ color: c.text }}>{item.v}</span></div>))}</div></div>);
  return (<div style={{ background: c.primaryUltraLight, borderRadius: 2, padding: "20px 24px" }}><div style={{ fontSize: 11, color: c.accent, letterSpacing: 2, marginBottom: 12 }}>人物档案</div><div style={{ fontSize: 15, color: c.text, lineHeight: 2 }}><strong>张薇</strong><div style={{ fontSize: 13, color: c.textSecondary }}>清华自动化系博士 → AI总监</div><div style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>深耕工业视觉8年，主导3条产线改造</div></div></div>);
}

function ListComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  const items = col.id === "story" ? ["2015年：首次进车间调试", "2019年：首条AI质检产线", "2023年：团队扩至30人"] : ["异常检测精度提升至99.1%", "推理延迟降至12ms/帧", "误报率控制在0.3%以下"];
  return (<div>{items.map((item, i) => (<div key={i} style={{ display: "flex", gap: col.id === "tech" ? 12 : 10, marginBottom: col.id === "story" ? 14 : 10, fontSize: 14, lineHeight: 1.8, color: c.text, alignItems: "flex-start", textAlign: SPEC.textAlign, ...(col.id === "industry" && i % 2 === 0 ? { padding: "6px 12px", background: c.primaryUltraLight, borderRadius: 2 } : {}) }}>{col.id === "tech" ? (<span style={{ fontFamily: "monospace", fontSize: 11, color: "#fff", background: c.primary, borderRadius: 2, padding: "2px 7px", flexShrink: 0, fontWeight: 600 }}>{i + 1}</span>) : col.id === "story" ? (<span style={{ width: 8, height: 8, border: `1.5px solid ${c.accent}`, borderRadius: "50%", flexShrink: 0, marginTop: 8 }} />) : col.id === "academic" ? (<span style={{ color: c.primary, flexShrink: 0, fontSize: 8, marginTop: 7 }}>■</span>) : (<span style={{ color: c.accent, flexShrink: 0, fontWeight: 700 }}>→</span>)}<span>{item}</span></div>))}</div>);
}

function DividerComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  if (col.id === "academic") return (<div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}><div style={{ flex: 1, height: 1, background: c.border }} /><span style={{ fontSize: 10, color: c.textTertiary, fontFamily: "monospace" }}>§</span><div style={{ flex: 1, height: 1, background: c.border }} /></div>);
  if (col.id === "industry") return (<div style={{ height: 2, background: c.primary, borderRadius: 1, margin: "4px 0", opacity: 0.5 }} />);
  if (col.id === "tech") return (<div style={{ padding: "4px 0", fontFamily: "monospace", fontSize: 12, color: c.border, textAlign: "center", letterSpacing: 4 }}>· · ·</div>);
  return (<div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "12px 0" }}><div style={{ width: 24, height: 1, background: c.border }} /><div style={{ width: 5, height: 5, background: c.accent, borderRadius: "50%" }} /><div style={{ width: 24, height: 1, background: c.border }} /></div>);
}

function ImageComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  const labels = { academic: "实验结果可视化", industry: "行业活动/产品图", tech: "架构图/流程图", story: "人物纪实摄影" };
  const captions = { academic: "图3：各缺陷类型AUROC对比", industry: "图：2025世界智能制造大会", tech: "图：ONNX Runtime推理流程", story: "摄于2023年，某工厂产线旁" };
  return (<div><div style={{ background: isDark ? "#2a2a2a" : c.surface, border: `1px solid ${c.border}`, borderRadius: 2, height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: c.textTertiary, fontSize: 12 }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 20, marginBottom: 4, opacity: 0.5 }}>🖼</div>{labels[col.id]}</div></div><p style={{ fontSize: 11, color: c.textTertiary, textAlign: col.id === "story" ? "right" : "center", marginTop: 6, fontStyle: col.id === "story" ? "italic" : "normal" }}>{captions[col.id]}</p><div style={{ fontSize: 9, color: c.textTertiary, textAlign: "center", marginTop: 4, padding: "4px 8px", background: isDark ? "#2a2a2a" : "#f9f9f9", borderRadius: 2, lineHeight: 1.5 }}>⚠ 使用透明底PNG，避免深色模式白边</div></div>);
}

function CodeComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  return (<div style={{ borderRadius: 2, overflow: "hidden", border: `1px solid ${c.border}` }}><div style={{ background: col.id === "tech" ? c.primary : "#2c3e50", padding: "6px 14px", display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{col.id === "tech" ? "terminal" : "python"}</span><span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>复制</span></div><div style={{ background: "#1a1d23", padding: "14px 16px", fontFamily: "Consolas, monospace", fontSize: 12, lineHeight: 1.8, color: "#e2e8f0", overflowX: "auto", whiteSpace: "nowrap" }}><div><span style={{ color: "#7c8ba1" }}># 加载量化模型</span></div><div><span style={{ color: "#c792ea" }}>import</span> onnxruntime <span style={{ color: "#c792ea" }}>as</span> ort</div><div>sess = ort.<span style={{ color: "#82aaff" }}>InferenceSession</span>(<span style={{ color: "#c3e88d" }}>"model_int8.onnx"</span>)</div></div><div style={{ fontSize: 9, color: c.textTertiary, padding: "5px 14px", background: isDark ? "#222" : "#f5f5f5", borderTop: `1px solid ${c.border}` }}>✅ Markdown兼容：```python 自动映射此样式</div></div>);
}

function TableComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  const bg = isDark ? c.dark?.surface || "#222" : "#fff";
  const headers = ["指标", "基线", "优化后", "提升"];
  const rows = [["推理延迟", "48ms", "12ms", "↓75%"], ["模型体积", "340MB", "42MB", "↓88%"], ["AUROC", "98.1%", "99.6%", "↑1.5%"]];
  return (<div style={{ border: `1px solid ${c.border}`, borderRadius: 2, overflow: "hidden" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}><thead><tr style={{ background: c.primary, color: "#fff" }}>{headers.map((h) => <th key={h} style={{ padding: "8px 10px", fontWeight: 600, textAlign: "left", fontSize: 12 }}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => (<tr key={i} style={{ background: i % 2 === 0 ? bg : c.primaryUltraLight }}>{row.map((cell, j) => (<td key={j} style={{ padding: "7px 10px", borderTop: `1px solid ${c.border}`, fontWeight: j === 0 ? 600 : 400, color: j === 3 ? c.accent : c.text, fontFamily: j > 0 ? "monospace" : "inherit", fontSize: 12 }}>{cell}</td>))}</tr>))}</tbody></table></div>);
}

function CTAComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  if (col.id === "story") return (<div style={{ textAlign: "center", padding: "20px 0" }}><p style={{ fontSize: 14, color: c.textSecondary, marginBottom: 16 }}>如果这个故事触动了你</p><div style={{ display: "inline-block", padding: "10px 32px", border: `1px solid ${c.primary}`, color: c.primary, fontSize: 13, borderRadius: 2, letterSpacing: 2 }}>分享给 TA</div></div>);
  if (col.id === "industry") return (<div style={{ background: c.primary, borderRadius: 2, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 14, color: "#fff", fontWeight: 600 }}>订阅周报</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>每周一早8点推送</div></div><div style={{ padding: "6px 18px", background: "#fff", color: c.primary, fontSize: 12, borderRadius: 2, fontWeight: 600, flexShrink: 0 }}>关注</div></div>);
  if (col.id === "tech") return (<div style={{ border: `1px solid ${c.border}`, borderRadius: 2, padding: "14px 18px" }}><div style={{ fontSize: 13, color: c.text, marginBottom: 10 }}><span style={{ fontFamily: "monospace", color: c.primary }}>📦</span> 完整代码已开源</div><div style={{ background: c.primaryUltraLight, padding: "8px 14px", borderRadius: 2, fontFamily: "monospace", fontSize: 12, color: c.primary, wordBreak: "break-all" }}>github.com/example/onnx-arm-deploy</div><div style={{ marginTop: 12, display: "flex", gap: 10 }}><span style={{ padding: "5px 14px", background: c.primary, color: "#fff", fontSize: 12, borderRadius: 2 }}>⭐ Star</span><span style={{ padding: "5px 14px", border: `1px solid ${c.primary}`, color: c.primary, fontSize: 12, borderRadius: 2 }}>阅读原文</span></div></div>);
  return (<div style={{ textAlign: "center", padding: "16px 0" }}><div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 12 }}>获取全部引用论文及数据集</div><div style={{ display: "inline-block", padding: "8px 28px", background: c.primary, color: "#fff", fontSize: 13, borderRadius: 2 }}>阅读原文 →</div></div>);
}

function FooterComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  return (<div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 16 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><div><div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>公众号名称</div><div style={{ fontSize: 11, color: c.textSecondary, marginTop: 4 }}>{col.tagline}</div></div><div style={{ width: 48, height: 48, background: c.primaryUltraLight, border: `1px solid ${c.border}`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: c.textTertiary }}>二维码</div></div><div style={{ marginTop: 12, fontSize: 11, color: c.textSecondary }}>往期：<span style={{ color: c.primary }}>《工业视觉年度综述》</span> · <span style={{ color: c.primary }}>《边缘AI部署》</span></div><div style={{ marginTop: 10, fontSize: 10, color: c.textTertiary }}>© 2025 公众号名称 · 转载请联系授权</div></div>);
}

// ====== 6 NEW COMPONENTS ======

function MediaComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  const bg = isDark ? c.dark?.surface || "#222" : "#fff";
  const audioTitles = { academic: "作者语音解读论文核心", industry: "本期行业播客速览", tech: "技术播客：边缘部署踩坑记", story: "访谈：张薇讲述产线改造" };
  return (<div><div style={{ border: `1px solid ${c.border}`, borderRadius: 2, padding: "12px 16px", background: bg, marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: c.primaryUltraLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ color: c.primary, fontSize: 16 }}>▶</span></div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{audioTitles[col.id]}</div><div style={{ fontSize: 11, color: c.textTertiary, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}><span style={{ display: "inline-block", width: "55%", height: 3, background: c.primaryLight, borderRadius: 2 }} /><span>03:42</span></div></div></div><div style={{ border: `1px solid ${c.border}`, borderRadius: 2, overflow: "hidden", background: "#1a1a1a" }}><div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 16, marginLeft: 2 }}>▶</span></div></div><div style={{ padding: "8px 12px", background: bg, borderTop: `1px solid ${c.border}` }}><div style={{ fontSize: 12, color: c.text }}>{col.id === "tech" ? "ONNX模型转换流程演示" : "工厂智能化改造实录"}</div></div></div><div style={{ fontSize: 9, color: c.textTertiary, marginTop: 6, textAlign: "center" }}>使用 &lt;mpvoice&gt; / &lt;mpvideo&gt; 标签嵌入</div></div>);
}

function MiniappComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  const bg = isDark ? c.dark?.surface || "#222" : "#fff";
  const apps = { academic: { n: "论文数据集浏览器", d: "在线查看MVTec AD数据集", i: "📊" }, industry: { n: "AI+工控产业地图", d: "完整行业图谱与公司信息", i: "🗺" }, tech: { n: "代码演示环境", d: "在线运行本文代码示例", i: "💻" }, story: { n: "更多人物故事", d: "工业AI人物访谈合集", i: "👤" } };
  const a = apps[col.id];
  return (<div style={{ border: `1px solid ${c.border}`, borderRadius: 2, padding: "14px 16px", background: bg, display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 8, background: c.primaryUltraLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{a.i}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{a.n}</div><div style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }}>{a.d}</div></div><div style={{ fontSize: 10, color: c.textTertiary, flexShrink: 0 }}><div>小程序</div><div style={{ marginTop: 2, textAlign: "right" }}>→</div></div></div>);
}

function HashtagComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  const tags = { academic: ["#工业异常检测", "#Transformer", "#视觉质检"], industry: ["#AI融资", "#工业4.0", "#智能制造"], tech: ["#ONNX部署", "#模型量化", "#边缘计算"], story: ["#工业AI人物", "#技术人生", "#产线故事"] };
  return (<div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{tags[col.id].map((t) => (<span key={t} style={{ fontSize: 13, color: c.primary }}>{t}</span>))}</div><div style={{ fontSize: 9, color: c.textTertiary, marginTop: 8, padding: "4px 8px", background: isDark ? "#222" : "#f9f9f9", borderRadius: 2 }}>话题标签可被微信搜索索引，提升分发触达</div></div>);
}

function CollectionComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  const bg = isDark ? c.dark?.surface || "#222" : "#fff";
  const s = { academic: { n: "工业AI前沿综述系列", items: ["Vol.35 缺陷生成与数据增强", "Vol.36 联邦学习在质检中的应用", "Vol.37 Transformer异常检测 ← 本篇"] }, industry: { n: "AI+工控周报合集", items: ["第49期 12月第1周", "第50期 12月第2周", "第51期 12月第3周 ← 本篇"] }, tech: { n: "边缘部署实战系列", items: ["① 模型选型与压缩", "② 量化与ONNX转换", "③ ARM设备部署 ← 本篇"] }, story: { n: "「产线上的人」系列", items: ["01 从博士到车间主任", "02 90后女工程师的八年", "03 算法团队的冬天 ← 本篇"] } }[col.id];
  return (<div style={{ border: `1px solid ${c.border}`, borderRadius: 2, overflow: "hidden", background: bg }}><div style={{ background: c.primaryUltraLight, padding: "10px 16px", borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 12, fontWeight: 600, color: c.primary }}>📚 {s.n}</span><span style={{ fontSize: 10, color: c.textTertiary, marginLeft: "auto" }}>{s.items.length}篇</span></div>{s.items.map((item, i) => { const cur = item.includes("本篇"); return (<div key={i} style={{ padding: "10px 16px", borderBottom: i < s.items.length - 1 ? `1px solid ${c.border}` : "none", display: "flex", alignItems: "center", background: cur ? c.primaryUltraLight : "transparent" }}><span style={{ fontSize: 13, color: cur ? c.primary : c.text, fontWeight: cur ? 600 : 400, flex: 1 }}>{item}</span>{cur && <span style={{ fontSize: 10, color: c.primary }}>当前</span>}</div>); })}</div>);
}

function VoteComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  const bg = isDark ? c.dark?.surface || "#222" : "#fff";
  const v = { academic: { q: "工业异常检测最大的落地瓶颈？", opts: ["标注数据不足", "推理速度", "泛化能力", "部署复杂"] }, industry: { q: "2026最值得关注的AI+工控方向？", opts: ["具身智能", "数字孪生", "预测性维护", "协作机器人"] }, tech: { q: "边缘部署最常遇到的问题？", opts: ["内存溢出", "精度损失", "编译配置", "性能不达标"] }, story: { q: "最想听哪类人物的故事？", opts: ["一线算法工程师", "工厂技术主管", "学术转产业", "创业者"] } }[col.id];
  return (<div style={{ border: `1px solid ${c.border}`, borderRadius: 2, padding: 16, background: bg }}><div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 14, lineHeight: 1.6 }}>{v.q}</div>{v.opts.map((opt, i) => (<div key={i} style={{ marginBottom: 8, padding: "8px 14px", borderRadius: 2, border: `1px solid ${c.border}`, fontSize: 13, color: c.text, display: "flex", alignItems: "center", gap: 10, background: i === 0 ? c.primaryUltraLight : "transparent" }}><span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${i === 0 ? c.primary : c.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{i === 0 && <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.primary }} />}</span><span>{opt}</span>{i === 0 && <span style={{ marginLeft: "auto", fontSize: 11, color: c.primary, fontWeight: 600 }}>42%</span>}</div>))}<div style={{ fontSize: 10, color: c.textTertiary, marginTop: 8 }}>微信原生投票 · 328人参与</div></div>);
}

function ReadmoreComponent({ col, isDark }) {
  const c = useColors(col, isDark);
  const content = { tech: { main: "点击下方「阅读原文」获取完整代码仓库", sub: "github.com/example/onnx-arm-deploy" }, academic: { main: "点击「阅读原文」下载论文PDF及补充材料", sub: null }, industry: { main: "阅读原文查看完整行业报告", sub: "↓ ↓ ↓" }, story: { main: "了解更多「产线上的人」系列故事", sub: null } }[col.id];
  return (<div style={{ textAlign: "center", padding: "16px 0 8px", borderTop: `1px solid ${c.border}` }}><div style={{ fontSize: 13, color: c.text, marginBottom: 6, fontStyle: col.id === "story" ? "italic" : "normal" }}>{col.id === "tech" && <span style={{ fontFamily: "monospace", color: c.primary }}>→ </span>}{content.main}</div>{content.sub && <div style={{ fontSize: 11, color: col.id === "tech" ? c.textTertiary : c.accent, fontFamily: col.id === "tech" ? "monospace" : "inherit" }}>{content.sub}</div>}{!content.sub && <div style={{ width: col.id === "story" ? 30 : 40, height: col.id === "story" ? 1 : 2, background: col.id === "story" ? c.accent : c.primary, margin: "6px auto 0", borderRadius: 1 }} />}</div>);
}

const RENDERERS = { header: HeaderComponent, body: BodyComponent, h2h3: H2H3Component, blockquote: BlockquoteComponent, card: CardComponent, list: ListComponent, divider: DividerComponent, image: ImageComponent, code: CodeComponent, table: TableComponent, cta: CTAComponent, footer: FooterComponent, media: MediaComponent, miniapp: MiniappComponent, hashtag: HashtagComponent, collection: CollectionComponent, vote: VoteComponent, readmore: ReadmoreComponent };

function SpecPanel({ col, isDark }) {
  const c = useColors(col, isDark);
  const rows = [["正文字号", `${SPEC.bodyFontSize}px`], ["行高", `${SPEC.bodyLineHeight}倍（人物故事2.0）`], ["字间距", `${SPEC.bodyLetterSpacing}px`], ["段间距", `${SPEC.paragraphGap}px`], ["页边距", `${SPEC.pageMargin}px`], ["对齐", "两端对齐 justify"], ["缩进", "无首行缩进"], ["正文色", col.text], ["辅助色", col.textSecondary], ["注释色", col.textTertiary], ["主色", col.primary], ["强调色", col.accent], ["色彩上限", `≤${SPEC.maxColors}种`]];
  return (<div style={{ padding: 16 }}><div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 12 }}>📐 排版参数规范</div>{rows.map(([k, v], i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${isDark ? "#333" : "#f0f0f0"}`, fontSize: 12 }}><span style={{ color: c.textSecondary }}>{k}</span><span style={{ color: c.text, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}>{v}{(k.includes("色") && !k.includes("上限")) && <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: v, border: "1px solid rgba(128,128,128,0.3)" }} />}</span></div>))}<div style={{ marginTop: 14, padding: "10px 12px", background: isDark ? "#2a2a2a" : "#fff8e6", borderRadius: 2, fontSize: 11, lineHeight: 1.7, color: c.textSecondary }}><strong>深色模式规则：</strong>微信自动反转灰度值（#232323→#c3c3c3），彩色值不变。避免纯白背景（#fff→#000太硬）；图片用透明底；position被过滤；只能内联样式。</div><div style={{ marginTop: 10, padding: "10px 12px", background: isDark ? "#2a2a2a" : "#f0f5ff", borderRadius: 2, fontSize: 11, lineHeight: 1.7, color: c.textSecondary }}><strong>CSS限制：</strong>无JS / 无&lt;style&gt; / 无class/ID / 无position / 百分比transform失效 / 单位建议px或vw。所有样式必须内联。</div></div>);
}

export default function WeChatComponentSystem() {
  const [activeColumn, setActiveColumn] = useState("academic");
  const [activeComponent, setActiveComponent] = useState("header");
  const [viewMode, setViewMode] = useState("component");
  const [isDark, setIsDark] = useState(false);

  const col = COLUMNS[activeColumn];
  const c = useColors(col, isDark);
  const Renderer = RENDERERS[activeComponent];
  const panelBg = isDark ? "#1a1a1a" : "#fff";
  const phoneBg = isDark ? "#191919" : "#fff";

  return (
    <div style={{ fontFamily: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif", background: isDark ? "#111" : "#f0f0f0", minHeight: "100vh", display: "flex", flexDirection: "column", transition: "background 0.3s" }}>
      <div style={{ background: "#111", padding: "14px 16px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>微信公众号排版组件系统 v2</h1><p style={{ margin: "2px 0 0", fontSize: 11, color: "#777" }}>AI+工控 · 4栏目 · {COMPONENTS.length}组件 · 深色适配</p></div>
        <button onClick={() => setIsDark(!isDark)} style={{ border: "1px solid #444", background: isDark ? "#fff" : "#333", color: isDark ? "#333" : "#fff", padding: "5px 12px", fontSize: 11, borderRadius: 2, cursor: "pointer", fontWeight: 600 }}>{isDark ? "☀ 浅色" : "🌙 深色"}</button>
      </div>
      <div style={{ background: panelBg, borderBottom: `1px solid ${isDark ? "#333" : "#e0e0e0"}`, padding: "0 8px", display: "flex", overflowX: "auto" }}>
        {Object.values(COLUMNS).map((cc) => (<button key={cc.id} onClick={() => setActiveColumn(cc.id)} style={{ border: "none", background: "none", padding: "11px 14px", fontSize: 13, fontWeight: activeColumn === cc.id ? 600 : 400, color: activeColumn === cc.id ? cc.primary : (isDark ? "#888" : "#999"), borderBottom: activeColumn === cc.id ? `2px solid ${cc.primary}` : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap" }}>{cc.name}</button>))}
      </div>
      <div style={{ background: isDark ? col.dark.primaryLight : col.primaryUltraLight, padding: "10px 16px", borderBottom: `1px solid ${isDark ? "#333" : col.primaryLight}`, transition: "all 0.3s" }}>
        <div style={{ fontSize: 11, color: col.primary, fontWeight: 600 }}>{col.nameEn}</div>
        <div style={{ fontSize: 11, color: isDark ? "#888" : col.textSecondary, marginTop: 2 }}>{col.personality}</div>
      </div>
      <div style={{ display: "flex", padding: "8px 16px", gap: 6, flexWrap: "wrap" }}>
        {[{ k: "component", l: "逐个组件" }, { k: "fullpage", l: "整页预览" }, { k: "spec", l: "📐 参数" }].map(({ k, l }) => (
          <button key={k} onClick={() => setViewMode(k)} style={{ border: `1px solid ${viewMode === k ? col.primary : (isDark ? "#444" : "#ccc")}`, background: viewMode === k ? col.primary : panelBg, color: viewMode === k ? "#fff" : (isDark ? "#aaa" : "#666"), padding: "4px 12px", fontSize: 11, borderRadius: 2, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {viewMode === "spec" ? (
        <div style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", padding: "16px 12px" }}><div style={{ width: "100%", maxWidth: 375, background: phoneBg, borderRadius: 8, boxShadow: isDark ? "none" : "0 2px 20px rgba(0,0,0,0.08)" }}><SpecPanel col={col} isDark={isDark} /></div></div>
      ) : viewMode === "component" ? (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ width: 115, background: panelBg, borderRight: `1px solid ${isDark ? "#333" : "#e0e0e0"}`, overflowY: "auto", flexShrink: 0 }}>
            {COMPONENTS.map((comp) => (<button key={comp.id} onClick={() => setActiveComponent(comp.id)} style={{ display: "block", width: "100%", border: "none", borderBottom: `1px solid ${isDark ? "#2a2a2a" : "#f0f0f0"}`, borderLeft: activeComponent === comp.id ? `3px solid ${col.primary}` : "3px solid transparent", background: activeComponent === comp.id ? (isDark ? col.dark.primaryLight : col.primaryUltraLight) : panelBg, padding: "8px 8px", textAlign: "left", cursor: "pointer" }}><div style={{ fontSize: 11, fontWeight: activeComponent === comp.id ? 600 : 400, color: activeComponent === comp.id ? col.primary : c.text, display: "flex", alignItems: "center", gap: 3 }}>{comp.name}{comp.isNew && <span style={{ fontSize: 7, padding: "0px 3px", background: "#e74c3c", color: "#fff", borderRadius: 2, fontWeight: 600, lineHeight: "14px" }}>N</span>}</div><div style={{ fontSize: 9, color: c.textTertiary, marginTop: 1 }}>{comp.desc}</div></button>))}
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", padding: "16px 8px" }}>
            <div style={{ width: "100%", maxWidth: 375, background: phoneBg, borderRadius: 8, boxShadow: isDark ? "none" : "0 2px 20px rgba(0,0,0,0.08)", padding: `20px ${SPEC.pageMargin}px`, minHeight: 200 }}><Renderer col={col} isDark={isDark} /></div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", padding: "16px 8px" }}>
          <div style={{ width: "100%", maxWidth: 375, background: phoneBg, borderRadius: 8, boxShadow: isDark ? "none" : "0 2px 20px rgba(0,0,0,0.08)", padding: `20px ${SPEC.pageMargin}px` }}>
            {COMPONENTS.map((comp) => { const R = RENDERERS[comp.id]; return (<div key={comp.id} style={{ marginBottom: SPEC.sectionGap }}><div style={{ fontSize: 9, color: isDark ? "#555" : "#bbb", letterSpacing: 2, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>{comp.name}{comp.isNew && <span style={{ fontSize: 7, padding: "0 3px", background: "#e74c3c", color: "#fff", borderRadius: 2 }}>N</span>}</div><R col={col} isDark={isDark} /></div>); })}
          </div>
        </div>
      )}
    </div>
  );
}
