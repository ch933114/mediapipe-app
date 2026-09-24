import { readFileSync } from "node:fs";
import path from "node:path";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { defineConfig } from "vite";
import svgLoader from "vite-svg-loader";

const packageJson = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "package.json"), "utf-8")
);

export default defineConfig(() => {
  return {
    base: "/mediapipe-app/",
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
