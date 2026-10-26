declare module "virtual:ox-content/search" {
  import type { SearchResult } from "@ox-content/vite-plugin";
  export function search(query: string, options?: { limit?: number }): Promise<SearchResult[]>;
}
declare module "virtual:ox-content-svelte/html-host/modules" {
  import type { SvelteHtmlHostClientModules } from "@ox-content/vite-plugin-svelte";
  const modules: SvelteHtmlHostClientModules;
  export default modules;
}
