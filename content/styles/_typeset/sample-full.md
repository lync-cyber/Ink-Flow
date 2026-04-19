<!--
  wx-md · 全量容器 × 全部 variant 样例
  ============================================================
  用途：
    1. 给 LLM 的"典型输入参考"：typeset-authoring skill 看这份文件学"什么场景用什么容器/variant"
    2. 排版工具回归测试：23 个 variant 在任意主题下都要能完整渲染、无抛错
    3. 个人排版参考：用户在组件库里不确定选哪个时，先在编辑器里粘这份对着看

  规则：
    - 每个 variant 前有形如 <!-- variant=X 展示 Y --> 的定位注释，LLM 可按注释反查位置
    - variant 覆盖：admonition 6 种 + quote 4 + compare 3 + steps 3 + divider 5 + section-title 2 = 23
    - 无 variant 的容器（intro / cover / author / highlight / footer-cta / recommend / qrcode / mpvoice / mpvideo）各出现一次
    - 行内扩展（==高亮== ~~波浪~~ *斜体* **加粗** `inline code` [.着重.] [~波浪~]）集中在"四、行内与代码"一节

  不做的事：
    - 本文件只验证结构完整，不保证"每段文案都值得发表"——真实成文仍需人工打磨
    - attrs.variant 是按容器级临时覆盖；如果想把某 variant 设为主题默认，改 theme.variants，不要在 md 里反复写
-->

::: intro 全量样例导读
这份样稿把 wx-md 当前全部 19 个容器、23 个 variant 和行内扩展放在同一页。切主题时它应该继续成立，任何一格崩了就是 bug。
:::

::: cover 拍一张抽象封面也行
![封面占位图](https://placehold.co/1200x630?text=wx-md)

_一行说明文字，和封面一起被排版工具按主题色调卡住。_
:::

::: author 编辑部 role=主笔
两年内容，三年工具。写给能被长文留住的人。
:::


<!-- section-title variant=bordered（默认骨架：底部细色线） -->
::: section-title 一、章节标题的两种骨架
:::

主题里声明 `variants.sectionTitle = 'bordered'` 时，所有 `::: section-title ...` 都用同一骨架。下面这行用 `variant=cornered` 做局部覆盖，便于对比。

<!-- section-title variant=cornered（左上角 SVG 装饰，无底线） -->
::: section-title variant=cornered 折角装饰变体
:::

如果你要做"目录页"或"章节扉页"，cornered 更安静；bordered 更工具化，信息密度大的技术稿偏向它。


<!-- section-title variant=bordered -->
::: section-title 二、四色提示的六种骨架
:::

提示容器（tip / warning / info / danger）的**骨架**由 `variants.admonition` 决定，颜色仍来自 `tokens.status`。也就是说 **「同一个 variant 骨架，四种颜色各一份」**，总视觉种类是 6 × 4 = 24。

<!-- admonition variant=accent-bar（默认：左 3px 色条 + 浅底） -->
::: tip 适合说明 API 字段的细节 variant=accent-bar
accent-bar 最低调，几乎隐形。正文多、提示多的技术稿默认用它，避免五颜六色刺眼。
:::

<!-- admonition variant=pill-tag（顶部胶囊标签：标题悬于边缘） -->
::: warning 提醒读者注意版本差异 variant=pill-tag
pill-tag 把标题拎到容器边缘之上，扫读时能先被"标签文字"抓住；信息密度高时慎用，三个以上会抢主线。
:::

<!-- admonition variant=ticket-notch（票根缺口：左右圆切齿） -->
::: info 发放优惠券/活动须知一类的仪式感 variant=ticket-notch
ticket-notch 用 SVG data-URI 做了票根缺口。社群运营、福利通知类栏目用它有"入场券"气质。
:::

<!-- admonition variant=card-shadow（纯阴影卡，无左条） -->
::: danger 涉及不可逆操作，务必再读一遍 variant=card-shadow
card-shadow 最"产品化"——无框、仅阴影。适合风格更接近 App 界面的内容，不适合浓墨重彩的散文。
:::

<!-- admonition variant=minimal-underline（无底色，仅标题下划线） -->
::: tip 给不想打扰正文节奏的小提示 variant=minimal-underline
minimal-underline 几乎"融化"进正文。长文连续穿插提示时用它，读者察觉不到"又被打断了"。
:::

<!-- admonition variant=terminal（黑底 + 三个交通灯圆点） -->
::: info macOS 终端复刻风 variant=terminal
terminal 适合"代码审查笔记"、"命令速查"之类正文里八成是 `mono` 字面的段落；整篇都 terminal 会让读者疲劳。
:::


<!-- section-title -->
::: section-title 三、引用 / 对比 / 步骤 / 分隔
:::


### 3.1 金句引用：四种骨架

<!-- quote variant=classic（大号引号 + 居中） -->
::: quote-card 王小波 variant=classic
一切都不能阻止我爱这世界。
:::

<!-- quote variant=magazine-dropcap（首字下沉） -->
::: quote-card 罗兰·巴特 variant=magazine-dropcap
真正的作者不是怀有某种观念的人，而是发现一种句法的人。
:::

<!-- quote variant=column-rule（双侧细竖线） -->
::: quote-card 史铁生 variant=column-rule
所谓命运，就是说，这一出充满了危机的戏剧需要一个连贯的主题，于是就有一些角色必得担当可怕的责任。
:::

<!-- quote variant=frame-brackets（四角 L 形装饰） -->
::: quote-card 博尔赫斯 variant=frame-brackets
我心里一直在暗暗设想，天堂应该是图书馆的模样。
:::


### 3.2 两栏对比：三种布局

<!-- compare variant=column-card（默认：table 两列） -->
:::: compare variant=column-card

::: pros 为什么选 wx-md
- 主题与正文解耦，换色不改结构
- 容器语法可版本化，Diff 人读得懂
- 自带 LLM 语义稿约定，适合内容工作流
:::

::: cons 暂时不适合
- 强动效图文（公众号平台本身剥）
- 需要精确像素级对齐的海报稿
:::

::::

<!-- compare variant=stacked-row（上下堆叠，小屏友好） -->
:::: compare variant=stacked-row

::: pros 堆叠式的好处
两栏在 375px 屏幕里被压到文字换行，可读性差。堆叠式直接让它上下排，单列显示。
:::

::: cons 代价
占用垂直空间更多，翻页次数增加。
:::

::::

<!-- compare variant=ledger（账本双色：绿 / 红） -->
:::: compare variant=ledger

::: pros 收入项
- 订阅费 · 广告分成
- 付费阅读 · 咨询
:::

::: cons 支出项
- 服务器 · 设计外包
- 推广投放
:::

::::


### 3.3 步骤流程：三种骨架

<!-- steps variant=number-circle（默认：圆圈编号） -->
::: steps 上线清单 variant=number-circle
### 跑 lint
`bash .claude/skills/quality-linting/scripts/lint.py`，所有 error 清零。

### 预览三主题
在 wx-md 顶部下拉切换，确认无主题特有崩版。

### 复制进公众号
点"一键复制"，粘贴到公众号后台图文编辑器。
:::

<!-- steps variant=ribbon-chain（飘带链式） -->
::: steps 三阶段内容流水 variant=ribbon-chain
### 选题
读者视角 × 自己擅长，两列清单求交集。

### 初稿
30 分钟只写"今天想明白的一句话"。

### 修改
放一夜，第二天读出声修一遍。
:::

<!-- steps variant=timeline-dot（左侧时间轴点） -->
::: steps 发稿当天时间线 variant=timeline-dot
### 07:30
起床，重读昨晚终稿，只修错字。

### 09:00
推送，转发到社群，置顶。

### 21:00
复盘数据，记录一条"下次改进"。
:::


### 3.4 分隔线：五种

<!-- divider variant=wave（波浪线） -->
::: divider variant=wave
:::

<!-- divider variant=dots（三点） -->
::: divider variant=dots
:::

<!-- divider variant=flower（花饰 SVG） -->
::: divider variant=flower
:::

<!-- divider variant=rule（一道纯色线，默认骨架） -->
::: divider variant=rule
:::

<!-- divider variant=glyph（单字符装饰，可用 attrs.glyph 换） -->
::: divider variant=glyph glyph=◆
:::


<!-- section-title -->
::: section-title 四、行内与代码
:::

这一段把所有行内扩展堆在一起，检查 ==高亮==、~~波浪~~、*斜体*、**加粗**、`inline code`、[.着重.]、[~波浪2~]、[外链](https://example.com) 同时出现时的节奏。一个段落里**不要**一次用全部七种——此处只是为了扫描。

> 普通引用块用来承载一句不那么重的观点，不抢焦点。适合嵌在论证链条中间。

::: highlight
把复杂写简单，是对读者的尊重；把简单写复杂，是对自己的谄媚。

高亮块适合整段压重点，不适合只高亮一行——一行用 `==` 就够。
:::

无序列表：

- 主题 = tokens + elements + containers + assets + templates + inline + variants
- 每个维度可独立替换，相互正交
- 读者 365 天内能明显感受到的是 tokens（色）与 variants（骨架）

有序列表：

1. 先定 tokens（色 + 字号 + 行距）
2. 再挑 variants（骨架，和色彩正交）
3. 最后调 assets（SVG 装饰，点缀用）

任务列表：

- [x] D1 类型扩展
- [x] D2 渲染器重构
- [x] D3 组件库 registry
- [ ] D7 variant 快照测试

脚注[^1] 在正文中出现时，导出到公众号会被转成脚注列表。[^1]: 这是脚注内容，微信会排到文末。

表格：

| 主题 | 基调 | 适用栏目 |
| --- | --- | --- |
| 默认 | 冷白 | 技术 / 工具 |
| tech-geek | 深夜 | 技术 / 产品 |
| life-aesthetic | 暖米 | 生活 / 旅行 |
| business-finance | 锐利 | 商业 / 财经 |
| literary-humanism | 素雅 | 散文 / 书评 |

代码块（含高亮）：

```ts
import { render } from './pipeline'
import { getTheme } from './themes'

const theme = getTheme('default')
const { html, wordCount } = render({
  md: '# Hello wx-md',
  theme,
})
console.log(`字数 ${wordCount}`)
```

单行 shell：

```bash
npm run build && npm run test
```


<!-- section-title -->
::: section-title 五、媒体占位
:::

<!-- mpvoice：粘贴到公众号后台需手动关联真实音频 -->
::: mpvoice 开篇语（占位：导出后在公众号素材库挂真实 fileid）
:::

<!-- mpvideo with qqvid：直接渲染 v.qq.com iframe -->
::: mpvideo 产品演示 qqvid=placeholder-qqvid-xxx
:::

<!-- mpvideo without qqvid：降级为占位卡 -->
::: mpvideo 季度复盘视频
:::


<!-- section-title -->
::: section-title 六、文末模块
:::

::: footer-cta 如果这篇对你有启发 cta=点此关注
每周一篇深度长文，愿意被慢读、愿意留言互相打磨。
:::

::: recommend 延伸阅读
- [wx-md 的十个设计取舍](https://example.com/a)
- [LCH 色彩生成手册](https://example.com/b)
- [公众号排版里那些不能写的 CSS](https://example.com/c)
:::

::: qrcode 扫码加入读者群（每月更新邀请码）
![二维码占位](https://placehold.co/240x240?text=QR)
:::
