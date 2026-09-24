import type { Ref } from "vue";
import { i18n } from "@/i18n";
import {
  createDevilFaceWarp,
  type DevilFaceWarp,
  type NormalizedLandmark,
} from "@/utils/devilFaceWarp";
import { requestRearCameraStream } from "@/utils/requestRearCameraStream";

type UseSmileDevilMaskArOptions = {
  stageElement: Ref<HTMLElement | null>;
  videoElement: Ref<HTMLVideoElement | null>;
  canvasElement: Ref<HTMLCanvasElement | null>;
};

type FaceResults = { multiFaceLandmarks?: NormalizedLandmark[][] };
type FaceMeshInstance = {
  close?: () => Promise<void> | void;
  onResults: (callback: (results: FaceResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  setOptions: (options: Record<string, unknown>) => void;
};
type FaceMeshConstructor = new (config: {
  locateFile: (file: string) => string;
}) => FaceMeshInstance;
type FaceMeshWindow = Window &
  typeof globalThis & { FaceMesh?: FaceMeshConstructor };

const MORPH_SCORE_START = 0.33;
const MORPH_SCORE_END = 0.6;
const FACE_MESH_VERSION = "0.4.1633559619";
const FACE_MESH_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${FACE_MESH_VERSION}/face_mesh.js`;
const FACE_MESH_PATH = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${FACE_MESH_VERSION}/`;
let faceMeshScriptLoader: Promise<void> | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDistance(first: NormalizedLandmark, second: NormalizedLandmark) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function getSmileScore(landmarks: NormalizedLandmark[]) {
  const mouthWidth = getDistance(landmarks[61], landmarks[291]);
  const faceWidth = getDistance(landmarks[234], landmarks[454]);
  const mouthHeight = getDistance(landmarks[13], landmarks[14]);

  if (!faceWidth) return 0;
  return mouthWidth / faceWidth + (mouthHeight / faceWidth) * 0.35;
}

function getMorphTarget(score: number) {
  return clamp(
    (score - MORPH_SCORE_START) / (MORPH_SCORE_END - MORPH_SCORE_START),
    0,
    1
  );
}

function loadFaceMeshScript() {
  const faceMeshWindow = window as FaceMeshWindow;
  if (faceMeshWindow.FaceMesh) return Promise.resolve();
  if (faceMeshScriptLoader) return faceMeshScriptLoader;

  faceMeshScriptLoader = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${FACE_MESH_SCRIPT_URL}"]`
    );
    const handleLoad = () => resolve();
    const handleError = () =>
      reject(new Error(i18n.global.t("smile.state.loadError")));

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const scriptElement = document.createElement("script");
    scriptElement.src = FACE_MESH_SCRIPT_URL;
    scriptElement.async = true;
    scriptElement.crossOrigin = "anonymous";
    scriptElement.addEventListener("load", handleLoad, { once: true });
    scriptElement.addEventListener("error", handleError, { once: true });
    document.head.appendChild(scriptElement);
  });

  return faceMeshScriptLoader;
}

export function useSmileDevilMaskAr({
  stageElement,
  videoElement,
  canvasElement,
}: UseSmileDevilMaskArOptions) {
  const isRunning = ref(false);
  const isStarting = ref(false);
  const isSmiling = ref(false);
  const hasFaceWarp = ref(false);
  const smileScore = ref(0);
  const overlayMessage = ref(i18n.global.t("smile.state.cameraPrompt"));
  const statusText = ref(i18n.global.t("smile.state.idle"));
  const statusTone = ref<"idle" | "active" | "error">("idle");

  let faceMeshInstance: FaceMeshInstance | null = null;
  let mediaStream: MediaStream | null = null;
  let detectFrameId = 0;
  let renderFrameId = 0;
  let faceWarp: DevilFaceWarp | null = null;
  let smoothedLandmarks: NormalizedLandmark[] | null = null;
  let latestScore = 0;
  let morphStrength = 0;
  let faceVisible = false;

  function setStatus(text: string, tone: "idle" | "active" | "error" = "idle") {
    if (statusText.value === text && statusTone.value === tone) return;
    statusText.value = text;
    statusTone.value = tone;
  }

  function resetTrackingState() {
    isSmiling.value = false;
    smileScore.value = 0;
    smoothedLandmarks = null;
    latestScore = 0;
    morphStrength = 0;
    faceVisible = false;
  }

  function smoothLandmarks(next: NormalizedLandmark[]) {
    if (!smoothedLandmarks || smoothedLandmarks.length !== next.length) {
      smoothedLandmarks = next.map((point) => ({ x: point.x, y: point.y }));
      return;
    }

    for (let index = 0; index < next.length; index += 1) {
      const current = smoothedLandmarks[index];
      const point = next[index];
      if (!current || !point) continue;
      current.x += (point.x - current.x) * 0.55;
      current.y += (point.y - current.y) * 0.55;
    }
  }

  function onResults(results: FaceResults) {
    const landmarks = results.multiFaceLandmarks?.[0];
    if (!landmarks) {
      faceVisible = false;
      return;
    }

    faceVisible = true;
    smoothLandmarks(landmarks);
    latestScore = getSmileScore(landmarks);
    smileScore.value = Math.round(clamp(latestScore / 0.65, 0, 1) * 100);
  }

  function renderFrame() {
    if (!isRunning.value) return;

    const target = faceVisible ? getMorphTarget(latestScore) : 0;
    morphStrength += (target - morphStrength) * 0.12;
    if (Math.abs(target - morphStrength) < 0.002) morphStrength = target;
    isSmiling.value = morphStrength >= 0.28;

    const stage = stageElement.value;
    const video = videoElement.value;
    if (
      faceWarp &&
      stage &&
      video &&
      stage.clientWidth > 0 &&
      stage.clientHeight > 0
    ) {
      const landmarksForWarp =
        smoothedLandmarks && (faceVisible || morphStrength > 0.01)
          ? smoothedLandmarks
          : null;
      faceWarp.resize(stage.clientWidth, stage.clientHeight);
      faceWarp.render({
        video,
        landmarks: landmarksForWarp,
        morph: morphStrength,
        timeMs: performance.now(),
      });
    }

    if (!faceVisible && morphStrength < 0.05) {
      smileScore.value = 0;
      setStatus(i18n.global.t("smile.state.idle"));
    } else if (morphStrength >= 0.28) {
      setStatus(i18n.global.t("smile.state.detected"), "active");
    } else if (faceVisible) {
      setStatus(i18n.global.t("smile.state.tracking"));
    }

    renderFrameId = window.requestAnimationFrame(renderFrame);
  }

  async function detectLoop() {
    const video = videoElement.value;
    if (!isRunning.value || !faceMeshInstance || !video) return;
    try {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
        await faceMeshInstance.send({ image: video });
    } catch {
      if (!isRunning.value) return;
    }
    if (!isRunning.value) return;
    detectFrameId = window.requestAnimationFrame(() => void detectLoop());
  }

  function ensureFaceWarp() {
    const canvas = canvasElement.value;
    if (!canvas) return;
    faceWarp ??= createDevilFaceWarp(canvas);
    hasFaceWarp.value = Boolean(faceWarp);
  }

  async function teardownSession() {
    isRunning.value = false;
    if (detectFrameId) window.cancelAnimationFrame(detectFrameId);
    if (renderFrameId) window.cancelAnimationFrame(renderFrameId);
    detectFrameId = 0;
    renderFrameId = 0;
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
    const video = videoElement.value;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    if (faceMeshInstance?.close) await faceMeshInstance.close();
    faceMeshInstance = null;
    faceWarp?.clear();
    resetTrackingState();
  }

  async function start() {
    const video = videoElement.value;
    const faceMeshWindow = window as FaceMeshWindow;
    if (!video || isRunning.value || isStarting.value) return;
    isStarting.value = true;
    overlayMessage.value = i18n.global.t("smile.state.cameraLoading");
    setStatus(i18n.global.t("smile.state.booting"));

    try {
      mediaStream = await requestRearCameraStream();
      video.srcObject = mediaStream;
      await video.play();
      await loadFaceMeshScript();
      if (!faceMeshWindow.FaceMesh)
        throw new Error(i18n.global.t("smile.state.loadError"));
      faceMeshInstance = new faceMeshWindow.FaceMesh({
        locateFile: (file) => `${FACE_MESH_PATH}${file}`,
      });
      faceMeshInstance.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      });
      faceMeshInstance.onResults(onResults);
      ensureFaceWarp();
      resetTrackingState();
      isRunning.value = true;
      overlayMessage.value = "";
      setStatus(i18n.global.t("smile.state.tracking"));
      renderFrameId = window.requestAnimationFrame(renderFrame);
      await detectLoop();
    } catch (error) {
      await teardownSession();
      const message =
        error instanceof Error
          ? error.message
          : i18n.global.t("smile.state.loadError");
      overlayMessage.value = i18n.global.t("smile.state.cameraError", {
        message,
      });
      setStatus(i18n.global.t("smile.state.loadError"), "error");
    } finally {
      isStarting.value = false;
    }
  }

  async function stop() {
    await teardownSession();
    overlayMessage.value = i18n.global.t("smile.state.cameraPrompt");
    setStatus(i18n.global.t("smile.state.idle"));
  }

  onBeforeUnmount(() => {
    void stop();
    faceWarp?.destroy();
    faceWarp = null;
    hasFaceWarp.value = false;
  });

  return {
    hasFaceWarp,
    isRunning,
    isStarting,
    isSmiling,
    overlayMessage,
    smileScore,
    start,
    statusText,
    statusTone,
    stop,
  };
}
