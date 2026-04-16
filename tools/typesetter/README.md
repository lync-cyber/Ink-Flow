# InkFlow 微信公众号排版器

> **零构建、无后端、单文件可用。** 基于 [doocs/md](https://github.com/doocs/md) 的渲染理念重写，
> 依赖标准 Markdown + GFM Alerts，粘贴到公众号后台样式保真度优先。

## 设计原则

1. **标准即正义**：输入只支持标准 Markdown + GFM Alerts（`> [!NOTE]` 等 5 类），不发明新语法
2. **主题即栏目**：每个内容栏目对应一个预设（主题 + 品牌色 + 字族 + 字号）
3. **内联即兼容**：复制时把计算样式烘焙为 `style=""`，去除 class，公众号后台能完整保留

## 快速使用

```bash
# 任一方式启动本地静态服务（避免浏览器 file:// 限制）
python3 -m http.server 8000    # 然后访问 http://localhost:8000/tools/typesetter/

# 或直接双击 index.html（仅 Chrome / Edge 能绕开 CORS 加载 preset JSON）
```

1. 把 `articles/{slug}/export/wechat.md` 内容粘贴到左侧编辑区
2. 右上角栏目下拉会自动从 frontmatter 的 `column:` 字段同步
3. 点击"复制富文本" → 打开公众号后台 → 粘贴

## 目录

```
tools/typesetter/
  index.html          入口页面
  app.js              渲染与复制逻辑
  themes/
    base.css          共享排版（段落、列表、表格、GFM Alert）
    default.css       经典主题（doocs/md default）
    grace.css         优雅主题（doocs/md grace）
    simple.css        简洁主题（doocs/md simple）
  presets/
    academic.json     学术前沿 → default + 深蓝 + 15px
    industry.json     行业趋势 → simple  + 翡翠绿 + 15px
    tech.json         技术专题 → default + 紫罗兰 + 15px
    story.json        人物故事 → grace   + 暖棕衬线 + 16px
```

## 支持的 Markdown 语法

| 语法 | 效果 |
|------|------|
| `# / ## / ### / ####` | 标题（各主题差异化渲染） |
| `**bold**` `*italic*` `~~del~~` | 行内格式 |
| `` `code` `` | 行内代码 |
| ` ```lang ` | 代码块 |
| `> text` | 引用 |
| `> [!NOTE/TIP/IMPORTANT/WARNING/CAUTION]` | GFM Alert（5 种） |
| `- / 1.` | 列表 |
| `[text](url)` | 链接 |
| `![alt](url)` | 图片 |
| `\| col \| col \|` | 表格 |
| `---` | 分割线 |

**不支持**（故意丢弃）：`:::block` 扩展、自定义 HTML 容器、`<style>` 块、内联 `<script>`。
历史上的 `:::card / :::cta / :::footer / :::note / :::references` 等扩展已全部退役，
因为微信编辑器会剥离非标准容器样式。

## 栏目预设

| 栏目 | 主题 | 主色 | 字号 | 字族 |
|------|------|------|------|------|
| academic | default | #1a5276 | 15px | 无衬线 |
| industry | simple | #0e6655 | 15px | 无衬线 |
| tech | default | #4a235a | 15px | 无衬线 |
| story | grace | #784212 | 16px | 衬线（Optima） |

可在顶栏手动覆盖任意字段；选"自定义"跳过预设同步。

## 致谢

CSS 主题源自 [doocs/md](https://github.com/doocs/md) 项目（WTFPL 许可），
经微调适配 InkFlow 栏目体系。GFM Alert 实现参考 [marked-alert](https://github.com/bent10/marked-extensions)。
