/**
 * InkFlow bootstrap — 注入到 doocs/md 的 index.html <head> 内、main.ts 之前执行。
 *
 * 读取 URL query: ?column=tech&article=my-slug
 * 写入 localStorage（doocs VueUse useStorage 在 Vue 挂载时首次读取）:
 *   MD__css_content_config — 自定义 CSS tab（注入栏目 theme.css）
 *   MD__posts              — 文章列表（注入 article md）
 *   MD__current_post_id    — 当前选中文章 id
 *
 * 数据源：同目录的 inkflow-themes.js / inkflow-articles.js（serve.mjs 启动时重建）。
 * 设计原则：不改 doocs 任何 TS/Vue 源码，只读写 localStorage + URL。
 */
(function () {
  var PREFIX = 'MD__';

  function log(msg, extra) {
    // eslint-disable-next-line no-console
    console.log('[inkflow] ' + msg, extra || '');
  }

  try {
    var params = new URLSearchParams(window.location.search);
    var column = params.get('column');
    var article = params.get('article');
    if (!column && !article) return;

    // ── 主题注入 ────────────────────────────────────────
    if (column) {
      var themes = window.__INKFLOW_THEMES__ || {};
      var themeCss = themes[column];
      if (themeCss) {
        var tabName = 'inkflow-' + column;
        var config = {
          active: tabName,
          tabs: [{
            title: 'InkFlow·' + column,
            name: tabName,
            content: themeCss,
          }],
        };
        try {
          localStorage.setItem(PREFIX + 'css_content_config', JSON.stringify(config));
          log('主题已注入: ' + column);
        } catch (e) {
          log('主题写入失败', e);
        }
      } else {
        log('未找到栏目主题: ' + column);
      }
    }

    // ── 文章注入 ────────────────────────────────────────
    if (article) {
      var articles = window.__INKFLOW_ARTICLES__ || {};
      var md = articles[article];
      if (md) {
        var postId = 'inkflow-' + article;
        var now = new Date();
        var nowStr = now.toLocaleString('zh-cn');
        var post = {
          id: postId,
          title: article,
          content: md,
          history: [{ datetime: nowStr, content: md }],
          createDatetime: now.toISOString(),
          updateDatetime: now.toISOString(),
        };
        try {
          localStorage.setItem(PREFIX + 'posts', JSON.stringify([post]));
          // useStorage 对 string 类型存储不会 JSON.stringify，
          // 但 doocs 源码统一用 JSON.stringify，保持一致。
          localStorage.setItem(PREFIX + 'current_post_id', JSON.stringify(postId));
          log('文章已注入: ' + article);
        } catch (e) {
          log('文章写入失败', e);
        }
      } else {
        log('未找到文章: ' + article);
      }
    }

    // 清理 URL，避免刷新后二次注入（会覆盖用户编辑）
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[inkflow] bootstrap 失败', e);
  }
})();
