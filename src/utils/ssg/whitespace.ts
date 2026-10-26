import { fromMarkdown } from "mdast-util-from-markdown";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { frontmatter } from "micromark-extension-frontmatter";

interface MarkdownNode {
  type: string;
  position?: { start: { offset?: number }; end: { offset?: number } };
  children?: MarkdownNode[];
}

/**
 * Replaces full-width spaces in Markdown text with a character reference before
 * ox-content parses the source. ox-content trims Unicode whitespace from text
 * nodes, so a leading U+3000 would otherwise disappear from a paragraph.
 */
export function preserveFullWidthSpaces(source: string): string {
  if (!source.includes("\u3000")) return source;

  const ast = fromMarkdown(source, {
    extensions: [frontmatter(["yaml"])],
    mdastExtensions: [frontmatterFromMarkdown(["yaml"])],
  });
  const offsets: number[] = [];
  const visit = (node: MarkdownNode) => {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    // Autolink labels share their source with the destination: leave those URLs intact.
    if (node.type === "link" && start !== undefined && source[start] === "<") return;
    if (node.type === "text" && start !== undefined && end !== undefined) {
      for (let offset = start; offset < end; offset++) {
        if (source[offset] === "\u3000") offsets.push(offset);
      }
    }
    node.children?.forEach(visit);
  };
  visit(ast);

  let result = "";
  let cursor = 0;
  for (const offset of offsets.sort((a, b) => a - b)) {
    result += source.slice(cursor, offset) + "&#x3000;";
    cursor = offset + 1;
  }
  return result + source.slice(cursor);
}
