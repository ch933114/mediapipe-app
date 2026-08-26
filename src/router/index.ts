import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import { resolveEnvValue } from "@/utils/resolveEnv";

export const router = createRouter({
  history: createWebHistory(resolveEnvValue(import.meta.env.VITE_APP_BASE_URL)),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
  ],
});
