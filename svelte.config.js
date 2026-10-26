import { vitePreprocess } from "@rsvelte/vite-plugin-svelte";
export default {
  preprocess: vitePreprocess(),
  compilerOptions: { css: "injected" },
};
