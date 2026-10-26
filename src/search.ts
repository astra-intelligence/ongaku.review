import type { SearchResult } from "@ox-content/vite-plugin";
import { search } from "virtual:ox-content/search";
import { defaultPostIcon, icons, isPostIcon } from "./config/icons";
import { normalizeSearchPath } from "./utils/search-path";

function resultItem(result: SearchResult, pagesByIndexPath: Record<string, unknown>) {
  const indexPath = normalizeSearchPath(result.url);
  const page = pagesByIndexPath[indexPath];
  const entry =
    page && typeof page === "object" ? (page as { path?: unknown; icon?: unknown }) : undefined;
  const path = typeof entry?.path === "string" ? entry.path : indexPath;
  const icon = entry?.icon;
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.className = "file-link";
  link.href = path;
  const image = document.createElement("img");
  image.src = icons[isPostIcon(icon) ? icon : defaultPostIcon];
  image.alt = "";
  image.width = 24;
  image.height = 24;
  const title = document.createElement("span");
  title.textContent = result.title;
  link.append(image, title);
  item.append(link);
  if (result.snippet) {
    const snippet = document.createElement("p");
    snippet.className = "search-snippet";
    snippet.textContent = result.snippet;
    item.append(snippet);
  }
  return item;
}

export function initSearch(form: HTMLFormElement) {
  const input = form.elements.namedItem("q");
  const status = document.querySelector<HTMLElement>("[data-search-status]");
  const list = document.querySelector<HTMLElement>("[data-search-results]");
  if (!(input instanceof HTMLInputElement) || !status || !list) return;
  const pagesByIndexPath = JSON.parse(list.dataset.searchPages ?? "{}") as Record<string, unknown>;
  let latest = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const run = async (query: string) => {
    const request = ++latest;
    const keyword = query.trim();
    const url = new URL(location.href);
    if (keyword) url.searchParams.set("q", keyword);
    else url.searchParams.delete("q");
    history.replaceState(history.state, "", url);
    if (!keyword) {
      list.replaceChildren();
      status.textContent = "";
      return;
    }
    try {
      const results = await search(keyword);
      if (request !== latest) return;
      list.replaceChildren(...results.map((result) => resultItem(result, pagesByIndexPath)));
      status.textContent = results.length
        ? `「${keyword}」の検索結果：${results.length}件`
        : `「${keyword}」に一致するページは見つかりませんでした。`;
    } catch {
      if (request !== latest) return;
      list.replaceChildren();
      status.textContent = "検索できませんでした。時間をおいてもう一度お試しください。";
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearTimeout(timer);
    void run(input.value);
  });
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(input.value), 200);
  });

  const initial = new URLSearchParams(location.search).get("q");
  if (initial) {
    input.value = initial;
    void run(initial);
  }
}
