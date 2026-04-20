# 主题目录（5 套）

SKILL.md §3 选主题时读此文件。每套主题含：基调 / 极端强项 / "不要拿它做 X" 的反例。

查最新可用主题列表：`framework/tools/typeset/app/src/themes/index.ts`

---

## `default` · 中性白底

**id**：`default`
**tokens 基调**：primary `#2d6fdd`（蓝）/ bg `#ffffff` / text `#1f2328`

### 极端强项
- 没有 —— 这是"无主张"的安全网
- 适合做模板原型验证（写组件库预设时先确保在 default 下能看）

### 反例 / 不要拿它做
- **长期用作任何栏目的主题** —— 两周后读者会觉得"又一个公众号"
- 单一文章风格强烈时用 default，会让风格显得不自信

### 选择它的合理理由
- 新栏目尚未定调，先用 default 跑几篇观察读者反馈，再做迁移
- 专门写给内部看的工具文档（无需栏目气质）

---

## `tech-geek` · 深夜代码

**id**：`tech-geek`
**tokens 基调**：深色背景 + 霓虹 accent + mono 友好

### 极端强项
- `terminal` admonition 骨架的视觉自洽度最高（黑底 × 代码绿/黄配色）
- 代码块大量出现时背景一致感最好
- 适合 `timeline-dot` steps（终端日志感）

### 反例 / 不要拿它做
- **非技术栏目** —— 深色背景在长文阅读里会让读者眼睛疲劳（公众号无法一键切日间）
- 带图文 / 图表的文章 —— 白底图片在深色背景上会"悬浮感"过强
- 写给非技术读者（如运营稿）—— 深色 = 陌生 = 跳出

### 选择它的合理理由
- 目标读者是开发者、CS 学生
- 文章中 ≥ 30% 字符来自代码/命令
- 栏目定位是"极客的业余沙发时间"

---

## `life-aesthetic` · 暖米生活

**id**：`life-aesthetic`
**tokens 基调**：暖米色底 + 衬线标题 + 大留白

### 极端强项
- 章节间留白感最强 —— 适合 `cornered` section-title + `wave` / `flower` divider
- `magazine-dropcap` 金句骨架在此主题下最耐看
- 适合 `stacked-row` compare（移动端阅读）

### 反例 / 不要拿它做
- **数据密集稿** —— 表格 / 对比 / compare:ledger 在暖米底下会"糊成一片"
- 技术命令 / 代码速查 —— 衬线 + 代码 = 违和
- 追求"扫读效率"的新闻快讯 —— 留白太多翻页多

### 选择它的合理理由
- 散文、旅行、美食、生活方式栏目
- 每段想留"呼吸感"
- 目标是被读者"慢慢读"

---

## `business-finance` · 锐利黑金

**id**：`business-finance`
**tokens 基调**：深色 primary + 金色 accent + 表格友好

### 极端强项
- `ledger` compare 视觉最有"账本感" —— 此主题就是为"收益/成本"类对比准备
- 表格 / 数据 / 对比密度高时结构感最强
- `pill-tag` admonition 在此主题下最像"产品发布"

### 反例 / 不要拿它做
- **情感类稿** —— 锐利 = 冰冷
- 文学 / 散文 —— 衬线缺失 + 装饰克制到刻薄
- 以代码为主的技术稿（tech-geek 更合适）

### 选择它的合理理由
- 行业分析、公司财报解读、赛道复盘
- 需要大量表格 / 对比
- 目标读者是投资人、从业者

---

## `literary-humanism` · 素雅衬线

**id**：`literary-humanism`
**tokens 基调**：米白底 + 明朝衬线 + 点状装饰

### 极端强项
- 所有 quote variant 都好看，尤其 `magazine-dropcap` / `frame-brackets`
- `glyph` divider 在此主题下最合拍（❦ / § 与衬线同家族）
- 长引用 / 古诗 / 书评摘录的最佳选择

### 反例 / 不要拿它做
- **技术教程** —— 衬线 + 代码块视觉冲突
- 步骤稿（任何 steps variant 都显得拧巴）
- 以表格为主的数据稿（衬线 + 表格 = 排版失败）

### 选择它的合理理由
- 书评、人物特稿、文化评论、诗歌解读
- 单篇 ≥ 3 处引用
- 目标读者是文学爱好者、阅读量大的中产

---

## 选择决策树

不会选时按以下顺序问自己：

1. **代码占比 ≥ 30%？** → `tech-geek`
2. **表格 / 对比密度高？** → `business-finance`
3. **衬线金句 / 古典引用多？** → `literary-humanism`
4. **追求留白与慢读？** → `life-aesthetic`
5. **以上都不是？** → `default` + 明确标记"这是过渡方案，第 N 篇之前要换"

---

## 极端大胆的反向选择

宪章 2："拒绝中庸"。以下是**主动反向**的合理场景：

| 文章类型 | 主流建议 | 反向大胆选择 | 什么时候选反向 |
|---|---|---|---|
| 技术教程 | tech-geek | literary-humanism | 想让"动手文"像散文一样慢慢读（适合工具哲学类） |
| 书评 | literary-humanism | tech-geek | 书评对象本身是技术书，且评者以"工程师口吻"评 |
| 财经分析 | business-finance | life-aesthetic | 从生活视角切入宏观（"一碗面里的通胀") |
| 随笔散文 | life-aesthetic | business-finance | 用财经栏目的冷峻写生活，反差感 |

选反向时必须有一句 context-specific 的 why（宪章 4），否则就是耍酷 = AI slop。

---

## 色盘冲突检查

同一账号的多个栏目主题**primary 色相差必须 ≥ 30°**，否则读者分辨不出栏目。

查法：
```bash
grep -r "primary:" framework/tools/typeset/app/src/themes/*/index.ts
```

如果发现两个栏目的 primary 色相差 < 30°，需要：
- 要么给其中之一换主题
- 要么通过 wx-md 的 ColorCustomizer 在运行时叠加一层自定义配色
