import type { Article, DraftMetadata } from "@/types/article";
import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Youtube } from "@tiptap/extension-youtube";
import { Typography } from "@tiptap/extension-typography";
import { FontFamily } from "@tiptap/extension-font-family";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { FontSize } from "@/extensions/FontSize";
import { LineHeight } from "@/extensions/LineHeight";
import { LetterSpacing } from "@/extensions/LetterSpacing";
import { Indent } from "@/extensions/Indent";
import { createLowlight, common } from "lowlight";

const STORAGE_KEY = "article_drafts";
const METADATA_KEY = "drafts_metadata";

// Helper function to extract text from JSONContent
function extractTextFromJSON(json: JSONContent): string {
  if (!json) return "";

  let text = "";

  // If it's a text node, add the text
  if (json.type === "text" && json.text) {
    text += json.text;
  }

  // Recursively process content array
  if (json.content && Array.isArray(json.content)) {
    text += json.content.map((child) => extractTextFromJSON(child)).join("");
  }

  // Add line breaks for block nodes
  if (
    ["paragraph", "heading", "blockquote", "codeBlock"].includes(
      json.type || ""
    )
  ) {
    text += "\n";
  }

  return text;
}

// Shared extensions for content conversion
const extensions = [
  StarterKit.configure({
    codeBlock: false,
  }),
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableCell,
  TableHeader,
  CodeBlockLowlight.configure({
    lowlight: createLowlight(common),
  }),
  Image.configure({
    inline: true,
    allowBase64: true,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "text-primary underline",
    },
  }),
  TextAlign.configure({
    types: ["heading", "paragraph", "image"],
  }),
  Color,
  TextStyle,
  Highlight.configure({
    multicolor: true,
  }),
  Underline,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Youtube.configure({
    width: 640,
    height: 480,
  }),
  Typography,
  FontFamily.configure({
    types: ["textStyle"],
  }),
  Subscript,
  Superscript,
  FontSize.configure({
    types: ["textStyle"],
  }),
  LineHeight.configure({
    types: ["paragraph", "heading"],
    defaultLineHeight: "1.5",
  }),
  LetterSpacing.configure({
    types: ["textStyle"],
  }),
  Indent.configure({
    types: ["paragraph", "heading"],
    minLevel: 0,
    maxLevel: 8,
  }),
];

export class StorageManager {
  static saveDraft(article: Article): void {
    try {
      const drafts = this.getAllDrafts();
      const existingIndex = drafts.findIndex((d) => d.id === article.id);

      if (existingIndex !== -1) {
        drafts[existingIndex] = article;
      } else {
        drafts.push(article);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
      this.updateMetadata(article);
    } catch (error) {
      throw new Error("Failed to save draft");
    }
  }

  static getDraft(id: string): Article | null {
    try {
      const drafts = this.getAllDrafts();
      return drafts.find((d) => d.id === id) || null;
    } catch (error) {
      return null;
    }
  }

  static getAllDrafts(): Article[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  static deleteDraft(id: string): void {
    try {
      const drafts = this.getAllDrafts().filter((d) => d.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
      this.deleteMetadata(id);
    } catch (error) {
      throw new Error("Failed to delete draft");
    }
  }

  static duplicateDraft(id: string): Article | null {
    try {
      const original = this.getDraft(id);
      if (!original) return null;

      const duplicate: Article = {
        ...original,
        id: this.generateId(),
        title: `${original.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.saveDraft(duplicate);
      return duplicate;
    } catch (error) {
      return null;
    }
  }

  static getAllMetadata(): DraftMetadata[] {
    try {
      const data = localStorage.getItem(METADATA_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  private static updateMetadata(article: Article): void {
    const metadata = this.getAllMetadata();
    const existingIndex = metadata.findIndex((m) => m.id === article.id);

    // Extract preview text from content (handle both JSON and HTML)
    let preview = "";
    if (typeof article.content === "string") {
      // Legacy HTML format
      preview = article.content.replace(/<[^>]*>/g, "").substring(0, 150);
    } else if (article.content && typeof article.content === "object") {
      // JSON format - extract text
      try {
        preview = extractTextFromJSON(article.content as JSONContent)
          .trim()
          .substring(0, 150);
      } catch (error) {
        preview = "Content preview unavailable";
      }
    }

    const newMetadata: DraftMetadata = {
      id: article.id,
      title: article.title || "Untitled",
      lastModified: article.updatedAt,
      wordCount: article.wordCount,
      preview,
    };

    if (existingIndex !== -1) {
      metadata[existingIndex] = newMetadata;
    } else {
      metadata.push(newMetadata);
    }

    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  }

  private static deleteMetadata(id: string): void {
    const metadata = this.getAllMetadata().filter((m) => m.id !== id);
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  }

  static generateId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static exportToJSON(article: Article): string {
    return JSON.stringify(article, null, 2);
  }

  static exportToMarkdown(article: Article): string {
    let markdown = `# ${article.title}\n\n`;

    if (article.subtitle) {
      markdown += `*${article.subtitle}*\n\n`;
    }

    if (article.author) {
      markdown += `**Author:** ${article.author}\n`;
    }

    if (article.tags.length > 0) {
      markdown += `**Tags:** ${article.tags.join(", ")}\n`;
    }

    markdown += `\n---\n\n`;

    // Convert content to text (handle both JSON and HTML)
    if (typeof article.content === "string") {
      // Legacy HTML format
      markdown += article.content.replace(/<[^>]*>/g, "");
    } else if (article.content && typeof article.content === "object") {
      // JSON format - extract text
      try {
        markdown += extractTextFromJSON(article.content as JSONContent).trim();
      } catch (error) {
        markdown += "Content conversion error";
      }
    }

    return markdown;
  }

  static exportToHTML(article: Article): string {
    // Convert content to HTML (handle both JSON and HTML)
    let contentHTML = "";
    if (typeof article.content === "string") {
      // Legacy HTML format - use as is
      contentHTML = article.content;
    } else if (article.content && typeof article.content === "object") {
      // JSON format - convert to HTML
      try {
        contentHTML = generateHTML(article.content as JSONContent, extensions);
      } catch (error) {
        contentHTML = "<p>Content conversion error</p>";
      }
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title}</title>
    ${
      article.metaDescription
        ? `<meta name="description" content="${article.metaDescription}">`
        : ""
    }
</head>
<body>
    <article>
        <header>
            <h1>${article.title}</h1>
            ${
              article.subtitle
                ? `<p class="subtitle">${article.subtitle}</p>`
                : ""
            }
            ${
              article.author ? `<p class="author">By ${article.author}</p>` : ""
            }
        </header>
        <main>
            ${contentHTML}
        </main>
    </article>
</body>
</html>
    `.trim();
  }

  static clearAllDrafts(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(METADATA_KEY);
  }
}
