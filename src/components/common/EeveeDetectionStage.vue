<script setup lang="ts">
  import EeveeModelViewer from "@/components/common/EeveeModelViewer.vue";
  import { useEeveeDetectionAr } from "@/composables/useEeveeDetectionAr";
  import { useLocale } from "@/i18n/useLocale";

  const { t } = useLocale();

  const videoElement = ref<HTMLVideoElement | null>(null);
  const captureCanvasElement = ref<HTMLCanvasElement | null>(null);
  const modelViewerErrorMessage = ref("");
  const eeveeModelUrl = `${import.meta.env.BASE_URL}models/eevee.glb`;

  const {
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
  } = useEeveeDetectionAr({
    captureCanvasElement,
    videoElement,
  });

  const statusClassName = computed(() => ({
    "eevee-detection-stage-status": true,
    "eevee-detection-stage-status-active": statusTone.value === "active",
    "eevee-detection-stage-status-error": statusTone.value === "error",
  }));

  const similarityPercent = computed(
    () => `${Math.round(detectionScore.value * 100)}%`
  );

  const detectionBoundsStyle = computed(() => {
    if (!detectionBounds.value) return null;

    return {
      left: `${detectionBounds.value.left * 100}%`,
      top: `${detectionBounds.value.top * 100}%`,
      width: `${detectionBounds.value.width * 100}%`,
      height: `${detectionBounds.value.height * 100}%`,
    };
  });
</script>

<template>
  <section class="eevee-detection-stage">
    <div class="eevee-detection-stage-viewport">
      <video
        ref="videoElement"
        class="eevee-detection-stage-video"
        autoplay
        muted
        playsinline
      />
      <canvas ref="captureCanvasElement" class="eevee-detection-stage-canvas" />

      <div v-if="overlayMessage" class="eevee-detection-stage-overlay">
        {{ overlayMessage }}
      </div>

      <div class="eevee-detection-stage-hud">
        <div class="eevee-detection-stage-badge">
          <span class="eevee-detection-stage-badge-label">
            {{ t("eevee.similarity") }}
          </span>
          <strong>{{ similarityPercent }}</strong>
        </div>

        <div class="eevee-detection-stage-meter">
          <div
            class="eevee-detection-stage-meter-bar"
            :style="{ transform: `scaleX(${detectionScore})` }"
          />
        </div>
      </div>

      <transition name="eevee-detection-stage-glow">
        <div v-if="isDetected" class="eevee-detection-stage-detected">
          {{ t("eevee.detectedBadge") }}
        </div>
      </transition>

      <div
        v-if="detectionBoundsStyle"
        class="eevee-detection-stage-target"
        :style="detectionBoundsStyle"
      />
    </div>

    <div class="eevee-detection-stage-controls">
      <button
        class="eevee-detection-stage-button eevee-detection-stage-button-primary"
        :disabled="isRunning || isStarting"
        type="button"
        @click="start"
      >
        {{ isStarting ? t("eevee.loading") : t("eevee.start") }}
      </button>

      <button
        class="eevee-detection-stage-button eevee-detection-stage-button-secondary"
        :disabled="!isRunning"
        type="button"
        @click="stop"
      >
        {{ t("eevee.stop") }}
      </button>

      <span :class="statusClassName">{{ statusText }}</span>
    </div>

    <div class="eevee-detection-stage-info">
      <p>{{ t("eevee.instructions.detect") }}</p>
      <p>{{ t("eevee.instructions.camera") }}</p>
    </div>

    <div
      v-if="isDetected"
      class="eevee-detection-stage-card"
      role="status"
      aria-live="polite"
    >
      <div class="eevee-detection-stage-model-shell">
        <EeveeModelViewer
          class="eevee-detection-stage-model"
          :model-url="eeveeModelUrl"
          @error="modelViewerErrorMessage = t('eevee.modelError')"
        />

        <div
          v-if="modelViewerErrorMessage"
          class="eevee-detection-stage-model-fallback"
        >
          {{ modelViewerErrorMessage }}
        </div>
      </div>

      <article class="eevee-detection-stage-details">
        <p class="eevee-detection-stage-kicker">
          {{ t("eevee.info.dex") }}
        </p>
        <h3 class="eevee-detection-stage-title">
          {{ t("eevee.info.name") }}
        </h3>
        <p class="eevee-detection-stage-description">
          {{ t("eevee.info.description") }}
        </p>

        <div class="eevee-detection-stage-stat-grid">
          <div class="eevee-detection-stage-stat">
            <span>{{ t("eevee.info.typeLabel") }}</span>
            <strong>{{ t("eevee.info.typeValue") }}</strong>
          </div>
          <div class="eevee-detection-stage-stat">
            <span>{{ t("eevee.info.heightLabel") }}</span>
            <strong>{{ t("eevee.info.heightValue") }}</strong>
          </div>
          <div class="eevee-detection-stage-stat">
            <span>{{ t("eevee.info.weightLabel") }}</span>
            <strong>{{ t("eevee.info.weightValue") }}</strong>
          </div>
          <div class="eevee-detection-stage-stat">
            <span>{{ t("eevee.info.featureLabel") }}</span>
            <strong>{{ t("eevee.info.featureValue") }}</strong>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
  .eevee-detection-stage {
    @apply flex w-full max-w-5xl flex-col gap-4;
  }

  .eevee-detection-stage-viewport {
    @apply relative overflow-hidden rounded-[28px] border border-white/10 bg-[#05070d] shadow-[0_24px_80px_rgba(0,0,0,0.45)];
    aspect-ratio: 4 / 3;
  }

  .eevee-detection-stage-viewport::before {
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(circle at top, rgb(255 187 92 / 20%), transparent 42%),
      linear-gradient(180deg, rgb(28 18 9 / 18%), rgb(3 5 10 / 84%));
    content: "";
  }

  .eevee-detection-stage-video,
  .eevee-detection-stage-canvas {
    @apply absolute inset-0 h-full w-full object-cover;
  }

  .eevee-detection-stage-canvas {
    @apply hidden;
  }

  .eevee-detection-stage-overlay {
    @apply absolute inset-0 z-20 flex items-center justify-center bg-black/65 px-6 text-center text-sm font-medium text-white;
  }

  .eevee-detection-stage-hud {
    @apply absolute inset-x-4 bottom-4 z-10 flex flex-col gap-3;
  }

  .eevee-detection-stage-badge {
    @apply flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-sm text-white backdrop-blur-md;
  }

  .eevee-detection-stage-badge-label {
    @apply text-white/70;
  }

  .eevee-detection-stage-meter {
    @apply h-1.5 overflow-hidden rounded-full bg-white/10;
  }

  .eevee-detection-stage-meter-bar {
    @apply h-full origin-left rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-cyan-300 transition-transform duration-200;
  }

  .eevee-detection-stage-detected {
    @apply absolute right-4 top-4 z-10 rounded-full border border-amber-300/60 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.3)] backdrop-blur-md;
  }

  .eevee-detection-stage-target {
    @apply absolute z-10 rounded-[24px] border-2 border-cyan-300/90 shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_0_26px_rgba(34,211,238,0.35)];
    box-shadow:
      inset 0 0 0 1px rgb(255 255 255 / 22%),
      0 0 0 1px rgb(103 232 249 / 32%),
      0 0 26px rgb(34 211 238 / 35%);
  }

  .eevee-detection-stage-controls {
    @apply flex flex-wrap items-center gap-3;
  }

  .eevee-detection-stage-button {
    @apply inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40;
  }

  .eevee-detection-stage-button-primary {
    @apply bg-amber-400 text-slate-950 hover:bg-amber-300;
  }

  .eevee-detection-stage-button-secondary {
    @apply border border-white/15 bg-white/5 text-white hover:bg-white/10;
  }

  .eevee-detection-stage-status {
    @apply text-sm text-white/60;
  }

  .eevee-detection-stage-status-active {
    @apply text-amber-200;
  }

  .eevee-detection-stage-status-error {
    @apply text-rose-300;
  }

  .eevee-detection-stage-info {
    @apply rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-white/70;
  }

  .eevee-detection-stage-card {
    @apply grid gap-5 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,196,118,0.12),rgba(255,255,255,0.04))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur sm:p-6 lg:grid-cols-[minmax(16rem,22rem)_1fr];
  }

  .eevee-detection-stage-model-shell {
    @apply relative w-full self-start overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,218,170,0.26),rgba(18,20,29,0.88))] p-3;
    aspect-ratio: 1 / 1;
    min-height: 18rem;
  }

  .eevee-detection-stage-model {
    @apply h-full w-full rounded-[20px];
  }

  .eevee-detection-stage-model-fallback {
    @apply absolute inset-3 flex items-center justify-center rounded-[20px] px-6 text-center text-sm;
    background-color: rgb(9 12 20 / 92%);
    color: rgb(255 255 255 / 72%);
  }

  .eevee-detection-stage-details {
    @apply flex flex-col gap-4;
  }

  .eevee-detection-stage-kicker {
    @apply text-xs uppercase tracking-[0.2em] text-amber-200/80;
  }

  .eevee-detection-stage-title {
    @apply text-3xl font-semibold text-white;
  }

  .eevee-detection-stage-description {
    @apply max-w-2xl text-sm leading-7;
    color: rgb(255 255 255 / 72%);
  }

  .eevee-detection-stage-stat-grid {
    @apply grid gap-3 sm:grid-cols-2;
  }

  .eevee-detection-stage-stat {
    @apply rounded-3xl border border-white/10 bg-black/15 px-4 py-3;
  }

  .eevee-detection-stage-stat span {
    @apply block text-xs uppercase tracking-[0.14em] text-white/45;
  }

  .eevee-detection-stage-stat strong {
    @apply mt-2 block text-base text-white;
  }

  .eevee-detection-stage-glow-enter-active,
  .eevee-detection-stage-glow-leave-active {
    transition:
      opacity 220ms ease,
      transform 220ms ease;
  }

  .eevee-detection-stage-glow-enter-from,
  .eevee-detection-stage-glow-leave-to {
    opacity: 0;
    transform: translateY(-0.35rem);
  }

  @media (width <= 640px) {
    .eevee-detection-stage-viewport {
      aspect-ratio: 3 / 4;
      min-height: min(70svh, 42rem);
    }

    .eevee-detection-stage-controls {
      @apply items-stretch;
    }

    .eevee-detection-stage-button {
      @apply flex-1;
    }

    .eevee-detection-stage-status {
      @apply w-full;
    }

    .eevee-detection-stage-model-shell {
      aspect-ratio: 1 / 1;
      min-height: clamp(14rem, 78vw, 20rem);
      max-width: min(100%, 22rem);
      margin-inline: auto;
    }
  }
</style>
