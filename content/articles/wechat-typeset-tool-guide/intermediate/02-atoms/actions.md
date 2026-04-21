---
id: action-01
type: action
weight: primary
platforms: [wechat]
source_section: wechat-typeset 核心参数
length_chars: 138
---
给谁：技术内容创作者，正在使用 Markdown Nice 或手动排版公众号文章。
何时：下一篇文章准备排版前。
怎么做：
1. `git clone https://github.com/lync-cyber/wechat-typeset.git && cd wechat-typeset && npm ci && npm run preview`
2. 浏览器打开 `http://127.0.0.1:7788`，粘贴 Markdown 草稿
3. 在左侧选一套与文章气质匹配的主题人格（如技术教程选 `tech-geek`，生活分享选 `life-aesthetic`）
4. 切换预览确认 375px 效果，点"一键复制"
5. 打开公众号后台，Ctrl+V 粘贴富文本，直接发布

---
id: action-02
type: action
weight: supporting
platforms: [wechat]
source_section: 主题系统（Theme Persona）
length_chars: 100
---
给谁：需要建立独特视觉身份的公众号运营者或团队。
何时：建立内容品牌规范时，或发现所有文章外观雷同时。
怎么做：
1. 从 9 套内置主题（`default` / `tech-geek` / `business-finance` / `literary-humanism` 等）中选定 1-2 套固定使用
2. 为不同题材（技术/财经/生活）各绑定一套主题，形成栏目视觉分层
3. 若需深度定制：`cp -r src/themes/default src/themes/your-slug`，编辑 `persona.spec.ts`，运行 `npm run validate:spec` 校验后使用

---
id: action-03
type: action
weight: supporting
platforms: [wechat]
source_section: LLM Agent 集成（Skill 包）
length_chars: 90
---
给谁：使用 Claude Code 或 InkFlow 写作 pipeline 的技术内容作者。
何时：已生成文章草稿（04a-draft），准备进入排版阶段时。
怎么做：
1. 确认 wechat-typeset 已 clone 到 InkFlow 同级目录并运行 `npm run preview`（端口 7788）
2. 在 Claude Code 中说"给这篇排版"触发 typeset-authoring skill
3. skill 会读取 `intermediate/09-typeset-plan.md` 并产出 `export/08-typeset/wechat/annotated.md`
4. 打开 `http://127.0.0.1:7788`，粘贴 annotated.md，选主题，一键复制

---
id: action-04
type: action
weight: supporting
platforms: [wechat]
source_section: 平台约束的编码方式
length_chars: 86
---
给谁：首次使用 wechat-typeset 或自定义主题的开发者，遇到粘贴后样式错乱。
何时：粘贴到公众号后台后发现排版异常时。
怎么做：
1. 检查主题是否用了 `position` / `float` / `display:flex` / `@media` / `-webkit-` 前缀（这些会被微信剥离）
2. SVG 白色填充从 `#ffffff` 改为 `#fefefe`
3. 运行 `npm run validate:spec` 让构造期校验捕获违规属性
4. 若仍有问题，查看 `src/pipeline/rules.ts` 的 `FORBIDDEN_CSS_PROPS` 完整列表
