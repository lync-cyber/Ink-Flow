# typesetter / steps 模块

> 七步流程的详细操作；主 agent prompt 只列骨架，需要执行细节时按需 Read 本文件。

## Step ① — health

```bash
python framework/tools/_adapters/cli.py health
```

- ok=false → 在终端把 reason 原文抛给用户；写一句"CP3 blocked: capabilities missing"
  汇报给 orchestrator；**不**写 09-plan / annotated / meta.json。
- ok=true 且 version 非 SemVer → 本 agent 视同失败（adapter 内部已拒绝，但 double-check）。

## Step ② — capabilities

```bash
python framework/tools/_adapters/cli.py capabilities --cache
```

成功后 `runtime/typeset-capabilities.json` 是本次决策的唯一 id 白名单。

## Step ③ — docs（容器知识外部化的关键动作）

```bash
python framework/tools/_adapters/cli.py docs
```

返回形如：

```json
{"paths": {
  "containerSyntax": "C:/.../wechat-typeset/docs/container-syntax.md",
  "skillReadme":     "C:/.../wechat-typeset/skills/wechat-typeset/SKILL.md",
  "personas":        "C:/.../wechat-typeset/skills/wechat-typeset/references/personas.md",
  "hardRules":       "C:/.../wechat-typeset/skills/wechat-typeset/references/hard-rules.md"
}}
```

**至少 Read 两个**：`containerSyntax`（容器语法 SSOT）与 `personas`（选型信号）。
本 agent 绝不靠记忆生成容器名。

## Step ④ — PLAN

1. Read 01-brief.md、03-outline/wechat.md，判断栏目 / 内容类型。
   **outline 只给"语义信号"**（`visual_signature_hint` 枚举词 + `key_visual_moments` 描述），
   **不给容器/persona id**——容器选型完全归本 agent（P1-7 职责收敛）。
   把 hint 当作排序权重：
     - tech_tutorial / tech_deep_dive  → persona 优先 tech-explainer / tech-geek
     - academic_summary               → persona 优先 academic-analyst
     - industry_alert / opinion_polemic → persona 优先 industry-edge
     - story_emotional / story_career_lesson → persona 优先 story-narrator
   （以上仅为 hint→persona 映射建议；最终以 capabilities + AskUserQuestion 为准）
2. Read `framework/config/columns.yaml` 的 `columns.{column}.typeset.persona_candidates`
   （若该栏目声明了）：
   - `primary` + `alternates` 作为 AskUserQuestion 的**首选项排序**，`reasons` 作为每项的
     一句理由说明。
   - 字段缺失或字段里的 id 不在 capabilities.personas[] → 回退到"读 personas.md 自由匹配"
     路径，但必须在 plan.md 里记一行"栏目未声明 persona 推荐"。
3. Glob `content/articles/*/intermediate/09-typeset-plan.md`，读其 frontmatter 的 `persona`
   和 `signature`：
   - 同栏目同 persona 已出现 N≥2 次 → AskUserQuestion 附带提示"你已为该栏目用过 N 次 {id}，
     是继续保持一致还是这一篇刻意反转"
   - 签名容器 + 变体的**精确组合**在同栏目已用过 → 必须换一个（强约束，防撞车）
4. 用 **一轮强制 AskUserQuestion** 让用户最终落子（选项 = 栏目推荐排序 + 自由写入）。
5. 写 `content/articles/{slug}/intermediate/09-typeset-plan.md`，frontmatter 必含 `persona`
   字段，正文必含"栏目推荐 → 历史记录 → 本次选择"三栏表格（见 format.md）。

## Step ⑤ — ANNOTATE

1. 把 `export/08-wechat-publish.md` **逐段复制**到
   `export/08-typeset/wechat/annotated.md`。
2. 按 plan 在合适位置**包**容器。语法一律以 Step ③ 读到的 container-syntax.md 为准：
   - 容器名 kebab-case：`quote-card` / `section-title` / `footer-cta`
   - admonition 不是容器；用 `tip` / `warning` / `info` / `danger` / `note`
   - 属性写在 open 行：`::: tip variant=terminal 标题`（**禁止** `{variant="..."}`）
   - variant 覆盖靠 open 行 `variant=xxx`（**禁止** `<!-- variant=xxx -->` 注释）
   - compare 外层 `::::`、内嵌 `::: pros` / `::: cons` 内层 `:::`；**不要**把 GFM 表格
     当 compare 正文
3. **字数不动**：除新增的 `:::` 行外，每段正文字数必须与 publish 版本相等。
4. **frontmatter 不塞** `typeset: {...}` 孤儿块——wechat-typeset 不消费；persona
   信息只在 plan 与 meta.json 里记。

## Step ⑥ — conform

```bash
python framework/tools/_adapters/cli.py conform \
    --persona <id> \
    --signature <container>=<variant> \
    --variant-override <c>=<v>... \
    --markdown content/articles/{slug}/export/08-typeset/wechat/annotated.md
```

violations 非空 → 回 Step ④ 修。**禁止**把 violations 当警告放过。

**特别处理：图片 src 为本地路径**（形如 `../intermediate/04b-figure/wechat/*.png`）时，
conform 会报 `image src 'xxx' is a local/relative path`。修法两条路子：

1. **手动上传**（最常用）：把相应 png 传到 CDN / GitHub / 公众号素材库，在 annotated.md
   里把 src 换成 `https://...` 或 `data:image/png;base64,...`；上游（publisher）也应同步替换。
2. **粘贴时人工补图**：接受 annotated.md 仍有本地路径，上游约定在 wechat-typeset launcher
   里粘贴后再用编辑器功能插入图片。这条路子让 conform 保持 warning 也行，但必须在
   meta.json 的 `validate.issues` 里留一条 `kind: "local_image_manual_upload"` 的备忘。

默认走 (1)。agent 自身**不**上传——凭证/权限是用户决定，这一步出人意料地应该 AskUserQuestion。

## Step ⑦ — validate

```bash
python framework/tools/_adapters/cli.py validate \
    --input content/articles/{slug}/export/08-typeset/wechat/annotated.md \
    --persona <id>
```

- ok=true → 写 meta.json + 返回 orchestrator
- ok=false → issues 里每条都给了 line + hint，按 hint 修 annotated.md 后重试；
  重试超 3 次仍不过 → 把失败详情写到 meta.json.errors 并置 CP3=failed
