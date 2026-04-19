# Variant 词典（6×23）

SKILL.md §4 决策时读此文件。每个 variant 含三段：气质、适用、反例。
"反例"比"适用"更重要——它划出何时**不该**用。

---

## 1. admonition · 6 种

提示容器（tip / warning / info / danger）的骨架。骨架 × 4 色 = 24 种视觉，但**骨架同家**。

### `accent-bar`（左 3px 色条 + 浅底，默认）
- 气质：工具化、低调
- 适用：技术长文、文档、FAQ —— 需要频繁出现 tip/warning，又不想抢正文
- 反例：散文 / 人物稿，这种骨架会让文章显得像 README

### `pill-tag`（顶部胶囊标签 + 标题悬于边缘）
- 气质：模块化、产品感
- 适用：产品更新说明、功能发布、换版公告 —— 扫读时胶囊标签先被抓住
- 反例：单篇 ≥3 个提示 —— 胶囊太密变"贴纸墙"

### `ticket-notch`（左右圆切齿票根）
- 气质：仪式感、入场券
- 适用：活动通知、福利发放、社群邀请 —— 非日常信息
- 反例：严肃技术 / 学术稿 —— 票根装饰降低可信度

### `card-shadow`（纯阴影卡，无左条）
- 气质：App 化、卡片化
- 适用：偏产品风的栏目、复盘稿、访谈记录
- 反例：公众号主流读者更熟悉左条骨架，纯阴影在手机上会被误认为广告卡

### `minimal-underline`（标题下划线，无底色）
- 气质：几乎隐形
- 适用：信息密度极高的长文、论文风稿件 —— 要让正文节奏不被打断
- 反例：要"压住结论"的关键提示 —— 会被读者跳过

### `terminal`（黑底 + 三交通灯）
- 气质：macOS 终端复刻、极客
- 适用：命令行教程、Shell 速查、debug 记录
- 反例：女性向 / 生活栏目 / 文学稿 —— 风格差距过大

---

## 2. quote · 4 种

### `classic`（大装饰引号 + 居中，默认）
- 气质：稳重、杂志感
- 适用：引述名人 / 权威 / 经典 —— 一篇 1–2 次使用
- 反例：连续 3 个引用叠出现，会让视觉"打嗝"

### `magazine-dropcap`（首字下沉）
- 气质：杂志开篇感、抒情
- 适用：散文 / 书评 / 人物稿的核心金句
- 反例：技术 / 数据稿，首字下沉显得矫情

### `column-rule`（双侧细竖线）
- 气质：几何、现代
- 适用：带分析口吻的引述、行业观察中的第三方发言
- 反例：文学栏目 —— 几何线条与正文衬线不合拍

### `frame-brackets`（四角 L 形装饰）
- 气质：取景框、摄影感
- 适用：人物访谈、摄影图文、旅行记录里的关键发言
- 反例：长篇密集引用 —— 装饰过多变杂乱

---

## 3. compare · 3 种

### `column-card`（两栏表格，默认）
- 气质：规整、对照清单
- 适用：pros/cons、before/after、两方案对比
- 反例：移动端阅读为主时两栏被压窄（考虑 `stacked-row`）

### `stacked-row`（上下堆叠）
- 气质：移动端友好、叙事式
- 适用：短句要素多的对比、375px 屏幕下横屏会挤
- 反例：桌面阅读为主 + 数据量大 —— 垂直拉得很长，翻页疲劳

### `ledger`（双色账本：绿 / 红）
- 气质：财务感、视觉直观
- 适用：收入/支出、收益/成本、得/失
- 反例：非数值对比（如"方案 A 的优雅 vs 方案 B 的粗暴"）—— 双色会误导读者以为在看账

---

## 4. steps · 3 种

### `number-circle`（圆圈编号，默认）
- 气质：教程感
- 适用：3–5 步的操作指引
- 反例：步骤 ≥ 7 步 —— 圆圈密度过高（考虑 `timeline-dot`）

### `ribbon-chain`（飘带链式）
- 气质：流程连贯、工艺感
- 适用：有"阶段"概念的流程（选题 → 初稿 → 修改 → 发布）
- 反例：非线性步骤（互相不依赖）—— 飘带暗示顺序

### `timeline-dot`（左侧时间轴点）
- 气质：时间/日程/里程碑
- 适用：发稿当天流程、项目时间线、历史事件
- 反例：非时序步骤（如"准备、执行、回收"的并行任务）

---

## 5. divider · 5 种

### `wave`（波浪线 SVG）
- 气质：柔、呼吸感
- 适用：散文、生活栏目、情感过渡
- 反例：技术 / 财经稿 —— 波浪抢戏

### `dots`（三点）
- 气质：克制、电影转场感
- 适用：章节切换时段落之间的小停顿
- 反例：已经有很多装饰的主题 —— 此时选 `rule` 更合适

### `flower`（花饰 SVG）
- 气质：杂志扉页
- 适用：文学 / 生活栏目章节间 —— 最多全文 1–2 次
- 反例：技术 / 数据稿 —— 花饰显得拧巴

### `rule`（一道纯色线，默认）
- 气质：工具化
- 适用：信息密度高的长文需要节拍点，但不想引入装饰
- 反例：已经以极简为签名的主题 —— 一道线多余，改用纯留白（即不放 divider）

### `glyph`（单字符装饰：❦ / § / ◆ / ❖）
- 气质：签名感、作者章
- 适用：作为栏目"签名分隔符"，全文统一一个字符（可用 `attrs.glyph` 换）
- 反例：同一篇混用多个字符 —— 立即降级成装饰噪声

---

## 6. section-title · 2 种

### `bordered`（底部 2px 主色线，默认）
- 气质：工具化、信息栏
- 适用：技术 / 数据 / 产品稿的章节分隔
- 反例：文学 / 生活稿 —— 底线太硬

### `cornered`（左上 SVG 折角装饰，无底线）
- 气质：静、扉页感
- 适用：栏目的"章节扉页"、小节独立成页的长文
- 反例：章节一页不到内容就又分下一节 —— 装饰过密

---

## 极端组合清单（反中庸速查表）

给 §4 做"先定签名再配其它"时的参考。**不要挑"样样都来一点"的中间方案**。

| 签名 | 对应极端组合 |
|---|---|
| 极客技术 | admonition:terminal / quote:classic / compare:column-card / steps:timeline-dot / divider:rule / section-title:bordered |
| 杂志文学 | admonition:minimal-underline / quote:magazine-dropcap / compare:stacked-row / steps:ribbon-chain / divider:flower / section-title:cornered |
| 产品发布 | admonition:pill-tag / quote:classic / compare:ledger / steps:ribbon-chain / divider:dots / section-title:bordered |
| 财经数据 | admonition:accent-bar / quote:column-rule / compare:ledger / steps:number-circle / divider:rule / section-title:bordered |
| 活动福利 | admonition:ticket-notch / quote:classic / compare:column-card / steps:number-circle / divider:glyph(glyph=❦) / section-title:bordered |
| 散文人物 | admonition:minimal-underline / quote:frame-brackets / compare:stacked-row / steps:timeline-dot / divider:wave / section-title:cornered |

这六套是**起点而不是终点**。真正的决策要从用户话题出发（宪章 4），而不是查表。
