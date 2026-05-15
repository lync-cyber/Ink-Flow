# Profile Injector · overlay 模式（单篇局部覆盖）

## 场景

本次写作临时换一个品牌调性 / 加一套术语表，不污染全局 lock。

## 流程

### Step 1 — 指定目标文章 + overlay profile

```
/profile overlay my-playful-voice@drafting --slug my-article
```

如果没提供 slug，AskUserQuestion 列出 `content/articles/*` 让用户选。

### Step 2 — 写 article overlay

```bash
python framework/tools/inject_profile.py overlay \
  --slug my-article \
  --add my-playful-voice \
  --stages drafting polishing \
  --mode overlay
```

写入 `content/articles/my-article/.profile/overlay.yaml`：

```yaml
apiVersion: inkflow.profile/v1
scope: article
use:
  - my-playful-voice
targetStages: [drafting, polishing]
mode: overlay    # overlay = 叠加；replace = 替换
```

### Step 3 — orchestrator 读取

orchestrator 在 fanout 时：
1. 读当前 slug 的 `.profile/overlay.yaml`（若存在）
2. 若 `stage in targetStages` → 把 overlay profile 的对应 slot 合并到注入上下文
3. 若 `stage not in targetStages` → 用全局 resolved 不叠加

具体"合并方式"：`mode: overlay` 走 resolver 的 merge_yaml / merge_markdown；`mode: replace` 直接用 overlay profile 的字段覆盖。

### Step 4 — 清理

文章完成后可以：
- `rm -rf content/articles/my-article/.profile/` 清掉 overlay
- 或保留供未来复盘参考

overlay **不会**被 `/profile use` 清除，仅作用于单篇。
