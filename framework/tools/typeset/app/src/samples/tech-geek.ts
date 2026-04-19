export const techGeekSample = `# 一次 LLM 调试的复盘

::: intro 一次把 Bug 归因到"编码顺序"的事故
凌晨两点在灰度流上看到诡异的 401，一层层剥开才发现是一个 \`\\n\` 被吃掉了。
:::

::: cover 本周工程随笔
![封面占位](https://placehold.co/1200x630?text=tech-geek)

> \`$ cat this_week.md\`
:::

::: author 林墨 role=基建工程师
长期跑在 LLM 基础设施一线。
:::

::: divider variant=wave
:::

## 症状：一个看似"间歇"的 401

请求路径完全一致，却有 3% 概率被拒。线上常见的嫌疑——网络抖动、token 过期、负载不均——==全部排除==。

::: tip 经验法则
当"间歇性失败"比例稳定在某个非典型值（3%、7%），通常是枚举型原因，不是概率型。
:::

\`\`\`ts
const signature = hmacSha256(
  secret,
  \`\${method}\\n\${path}\\n\${body}\`,  // <- 这一行是锅
)
\`\`\`

问题出在 \`body\` 序列化时部分路径走了 \`JSON.stringify\` 的排序实现，另一部分没走。服务端用的是后者——两边字符串差一个 key 顺序，签名就崩。

::: warning 坑点
**不要**在任何签名管线里信任"自然 JSON 顺序"，\`Object.keys\` 的顺序只在 V8 里稳定。
:::

::: divider variant=dots
:::

## 对比两种修法

:::: compare

::: pros 方案 A · 两端都显式 sort
- 客户端、服务端共享 \`sortedStringify\`
- 零第三方依赖
- 兼容存量签名（对小写 key 无损）
:::

::: cons 方案 B · 切换到 JWS
- 彻底切到标准 JWS，重写整条签名链
- 旧客户端需双签过渡期
- 好处是以后"签名协议"是业界标准
:::

::::

::: info 落地选择
短期 A，长期 B。A 上线 30 分钟，B 排到下个季度。
:::

::: divider variant=flower
:::

## 复盘清单

::: steps 四步走
### 复现
用生产 trace 提取 payload，本地重放直到 401 必现。

### 定位
对比签名字符串的 hex diff，发现 key 顺序不同。

### 修复
两端统一 \`sortedStringify\`，灰度 5% 观察 1 小时。

### 防线
CI 加一条"签名一致性"冒烟用例，payload 覆盖 50 条线上样本。
:::

::: divider variant=wave
:::

## 金句与推荐

::: quote-card 做基建的朋友
每一次凌晨的故障，最后都会变成 CI 里的一条测试用例。
:::

::: danger 别再犯
线上签名函数永远不要接受"隐式排序"。
:::

::: footer-cta 同频的话 cta=关注我
写工程、写复盘、写失败。每周一更。
:::

::: recommend 延伸阅读
- [HMAC 签名工程化要点](https://example.com/hmac)
- [JSON 规范顺序 RFC](https://example.com/rfc)
:::
`
