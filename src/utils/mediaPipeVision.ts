import { FilesetResolver } from "@mediapipe/tasks-vision";
import { clearSharedMediaPipeWasm } from "@/utils/mediaPipeRuntime";

const TASKS_VISION_VERSION = "1.0.1";

// Tasks wasm root / Tasks 的 Wasm 根路徑
export const TASKS_VISION_WASM_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;

export const HAND_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export const POSE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

export const FACE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export const IMAGE_EMBEDDER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite";

type VisionTaskBackend = {
  canvas?: HTMLCanvasElement;
  delegate: "CPU" | "GPU";
};

let visionFilesetPromise: Promise<
  Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>
> | null = null;

// Shared vision wasm / 共用的視覺 Wasm
export function loadVisionFileset() {
  visionFilesetPromise ??= FilesetResolver.forVisionTasks(
    TASKS_VISION_WASM_ROOT
  ).catch((error: unknown) => {
    visionFilesetPromise = null;
    throw error;
  });

  return visionFilesetPromise;
}

// Video frame clock / 影片影格時間戳
export function createVideoTimestamp() {
  let lastTimestamp = 0;

  return () => {
    const now = performance.now();

    lastTimestamp = now > lastTimestamp ? now : lastTimestamp + 1;

    return lastTimestamp;
  };
}

export function releaseVisionCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;

  try {
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");

    context?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    // Ignore a canvas that cannot take WebGL / 略過無法再取 WebGL 的 canvas
  }
}

// GPU task with CPU fallback / GPU 任務失敗時改用 CPU
export async function createVisionTask<T>(
  createTask: (backend: VisionTaskBackend) => Promise<T>
) {
  const gpuCanvas = document.createElement("canvas");

  try {
    return {
      canvas: gpuCanvas,
      task: await createTask({
        canvas: gpuCanvas,
        delegate: "GPU",
      }),
    };
  } catch {
    releaseVisionCanvas(gpuCanvas);
    clearSharedMediaPipeWasm();

    return {
      canvas: null,
      task: await createTask({ delegate: "CPU" }),
    };
  }
}
