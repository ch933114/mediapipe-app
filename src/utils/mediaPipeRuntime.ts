type SharedMediaPipeModule = {
  canvas?: HTMLCanvasElement;
};

type SharedMediaPipeRuntime = Window & {
  Module?: SharedMediaPipeModule;
  ModuleFactory?: unknown;
  createMediapipeSolutionsWasm?: unknown;
  createMediapipeSolutionsPackedAssets?: unknown;
};

let runtimeQueue: Promise<void> = Promise.resolve();

function loseLeftoverWebGl(moduleValue: SharedMediaPipeModule | undefined) {
  const canvas = moduleValue?.canvas;

  if (!canvas) return;

  try {
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");

    context?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    // Ignore a canvas that cannot take WebGL / 略過無法再取 WebGL 的 canvas
  }
}

// Shared WASM globals / 舊版 Solutions 與 Tasks 共用的 WASM 全域
export function clearSharedMediaPipeWasm() {
  const runtime = window as SharedMediaPipeRuntime;

  loseLeftoverWebGl(runtime.Module);
  runtime.Module = undefined;
  runtime.ModuleFactory = undefined;
  runtime.createMediapipeSolutionsWasm = undefined;
  runtime.createMediapipeSolutionsPackedAssets = undefined;
}

// Serialize WASM startup / 讓 WASM 啟動依序執行
export function enqueueMediaPipeWork<T>(work: () => Promise<T>) {
  const result = runtimeQueue.then(work, work);

  runtimeQueue = result.then(
    () => undefined,
    () => undefined
  );

  return result;
}
