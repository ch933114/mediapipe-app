<script setup lang="ts">
  import type { Component } from "vue";
  import DanceDetectionStage from "@/components/common/DanceDetectionStage.vue";
  import EeveeDetectionStage from "@/components/common/EeveeDetectionStage.vue";
  import GestureGemStage from "@/components/common/GestureGemStage.vue";
  import SmileDevilMaskStage from "@/components/common/SmileDevilMaskStage.vue";
  import { useLocale } from "@/i18n/useLocale";

  type DemoTab = "gesture" | "dance" | "eevee" | "smile";

  const { t } = useLocale();

  const activeTab = ref<DemoTab>("gesture");
  const tabRailElement = ref<HTMLElement | null>(null);

  function handleTabRailWheel(event: WheelEvent) {
    const tabRail = tabRailElement.value;

    if (!tabRail || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    event.preventDefault();
    tabRail.scrollLeft += event.deltaY;
  }

  const tabItems = computed(() => [
    {
      key: "gesture" as const,
      title: t("home.tabs.gesture"),
      description: t("home.panels.gesture.description"),
    },
    {
      key: "dance" as const,
      title: t("home.tabs.dance"),
      description: t("home.panels.dance.description"),
    },
    {
      key: "eevee" as const,
      title: t("home.tabs.eevee"),
      description: t("home.panels.eevee.description"),
    },
    {
      key: "smile" as const,
      title: t("home.tabs.smile"),
      description: t("home.panels.smile.description"),
    },
  ]);

  type PanelConfig = {
    component: Component;
    description: string;
    steps: Array<{ description: string; title: string }>;
    title: string;
  };

  const panelMap = computed<Record<DemoTab, PanelConfig>>(() => ({
    gesture: {
      title: t("home.panels.gesture.title"),
      description: t("home.panels.gesture.description"),
      component: GestureGemStage,
      steps: [
        {
          title: t("home.steps.gesture.step1.title"),
          description: t("home.steps.gesture.step1.description"),
        },
        {
          title: t("home.steps.gesture.step2.title"),
          description: t("home.steps.gesture.step2.description"),
        },
        {
          title: t("home.steps.gesture.step3.title"),
          description: t("home.steps.gesture.step3.description"),
        },
      ],
    },
    dance: {
      title: t("home.panels.dance.title"),
      description: t("home.panels.dance.description"),
      component: DanceDetectionStage,
      steps: [
        {
          title: t("home.steps.dance.step1.title"),
          description: t("home.steps.dance.step1.description"),
        },
        {
          title: t("home.steps.dance.step2.title"),
          description: t("home.steps.dance.step2.description"),
        },
        {
          title: t("home.steps.dance.step3.title"),
          description: t("home.steps.dance.step3.description"),
        },
      ],
    },
    eevee: {
      title: t("home.panels.eevee.title"),
      description: t("home.panels.eevee.description"),
      component: EeveeDetectionStage,
      steps: [
        {
          title: t("home.steps.eevee.step1.title"),
          description: t("home.steps.eevee.step1.description"),
        },
        {
          title: t("home.steps.eevee.step2.title"),
          description: t("home.steps.eevee.step2.description"),
        },
        {
          title: t("home.steps.eevee.step3.title"),
          description: t("home.steps.eevee.step3.description"),
        },
      ],
    },
    smile: {
      title: t("home.panels.smile.title"),
      description: t("home.panels.smile.description"),
      component: SmileDevilMaskStage,
      steps: [
        {
          title: t("home.steps.smile.step1.title"),
          description: t("home.steps.smile.step1.description"),
        },
        {
          title: t("home.steps.smile.step2.title"),
          description: t("home.steps.smile.step2.description"),
        },
        {
          title: t("home.steps.smile.step3.title"),
          description: t("home.steps.smile.step3.description"),
        },
      ],
    },
  }));

  const activePanel = computed(
    () => panelMap.value[activeTab.value] ?? panelMap.value.gesture
  );
</script>

<template>
  <main class="min-h-screen bg-[#05070d] px-4 py-8 text-white sm:px-6 lg:px-8">
    <section
      class="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-[32px] border border-white/10 bg-white/[0.03] px-5 py-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur sm:px-8 sm:py-8"
    >
      <div class="flex flex-col gap-3">
        <p
          class="w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-200"
        >
          {{ t("home.eyebrow") }}
        </p>
        <h1
          class="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          {{ t("common.appTitle") }}
        </h1>
        <p class="max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
          {{ t("home.lead") }}
        </p>
      </div>

      <div
        ref="tabRailElement"
        class="home-tab-rail"
        @wheel="handleTabRailWheel"
      >
        <button
          v-for="tabItem in tabItems"
          :key="tabItem.key"
          :class="[
            'home-tab-card rounded-[28px] border px-5 py-4 text-left transition',
            activeTab === tabItem.key
              ? 'border-cyan-300/70 bg-cyan-400/10 shadow-[0_16px_50px_rgba(34,211,238,0.14)]'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]',
          ]"
          type="button"
          @click="activeTab = tabItem.key"
        >
          <p class="text-base font-semibold text-white">{{ tabItem.title }}</p>
          <p class="mt-2 text-sm leading-6 text-white/65">
            {{ tabItem.description }}
          </p>
        </button>
      </div>

      <div class="rounded-[28px] border border-white/10 bg-black/15 p-5 sm:p-6">
        <div class="mb-6 flex flex-col gap-2">
          <h2 class="text-2xl font-semibold text-white">
            {{ activePanel.title }}
          </h2>
          <p class="max-w-3xl text-sm leading-7 text-white/65">
            {{ activePanel.description }}
          </p>
        </div>

        <component :is="activePanel.component" />
      </div>

      <div class="grid gap-3 text-sm text-white/65 sm:grid-cols-3">
        <article
          v-for="step in activePanel.steps"
          :key="step.title"
          class="rounded-3xl border border-white/10 bg-white/5 p-4"
        >
          <h3 class="text-sm font-semibold text-white">
            {{ step.title }}
          </h3>
          <p class="mt-2 leading-6">{{ step.description }}</p>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
  .home-tab-rail {
    display: grid;
    gap: 0.75rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    grid-auto-columns: minmax(18rem, 1fr);
    grid-auto-flow: column;
    scrollbar-width: none;
  }

  .home-tab-rail::-webkit-scrollbar {
    display: none;
  }

  .home-tab-card {
    min-height: 100%;
  }

  @media (width >= 768px) {
    .home-tab-rail {
      grid-auto-columns: minmax(0, 1fr);
    }
  }
</style>
