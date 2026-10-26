import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { listPosts, loadDocs } from "./content";

const roots: string[] = [];

async function createRoot(posts: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "ongaku-review-"));
  roots.push(root);
  const directory = path.join(root, "src/content/posts");
  await mkdir(directory, { recursive: true });
  for (const [name, source] of Object.entries(posts))
    await writeFile(path.join(directory, name), source, "utf8");
  return root;
}

const post = (frontmatter: string) => `---\n${frontmatter}\n---\n\n# 見出し\n`;

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("loadDocs", () => {
  it("createdとupdatedを読み取る", async () => {
    const root = await createRoot({
      "first.md": post("title: 最初の記事\ncreated: 2026-10-01\nupdated: 2026-10-20"),
    });

    const [doc] = await loadDocs(root);

    expect(doc?.created).toBe("2026-10-01");
    expect(doc?.updated).toBe("2026-10-20");
  });

  it("updatedを省略するとcreatedと同じ日時になる", async () => {
    const root = await createRoot({
      "first.md": post("title: 最初の記事\ncreated: 2026-10-01"),
    });

    const [doc] = await loadDocs(root);

    expect(doc?.updated).toBe("2026-10-01");
  });
});

describe("listPosts", () => {
  it("updatedではなくcreatedの新しい順に並べる", async () => {
    const root = await createRoot({
      "old.md": post("title: 古い記事\ncreated: 2026-10-01\nupdated: 2026-10-30"),
      "new.md": post("title: 新しい記事\ncreated: 2026-10-20\nupdated: 2026-10-21"),
      "undated.md": post("title: 日付なし"),
    });

    const docs = await loadDocs(root);

    expect(listPosts(docs).map((doc) => doc.title)).toEqual(["新しい記事", "古い記事", "日付なし"]);
  });
});
