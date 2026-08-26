import type { CSSProperties, Ref } from "vue";
import dancingBearImage from "@/assets/images/dancingbear.gif";
import { i18n } from "@/i18n";
import { requestRearCameraStream } from "@/utils/requestRearCameraStream";

type UseDanceDetectionArOptions = {
  stageElement: Ref<HTMLElement | null>;
  videoElement: Ref<HTMLVideoElement | null>;
  canvasElement: Ref<HTMLCanvasElement | null>;
};

type PoseLandmark = {
  x: number;
  y: number;
  visibility?: number;
};

type PoseResults = {
  poseLandmarks?: PoseLandmark[];
};

type PoseInstance = {
  close?: () => Promise<void> | void;
  onResults: (callback: (results: PoseResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  setOptions: (options: Record<string, unknown>) => void;
};

type PoseConstructor = new (config: {
  locateFile: (file: string) => string;
}) => PoseInstance;

type PoseWindow = Window &
  typeof globalThis & {
    Pose?: PoseConstructor;
  };

type PersonBounds = {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
};

type BearPlacement = {
  alt: string;
  id: string;
  src: string;
  style: CSSProperties;
};

const TRACKED_POINTS = [11, 12, 15, 16, 23, 24, 27, 28] as const;
const CONNECTIONS = [
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
] as const;
const POSE_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
const VISIBILITY_THRESHOLD = 0.5;
const DANCE_MOTION_THRESHOLD = 0.018;
const DANCE_AVERAGE_THRESHOLD = 0.012;
const DANCE_SAMPLE_WINDOW = 24;
const DANCE_MIN_SAMPLE_COUNT = 12;
const DANCE_ACTIVE_SAMPLE_TARGET = 8;

let poseScriptLoader: Promise<void> | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  return i18n.global.t("dance.state.loadError");
}

function loadPoseScript() {
  const poseWindow = window as PoseWindow;

  if (poseWindow.Pose) {
    return Promise.resolve();
  }

  if (poseScriptLoader) {
    return poseScriptLoader;
  }

  poseScriptLoader = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${POSE_SCRIPT_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error(i18n.global.t("dance.state.loadError"))),
        { once: true }
      );
      return;
    }

    // Load MediaPipe Pose from CDN / 從 CDN 載入姿態模型腳本
    const scriptElement = document.createElement("script");

    scriptElement.src = POSE_SCRIPT_URL;
    scriptElement.async = true;
    scriptElement.crossOrigin = "anonymous";
    scriptElement.addEventListener("load", () => resolve(), { once: true });
    scriptElement.addEventListener(
      "error",
      () => reject(new Error(i18n.global.t("dance.state.loadError"))),
      { once: true }
    );
    document.head.appendChild(scriptElement);
  });

  return poseScriptLoader;
}

function getVisiblePoint(landmarks: PoseLandmark[], index: number) {
  const point = landmarks[index];
  if (!point) return null;
  if ((point.visibility ?? 0) < VISIBILITY_THRESHOLD) return null;

  return point;
}

function getPersonBounds(landmarks: PoseLandmark[]) {
  const visiblePoints = landmarks.filter(
    (point) => (point.visibility ?? 0) >= VISIBILITY_THRESHOLD
  );

  if (!visiblePoints.length) return null;

  return visiblePoints.reduce<PersonBounds>(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    {
      minX: 1,
      minY: 1,
      maxX: 0,
      maxY: 0,
    }
  );
}

function formatEnergyScore(value: number) {
  return value.toFixed(3);
}

export function useDanceDetectionAr({
  stageElement,
  videoElement,
  canvasElement,
}: UseDanceDetectionArOptions) {
  const isRunning = ref(false);
  const isStarting = ref(false);
  const isDancing = ref(false);
  const overlayMessage = ref(i18n.global.t("dance.state.cameraPrompt"));
  const statusText = ref(i18n.global.t("dance.state.idle"));
  const statusTone = ref<"idle" | "active" | "error">("idle");
  const bearPlacements = ref<BearPlacement[]>([]);
  const popupVisible = ref(false);
  const popupText = ref(i18n.global.t("dance.popup"));

  let poseInstance: PoseInstance | null = null;
  let mediaStream: MediaStream | null = null;
  let loopFrameId = 0;
  let popupTimer = 0;
  let activeSamples = 0;
  let cooldownUntil = 0;
  let previousPose: Array<{ x: number; y: number } | null> | null = null;
  const motionSamples: number[] = [];

  function setStatus(text: string, tone: "idle" | "active" | "error" = "idle") {
    statusText.value = text;
    statusTone.value = tone;
  }

  function clearPopup() {
    if (popupTimer) {
      window.clearTimeout(popupTimer);
      popupTimer = 0;
    }
    popupVisible.value = false;
  }

  function showPopup() {
    popupVisible.value = true;
    clearPopup();
    popupVisible.value = true;
    popupTimer = window.setTimeout(() => {
      popupVisible.value = false;
      popupTimer = 0;
    }, 2500);
  }

  function resetTrackingState() {
    previousPose = null;
    motionSamples.length = 0;
    activeSamples = 0;
    isDancing.value = false;
    bearPlacements.value = [];
    clearPopup();
  }

  function drawPose(landmarks: PoseLandmark[]) {
    const video = videoElement.value;
    const canvas = canvasElement.value;
    const context = canvas?.getContext("2d");

    if (!video || !canvas || !context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#8ec5ff";
    context.lineWidth = 4;

    CONNECTIONS.forEach(([startIndex, endIndex]) => {
      const start = getVisiblePoint(landmarks, startIndex);
      const end = getVisiblePoint(landmarks, endIndex);

      if (!start || !end) return;

      context.beginPath();
      context.moveTo(start.x * canvas.width, start.y * canvas.height);
      context.lineTo(end.x * canvas.width, end.y * canvas.height);
      context.stroke();
    });

    context.fillStyle = "#c9e3ff";

    TRACKED_POINTS.forEach((index) => {
      const point = getVisiblePoint(landmarks, index);

      if (!point) return;

      context.beginPath();
      context.arc(
        point.x * canvas.width,
        point.y * canvas.height,
        5,
        0,
        Math.PI * 2
      );
      context.fill();
    });
  }

  function averageMotion(landmarks: PoseLandmark[]) {
    if (!previousPose) {
      previousPose = TRACKED_POINTS.map((index) => {
        const point = getVisiblePoint(landmarks, index);
        if (!point) return null;

        return { x: point.x, y: point.y };
      });
      return 0;
    }

    let total = 0;
    let visible = 0;

    TRACKED_POINTS.forEach((index, trackedIndex) => {
      const point = getVisiblePoint(landmarks, index);
      const previousPoint = previousPose?.[trackedIndex] ?? null;

      if (!point) {
        if (previousPose) previousPose[trackedIndex] = null;
        return;
      }

      if (!previousPoint) {
        if (previousPose) {
          previousPose[trackedIndex] = { x: point.x, y: point.y };
        }
        return;
      }

      total += Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y);
      visible += 1;
      previousPoint.x = point.x;
      previousPoint.y = point.y;
    });

    return visible ? total / visible : 0;
  }

  function updateBearPlacements(bounds: PersonBounds) {
    const stage = stageElement.value;
    if (!stage) return;

    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const left = bounds.minX * width;
    const right = bounds.maxX * width;
    const top = bounds.minY * height;
    const bottom = bounds.maxY * height;
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    const personWidth = Math.max(right - left, width * 0.18);
    const personHeight = Math.max(bottom - top, height * 0.32);
    const bearSize = clamp(personWidth * 0.34, 72, 140);
    const offsetX = bearSize * 0.68;
    const offsetY = bearSize * 0.66;

    bearPlacements.value = [
      {
        id: "top-left",
        alt: "跳舞小熊",
        src: dancingBearImage,
        style: {
          left: `${clamp(centerX - offsetX, bearSize / 2, width - bearSize / 2)}px`,
          top: `${clamp(top - offsetY, bearSize / 2, height - bearSize / 2)}px`,
          width: `${bearSize}px`,
        },
      },
      {
        id: "top-right",
        alt: "跳舞小熊",
        src: dancingBearImage,
        style: {
          left: `${clamp(centerX + offsetX, bearSize / 2, width - bearSize / 2)}px`,
          top: `${clamp(top - offsetY * 0.85, bearSize / 2, height - bearSize / 2)}px`,
          width: `${bearSize * 0.92}px`,
        },
      },
      {
        id: "bottom-left",
        alt: "跳舞小熊",
        src: dancingBearImage,
        style: {
          left: `${clamp(left - bearSize * 0.25, bearSize / 2, width - bearSize / 2)}px`,
          top: `${clamp(centerY + personHeight * 0.18, bearSize / 2, height - bearSize / 2)}px`,
          width: `${bearSize * 0.96}px`,
        },
      },
      {
        id: "bottom-right",
        alt: "跳舞小熊",
        src: dancingBearImage,
        style: {
          left: `${clamp(right + bearSize * 0.25, bearSize / 2, width - bearSize / 2)}px`,
          top: `${clamp(centerY + personHeight * 0.14, bearSize / 2, height - bearSize / 2)}px`,
          width: `${bearSize * 1.04}px`,
        },
      },
    ];
  }

  function onResults(results: PoseResults) {
    const landmarks = results.poseLandmarks;
    const canvas = canvasElement.value;
    const context = canvas?.getContext("2d");

    if (!landmarks) {
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
      resetTrackingState();
      setStatus(i18n.global.t("dance.state.searching"));
      return;
    }

    drawPose(landmarks);

    const motion = averageMotion(landmarks);
    motionSamples.push(motion);
    if (motionSamples.length > DANCE_SAMPLE_WINDOW) {
      motionSamples.shift();
    }

    if (motion > DANCE_MOTION_THRESHOLD) {
      activeSamples += 1;
    } else {
      activeSamples = Math.max(0, activeSamples - 1);
    }

    const average =
      motionSamples.reduce((sum, value) => sum + value, 0) /
      motionSamples.length;
    const dancing =
      motionSamples.length >= DANCE_MIN_SAMPLE_COUNT &&
      activeSamples >= DANCE_ACTIVE_SAMPLE_TARGET &&
      average > DANCE_AVERAGE_THRESHOLD;

    const bounds = getPersonBounds(landmarks);
    if (bounds && dancing) {
      updateBearPlacements(bounds);
    } else {
      bearPlacements.value = [];
    }

    if (dancing) {
      setStatus(i18n.global.t("dance.state.dancing"), "active");
    } else {
      setStatus(
        i18n.global.t("dance.state.energy", {
          score: formatEnergyScore(average),
        })
      );
    }

    if (dancing && !isDancing.value && Date.now() >= cooldownUntil) {
      showPopup();
      cooldownUntil = Date.now() + 3000;
    }

    isDancing.value = dancing;
  }

  async function runLoop() {
    const video = videoElement.value;

    if (!isRunning.value || !poseInstance || !video) return;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      await poseInstance.send({ image: video });
    }

    loopFrameId = window.requestAnimationFrame(() => {
      void runLoop();
    });
  }

  async function teardownSession() {
    isRunning.value = false;

    if (loopFrameId) {
      window.cancelAnimationFrame(loopFrameId);
      loopFrameId = 0;
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

    const canvas = canvasElement.value;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (poseInstance?.close) {
      await poseInstance.close();
    }
    poseInstance = null;

    resetTrackingState();
  }

  async function start() {
    const video = videoElement.value;
    const poseWindow = window as PoseWindow;

    if (!video || isRunning.value || isStarting.value) return;

    isStarting.value = true;
    overlayMessage.value = i18n.global.t("dance.state.cameraLoading");
    setStatus(i18n.global.t("dance.state.booting"));

    try {
      await loadPoseScript();

      mediaStream = await requestRearCameraStream();

      video.srcObject = mediaStream;
      await video.play();

      if (!poseWindow.Pose) {
        throw new Error(i18n.global.t("dance.state.loadError"));
      }

      poseInstance = new poseWindow.Pose({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      poseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      });
      poseInstance.onResults(onResults);

      resetTrackingState();
      isRunning.value = true;
      overlayMessage.value = "";
      setStatus(i18n.global.t("dance.state.tracking"));
      await runLoop();
    } catch (error) {
      await teardownSession();
      overlayMessage.value = i18n.global.t("dance.state.cameraError", {
        message: getErrorMessage(error),
      });
      setStatus(i18n.global.t("dance.state.loadError"), "error");
    } finally {
      isStarting.value = false;
    }
  }

  async function stop() {
    await teardownSession();
    overlayMessage.value = i18n.global.t("dance.state.cameraPrompt");
    setStatus(i18n.global.t("dance.state.idle"));
  }

  onBeforeUnmount(() => {
    void stop();
  });

  return {
    bearPlacements,
    isDancing,
    isRunning,
    isStarting,
    overlayMessage,
    popupText,
    popupVisible,
    start,
    statusText,
    statusTone,
    stop,
  };
}
