import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Editor } from '@tiptap/react';

type ImageAlign = 'left' | 'center' | 'right';

const shortcutMap: Record<ImageAlign, string> = {
  left: 'Alt+Shift+L',
  center: 'Alt+Shift+E',
  right: 'Alt+Shift+R',
};

interface ImageAlignButtonProps {
  editor: Editor | null;
  align: ImageAlign;
  text?: string;
  hideWhenUnavailable?: boolean;
  showShortcut?: boolean;
  onAligned?: (align: ImageAlign) => void;
  className?: string;
}

export function ImageAlignButton({
  editor,
  align,
  text,
  hideWhenUnavailable = true,
  showShortcut = false,
  onAligned,
  className,
}: ImageAlignButtonProps) {
  if (!editor) return null;

  const isImageActive = editor.isActive('imageResize') || editor.isActive('image');
  if (hideWhenUnavailable && !isImageActive) {
    return null;
  }

  const canAlign = editor.can().chain().focus().setTextAlign(align).run();
  const isActive = isImageActive && editor.isActive({ textAlign: align });

  const handleAlign = () => {
    if (!canAlign) return;
    editor.chain().focus().setTextAlign(align).run();
    onAligned?.(align);
  };

  const ariaLabel = text ? undefined : `Align image ${align}`;

  return (
    <Button
      type="button"
      size="sm"
      variant={isActive ? 'default' : 'outline'}
      disabled={!canAlign}
      onMouseDown={(event) => event.preventDefault()}
      onClick={handleAlign}
      className={cn(
        'h-8 px-2 text-xs font-medium',
        isActive ? 'bg-primary text-white hover:bg-primary/90' : '',
        className,
      )}
      aria-pressed={isActive}
      title={showShortcut ? `${text || align} (${shortcutMap[align]})` : text || align}
      aria-label={ariaLabel}
    >
      <span>{text || align}</span>
      {showShortcut && (
        <span className="ml-2 text-[10px] uppercase text-muted-foreground">{shortcutMap[align]}</span>
      )}
    </Button>
  );
}

