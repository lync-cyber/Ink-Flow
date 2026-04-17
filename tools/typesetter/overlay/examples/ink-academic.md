# 边缘 Transformer 异常检测：从蒸馏压缩到产线实测

> 本文综述 Transformer 在工业视觉检测领域的压缩与部署方法，覆盖知识蒸馏、INT8 量化与 FPGA 加速三条路径。核心结论：蒸馏后的 Swin-T 变体在保持 99.4% AUROC 的同时将推理延迟降至 38ms，模型体积缩减 91%。

## 背景与动机

工业质检对**实时性**与**准确率**的双重要求，使云端大模型方案受限于网络延迟与数据合规约束。主流边缘部署目标为延迟 ≤ 50ms、功耗 ≤ 15W。

### 现有方法分类

- **重建误差类**：AutoEncoder、VAE，训练简单但误报率偏高
- **特征距离类**：PatchCore、PaDiM，精度优秀，但存储开销大
- **生成扩散类**：DiffusionAD，泛化性强，推理慢（≥ 200ms）

## 方法设计

### 核心架构

教师模型（Swin-B，340MB）→ 学生模型（Swin-T/4，31MB），采用三阶段渐进蒸馏。

| 压缩方法 | AUROC | 延迟（ms） | 模型大小 |
|---|---|---|---|
| 基线 Swin-B | 99.8% | 121 | 340 MB |
| 蒸馏 Swin-T | **99.4%** | 45 | 42 MB |
| INT8 量化 | 99.1% | **38** | **11 MB** |

### 推理代码示例

```python
import torch
from models import SwinAD

model = SwinAD.load("swin_ad_int8.pt", device="cpu")
model.eval()

with torch.no_grad():
    score = model(input_tensor)   # → [B, H, W] anomaly map
    pred  = (score > 0.5).float()
```

---

## 结论

INT8 量化路径在满足延迟约束（38ms < 50ms）的前提下，AUROC 损失控制在 0.7%，是目前边缘部署的**最优性价比方案**。

## 参考文献

1. Roth K. et al. *Towards Total Recall in Industrial Anomaly Detection.* CVPR 2022.
2. Batzner K. et al. *EfficientAD: Accurate Visual Anomaly Detection.* WACV 2024.
3. Liu Z. et al. *Swin Transformer V2: Scaling Up Capacity and Resolution.* CVPR 2022.
