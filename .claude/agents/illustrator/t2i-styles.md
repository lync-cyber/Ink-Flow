# illustrator / 文生图风格库（Midjourney · ChatGPT 2.0 · Stable Diffusion）

> 当 HTML/SVG 都无法胜任（真人、真实场景、情绪氛围、品牌摄影感）时使用文生图。
>
> 本文件用于约束 illustrator 写出的 prompt：必须从内置 4 套之一起步，按平台 / 栏目挑色板与构图，最后输出英文 prompt（含 negative）+ 渠道参数。
>
> **禁止口令**：`ultra realistic, 8k, hyperdetailed, masterpiece, trending on artstation, octane render`——这些是 AI slop 的高发关键词，会让画面糊一团。仅 `documentary-mood` 允许使用 `photographic` 与 `35mm`。

---

## Prompt 结构（所有风格必须按此 5 段拼装）

```
[SUBJECT]      主体（who/what）一句话，含具体动作或状态
[SCENE]        场景与环境，含 1-2 个具体物件
[STYLE]        风格关键词（从下方 4 套取）
[PALETTE]      限定色板（hex 或自然语言；最多 5 色）
[COMPOSITION]  构图 / 光照 / 视角
```

最后单独一行 `Negative prompt:` 列出该风格的禁用项。

---

## 内置风格 · 1 · editorial-flat · 编辑部平面插画

```yaml
id: editorial-flat
suits: [academic, tech, industry]
description: 杂志专题感、限定色、几何感强、无三维渲染；可叠加在概念解读、流程拟人化场景
prompt_skeleton:
  style: "editorial flat illustration, magazine cover style, geometric shapes, limited 3-color palette, clean negative space, subtle paper texture"
  palette_hint: "use 3 hex colors: {theme.palette.primary}, {theme.palette.accent}, {theme.palette.surface_alt}; avoid gradients beyond 2 stops"
  composition: "centered subject, generous negative space, top-down or 3/4 view, single light source from left"
  lighting: "soft directional light, no glow, no bloom"
mj_params: "--style raw --stylize 150 --ar {aspect} --v 6"
chatgpt_image_hint: "Render as an editorial-style vector illustration. Strictly 3 colors. No photographic textures."
sd_lora_hint: "flat illustration LoRA, weight 0.7"
negative_default: "photographic, 3d render, neon, glow, gradient mesh, busy background, text in image, logo, watermark, signature, photoreal skin"
aspect_map:
  wechat:    "3:2"
  xiaohongshu: "3:4"
  zhihu:     "16:9"
  juejin:    "16:9"
example_subject: "a researcher sketches a neural network on grid paper"
```

---

## 内置风格 · 2 · tech-isometric · 科技等距构造

```yaml
id: tech-isometric
suits: [tech, industry, academic]
description: 等距视角的"系统图实体化"——比 SVG 框图更有质感，但仍保留几何精确；适合架构图衍生封面
prompt_skeleton:
  style: "isometric vector illustration, technical diagram aesthetic, crisp edges, modular block construction, minimal shading"
  palette_hint: "use 4 hex colors: {theme.palette.primary}, {theme.palette.accent}, {theme.palette.mute}, {theme.palette.surface_alt}; flat fills only"
  composition: "isometric 30-degree projection, modular grouped blocks, floating in mid-frame, soft ambient occlusion only at block joints"
  lighting: "top-front ambient light, no specular highlights"
mj_params: "--style raw --stylize 100 --ar {aspect} --v 6"
chatgpt_image_hint: "Strict 30-degree isometric projection. Flat fills, thin 1.5px outlines. Do not add photoreal materials."
sd_lora_hint: "isometric room LoRA, weight 0.65; turn off detail tweaker"
negative_default: "perspective view, photoreal, glossy plastic, hyperdetailed, fisheye, dramatic lighting, smoke, particles, text in image"
aspect_map:
  wechat:    "16:9"
  xiaohongshu: "3:4"
  zhihu:     "16:9"
  juejin:    "16:9"
example_subject: "a small data pipeline city built from cubes: API ingest, queue, worker, database"
```

---

## 内置风格 · 3 · warm-3d-clay · 暖色黏土质感

```yaml
id: warm-3d-clay
suits: [story, industry, xiaohongshu_cover]
description: 3D 黏土 / 软陶感、圆润、暖色品牌风；适合人物、情绪、抽象隐喻
prompt_skeleton:
  style: "soft 3D clay render, rounded shapes, matte plasticine surface, gentle subsurface scattering, modern brand illustration"
  palette_hint: "use 4 warm hex colors anchored on {theme.palette.accent} and {theme.palette.surface}; no cold blues unless accent role"
  composition: "single hero object centered or slight 3/4 angle, shallow depth, foreground prop optional"
  lighting: "soft window light from upper-left, large soft shadow on floor, no rim lights"
mj_params: "--style raw --stylize 250 --ar {aspect} --v 6"
chatgpt_image_hint: "Render as soft 3D clay. Matte surface, no glossy highlights, no glass."
sd_lora_hint: "clay render LoRA, weight 0.8"
negative_default: "photoreal, sharp edges, glass, metal reflections, hard rim light, neon, text, logo, glitch"
aspect_map:
  wechat:    "3:2"
  xiaohongshu: "3:4"
  zhihu:     "16:9"
  juejin:    "16:9"
example_subject: "a small clay figure sitting in front of a clay laptop, coffee cup steam curling up"
```

---

## 内置风格 · 4 · documentary-mood · 纪实情绪摄影

```yaml
id: documentary-mood
suits: [story, industry_field_report]
description: 唯一允许"photographic"关键词的风格；纪实摄影、电影色调、自然光、保留环境上下文
prompt_skeleton:
  style: "documentary photograph, 35mm film stock, natural mid-tones, slight grain"
  palette_hint: "cinematic teal-and-amber subdued, low saturation; never neon"
  composition: "rule-of-thirds, environmental context visible (desk / street / window), subject occupies ~40% of frame"
  lighting: "single natural light source, soft golden-hour or overcast diffuse; no studio strobes"
mj_params: "--style raw --stylize 75 --ar {aspect} --v 6"
chatgpt_image_hint: "Photographic, 35mm film aesthetic, natural light. Do not stylize as illustration."
sd_lora_hint: "Kodak Portra 400 LoRA, weight 0.6"
negative_default: "3d render, illustration, cartoon, anime, oversaturated, hdr, lens flare overload, smooth skin, beauty retouch, text"
aspect_map:
  wechat:    "16:9"
  xiaohongshu: "3:4"
  zhihu:     "16:9"
  juejin:    "16:9"
example_subject: "a developer's late-night desk, half-empty mug, two monitors out of focus"
```

---

## 输出格式（写入 `fig-NN.md`）

```markdown
## 配图建议：{一句话用途}

**建议位置**：{紧接哪个段落}
**为何不用 HTML/SVG**：{一句话说明 · 真实感 / 情绪 / 品牌摄影}
**风格预设**：{style_id}（mood: ...）
**渠道与参数**：

### Midjourney

\`\`\`
{SUBJECT}. {SCENE}. {STYLE}. {PALETTE}. {COMPOSITION}.
--ar {aspect} --style raw --stylize {n} --v 6
\`\`\`

Negative: `{negative_default}`

### ChatGPT 2.0 / gpt-image-1

\`\`\`
{SUBJECT}. {SCENE}. {STYLE}. {PALETTE}. {COMPOSITION}.

Constraints: {chatgpt_image_hint}; no text in image; no logo.
\`\`\`

Size: `1536x1024`（16:9）/ `1024x1536`（3:4）/ `1024x1024`（1:1）

### Stable Diffusion（可选 · 离线）

- LoRA: `{sd_lora_hint}`
- Sampler: DPM++ 2M Karras, Steps 28, CFG 5
- Negative: `{negative_default}`

**配图规格**：
- 比例 {aspect}；目标尺寸 {target_px}
- 文件大小 ≤ 1MB（JPG q=82）；超出请用 [tinypng](https://tinypng.com) 压

**插入步骤**：生成 → 裁剪到 {aspect} → 导出 JPG → 替换 `fig-NN.png` 文件（保留同名）→ `image: pending-user` 改为 `image: fig-NN.png`
```

---

## 扩展：注册新风格

在 Profile 的 `typesetting.yaml`：

```yaml
illustration:
  t2iStyle: my-brand-portrait
  customT2iStyles:
    my-brand-portrait:
      extends: warm-3d-clay
      prompt_skeleton:
        style: "soft 3D clay render with our brand mascot, ..."
        palette_hint: "use our brand palette: #0a2540, #635bff, #ffffff"
      mj_params: "--style raw --stylize 200 --ar {aspect} --v 6"
      negative_default: "..."
```

合并规则同主题：`内置 ← customT2iStyles ← 单篇 brief.figure_t2i_style`。

校验底线：

- `prompt_skeleton` 五段必须齐全（subject 可由 illustrator 临场填）
- `negative_default` 必须存在且非空
- `aspect_map` 必须含当前平台
- 缺失则退回 `editorial-flat`，stderr 告警，不中止
