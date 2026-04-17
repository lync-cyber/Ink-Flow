# 从 Python 到 Rust：重写推理引擎的 8 个教训

> 用 Rust 重写核心推理路径后，P99 延迟从 120ms 降到 28ms，内存占用减少 80%，线上崩溃率从 0.8‰ 降至 0.02‰。本文只记录真正有效的模式和踩过的坑。

## 为什么要重写

Python 版的瓶颈集中在两处：GIL 导致的多核利用率不足，以及每次推理触发的大量堆内存分配。用 `py-spy` 分析 profiling 数据后发现：

- 序列化 / 反序列化占总耗时 **60%**
- 真正的模型推理（ONNX Runtime）只占 **25%**
- GIL 等待和 GC 占剩余 **15%**

## 关键指标对照

| 指标 | Python 版 | **Rust 版** | 提升 |
|---|---|---|---|
| P50 延迟 | 45 ms | **12 ms** | 3.75× |
| P99 延迟 | 120 ms | **28 ms** | 4.3× |
| 内存峰值 | 2.1 GB | **380 MB** | 5.5× |
| 部署包大小 | 350 MB | **12 MB** | 29× |

## 实现模式

### 教训 1：全局 Context 用 OnceLock

```rust
use std::sync::OnceLock;

static CTX: OnceLock<InferContext> = OnceLock::new();

pub fn infer(input: &Tensor) -> Result<Tensor> {
    let ctx = CTX.get_or_init(|| InferContext::new());
    ctx.run(input)
}
```

`OnceLock` 是 Rust 1.70 标准库原生支持，无需宏，比 `lazy_static` 编译更快。

### 教训 2：读多写少用 RwLock

```rust
static MODEL: RwLock<Option<OrtModel>> = RwLock::new(None);
```

在读写比 100:1 的推理场景，`RwLock` 比 `Mutex` 吞吐量高约 **3×**。

#### 8 条避坑清单

1. `Arc<Mutex<T>>` 读多写少时改 `Arc<RwLock<T>>`
2. `serde_json::Value` 在关键路径上性能很差，直接反序列化到具体类型
3. `tokio::spawn_blocking` 不能过度使用，会打爆默认线程池
4. FFI 边界避免频繁 `CString::new`，用 thread_local 预分配
5. `Vec::with_capacity` 比 `Vec::new` + push 在已知长度时快约 20%
6. 避免在 async fn 内持有 `MutexGuard` 跨 `.await` 点
7. 用 `#[inline(always)]` 标注热路径小函数
8. 部署前用 `cargo flamegraph` 确认优化确实生效，不要凭感觉

---

源码参考：[github.com/example/infer-rs](https://github.com/example/infer-rs)
