import { describe, expect, it } from "vitest";
import { renderMetaTags } from "./meta";

describe("renderMetaTags", () => {
  it("記事ページはsummary_large_image＋記事サムネイル＋article型を出力する", () => {
    const html = renderMetaTags({
      title: "「アビイ・ロード」を2026年に聴く | ongaku.review",
      description: "The Beatles「Abbey Road」を通して聴いた記録です。",
      canonical: "https://ongaku.review/posts/abbey-road",
      ogType: "article",
      card: "summary_large_image",
      image: {
        url: "https://ongaku.review/assets/abc123.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "「アビイ・ロード」を2026年に聴く",
      },
      article: {
        publishedTime: "2026-10-25T00:00:00+09:00",
        modifiedTime: "2026-10-26T00:00:00+09:00",
        tags: ["ロック", "The Beatles"],
      },
    });
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain(
      '<meta property="og:image" content="https://ongaku.review/assets/abc123.png">',
    );
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta property="og:image:height" content="630">');
    expect(html).toContain('<meta property="og:image:type" content="image/png">');
    expect(html).toContain(
      '<meta property="og:image:alt" content="「アビイ・ロード」を2026年に聴く">',
    );
    expect(html).toContain(
      '<meta name="twitter:image" content="https://ongaku.review/assets/abc123.png">',
    );
    expect(html).toContain(
      '<meta name="twitter:image:alt" content="「アビイ・ロード」を2026年に聴く">',
    );
    expect(html).toContain(
      '<meta property="article:published_time" content="2026-10-25T00:00:00+09:00">',
    );
    expect(html).toContain(
      '<meta property="article:modified_time" content="2026-10-26T00:00:00+09:00">',
    );
    expect(html).toContain('<meta property="article:tag" content="ロック">');
    expect(html).toContain('<meta property="article:tag" content="The Beatles">');
    expect(html).toContain('<meta property="og:locale" content="ja_JP">');
    expect(html).toContain('<meta property="og:site_name" content="ongaku.review">');
  });

  it("記事以外のページはsummary＋サイトアイコンにフォールバックする", () => {
    const html = renderMetaTags({
      title: "ongaku.review",
      description: "音楽が好き。",
      canonical: "https://ongaku.review",
      ogType: "website",
      card: "summary",
      image: {
        url: "https://ongaku.review/icon-512.png",
        width: 512,
        height: 512,
        type: "image/png",
        alt: "ongaku.review",
      },
    });
    expect(html).toContain('<meta property="og:type" content="website">');
    expect(html).toContain('<meta name="twitter:card" content="summary">');
    expect(html).toContain(
      '<meta property="og:image" content="https://ongaku.review/icon-512.png">',
    );
    expect(html).toContain('<meta property="og:image:width" content="512">');
    expect(html).toContain('<meta property="og:image:height" content="512">');
    expect(html).toContain('<meta property="og:image:type" content="image/png">');
    expect(html).toContain('<meta property="og:image:alt" content="ongaku.review">');
    expect(html).toContain(
      '<meta name="twitter:image" content="https://ongaku.review/icon-512.png">',
    );
    expect(html).toContain('<meta name="twitter:image:alt" content="ongaku.review">');
    expect(html).toContain('<meta property="og:locale" content="ja_JP">');
    expect(html).not.toContain("article:published_time");
    expect(html).not.toContain("article:tag");
  });

  it("404ページはwebsite＋summaryの最小構成で出力する", () => {
    const html = renderMetaTags({
      title: "ページが見つかりません | ongaku.review",
      description: "お探しのページは見つかりませんでした。",
      canonical: "https://ongaku.review/404.html",
      ogType: "website",
      card: "summary",
      image: {
        url: "https://ongaku.review/icon-512.png",
        width: 512,
        height: 512,
        type: "image/png",
        alt: "ongaku.review",
      },
    });
    expect(html).toContain('<meta property="og:type" content="website">');
    expect(html).toContain('<meta name="twitter:card" content="summary">');
    expect(html).toContain('<meta property="og:locale" content="ja_JP">');
    expect(html).toContain(
      '<meta property="og:image" content="https://ongaku.review/icon-512.png">',
    );
    expect(html).not.toContain("article:");
  });

  it("画像なしの設定でも空のタグを出力しない", () => {
    const html = renderMetaTags({
      title: "ongaku.review",
      description: "音楽が好き。",
      canonical: "https://ongaku.review",
      ogType: "website",
      card: "summary",
    });
    expect(html).not.toContain("og:image");
    expect(html).not.toContain("twitter:image");
    expect(html).toContain('<meta property="og:type" content="website">');
    expect(html).toContain('<meta name="twitter:card" content="summary">');
  });
});
