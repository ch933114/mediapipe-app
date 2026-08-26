<script setup lang="ts">
  import { useLocale } from "@/i18n/useLocale";
  import { useDanceDetectionAr } from "@/composables/useDanceDetectionAr";

  const { t } = useLocale();

  const stageElement = ref<HTMLElement | null>(null);
  const videoElement = ref<HTMLVideoElement | null>(null);
  const canvasElement = ref<HTMLCanvasElement | null>(null);

  const {
    bearPlacements,
    isRunning,
    isStarting,
    overlayMessage,
    popupText,
    popupVisible,
    start,
    statusText,
    statusTone,
    stop,
  } = useDanceDetectionAr({
    stageElement,
    videoElement,
    canvasElement,
  });

  const statusClassName = computed(() => ({
    "dance-detection-stage-status": true,
    "dance-detection-stage-status-active": statusTone.value === "active",
    "dance-detection-stage-status-error": statusTone.value === "error",
  }));
</script>

<template>
  <section class="dance-detection-stage">
    <div ref="stageElement" class="dance-detection-stage-viewport">
      <video
        ref="videoElement"
        class="dance-detection-stage-video"
        autoplay
        muted
        playsinline
      />
      <canvas ref="canvasElement" class="dance-detection-stage-canvas" />

      <img
        v-for="bear in bearPlacements"
        :key="bear.id"
        :alt="bear.alt"
        class="dance-detection-stage-bear"
        :src="bear.src"
        :style="bear.style"
      />

      <div
        :class="[
          'dance-detection-stage-popup',
          { 'dance-detection-stage-popup-visible': popupVisible },
        ]"
        role="status"
        aria-live="polite"
      >
        {{ popupText }}
      </div>

      <div v-if="overlayMessage" class="dance-detection-stage-overlay">
        {{ overlayMessage }}
      </div>
    </div>

    <div class="dance-detection-stage-controls">
      <button
        class="dance-detection-stage-button dance-detection-stage-button-primary"
        :disabled="isRunning || isStarting"
        type="button"
        @click="start"
      >
        {{ isStarting ? t("dance.loading") : t("dance.start") }}
      </button>

      <button
        class="dance-detection-stage-button dance-detection-stage-button-secondary"
        :disabled="!isRunning"
        type="button"
        @click="stop"
      >
        {{ t("dance.stop") }}
      </button>

      <span :class="statusClassName">{{ statusText }}</span>
    </div>

    <div class="dance-detection-stage-info">
      <p>{{ t("dance.instructions.detect") }}</p>
      <p>{{ t("dance.instructions.reset") }}</p>
    </div>
  </section>
</template>

<style scoped>
  .dance-detection-stage {
    @apply flex w-full max-w-3xl flex-col gap-4;
  }

  .dance-detection-stage-viewport {
    @apply relative overflow-hidden rounded-[28px] border border-white/10 bg-[#05070d] shadow-[0_24px_80px_rgba(0,0,0,0.45)];
    aspect-ratio: 4 / 3;
  }

  .dance-detection-stage-viewport::before {
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(circle at top, rgb(48 191 255 / 18%), transparent 42%),
      linear-gradient(180deg, rgb(12 17 31 / 24%), rgb(3 5 10 / 84%));
    content: "";
  }

  .dance-detection-stage-video,
  .dance-detection-stage-canvas {
    @apply absolute inset-0 h-full w-full object-cover;
  }

  .dance-detection-stage-canvas {
    @apply pointer-events-none;
  }

  .dance-detection-stage-overlay {
    @apply absolute inset-0 z-20 flex items-center justify-center bg-black/65 px-6 text-center text-sm font-medium text-white;
  }

  .dance-detection-stage-popup {
    @apply absolute left-1/2 top-4 z-20 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-2xl border border-cyan-300/70 bg-cyan-100 px-4 py-3 text-center text-sm font-semibold text-slate-900 opacity-0 shadow-[0_8px_28px_rgba(0,0,0,0.35)] transition;
    transform: translate(-50%, -0.75rem);
  }

  .dance-detection-stage-popup-visible {
    @apply opacity-100;
    transform: translate(-50%, 0);
  }

  .dance-detection-stage-bear {
    @apply pointer-events-none absolute z-10 select-none;
    transform: translate(-50%, -50%);
    animation: dance-bear-bounce 1.1s ease-in-out infinite;
    filter: drop-shadow(0 10px 18px rgb(0 0 0 / 35%));
  }

  .dance-detection-stage-controls {
    @apply flex flex-wrap items-center gap-3;
  }

  .dance-detection-stage-button {
    @apply inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40;
  }

  .dance-detection-stage-button-primary {
    @apply bg-cyan-500 text-slate-950 hover:bg-cyan-400;
  }

  .dance-detection-stage-button-secondary {
    @apply border border-white/15 bg-white/5 text-white hover:bg-white/10;
  }

  .dance-detection-stage-status {
    @apply text-sm text-white/60;
  }

  .dance-detection-stage-status-active {
    @apply text-emerald-300;
  }

  .dance-detection-stage-status-error {
    @apply text-rose-300;
  }

  .dance-detection-stage-info {
    @apply rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-white/70;
  }

  @keyframes dance-bear-bounce {
    0%,
    100% {
      transform: translate(-50%, -50%) translateY(0) scale(1);
    }

    30% {
      transform: translate(-50%, -50%) translateY(-0.35rem) scale(1.04);
    }

    60% {
      transform: translate(-50%, -50%) translateY(0.12rem) scale(0.98);
    }
  }

  @media (width <= 640px) {
    .dance-detection-stage-viewport {
      aspect-ratio: 3 / 4;
      min-height: min(70svh, 42rem);
    }

    .dance-detection-stage-controls {
      @apply items-stretch;
    }

    .dance-detection-stage-button {
      @apply flex-1;
    }

    .dance-detection-stage-status {
      @apply w-full;
    }
  }
</style>
