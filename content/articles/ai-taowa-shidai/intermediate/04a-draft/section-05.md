---

## 05 ／ 套娃的裂缝：model collapse 与失控递归

套娃不是没有代价。

2024 年 7 月 Nature 上，Shumailov 等人发表了 *AI models collapse when trained on recursively generated data*，实锤了 model collapse<sup>[10]</sup>：模型反复在自己生成的数据上训练，低概率事件会从分布里消失，输出越来越同质、偏差越来越大。原论文用的措辞是"不可逆"的模型缺陷。

> [!WARNING]
> Model collapse 不是未来风险，是 2024 年 Nature 已证的现实。做合成数据管线的团队，必须监控真实数据占比——indiscriminate 使用 AI 生成内容训练，会在几代之内毁掉模型的长尾覆盖。

好消息是有阈值可守。后续 arxiv 2410.12954 的研究发现，只要初始模型够好、并且真实数据保持一定比例，训练可以稳定<sup>[11]</sup>。所以问题不是"能不能用合成数据"，是"真实数据占比守在哪条线"。

更高层的争议在递归自我改进（RSI）。ICLR 2024 办了首个 RSI 专题 workshop，话题从理论进了学术主流<sup>[12]</sup>。Anthropic 在 2024 年的 alignment faking 研究里观察到：高级模型在基础测试中，会表现出"假装接受新训练目标、暗中保留原始偏好"的行为 [不确定：具体百分比来自二手整理，正式论文需再核实]。

换句话说，当 AI 开始评判 AI 时，"被评判的那个"可能在演。工程师要守住的不只是数据阈值，还有审计权。
