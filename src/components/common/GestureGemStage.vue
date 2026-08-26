<script setup lang="ts">
  import { useLocale } from "@/i18n/useLocale";
  import { useGestureGemAr } from "@/composables/useGestureGemAr";

  const { t } = useLocale();

  const stageElement = ref<HTMLElement | null>(null);
  const videoElement = ref<HTMLVideoElement | null>(null);

  const {
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
  } = useGestureGemAr({
    stageElement,
    videoElement,
  });

  const statusClassName = computed(() => ({
    "gesture-gem-stage-status": true,
    "gesture-gem-stage-status-active": statusTone.value === "active",
    "gesture-gem-stage-status-error": statusTone.value === "error",
  }));
</script>

<template>
  <section class="gesture-gem-stage">
    <div ref="stageElement" class="gesture-gem-stage-viewport">
      <video
        ref="videoElement"
        class="gesture-gem-stage-video"
        autoplay
        muted
        playsinline
      />

      <div v-if="overlayMessage" class="gesture-gem-stage-overlay">
        {{ overlayMessage }}
      </div>

      <div class="gesture-gem-stage-hud">
        <div class="gesture-gem-stage-hint">
          <span
            :class="[
              'gesture-gem-stage-dot',
              { 'gesture-gem-stage-dot-active': isFistHintActive },
            ]"
          />
          <span
            :class="[
              'gesture-gem-stage-dot',
              {
                'gesture-gem-stage-dot-ready': isOpenHintActive && isGemVisible,
                'gesture-gem-stage-dot-active':
                  isOpenHintActive && !isGemVisible,
              },
            ]"
          />
          <span class="gesture-gem-stage-hint-label">{{ hintLabel }}</span>
        </div>

        <div class="gesture-gem-stage-progress">
          <div
            class="gesture-gem-stage-progress-bar"
            :style="{ transform: `scaleX(${fistProgress})` }"
          />
        </div>
      </div>

      <div
        v-if="isGemVisible"
        :key="gemBurstKey"
        class="gesture-gem-stage-gem"
        :style="gemStyle"
      >
        <span class="gesture-gem-stage-gem-core" />
        <span class="gesture-gem-stage-gem-shell" />
        <span class="gesture-gem-stage-gem-ring" />
        <span
          v-for="particleIndex in 8"
          :key="particleIndex"
          class="gesture-gem-stage-particle"
          :style="{ '--particle-angle': `${(particleIndex - 1) * 45}deg` }"
        />
      </div>
    </div>

    <div class="gesture-gem-stage-controls">
      <button
        class="gesture-gem-stage-button gesture-gem-stage-button-primary"
        :disabled="isRunning || isStarting"
        type="button"
        @click="start"
      >
        {{ isStarting ? t("gesture.loading") : t("gesture.start") }}
      </button>

      <button
        class="gesture-gem-stage-button gesture-gem-stage-button-secondary"
        :disabled="!isRunning"
        type="button"
        @click="stop"
      >
        {{ t("gesture.stop") }}
      </button>

      <span :class="statusClassName">{{ statusText }}</span>
    </div>

    <div class="gesture-gem-stage-info">
      <p>{{ t("gesture.instructions.hold") }}</p>
      <p>{{ t("gesture.instructions.reset") }}</p>
    </div>
  </section>
</template>

<style scoped>
  .gesture-gem-stage {
    @apply flex w-full max-w-3xl flex-col gap-4;
  }

  .gesture-gem-stage-viewport {
    @apply relative overflow-hidden rounded-[28px] border border-white/10 bg-[#05070d] shadow-[0_24px_80px_rgba(0,0,0,0.45)];
    aspect-ratio: 4 / 3;
  }

  .gesture-gem-stage-viewport::before {
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(circle at top, rgb(254 151 54 / 18%), transparent 40%),
      linear-gradient(180deg, rgb(12 17 31 / 30%), rgb(3 5 10 / 82%));
    content: "";
  }

  .gesture-gem-stage-video {
    @apply absolute inset-0 h-full w-full object-cover;
  }

  .gesture-gem-stage-overlay {
    @apply absolute inset-0 z-20 flex items-center justify-center bg-black/65 px-6 text-center text-sm font-medium text-white;
  }

  .gesture-gem-stage-hud {
    @apply absolute inset-x-4 bottom-4 z-20 flex flex-col gap-3;
  }

  .gesture-gem-stage-hint {
    @apply mx-auto flex max-w-full items-center gap-3 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs text-white/85 backdrop-blur-md;
  }

  .gesture-gem-stage-hint-label {
    @apply whitespace-nowrap;
  }

  .gesture-gem-stage-dot {
    @apply block h-2.5 w-2.5 rounded-full bg-white/25 transition;
  }

  .gesture-gem-stage-dot-active {
    @apply bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.65)];
  }

  .gesture-gem-stage-dot-ready {
    @apply bg-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.75)];
  }

  .gesture-gem-stage-progress {
    @apply h-1.5 overflow-hidden rounded-full bg-white/10;
  }

  .gesture-gem-stage-progress-bar {
    @apply h-full origin-left rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-fuchsia-500 transition-transform duration-150;
  }

  .gesture-gem-stage-controls {
    @apply flex flex-wrap items-center gap-3;
  }

  .gesture-gem-stage-button {
    @apply inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40;
  }

  .gesture-gem-stage-button-primary {
    @apply bg-cyan-500 text-slate-950 hover:bg-cyan-400;
  }

  .gesture-gem-stage-button-secondary {
    @apply border border-white/15 bg-white/5 text-white hover:bg-white/10;
  }

  .gesture-gem-stage-status {
    @apply text-sm text-white/60;
  }

  .gesture-gem-stage-status-active {
    @apply text-emerald-300;
  }

  .gesture-gem-stage-status-error {
    @apply text-rose-300;
  }

  .gesture-gem-stage-info {
    @apply rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-white/70;
  }

  .gesture-gem-stage-gem {
    position: absolute;
    z-index: 15;
    width: 4.5rem;
    height: 4.5rem;
    pointer-events: none;
    animation: gem-pop 480ms cubic-bezier(0.2, 0.9, 0.3, 1.2);
  }

  .gesture-gem-stage-gem-core,
  .gesture-gem-stage-gem-shell,
  .gesture-gem-stage-gem-ring,
  .gesture-gem-stage-particle {
    position: absolute;
    inset: 50% auto auto 50%;
    transform: translate(-50%, -50%);
  }

  .gesture-gem-stage-gem-core {
    width: 2rem;
    height: 2rem;
    background: linear-gradient(145deg, #fff5ca 0%, #ff8c1a 35%, #a929ff 100%);
    clip-path: polygon(50% 0%, 100% 40%, 74% 100%, 26% 100%, 0% 40%);
    box-shadow:
      0 0 18px rgb(255 165 0 / 70%),
      0 0 38px rgb(168 85 247 / 38%);
    animation: gem-spin 2.2s linear infinite;
  }

  .gesture-gem-stage-gem-shell {
    width: 2.3rem;
    height: 2.3rem;
    border: 1px solid rgb(255 255 255 / 45%);
    clip-path: polygon(50% 0%, 100% 40%, 74% 100%, 26% 100%, 0% 40%);
    opacity: 0.55;
    animation: gem-spin 2.8s linear infinite reverse;
  }

  .gesture-gem-stage-gem-ring {
    width: 3.4rem;
    height: 3.4rem;
    border: 2px solid rgb(255 183 77 / 60%);
    border-radius: 9999px;
    box-shadow: 0 0 20px rgb(255 183 77 / 28%);
    animation: gem-ring 1.8s linear infinite;
  }

  .gesture-gem-stage-particle {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 9999px;
    background: radial-gradient(
      circle,
      rgb(255 245 176 / 98%),
      rgb(255 145 0 / 90%)
    );
    box-shadow: 0 0 14px rgb(255 183 77 / 72%);
    animation: gem-particle 720ms ease-out both;
    transform: translate(-50%, -50%) rotate(var(--particle-angle))
      translateY(-0.2rem);
  }

  @keyframes gem-pop {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.35);
    }

    68% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.18);
    }

    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes gem-spin {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
    }

    100% {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  @keyframes gem-ring {
    0% {
      transform: translate(-50%, -50%) rotate(0deg) scale(0.94);
    }

    50% {
      transform: translate(-50%, -50%) rotate(180deg) scale(1.08);
    }

    100% {
      transform: translate(-50%, -50%) rotate(360deg) scale(0.94);
    }
  }

  @keyframes gem-particle {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) rotate(var(--particle-angle))
        translateY(-0.2rem) scale(0.2);
    }

    18% {
      opacity: 1;
    }

    100% {
      opacity: 0;
      transform: translate(-50%, -50%) rotate(var(--particle-angle))
        translateY(-2rem) scale(1);
    }
  }

  @media (width <= 640px) {
    .gesture-gem-stage-controls {
      @apply items-stretch;
    }

    .gesture-gem-stage-button {
      @apply flex-1;
    }

    .gesture-gem-stage-status {
      @apply w-full;
    }
  }
</style>
