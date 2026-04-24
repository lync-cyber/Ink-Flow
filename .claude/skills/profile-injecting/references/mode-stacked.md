# Profile Injector · stack 模式（临时虚拟组合）

## 场景

想试验"A 的 voice + B 的 typesetting + C 的 constraints"组合，但不想新建物理 Profile 目录。

## 流程

### Step 1 — 构造虚拟 lock

```
/profile stack base-generic-chinese + platform-wechat + my-voice@voice-only + my-constraints@constraints-only
```

可识别的 suffix：
- `@voice-only` / `@voice+principles` / `@typesetting-only` / `@constraints-only` — 仅取该 Profile 的对应 slot
- 无 suffix → 全部 slot 都取

### Step 2 — 写临时 lock

写入 `runtime/profile-lock.yaml`：

```yaml
apiVersion: inkflow.profile/v1
activeProfile: __stacked__
resolved:
  - { id: base-generic-chinese, version: 1.0.0 }
  - { id: platform-wechat,       version: 0.2.0 }
  - { id: my-voice,              version: 1.0.0, slotsOnly: [voice] }
  - { id: my-constraints,        version: 1.0.0, slotsOnly: [constraints] }
stacked: true
lockfileVersion: 1
```

resolver 在遇到 `stacked: true` 时，对 `slotsOnly` 字段只合并列出的 slot，其他 slot 忽略。

### Step 3 — 试用

照常跑写作流程，observe 产物。

### Step 4 — 满意则固化

```
/profile save-stack my-combo
```

会把虚拟 lock 合成的 resolved 内容作为一个新的物理 Profile Pack 落盘到 `profiles/my-combo/`，
并将 `activeProfile` 切到 `my-combo`。

### Step 5 — 不满意则回退

```
/profile use lync-wechat-tech
```

直接切回原 Profile，stack 丢弃。
