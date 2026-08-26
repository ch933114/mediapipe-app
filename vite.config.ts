import { readFileSync } from "node:fs";
import path from "node:path";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { defineConfig, loadEnv } from "vite";
import svgLoader from "vite-svg-loader";

import { resolveEnvValue } from "./src/utils/resolveEnv";

const packageJson = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "package.json"), "utf-8")
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode ?? "development", process.cwd(), "") ?? {};
  const base = resolveEnvValue(env.VITE_APP_BASE_URL, "/");

  return {
    base,
    plugins: [
      vue(),
      svgLoader(),
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        eslintrc: {
          enabled: true,
          filepath: "./.eslintrc-auto-import.json",
          globalsPropValue: "readonly",
        },
        dts: "auto-imports.d.ts",
      }),
      Components({
        dirs: ["src/components"],
        extensions: ["vue"],
        deep: true,
        dts: "components.d.ts",
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
    },
    define: {
      "import.meta.env.VITE_APPLICATION_VERSION": JSON.stringify(
        packageJson.version
      ),
    },
  };
});
