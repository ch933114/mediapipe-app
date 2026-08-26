import type { CSSProperties, Ref } from "vue";
import { i18n } from "@/i18n";
import { requestRearCameraStream } from "@/utils/requestRearCameraStream";

type UseSmileDevilMaskArOptions = {
  stageElement: Ref<HTMLElement | null>;
  videoElement: Ref<HTMLVideoElement | null>;
};

type FaceLandmark = { x: number; y: number };
type FaceResults = { multiFaceLandmarks?: FaceLandmark[][] };
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

const SMILE_THRESHOLD = 0.38;
const FACE_MESH_SCRIPT_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
const FACE_MESH_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/";
let faceMeshScriptLoader: Promise<void> | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDistance(first: FaceLandmark, second: FaceLandmark) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function getSmileScore(landmarks: FaceLandmark[]) {
  const mouthWidth = getDistance(landmarks[61], landmarks[291]);
  const faceWidth = getDistance(landmarks[234], landmarks[454]);
  const mouthHeight = getDistance(landmarks[13], landmarks[14]);

  if (!faceWidth) return 0;
  return mouthWidth / faceWidth + (mouthHeight / faceWidth) * 0.35;
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
}: UseSmileDevilMaskArOptions) {
  const isRunning = ref(false);
  const isStarting = ref(false);
  const isSmiling = ref(false);
  const smileScore = ref(0);
  const overlayMessage = ref(i18n.global.t("smile.state.cameraPrompt"));
  const statusText = ref(i18n.global.t("smile.state.idle"));
  const statusTone = ref<"idle" | "active" | "error">("idle");
  const maskStyle = ref<CSSProperties>({
    left: "50%",
    top: "50%",
    width: "0px",
    height: "0px",
    transform: "translate(-50%, -50%)",
  });

  let faceMeshInstance: FaceMeshInstance | null = null;
  let mediaStream: MediaStream | null = null;
  let loopFrameId = 0;

  function setStatus(text: string, tone: "idle" | "active" | "error" = "idle") {
    statusText.value = text;
    statusTone.value = tone;
  }

  function resetTrackingState() {
    isSmiling.value = false;
    smileScore.value = 0;
    maskStyle.value = {
      left: "50%",
      top: "50%",
      width: "0px",
      height: "0px",
      transform: "translate(-50%, -50%)",
    };
  }

  function updateMask(landmarks: FaceLandmark[]) {
    const stage = stageElement.value;
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    const faceLeft = landmarks[234];
    const faceRight = landmarks[454];
    if (
      !stage ||
      !leftEye ||
      !rightEye ||
      !forehead ||
      !chin ||
      !faceLeft ||
      !faceRight
    )
      return;

    const faceWidth = getDistance(faceLeft, faceRight) * stage.clientWidth;
    const faceHeight = getDistance(forehead, chin) * stage.clientHeight;
    const centerX = ((faceLeft.x + faceRight.x) / 2) * stage.clientWidth;
    const centerY = ((forehead.y + chin.y) / 2) * stage.clientHeight;
    const rotation =
      (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) /
      Math.PI;

    maskStyle.value = {
      left: `${clamp(centerX, 0, stage.clientWidth)}px`,
      top: `${clamp(centerY, 0, stage.clientHeight)}px`,
      width: `${faceWidth * 1.35}px`,
      height: `${faceHeight * 1.12}px`,
      transform: `translate(-50%, -45%) rotate(${rotation}deg)`,
    };
  }

  function onResults(results: FaceResults) {
    const landmarks = results.multiFaceLandmarks?.[0];
    if (!landmarks) {
      resetTrackingState();
      setStatus(i18n.global.t("smile.state.idle"));
      return;
    }

    const score = getSmileScore(landmarks);
    smileScore.value = Math.round(clamp(score / 0.65, 0, 1) * 100);
    isSmiling.value = score >= SMILE_THRESHOLD;
    updateMask(landmarks);
    setStatus(
      isSmiling.value
        ? i18n.global.t("smile.state.detected")
        : i18n.global.t("smile.state.tracking"),
      isSmiling.value ? "active" : "idle"
    );
  }

  async function runLoop() {
    const video = videoElement.value;
    if (!isRunning.value || !faceMeshInstance || !video) return;
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
      await faceMeshInstance.send({ image: video });
    loopFrameId = window.requestAnimationFrame(() => void runLoop());
  }

  async function teardownSession() {
    isRunning.value = false;
    if (loopFrameId) window.cancelAnimationFrame(loopFrameId);
    loopFrameId = 0;
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
    const video = videoElement.value;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    if (faceMeshInstance?.close) await faceMeshInstance.close();
    faceMeshInstance = null;
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
      resetTrackingState();
      isRunning.value = true;
      overlayMessage.value = "";
      setStatus(i18n.global.t("smile.state.tracking"));
      await runLoop();
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

  onBeforeUnmount(() => void stop());

  return {
    isRunning,
    isStarting,
    isSmiling,
    maskStyle,
    overlayMessage,
    smileScore,
    start,
    statusText,
    statusTone,
    stop,
  };
}
