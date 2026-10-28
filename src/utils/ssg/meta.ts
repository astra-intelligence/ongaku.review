import { site } from "../../config/site";

export interface SocialImage {
  /** Absolute URL of the image. */
  url: string;
  width?: number;
  height?: number;
  /** MIME type, e.g. `image/png`. */
  type?: string;
  alt: string;
}

export interface ArticleMeta {
  /** ISO 8601 in JST (`YYYY-MM-DDT00:00:00+09:00`). */
  publishedTime?: string;
  modifiedTime?: string;
  tags: string[];
}

export interface MetaTagsContext {
  /** Full document title (already includes the site suffix where applicable). */
  title: string;
  description: string;
  canonical: string;
  ogType: "article" | "website";
  card: "summary_large_image" | "summary";
  image?: SocialImage;
  article?: ArticleMeta;
}

export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );

const metaTag = (property: string, content: string) =>
  `<meta property="${property}" content="${escapeHtml(content)}">`;

const nameTag = (name: string, content: string) =>
  `<meta name="${name}" content="${escapeHtml(content)}">`;

const imageTags = (image: SocialImage, alt: string) =>
  [
    metaTag("og:image", image.url),
    image.width ? metaTag("og:image:width", String(image.width)) : "",
    image.height ? metaTag("og:image:height", String(image.height)) : "",
    image.type ? metaTag("og:image:type", image.type) : "",
    metaTag("og:image:alt", alt),
    nameTag("twitter:image", image.url),
    nameTag("twitter:image:alt", alt),
  ].join("");

const articleTags = (article: ArticleMeta) =>
  [
    article.publishedTime ? metaTag("article:published_time", article.publishedTime) : "",
    article.modifiedTime ? metaTag("article:modified_time", article.modifiedTime) : "",
    ...article.tags.map((tag) => metaTag("article:tag", tag)),
  ].join("");

/**
 * Assembles the Open Graph + Twitter Card meta tags shared by every page.
 * Article pages get `summary_large_image` with the post thumbnail and
 * `article` type; all other pages (home, tag, About, 404) get `summary`
 * with the site icon, so X/Slack/Discord never render a bare text card.
 */
export function renderMetaTags(context: MetaTagsContext): string {
  return [
    metaTag("og:site_name", site.title),
    metaTag("og:title", context.title),
    metaTag("og:description", context.description),
    metaTag("og:url", context.canonical),
    metaTag("og:type", context.ogType),
    metaTag("og:locale", "ja_JP"),
    context.image ? imageTags(context.image, context.image.alt) : "",
    nameTag("twitter:card", context.card),
    nameTag("twitter:title", context.title),
    nameTag("twitter:description", context.description),
    context.article ? articleTags(context.article) : "",
  ]
    .filter(Boolean)
    .join("");
}
