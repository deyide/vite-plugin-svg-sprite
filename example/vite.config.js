import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import svgSprite from "@olnho/vite-plugin-svg-sprite";

// https://vitejs.dev/config/
export default defineConfig((option) => {
  return {
    plugins: [
      vue(),
      svgSprite({
        svgPaths: ["./src/assets/icons"],
        extensions: [".svg"],
      }),
    ],
  };
});
