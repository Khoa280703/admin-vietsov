import type { Article } from '@/types/article';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { ImageResize } from '@/extensions/ImageResize.tsx';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Youtube } from '@tiptap/extension-youtube';
import { Typography } from '@tiptap/extension-typography';
import { FontFamily } from '@tiptap/extension-font-family';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { FontSize } from '@/extensions/FontSize';
import { LineHeight } from '@/extensions/LineHeight';
import { LetterSpacing } from '@/extensions/LetterSpacing';
import { Indent } from '@/extensions/Indent';
import { createLowlight, common } from 'lowlight';

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
          class: 'text-primary underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
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
        types: ['textStyle'],
      }),
      Subscript,
      Superscript,
      FontSize.configure({
        types: ['textStyle'],
      }),
      LineHeight.configure({
        types: ['paragraph', 'heading'],
        defaultLineHeight: '1.5',
      }),
      LetterSpacing.configure({
        types: ['textStyle'],
      }),
      Indent.configure({
        types: ['paragraph', 'heading'],
        minLevel: 0,
        maxLevel: 8,
      }),
    ],
    content: article.content || { type: 'doc', content: [] },
    editable: false, // Read-only for preview
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none',
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      <article className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
        {/* Featured Image */}
        {article.featuredImage && (
          <div className="mb-8 -mx-8">
            <img
              src={article.featuredImage}
              alt={article.title || 'Featured image'}
              className="w-full h-64 sm:h-96 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Category */}
        {article.category && (
          <div className="mb-4">
            <Badge variant="secondary">{article.category}</Badge>
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
          {article.title || 'Untitled Article'}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="text-xl text-muted-foreground mb-6 italic">
            {article.subtitle}
          </p>
        )}

        {/* Meta Information */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8 not-prose">
          {article.author && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{article.author}</span>
            </div>
          )}
          {article.updatedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{dayjs(article.updatedAt).format('MMMM D, YYYY')}</span>
            </div>
          )}
          {article.readingTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{article.readingTime} min read</span>
            </div>
          )}
        </div>

        {/* Excerpt */}
        {article.excerpt && (
          <Card className="p-4 mb-8 bg-muted/50">
            <p className="text-lg italic not-prose">{article.excerpt}</p>
          </Card>
        )}

        {/* Content */}
        <div className="article-content">
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <p className="text-muted-foreground">Loading content...</p>
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t not-prose">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

export default PreviewMode;

