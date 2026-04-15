:::label
文章头部区
:::

# ONNX Runtime在ARM边缘设备上的量化部署实战

:::label
正文排版
:::

在工业质检场景中，传统的基于规则的视觉检测方法正面临越来越大的挑战。**产品迭代速度加快**意味着缺陷模式不断变化，而人工标注的成本居高不下。近年来，~~无监督异常检测~~展现出了突破性潜力。

本文将逐一拆解关键障碍，并给出[经实际验证的解决路径](https://example.com)。

:::label
二/三级标题
:::

## 环境配置与依赖安装

### Step 1: 交叉编译工具链

:::label
引用块
:::

> 提示：ARM v8架构建议直接使用预编译包，可跳过本节。

:::label
信息卡片
:::

:::card
环境要求
OS：Ubuntu 20.04+
Python：3.8 - 3.11
RAM：≥ 4GB
:::

:::label
列表样式
:::

1. 使用ONNX导出PyTorch模型
2. 执行INT8动态量化
3. 在ARM设备上进行基准测试

:::label
分割线
:::

---

:::label
图片与图注
:::

![图：ONNX Runtime推理流程](https://example.com/arch.png)

:::label
代码/公式块
:::

```python
# 加载量化模型
import onnxruntime as ort
sess = ort.InferenceSession("model_int8.onnx")
```

:::label
表格
:::

| 指标 | 基线 | 优化后 | 提升 |
| --- | --- | --- | --- |
| 推理延迟 | 48ms | 12ms | ↓75% |
| 模型体积 | 340MB | 42MB | ↓88% |
| AUROC | 98.1% | 99.6% | ↑1.5% |

:::label
行动引导
:::

:::cta
完整代码已开源
github.com/user/project
Star
:::

:::label
文末固定区
:::

:::footer
:::

:::label
音视频嵌入 [N]
:::

:::media
技术播客：边缘部署踩坑记 / ONNX模型转换流程演示
:::

:::label
小程序卡片 [N]
:::

:::miniapp
代码演示环境 — 在线运行本文代码示例
:::

:::label
话题标签 [N]
:::

:::hashtag
#ONNX部署 #模型量化 #边缘计算
:::

:::label
合集导航 [N]
:::

:::collection
边缘部署实战系列：① 模型选型与压缩 / ② 量化与ONNX转换 / ③ ARM设备部署（本篇）
:::

:::label
投票互动 [N]
:::

:::vote
边缘部署最常遇到的问题？内存溢出 / 精度损失 / 编译配置 / 性能不达标
:::

:::label
阅读原文引导 [N]
:::

:::readmore
:::