<script setup lang="ts">
  import { useLocale } from "@/i18n/useLocale";

  const { t } = useLocale();
</script>

<template>
  <main class="p-6">
    <h1 class="text-xl font-semibold">{{ t("common.appTitle") }}</h1>
    <p class="mt-2 text-sm text-gray-600">{{ t("home.lead") }}</p>
  </main>
</template>
