import type {
  Hands as HandsClass,
  NormalizedLandmark,
  Results as HandsResults,
} from "@mediapipe/hands";
import type { CSSProperties, Ref } from "vue";
import { i18n } from "@/i18n";
import { requestRearCameraStream } from "@/utils/requestRearCameraStream";

type HandPhase = "idle" | "fisting" | "ready" | "showing";

type UseGestureGemArOptions = {
  stageElement: Ref<HTMLElement | null>;
  videoElement: Ref<HTMLVideoElement | null>;
};

type HandsWindow = Window &
  typeof globalThis & {
    Hands?: typeof HandsClass;
  };

type HandTrackingState = {
  fistMissSince: number;
  fistSince: number;
  phase: HandPhase;
  spawnAt: number;
};

const FINGER_TIPS = [4, 8, 12, 16, 20] as const;
const FINGER_MCP = [2, 5, 9, 13, 17] as const;
const FIST_ENTER_BENT_COUNT = 4;
const FIST_EXIT_BENT_COUNT = 2;
const FIST_HOLD_MS = 2000;
const FIST_MISS_GRACE_MS = 400;
const READY_TIMEOUT_MS = 3000;
const GEM_SCALE_MIN = 0.9;
const GEM_SCALE_MAX = 1.8;
const HANDS_VERSION = "0.4.1675469240";
const HANDS_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${HANDS_VERSION}/hands.js`;
const HANDS_ASSET_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${HANDS_VERSION}/`;
let handsScriptLoader: Promise<void> | null = null;

function loadHandsScript() {
  const handsWindow = window as HandsWindow;
  if (handsWindow.Hands) return Promise.resolve();
  if (handsScriptLoader) return handsScriptLoader;

  handsScriptLoader = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${HANDS_SCRIPT_URL}"]`
    );
    const handleLoad = () => resolve();
    const handleError = () =>
      reject(new Error(i18n.global.t("gesture.state.loadError")));

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const scriptElement = document.createElement("script");
    scriptElement.src = HANDS_SCRIPT_URL;
    scriptElement.async = true;
    scriptElement.crossOrigin = "anonymous";
    scriptElement.addEventListener("load", handleLoad, { once: true });
    scriptElement.addEventListener("error", handleError, { once: true });
    document.head.appendChild(scriptElement);
  }).catch((error: unknown) => {
    handsScriptLoader = null;
    throw error;
  });

  return handsScriptLoader;
}

function createInitialHandState(): HandTrackingState {
  return {
    fistMissSince: 0,
    fistSince: 0,
    phase: "idle",
    spawnAt: 0,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  return i18n.global.t("gesture.state.loadError");
}

function countBentFingers(landmarks: NormalizedLandmark[]) {
  let bentCount = 0;

  for (
    let fingerIndex = 0;
    fingerIndex < FINGER_TIPS.length;
    fingerIndex += 1
  ) {
    const tip = landmarks[FINGER_TIPS[fingerIndex]];
    const mcp = landmarks[FINGER_MCP[fingerIndex]];

    if (fingerIndex === 0) {
      if (Math.abs(tip.x - mcp.x) < 0.06) bentCount += 1;
      continue;
    }

    if (tip.y > mcp.y) bentCount += 1;
  }

  return bentCount;
}

function isOpenHand(landmarks: NormalizedLandmark[]) {
  let extendedCount = 0;

  for (
    let fingerIndex = 1;
    fingerIndex < FINGER_TIPS.length;
    fingerIndex += 1
  ) {
    const tip = landmarks[FINGER_TIPS[fingerIndex]];
    const mcp = landmarks[FINGER_MCP[fingerIndex]];

    if (tip.y < mcp.y - 0.04) extendedCount += 1;
  }

  return extendedCount >= 3;
}

function getHandScale(landmarks: NormalizedLandmark[]) {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const distance = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y);

  return clamp(distance * 8, GEM_SCALE_MIN, GEM_SCALE_MAX);
}

export function useGestureGemAr({
  stageElement,
  videoElement,
}: UseGestureGemArOptions) {
  const isRunning = ref(false);
  const isStarting = ref(false);
  const overlayMessage = ref(i18n.global.t("gesture.state.cameraPrompt"));
  const statusText = ref(i18n.global.t("gesture.state.idle"));
  const statusTone = ref<"idle" | "active" | "error">("idle");
  const hintLabel = ref(i18n.global.t("gesture.state.holdPrompt"));
  const fistProgress = ref(0);
  const isFistHintActive = ref(false);
  const isOpenHintActive = ref(false);
  const isGemVisible = ref(false);
  const gemBurstKey = ref(0);
  const gemStyle = ref<CSSProperties>({
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) scale(1)",
  });

  let handsInstance: HandsClass | null = null;
  let loopFrameId = 0;
  let mediaStream: MediaStream | null = null;
  let handState = createInitialHandState();

  function setStatus(text: string, tone: "idle" | "active" | "error" = "idle") {
    statusText.value = text;
    statusTone.value = tone;
  }

  // Paused fist charge / 暫停中的握拳蓄力
  function fistElapsed(now: number) {
    const endAt = handState.fistMissSince > 0 ? handState.fistMissSince : now;

    return Math.max(0, endAt - handState.fistSince);
  }

  function beginFistMiss(now: number) {
    if (handState.fistMissSince === 0) {
      handState.fistMissSince = now;
    }
  }

  function resumeFistHold(now: number) {
    if (handState.fistMissSince === 0) return;

    handState.fistSince += now - handState.fistMissSince;
    handState.fistMissSince = 0;
  }

  function isFistMissExpired(now: number) {
    return (
      handState.fistMissSince > 0 &&
      now - handState.fistMissSince >= FIST_MISS_GRACE_MS
    );
  }

  function resetInteractionState() {
    handState = createInitialHandState();
    fistProgress.value = 0;
    hintLabel.value = i18n.global.t("gesture.state.holdPrompt");
    isFistHintActive.value = false;
    isOpenHintActive.value = false;
    isGemVisible.value = false;
  }

  function updateGemStyle(landmarks: NormalizedLandmark[]) {
    const stage = stageElement.value;
    if (!stage) return;

    const palm = landmarks[9];
    const scale = getHandScale(landmarks);
    const x = clamp(palm.x * stage.clientWidth, 0, stage.clientWidth);
    const y = clamp(palm.y * stage.clientHeight, 0, stage.clientHeight);

    gemStyle.value = {
      left: `${x}px`,
      top: `${y}px`,
      transform: `translate(-50%, -50%) scale(${scale})`,
    };
  }

  function updateHintForPhase(now: number) {
    if (handState.phase === "idle") {
      hintLabel.value = i18n.global.t("gesture.state.holdPrompt");
      fistProgress.value = 0;
      isFistHintActive.value = false;
      isOpenHintActive.value = false;
      return;
    }

    if (handState.phase === "fisting") {
      const elapsed = fistElapsed(now);
      const seconds = (Math.floor(elapsed / 100) / 10).toFixed(1);

      fistProgress.value = clamp(elapsed / FIST_HOLD_MS, 0, 1);
      hintLabel.value = i18n.global.t("gesture.state.holding", { seconds });
      isFistHintActive.value = true;
      isOpenHintActive.value = false;
      return;
    }

    if (handState.phase === "ready") {
      fistProgress.value = 1;
      hintLabel.value = i18n.global.t("gesture.state.ready");
      isFistHintActive.value = true;
      isOpenHintActive.value = true;
      return;
    }

    fistProgress.value = 1;
    hintLabel.value = i18n.global.t("gesture.state.showing");
    isFistHintActive.value = true;
    isOpenHintActive.value = true;
  }

  function onResults(results: HandsResults) {
    const now = Date.now();
    const landmarks = results.multiHandLandmarks?.[0];

    if (!landmarks) {
      if (handState.phase === "idle") {
        setStatus(i18n.global.t("gesture.state.idle"), "idle");
        return;
      }

      beginFistMiss(now);

      if (isFistMissExpired(now)) {
        resetInteractionState();
        setStatus(i18n.global.t("gesture.state.idle"), "idle");
        return;
      }

      if (handState.phase === "showing") {
        setStatus(i18n.global.t("gesture.state.showing"), "active");
      } else if (handState.phase === "ready") {
        setStatus(i18n.global.t("gesture.state.ready"), "active");
      } else {
        setStatus(i18n.global.t("gesture.state.holdPrompt"), "active");
      }

      updateHintForPhase(now);
      return;
    }

    if (handState.phase === "ready" || handState.phase === "showing") {
      resumeFistHold(now);
    }

    const bentCount = countBentFingers(landmarks);
    const isFistEntered = bentCount >= FIST_ENTER_BENT_COUNT;
    const isFistKept = bentCount > FIST_EXIT_BENT_COUNT;
    const openDetected = isOpenHand(landmarks);

    if (handState.phase === "idle") {
      if (isFistEntered) {
        handState.phase = "fisting";
        handState.fistSince = now;
        handState.fistMissSince = 0;
      }
    } else if (handState.phase === "fisting") {
      if (openDetected) {
        handState = createInitialHandState();
      } else if (isFistKept) {
        resumeFistHold(now);

        if (fistElapsed(now) >= FIST_HOLD_MS) {
          handState.phase = "ready";
          handState.fistMissSince = 0;
        }
      } else {
        beginFistMiss(now);

        if (isFistMissExpired(now)) {
          handState = createInitialHandState();
        }
      }
    } else if (handState.phase === "ready") {
      if (openDetected) {
        handState.phase = "showing";
        handState.spawnAt = now;
        isGemVisible.value = true;
        gemBurstKey.value += 1;
      } else if (now - handState.fistSince > FIST_HOLD_MS + READY_TIMEOUT_MS) {
        handState = createInitialHandState();
      }
    } else if (handState.phase === "showing" && isFistEntered) {
      handState = createInitialHandState();
      isGemVisible.value = false;
    }

    if (handState.phase === "showing") {
      updateGemStyle(landmarks);
      setStatus(i18n.global.t("gesture.state.showing"), "active");
    } else if (handState.phase === "ready") {
      setStatus(i18n.global.t("gesture.state.ready"), "active");
    } else if (handState.phase === "fisting") {
      setStatus(i18n.global.t("gesture.state.holdPrompt"), "active");
    } else {
      setStatus(i18n.global.t("gesture.state.tracking"), "idle");
    }

    updateHintForPhase(now);
  }

  async function runLoop() {
    const video = videoElement.value;

    if (!isRunning.value || !handsInstance || !video) return;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      await handsInstance.send({ image: video });
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

    if (handsInstance?.close) {
      await handsInstance.close();
    }
    handsInstance = null;

    resetInteractionState();
  }

  async function start() {
    const video = videoElement.value;
    const handsWindow = window as HandsWindow;

    if (!video || isRunning.value || isStarting.value) return;

    isStarting.value = true;
    overlayMessage.value = i18n.global.t("gesture.state.cameraLoading");
    setStatus(i18n.global.t("gesture.state.booting"));

    try {
      await loadHandsScript();
      mediaStream = await requestRearCameraStream();

      video.srcObject = mediaStream;
      await video.play();

      if (!handsWindow.Hands) {
        throw new Error(i18n.global.t("gesture.state.loadError"));
      }

      handsInstance = new handsWindow.Hands({
        locateFile: (file) => `${HANDS_ASSET_BASE_URL}${file}`,
      });
      handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      });
      handsInstance.onResults(onResults);

      resetInteractionState();
      isRunning.value = true;
      overlayMessage.value = "";
      setStatus(i18n.global.t("gesture.state.tracking"));
      await runLoop();
    } catch (error) {
      await teardownSession();
      overlayMessage.value = i18n.global.t("gesture.state.cameraError", {
        message: getErrorMessage(error),
      });
      setStatus(i18n.global.t("gesture.state.loadError"), "error");
    } finally {
      isStarting.value = false;
    }
  }

  async function stop() {
    await teardownSession();
    overlayMessage.value = i18n.global.t("gesture.state.cameraPrompt");
    setStatus(i18n.global.t("gesture.state.idle"));
  }

  onBeforeUnmount(() => {
    void stop();
  });

  return {
    fistProgress,
    gemBurstKey,
    gemStyle,
    hintLabel,
    isFistHintActive,
    isGemVisible,
    isOpenHintActive,
    isRunning,
    isStarting,
    overlayMessage,
    start,
    statusText,
    statusTone,
    stop,
  };
}
