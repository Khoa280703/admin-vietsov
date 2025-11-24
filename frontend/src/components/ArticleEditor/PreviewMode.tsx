import type { Article } from "@/types/article";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { ImageResize } from "@/extensions/ImageResize.tsx";
import { Link } from "@tiptap/extension-link";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { CharacterCount } from "@tiptap/extension-character-count";
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
import PreviewLayout from "@/components/PreviewLayout/PreviewLayout";

interface PreviewModeProps {
  article: Partial<Article>;
}

export function PreviewMode({ article }: PreviewModeProps) {
  const lowlight = createLowlight(common);

  // Create read-only editor for preview
  const editor = useEditor({
    extensions: [
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
        lowlight,
      }),
      ImageResize.configure({
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
        types: ["heading", "paragraph", "tableCell", "imageResize"],
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
      CharacterCount,
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
    ],
    content: article.content || { type: "doc", content: [] },
    editable: false, // Read-only for preview
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none",
      },
    },
  });

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading preview...</p>
      </div>
    );
  }

  return (
    <PreviewLayout
      title={article.title || "Untitled Article"}
      subtitle={article.subtitle}
      category={article.category}
      timestamp={
        article.updatedAt
          ? new Date(article.updatedAt).toLocaleDateString("vi-VN")
          : undefined
      }
      excerpt={article.excerpt}
      author={article.author}
      featuredImage={article.featuredImage}
      editor={editor}
      tags={article.tags || []}
      activePath="/tintuc/hoat-dong-doan-the"
    />
  );
}

export default PreviewMode;
