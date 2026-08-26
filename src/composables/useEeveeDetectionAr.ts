import eeveeReferenceImage from "@/assets/images/eevee.png";
import { i18n } from "@/i18n";
import { requestRearCameraStream } from "@/utils/requestRearCameraStream";
import type { Ref } from "vue";

type UseEeveeDetectionArOptions = {
  captureCanvasElement: Ref<HTMLCanvasElement | null>;
  videoElement: Ref<HTMLVideoElement | null>;
};

type DetectionBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type DetectionSample = DetectionBounds & {
  score: number;
};

type MediaPipeEmbedding = {
  floatEmbedding?: number[] | Float32Array;
};

type MediaPipeEmbedResult = {
  embeddings?: MediaPipeEmbedding[];
};

type MediaPipeImageEmbedder = {
  close?: () => void;
  embed: (imageSource: CanvasImageSource) => MediaPipeEmbedResult;
};

type MediaPipeTasksVisionModule = {
  FilesetResolver: {
    forVisionTasks: (wasmRoot: string) => Promise<unknown>;
  };
  ImageEmbedder: {
    createFromModelPath: (
      visionTaskFileset: unknown,
      modelAssetPath: string
    ) => Promise<MediaPipeImageEmbedder>;
  };
};

const TASKS_VISION_MODULE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/+esm";
const TASKS_VISION_WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
const IMAGE_EMBEDDER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite";

const ANALYZE_INTERVAL_MS = 320;
const DETECTED_ANALYZE_INTERVAL_MS = 1600;
const DETECT_THRESHOLD = 0.75;
const CLEAR_THRESHOLD = 0.7;
const DETECT_STREAK_TARGET = 2;
const LOST_STREAK_TARGET = 4;
const SCAN_COVERAGES = [0.34, 0.48] as const;
const SCAN_POSITIONS = [0.3, 0.5, 0.7] as const;
const EMBEDDER_CANVAS_SIZE = 224;

let embedderLoaderPromise: Promise<MediaPipeImageEmbedder> | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  return i18n.global.t("eevee.state.loadError");
}

function getEmbeddingVector(result: MediaPipeEmbedResult) {
  const vector = result.embeddings?.[0]?.floatEmbedding;

  if (!vector) return null;

  return Array.isArray(vector) ? vector : Array.from(vector);
}

function getCosineSimilarity(left: number[], right: number[]) {
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  const normalizer = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);

  if (!normalizer) return 0;

  return clamp((dotProduct / normalizer + 1) / 2, 0, 1);
}

async function loadEmbedderModule() {
  const tasksVisionModule = (await import(
    /* @vite-ignore */ TASKS_VISION_MODULE_URL
  )) as unknown as MediaPipeTasksVisionModule;
  const visionTaskFileset =
    await tasksVisionModule.FilesetResolver.forVisionTasks(
      TASKS_VISION_WASM_ROOT
    );

  return tasksVisionModule.ImageEmbedder.createFromModelPath(
    visionTaskFileset,
    IMAGE_EMBEDDER_MODEL_URL
  );
}

async function ensureImageEmbedder() {
  embedderLoaderPromise ??= loadEmbedderModule();

  return embedderLoaderPromise;
}

function loadReferenceImage() {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.src = eeveeReferenceImage;
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error(i18n.global.t("eevee.state.loadError"))),
      { once: true }
    );
  });
}

function drawReferenceImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement
) {
  context.clearRect(0, 0, EMBEDDER_CANVAS_SIZE, EMBEDDER_CANVAS_SIZE);
  context.drawImage(image, 0, 0, EMBEDDER_CANVAS_SIZE, EMBEDDER_CANVAS_SIZE);
}

export function useEeveeDetectionAr({
  captureCanvasElement,
  videoElement,
}: UseEeveeDetectionArOptions) {
  const isRunning = ref(false);
  const isStarting = ref(false);
  const isDetected = ref(false);
  const detectionBounds = ref<DetectionBounds | null>(null);
  const detectionScore = ref(0);
  const overlayMessage = ref(i18n.global.t("eevee.state.cameraPrompt"));
  const statusText = ref(i18n.global.t("eevee.state.idle"));
  const statusTone = ref<"idle" | "active" | "error">("idle");

  let mediaStream: MediaStream | null = null;
  let loopTimerId = 0;
  let embedder: MediaPipeImageEmbedder | null = null;
  let referenceEmbedding: number[] | null = null;
  let detectStreak = 0;
  let lostStreak = 0;

  function setStatus(text: string, tone: "idle" | "active" | "error" = "idle") {
    statusText.value = text;
    statusTone.value = tone;
  }

  function resetDetectionState() {
    detectStreak = 0;
    lostStreak = 0;
    isDetected.value = false;
    detectionBounds.value = null;
    detectionScore.value = 0;
  }

  async function ensureReferenceEmbedding(
    context: CanvasRenderingContext2D
  ): Promise<number[]> {
    if (referenceEmbedding) return referenceEmbedding;

    const referenceImage = await loadReferenceImage();

    drawReferenceImage(context, referenceImage);

    const loadedEmbedder = await ensureImageEmbedder();
    const embedding = getEmbeddingVector(loadedEmbedder.embed(context.canvas));

    if (!embedding) {
      throw new Error(i18n.global.t("eevee.state.loadError"));
    }

    embedder = loadedEmbedder;
    referenceEmbedding = embedding;

    return embedding;
  }

  function drawSample(
    context: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    coverage: number,
    normalizedCenterX: number,
    normalizedCenterY: number
  ) {
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const cropSize = Math.min(sourceWidth, sourceHeight) * coverage;
    const halfCrop = cropSize / 2;
    const centerX = normalizedCenterX * sourceWidth;
    const centerY = normalizedCenterY * sourceHeight;
    const sourceX = clamp(centerX - halfCrop, 0, sourceWidth - cropSize);
    const sourceY = clamp(centerY - halfCrop, 0, sourceHeight - cropSize);

    context.clearRect(0, 0, EMBEDDER_CANVAS_SIZE, EMBEDDER_CANVAS_SIZE);
    context.drawImage(
      video,
      sourceX,
      sourceY,
      cropSize,
      cropSize,
      0,
      0,
      EMBEDDER_CANVAS_SIZE,
      EMBEDDER_CANVAS_SIZE
    );

    return {
      left: sourceX / sourceWidth,
      top: sourceY / sourceHeight,
      width: cropSize / sourceWidth,
      height: cropSize / sourceHeight,
    } satisfies DetectionBounds;
  }

  async function analyzeCurrentFrame() {
    const video = videoElement.value;
    const canvas = captureCanvasElement.value;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (!video || !canvas || !context) return;

    canvas.width = EMBEDDER_CANVAS_SIZE;
    canvas.height = EMBEDDER_CANVAS_SIZE;

    const loadedReferenceEmbedding = await ensureReferenceEmbedding(context);
    const loadedEmbedder = embedder ?? (await ensureImageEmbedder());
    const samples: DetectionSample[] = [];

    SCAN_COVERAGES.forEach((coverage) => {
      SCAN_POSITIONS.forEach((centerY) => {
        SCAN_POSITIONS.forEach((centerX) => {
          const bounds = drawSample(context, video, coverage, centerX, centerY);
          const sampleEmbedding = getEmbeddingVector(
            loadedEmbedder.embed(context.canvas)
          );

          if (!sampleEmbedding) return;

          samples.push({
            ...bounds,
            score: getCosineSimilarity(
              sampleEmbedding,
              loadedReferenceEmbedding
            ),
          });
        });
      });
    });

    if (!samples.length) return;

    const bestSample = samples.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    detectionScore.value = bestSample.score;

    if (bestSample.score >= DETECT_THRESHOLD) {
      detectStreak += 1;
      lostStreak = 0;
    } else if (bestSample.score <= CLEAR_THRESHOLD) {
      lostStreak += 1;
      detectStreak = 0;
    }

    if (!isDetected.value && detectStreak >= DETECT_STREAK_TARGET) {
      isDetected.value = true;
    }

    if (isDetected.value && lostStreak >= LOST_STREAK_TARGET) {
      isDetected.value = false;
      detectionBounds.value = null;
    }

    if (isDetected.value) {
      detectionBounds.value = {
        left: bestSample.left,
        top: bestSample.top,
        width: bestSample.width,
        height: bestSample.height,
      };
      setStatus(
        i18n.global.t("eevee.state.detected", {
          score: Math.round(bestSample.score * 100),
        }),
        "active"
      );
      return;
    }

    setStatus(
      i18n.global.t("eevee.state.scanning", {
        score: Math.round(bestSample.score * 100),
      })
    );
  }

  function scheduleNextAnalyze() {
    if (!isRunning.value) return;

    const delay = isDetected.value
      ? DETECTED_ANALYZE_INTERVAL_MS
      : ANALYZE_INTERVAL_MS;

    loopTimerId = window.setTimeout(() => {
      void runLoop();
    }, delay);
  }

  async function runLoop() {
    const video = videoElement.value;

    if (!isRunning.value || !video) return;

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      scheduleNextAnalyze();
      return;
    }

    try {
      await analyzeCurrentFrame();
    } catch (error) {
      overlayMessage.value = i18n.global.t("eevee.state.cameraError", {
        message: getErrorMessage(error),
      });
      setStatus(i18n.global.t("eevee.state.loadError"), "error");
      await teardownSession();
      return;
    }

    scheduleNextAnalyze();
  }

  async function teardownSession() {
    isRunning.value = false;

    if (loopTimerId) {
      window.clearTimeout(loopTimerId);
      loopTimerId = 0;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }

    const video = videoElement.value;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    resetDetectionState();
  }

  async function start() {
    const video = videoElement.value;
    const canvas = captureCanvasElement.value;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (!video || !canvas || !context || isRunning.value || isStarting.value) {
      return;
    }

    isStarting.value = true;
    overlayMessage.value = i18n.global.t("eevee.state.cameraLoading");
    setStatus(i18n.global.t("eevee.state.booting"));

    try {
      canvas.width = EMBEDDER_CANVAS_SIZE;
      canvas.height = EMBEDDER_CANVAS_SIZE;

      await ensureReferenceEmbedding(context);
      mediaStream = await requestRearCameraStream();

      video.srcObject = mediaStream;
      await video.play();

      resetDetectionState();
      isRunning.value = true;
      overlayMessage.value = "";
      setStatus(i18n.global.t("eevee.state.tracking"));
      await runLoop();
    } catch (error) {
      await teardownSession();
      overlayMessage.value = i18n.global.t("eevee.state.cameraError", {
        message: getErrorMessage(error),
      });
      setStatus(i18n.global.t("eevee.state.loadError"), "error");
    } finally {
      isStarting.value = false;
    }
  }

  async function stop() {
    await teardownSession();
    overlayMessage.value = i18n.global.t("eevee.state.cameraPrompt");
    setStatus(i18n.global.t("eevee.state.idle"));
  }

  onBeforeUnmount(() => {
    embedder?.close?.();
    embedder = null;
    referenceEmbedding = null;
    embedderLoaderPromise = null;
    void stop();
  });

  return {
    detectionBounds,
    detectionScore,
    isDetected,
    isRunning,
    isStarting,
    overlayMessage,
    start,
    statusText,
    statusTone,
    stop,
  };
}
