import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Highlighter,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { ColorPicker } from './ColorPicker';

interface BubbleMenuBarProps {
  editor: Editor;
}

export function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
  const { t } = useTranslation();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const highlightButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateVisibility = () => {
      const { selection } = editor.state;
      const { empty } = selection;
      
      if (!empty && editor.view) {
        const { from, to } = selection;
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        
        // Calculate position above the selection
        const top = Math.min(start.top, end.top) - 50;
        const left = (start.left + end.left) / 2;
        
        setPosition({ top, left });
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setShowHighlightPicker(false);
      }
    };

    editor.on('selectionUpdate', updateVisibility);
    editor.on('transaction', updateVisibility);

    return () => {
      editor.off('selectionUpdate', updateVisibility);
      editor.off('transaction', updateVisibility);
    };
  }, [editor]);

  // Close color picker when clicking outside
  useEffect(() => {
    if (!showHighlightPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        highlightButtonRef.current &&
        !highlightButtonRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.color-picker-container')
      ) {
        setShowHighlightPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHighlightPicker]);

  const setLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-1 p-2 bg-white rounded-xl shadow-2xl border border-gray-200 backdrop-blur-sm"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)',
        animation: 'bubbleMenuFadeIn 0.2s ease-out',
        backgroundColor: 'white',
      }}
    >
      {showLinkInput ? (
        <>
          <Input
            type="url"
            placeholder={t("editor.enterURL")}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setLink();
              if (e.key === 'Escape') setShowLinkInput(false);
            }}
            className="w-64 h-8"
            autoFocus
          />
          <Button size="sm" onClick={setLink}>
            {t("editor.add")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowLinkInput(false)}>
            {t("draft.cancel")}
          </Button>
        </>
      ) : (
        <>
          <Button
            size="sm"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className="h-8 w-8 p-0"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('code') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleCode().run()}
            className="h-8 w-8 p-0"
          >
            <Code className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            size="sm"
            variant={editor.isActive('link') ? 'default' : 'ghost'}
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                const previousUrl = editor.getAttributes('link').href;
                setLinkUrl(previousUrl || '');
                setShowLinkInput(true);
              }
            }}
            className="h-8 w-8 p-0"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <div className="relative">
            <Button
              ref={highlightButtonRef}
              size="sm"
              variant={editor.isActive('highlight') ? 'default' : 'ghost'}
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              className="h-8 w-8 p-0"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            {showHighlightPicker && (
              <ColorPicker
                editor={editor}
                type="highlight"
                onClose={() => setShowHighlightPicker(false)}
                triggerRef={highlightButtonRef}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default BubbleMenuBar;

