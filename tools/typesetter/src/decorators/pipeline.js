// ============================================================
// 装饰流水线 — DECORATORS 注册表 + runPipeline
//
// 设计：
//   - 每个 decorator 在自己的文件里调用 InkFlow.registerDecorator(name, fn)
//   - SKELETON.pipeline 为 null 时使用 DEFAULT_PIPELINE 顺序
//   - runPipeline(previewEl, ctx) 按 pipeline 名字依次执行
//
// 上下文 ctx 包含：
//   { meta, column, charCount, hrStyles }
// 让任何 decorator 都能拿到完整渲染上下文（避免单参 + 全局变量）
// ============================================================
(function (global) {
  'use strict';

  const DECORATORS = {};

  function registerDecorator(name, fn) {
    if (typeof fn !== 'function') {
      console.warn(`[InkFlow] registerDecorator(${name}): not a function`);
      return;
    }
    DECORATORS[name] = fn;
  }

  function runPipeline(previewEl, ctx) {
    const skel = (global.InkFlow.SKELETONS || {})[ctx.column]
              || (global.InkFlow.SKELETONS || {}).academic;
    const pipeline = (skel && skel.pipeline) || global.InkFlow.DEFAULT_PIPELINE || [];
    pipeline.forEach(name => {
      const fn = DECORATORS[name];
      if (!fn) {
        console.warn(`[InkFlow] pipeline step "${name}" not registered, skipped`);
        return;
      }
      try {
        fn(previewEl, ctx);
      } catch (err) {
        console.error(`[InkFlow] decorator "${name}" failed:`, err);
      }
    });
  }

  global.InkFlow = global.InkFlow || {};
  global.InkFlow.DECORATORS = DECORATORS;
  global.InkFlow.registerDecorator = registerDecorator;
  global.InkFlow.runPipeline = runPipeline;
})(typeof window !== 'undefined' ? window : globalThis);
