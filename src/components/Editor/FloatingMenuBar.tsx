import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code2,
  Image as ImageIcon,
  Table as TableIcon,
  Quote,
} from 'lucide-react';
import { compressImage, isImageFile, validateImageSize } from '@/utils/imageHandler';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface FloatingMenuBarProps {
  editor: Editor;
}

export function FloatingMenuBar({ editor }: FloatingMenuBarProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const { selection } = editor.state;
      const { $from, empty } = selection;
      
      // Show when cursor is at start of empty paragraph
      const isEmptyTextBlock =
        $from.parent.isTextblock &&
        !$from.parent.type.spec.code &&
        !$from.parent.textContent;

      setIsVisible(empty && isEmptyTextBlock);
    };

    editor.on('selectionUpdate', updateVisibility);
    editor.on('transaction', updateVisibility);

    return () => {
      editor.off('selectionUpdate', updateVisibility);
      editor.off('transaction', updateVisibility);
    };
  }, [editor]);

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!isImageFile(file)) {
        toast.error(t('editor.imageError'));
        return;
      }

      if (!validateImageSize(file, 5)) {
        toast.error(t('editor.imageSizeError'));
        return;
      }

      try {
        const base64 = await compressImage(file);
        editor.chain().focus().setImage({ src: base64 }).run();
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(t('editor.imageUploadFailed'));
      }
    };
    input.click();
  };

  if (!isVisible) return null;

  return (
    <div
      className="absolute z-50 flex flex-col gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      style={{
        left: '-52px',
        top: '0',
      }}
    >
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className="h-8 w-8 p-0"
        title={t("toolbar.heading1")}
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="h-8 w-8 p-0"
        title={t("toolbar.heading2")}
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className="h-8 w-8 p-0"
        title={t("toolbar.heading3")}
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="h-8 w-8 p-0"
        title={t("toolbar.bulletList")}
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-8 w-8 p-0"
        title={t("toolbar.numberedList")}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className="h-8 w-8 p-0"
        title={t("toolbar.blockquote")}
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className="h-8 w-8 p-0"
        title={t("toolbar.codeBlock")}
      >
        <Code2 className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={addImage}
        className="h-8 w-8 p-0"
        title={t("toolbar.insertImage")}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        className="h-8 w-8 p-0"
        title={t("toolbar.insertTable")}
      >
        <TableIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default FloatingMenuBar;

