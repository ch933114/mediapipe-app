<script setup lang="ts">
  import { useLocale } from "@/i18n/useLocale";
  import { useSmileDevilMaskAr } from "@/composables/useSmileDevilMaskAr";

  const { t } = useLocale();
  const stageElement = ref<HTMLElement | null>(null);
  const videoElement = ref<HTMLVideoElement | null>(null);
  const {
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
  } = useSmileDevilMaskAr({ stageElement, videoElement });

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
        autoplay
        muted
        playsinline
      />
      <div v-if="overlayMessage" class="smile-devil-stage-overlay">
        {{ overlayMessage }}
      </div>
      <div
        v-if="isSmiling"
        class="smile-devil-mask"
        :style="maskStyle"
        aria-hidden="true"
      >
        <span class="smile-devil-mask-horn smile-devil-mask-horn-left" />
        <span class="smile-devil-mask-horn smile-devil-mask-horn-right" />
        <span class="smile-devil-mask-eye smile-devil-mask-eye-left" />
        <span class="smile-devil-mask-eye smile-devil-mask-eye-right" />
        <span class="smile-devil-mask-fang smile-devil-mask-fang-left" />
        <span class="smile-devil-mask-fang smile-devil-mask-fang-right" />
      </div>
      <div class="smile-devil-stage-hud">
        <span>{{
          isSmiling ? t("smile.state.maskOn") : t("smile.state.smilePrompt")
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
    @apply inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40;
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

  .smile-devil-mask {
    position: absolute;
    z-index: 15;
    pointer-events: none;
    border: 3px solid rgb(239 68 68 / 90%);
    border-radius: 48% 48% 42% 42%;
    background: radial-gradient(
      ellipse at 50% 38%,
      rgb(127 29 29 / 78%),
      rgb(30 5 12 / 96%) 72%
    );
    box-shadow:
      0 0 24px rgb(239 68 68 / 48%),
      inset 0 -18px 30px rgb(0 0 0 / 42%);
    animation: devil-mask-in 260ms ease-out;
  }

  .smile-devil-mask-horn {
    position: absolute;
    top: -30%;
    width: 28%;
    height: 46%;
    background: #991b1b;
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
    filter: drop-shadow(0 0 5px rgb(239 68 68 / 70%));
  }

  .smile-devil-mask-horn-left {
    left: 3%;
    transform: rotate(-22deg);
  }

  .smile-devil-mask-horn-right {
    right: 3%;
    transform: rotate(22deg);
  }

  .smile-devil-mask-eye {
    position: absolute;
    top: 42%;
    width: 19%;
    height: 7%;
    background: #fde68a;
    clip-path: polygon(0 50%, 100% 0, 82% 100%);
    box-shadow: 0 0 10px #fca5a5;
  }

  .smile-devil-mask-eye-left {
    left: 19%;
  }

  .smile-devil-mask-eye-right {
    right: 19%;
    transform: scaleX(-1);
  }

  .smile-devil-mask-fang {
    position: absolute;
    bottom: 15%;
    width: 9%;
    height: 18%;
    background: #fff7ed;
    clip-path: polygon(0 0, 100% 0, 50% 100%);
  }

  .smile-devil-mask-fang-left {
    left: 31%;
  }

  .smile-devil-mask-fang-right {
    right: 31%;
  }

  @keyframes devil-mask-in {
    from {
      opacity: 0;
      transform: translate(-50%, -45%) scale(0.82);
    }

    to {
      opacity: 1;
    }
  }
</style>
