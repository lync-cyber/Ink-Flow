# Pipeline 配置参考

`framework/config/inkflow.yaml` 是 InkFlow 的单一事实来源，同时定义流程顺序、产物合约和校验规则。

## 目录

- [顶层字段](#顶层字段)
- [stages 字段详解](#stages-字段详解)
- [exports 字段](#exports-字段)
- [paths 常量](#paths-常量)
- [typeset_adapter 配置](#typeset_adapter-配置)

---

## 顶层字段

```yaml
workspace_mode: content    # content（创作模式）| framework（框架开发模式）

domains:
  - wechat-article         # 当前工作区的业务域

model_allocation:          # 各 agent 使用的模型（权威来源）
  orchestrator: opus
  researcher: sonnet
  atomizer: sonnet
  outliner: opus
  writer: opus
  illustrator: sonnet
  auditor: opus
  polisher: opus
  publisher: sonnet

defaults:                  # brief 字段的默认值
  target_length: 1500
  content_type: deep_dive
  audience: tech_intermediate
  skip_research: false
  no_figures: false
  target_platforms: [wechat]
  primary_platform: wechat
```

---

## stages 字段详解

每个 stage 是流水线的一步。字段说明：

```yaml
stages:
  - name: <stage-name>          # 阶段名（唯一标识）
    type: user_input            # user_input 表示 orchestrator 直接生成，无独立 agent
    agent: <agent-name>         # 执行此阶段的 agent
    per_platform: true          # true 时按 brief.target_platforms 扇出
    parallel: true              # true 时各平台实例并行执行
    parallel_with: [<stage>]    # 可与哪些阶段并行
    checkpoint: true            # true 时需用户审核才能推进（CP1/CP2/CP3）
    requires: [<stage>, ...]    # 依赖的前置阶段
    skip_if: "<condition>"      # 跳过条件，从 brief frontmatter 读值

    output: "<path-template>"   # 主产物路径（{slug} / {platform} / {N} 为占位符）
    section_output: "..."       # 逐节产物路径（writer 专用）
    individual_outputs: [...]   # 多个产物路径（atomizer 专用）
    final_output: "..."         # 终稿路径（polisher 专用）

    validation:                 # orchestrator 在 agent 完成后独立校验
      required_sections: [...]         # 产物必须包含的 H2 节标题
      required_per_section: [...]      # 每节必须包含的字段
      required_patterns: [...]         # 产物必须匹配的正则
      forbidden_patterns: [...]        # 产物不得包含的正则
      required_frontmatter_per_atom: [...] # atomizer 专用：atom 必填 frontmatter 字段
      word_count: { min: N, max: N }   # 字数范围
      severity_levels: [高, 中, 低]   # audit 报告必须包含的严重级别
      issue_table_header: "..."        # audit 报告问题表头格式
      section_tolerance: 0.20          # writer：字数允许偏差（20%）
      merged_word_count_from: "path#/jsonpath"  # 从配置文件读取字数限制
      forbidden_phrases_from: "path#/jsonpath"  # 从配置文件读取禁用词
      platform_checks:                 # polisher 专用：平台合规校验
        - type: css_safety
          source: "runtime/profile-resolved/typesetting.yaml#/cssSafety"
        - type: heading_level
          source: "runtime/profile-resolved/typesetting.yaml#/heading"
        - type: image_width
          source: "runtime/profile-resolved/typesetting.yaml#/imageWidth"
```

### 路径占位符

| 占位符 | 含义 |
|--------|------|
| `{slug}` | 文章的 slug（由 brief 决定） |
| `{platform}` | 平台名（wechat / juejin / zhihu / xiaohongshu） |
| `{N}` | 序号（section、figure 等） |

---

## exports 字段

定义 publish 阶段的各平台产物格式：

```yaml
exports:
  - format: wechat_md
    platform: wechat
    description: "Markdown Nice 适配格式"
    output: "content/articles/{slug}/export/08-wechat-publish.md"

  - format: teaser
    platform: wechat
    output: "content/articles/{slug}/export/08-teaser-120chars.md"
    word_limit: 120
```

---

## paths 常量

```yaml
paths:
  articles_root: content/articles
  profiles_root: profiles
  profile_resolved_dir: runtime/profile-resolved    # agent 唯一读源
  profile_lock: runtime/profile-lock.yaml
  references_dir: content/references
  retrospectives_dir: content/retrospectives
  state_dir: runtime/pipeline-states
  writing_kernel: framework/contracts/writing-kernel.md
  profile_protocol: framework/contracts/profile-protocol.md
  artifact_layout: framework/config/artifact-layout.yaml
```

---

## typeset_adapter 配置

非 pipeline 阶段，描述与 wechat-typeset 对账的元数据：

```yaml
typeset_adapter:
  adapter: wechat-typeset
  contract: framework/contracts/wechat-typeset.schema.json
  required_version: ">=0.2.0,<0.3.0"
  dist_dir: null          # null 时按约定路径 ../wechat-typeset/dist 查找
  launcher:
    repo: https://github.com/lync-cyber/wechat-typeset
    local_default_url: http://127.0.0.1:7788/
```

`dist_dir` 解析优先级：
1. `WECHAT_TYPESET_DIR` 环境变量
2. `dist_dir` 字段（若非 null）
3. `../wechat-typeset/dist`（约定的同级目录路径）
