import type { CSSProperties, Ref } from "vue";
import {
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { i18n } from "@/i18n";
import { enqueueMediaPipeWork } from "@/utils/mediaPipeRuntime";
import {
  createVideoTimestamp,
  createVisionTask,
  HAND_LANDMARKER_MODEL_URL,
  loadVisionFileset,
  releaseVisionCanvas,
} from "@/utils/mediaPipeVision";
import { requestRearCameraStream } from "@/utils/requestRearCameraStream";

type HandPhase = "idle" | "fisting" | "ready" | "showing";

type UseGestureGemArOptions = {
  stageElement: Ref<HTMLElement | null>;
  videoElement: Ref<HTMLVideoElement | null>;
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

  const nextVideoTimestamp = createVideoTimestamp();
  let handLandmarker: HandLandmarker | null = null;
  let visionCanvas: HTMLCanvasElement | null = null;
  let loopFrameId = 0;
  let mediaStream: MediaStream | null = null;
  let sessionToken = 0;
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

  function onResults(landmarks: NormalizedLandmark[] | undefined) {
    const now = Date.now();

    if (!landmarks?.length) {
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

  function runLoop() {
    const video = videoElement.value;

    if (!isRunning.value || !handLandmarker || !video) return;

    if (
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth > 0
    ) {
      const result = handLandmarker.detectForVideo(video, nextVideoTimestamp());

      onResults(result.landmarks[0]);
    }

    loopFrameId = window.requestAnimationFrame(runLoop);
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

    handLandmarker?.close();
    handLandmarker = null;
    releaseVisionCanvas(visionCanvas);
    visionCanvas = null;

    resetInteractionState();
  }

  async function startSession(token: number) {
    const video = videoElement.value;

    if (!video || token !== sessionToken) return;

    try {
      mediaStream = await requestRearCameraStream();
      if (token !== sessionToken || !videoElement.value) {
        await teardownSession();
        return;
      }

      video.srcObject = mediaStream;
      await video.play();
      if (token !== sessionToken) {
        await teardownSession();
        return;
      }

      const visionFileset = await loadVisionFileset();
      if (token !== sessionToken) {
        await teardownSession();
        return;
      }

      const visionTask = await createVisionTask((backend) =>
        HandLandmarker.createFromOptions(visionFileset, {
          baseOptions: {
            modelAssetPath: HAND_LANDMARKER_MODEL_URL,
            delegate: backend.delegate,
          },
          canvas: backend.canvas,
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.7,
          minTrackingConfidence: 0.6,
        })
      );
      if (token !== sessionToken) {
        visionTask.task.close();
        releaseVisionCanvas(visionTask.canvas);
        await teardownSession();
        return;
      }

      handLandmarker = visionTask.task;
      visionCanvas = visionTask.canvas;

      resetInteractionState();
      isRunning.value = true;
      overlayMessage.value = "";
      setStatus(i18n.global.t("gesture.state.tracking"));
      runLoop();
    } catch (error) {
      await teardownSession();
      overlayMessage.value = i18n.global.t("gesture.state.cameraError", {
        message: getErrorMessage(error),
      });
      setStatus(i18n.global.t("gesture.state.loadError"), "error");
    }
  }

  async function start() {
    if (!videoElement.value || isRunning.value || isStarting.value) return;

    const token = ++sessionToken;

    isStarting.value = true;
    overlayMessage.value = i18n.global.t("gesture.state.cameraLoading");
    setStatus(i18n.global.t("gesture.state.booting"));

    try {
      await enqueueMediaPipeWork(async () => {
        if (token !== sessionToken) return;

        await startSession(token);
      });
    } finally {
      isStarting.value = false;
    }
  }

  async function stop() {
    sessionToken += 1;

    await enqueueMediaPipeWork(async () => {
      await teardownSession();
      overlayMessage.value = i18n.global.t("gesture.state.cameraPrompt");
      setStatus(i18n.global.t("gesture.state.idle"));
    });
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
