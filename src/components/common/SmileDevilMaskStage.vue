<script setup lang="ts">
  import { useLocale } from "@/i18n/useLocale";
  import { useSmileDevilMaskAr } from "@/composables/useSmileDevilMaskAr";

  const { t } = useLocale();
  const stageElement = ref<HTMLElement | null>(null);
  const videoElement = ref<HTMLVideoElement | null>(null);
  const canvasElement = ref<HTMLCanvasElement | null>(null);
  const {
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
  } = useSmileDevilMaskAr({ stageElement, videoElement, canvasElement });

  const statusClassName = computed(() => ({
    "smile-devil-stage-status": true,
    "smile-devil-stage-status-active": statusTone.value === "active",
    "smile-devil-stage-status-error": statusTone.value === "error",
  }));
</script>

<template>
  <section class="smile-devil-stage">
    <div ref="stageElement" class="smile-devil-stage-viewport">
      <video
        ref="videoElement"
        class="smile-devil-stage-video"
        :class="{ 'opacity-0': hasFaceWarp }"
        autoplay
        muted
        playsinline
      />
      <canvas
        ref="canvasElement"
        class="smile-devil-stage-canvas"
        aria-hidden="true"
      />
      <div v-if="overlayMessage" class="smile-devil-stage-overlay">
        {{ overlayMessage }}
      </div>
      <div class="smile-devil-stage-hud">
        <span>{{
          isSmiling
            ? t("smile.state.transformed")
            : t("smile.state.smilePrompt")
        }}</span>
        <span>{{ t("smile.score") }} {{ smileScore }}%</span>
      </div>
    </div>
    <div class="smile-devil-stage-controls">
      <button
        class="smile-devil-stage-button smile-devil-stage-button-primary"
        :disabled="isRunning || isStarting"
        type="button"
        @click="start"
      >
        {{ isStarting ? t("smile.loading") : t("smile.start") }}
      </button>
      <button
        class="smile-devil-stage-button smile-devil-stage-button-secondary"
        :disabled="!isRunning"
        type="button"
        @click="stop"
      >
        {{ t("smile.stop") }}
      </button>
      <span :class="statusClassName">{{ statusText }}</span>
    </div>
    <div class="smile-devil-stage-info">
      <p>{{ t("smile.instructions.detect") }}</p>
      <p>{{ t("smile.instructions.camera") }}</p>
    </div>
  </section>
</template>

<style scoped>
  .smile-devil-stage {
    @apply flex w-full max-w-3xl flex-col gap-4;
  }

  .smile-devil-stage-viewport {
    @apply relative overflow-hidden rounded-[28px] border border-white/10 bg-[#080309] shadow-[0_24px_80px_rgba(0,0,0,0.45)];
    aspect-ratio: 4 / 3;
  }

  .smile-devil-stage-video {
    @apply absolute inset-0 h-full w-full object-cover;
  }

  .smile-devil-stage-canvas {
    @apply pointer-events-none absolute inset-0 z-10 h-full w-full;
  }

  .smile-devil-stage-overlay {
    @apply absolute inset-0 z-20 flex items-center justify-center bg-black/65 px-6 text-center text-sm font-medium text-white;
  }

  .smile-devil-stage-hud {
    @apply absolute inset-x-4 bottom-4 z-20 flex items-center justify-between rounded-full border border-red-300/20 bg-black/55 px-4 py-2 text-xs text-white/85 backdrop-blur-md;
  }

  .smile-devil-stage-controls {
    @apply flex flex-wrap items-center gap-3;
  }

  .smile-devil-stage-button {
    @apply inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-5;
  }

  .smile-devil-stage-button-primary {
    @apply bg-red-500 text-white hover:bg-red-400;
  }

  .smile-devil-stage-button-secondary {
    @apply border border-white/15 bg-white/5 text-white hover:bg-white/10;
  }

  .smile-devil-stage-status {
    @apply text-sm text-white/60;
  }

  .smile-devil-stage-status-active {
    @apply text-red-300;
  }

  .smile-devil-stage-status-error {
    @apply text-rose-300;
  }

  .smile-devil-stage-info {
    @apply rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-white/70;
  }

  @media (width <= 640px) {
    .smile-devil-stage {
      @apply gap-3;
    }

    .smile-devil-stage-viewport {
      aspect-ratio: auto;
      width: 100%;
      height: min(78svh, 44rem);
    }

    .smile-devil-stage-controls {
      @apply items-stretch;
    }

    .smile-devil-stage-button {
      @apply flex-1;
    }

    .smile-devil-stage-status {
      @apply w-full;
    }

    .smile-devil-stage-info {
      @apply px-3 py-3 leading-6;
    }
  }
</style>
