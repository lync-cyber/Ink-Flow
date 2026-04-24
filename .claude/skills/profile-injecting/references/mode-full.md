# Profile Injector · full 模式

## 流程

### Step 1 — 合法性校验

```bash
python framework/tools/validate_profile.py profiles/<id>
```

失败 → 打印错误、中止。

### Step 2 — 切换 active + 触发 resolver

```bash
python framework/tools/inject_profile.py set-active <id>
```

内部调用链：
1. 写 `runtime/profile-lock.yaml.activeProfile = <id>`
2. 调 `profile_resolver.py` 合成 → 写 `runtime/profile-resolved/*`

### Step 3 — 维护 CLAUDE.md marker block

CLAUDE.md 中已有这段：

```markdown
<!-- inkflow:profile:begin -->
@runtime/profile-resolved/principles.md
@runtime/profile-resolved/voice.md
@runtime/profile-resolved/typesetting.yaml
@runtime/profile-resolved/constraints.yaml
<!-- inkflow:profile:end -->
```

`@`-imports 路径不变（合成产物文件名固定），故切换 Profile 不需要改 CLAUDE.md。

### Step 4 — 回显

```
Profile 'lync-wechat-tech' 已绑定。
extends 链: base-generic-chinese@1.0.0 < platform-wechat@0.2.0 < lync-wechat-tech@1.0.0
合成产物: runtime/profile-resolved/

下一步：
  /profile show                # 查看详情
  开始写作：告诉我文章主题
```

## 失败回滚

若 Step 2 中 resolver 失败（extends 循环 / slot 文件缺失）：
1. lock 已写入但 resolved 未更新 → `profile_resolver.py --profile <old-id>` 回滚合成
2. 或 `inject_profile.py unuse` 清空绑定
