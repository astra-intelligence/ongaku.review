import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { defineConfig } from "vite-plus";
import { svelte } from "@rsvelte/vite-plugin-svelte";
import {
  buildSearchIndex,
  oxContentCustomHost,
  planCollectionAssetsFromDocuments,
} from "@ox-content/vite-plugin";
import { createSvelteHtmlHostIslandRegistry } from "@ox-content/vite-plugin-svelte";
import type { PreviewServer, ViteDevServer } from "vite";
import { contentDirectory, loadDocs } from "./src/utils/ssg/content";
import { site } from "./src/config/site";

export default defineConfig(async ({ mode }) => {
  const root = import.meta.dirname;
  const registry = createSvelteHtmlHostIslandRegistry({
    documents: async () =>
      (await loadDocs(root)).map(({ documentPath, source }) => ({ documentPath, source })),
    entries: [{ moduleId: "/src/components/SiteStatus.svelte", name: "SiteStatus" }],
    components: {
      SiteStatus: root + "/src/components/SiteStatus.svelte",
    },
    watch: [contentDirectory],
    root,
  });
  return {
    appType: "mpa" as const,
    server: {
      fs: {
        allow: [root],
      },
    },
    plugins: [
      {
        name: "site-public-search",
        configurePreviewServer(server: PreviewServer) {
          return () =>
            server.middlewares.use(async (_request, response, next) => {
              try {
                const dist = path.resolve(root, "dist");
                const requested = path.resolve(
                  dist,
                  "." + decodeURIComponent((_request.url ?? "/").split("?")[0]),
                );
                if (
                  requested.startsWith(dist + path.sep) &&
                  (await stat(requested).catch(() => null))?.isFile()
                )
                  return next();
                const html = await readFile(path.join(root, "dist/404.html"), "utf8");
                response.statusCode = 404;
                response.setHeader("Content-Type", "text/html; charset=utf-8");
                response.end(html);
              } catch (error) {
                next(error);
              }
            });
        },
        configureServer(server: ViteDevServer) {
          server.middlewares.use(async (request, response, next) => {
            if (request.url?.split("?")[0] !== "/search-index.json") return next();
            try {
              const index = await buildSearchIndex(path.join(root, contentDirectory), "/", [
                ".mdx",
                ".md",
              ]);
              response.setHeader("Content-Type", "application/json; charset=utf-8");
              response.end(index);
            } catch (error) {
              next(error);
            }
          });
        },
      },
      svelte(),
      registry.plugin,
      oxContentCustomHost({
        host: "./src/utils/ssg/host.ts",
        collectionAssets: {
          watch: [{ path: contentDirectory, kind: "directory" }],
          manifest: async (ctx) => {
            const docs = await loadDocs(ctx.root);
            const result = await planCollectionAssetsFromDocuments({
              root: ctx.root,
              contentRoot: contentDirectory,
              documents: docs.map((doc) => ({
                documentPath: doc.documentPath,
                pagePath: doc.path,
              })),
            });
            if (result.diagnostics.length)
              throw new Error(result.diagnostics.map((item) => item.message).join("\n"));
            return result.manifest;
          },
        },
        oxContent: {
          srcDir: contentDirectory,
          docs: false,
          highlight: true,
          mdx: true,
          search: { limit: 8, hotkey: "" },
          feeds: { formats: ["rss"], title: site.title, language: "ja" },
          siteMaps: { llms: false },
          ssg: {
            siteUrl: site.url,
            siteName: site.title,
            markdownSource: false,
          },
        },
        dev: {
          feedOutputs: true,
          routeDependencies: [{ path: contentDirectory, kind: "directory" }],
        },
        build: { enabled: mode !== "test", transformHtml: false },
      }),
    ],
    build: {
      manifest: true,
      rolldownOptions: { input: { client: "src/client.ts" } },
    },
    test: { include: ["src/**/*.test.ts"] },
  };
});
