import { Image } from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function ResizableImageComponent({ node, updateAttributes, editor }: NodeViewProps) {
  const { t } = useTranslation();
  const [isResizing, setIsResizing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = imgRef.current?.offsetWidth || 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current) return;
      const diff = e.clientX - startX.current;
      const newWidth = Math.max(100, startWidth.current + diff);
      updateAttributes({ width: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only show menu on click, not on drag
    if (!isResizing) {
      setShowMenu(true);
      setIsSelected(true);
      // Select the image node in editor
      if (editor) {
        const pos = editor.state.selection.$anchor.pos;
        editor.commands.setNodeSelection(pos);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent drag if clicking on image (not resize handle)
    if (e.target === imgRef.current || e.target === containerRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setIsSelected(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const getImageClasses = () => {
    const classes = ['max-w-full', 'h-auto', 'rounded-md'];
    const wrap = node.attrs.wrap || 'inline';
    const align = node.attrs.align || 'left';

    // Wrap text options
    if (wrap === 'inline') {
      // In line with text - no special classes
      classes.push('inline-block');
    } else if (wrap === 'left' || wrap === 'square' || wrap === 'tight') {
      // Wrap text left, square, tight - float left
      classes.push('float-left', 'mr-4', 'mb-2');
    } else if (wrap === 'right') {
      // Wrap text right - float right
      classes.push('float-right', 'ml-4', 'mb-2');
    } else if (wrap === 'through') {
      // Through - float left but text can go through
      classes.push('float-left', 'mr-4', 'mb-2', 'opacity-75');
    } else if (wrap === 'behind') {
      // Behind text - absolute positioning
      classes.push('absolute', 'z-0', 'opacity-50');
    }

    // Alignment for inline and behind
    if (wrap === 'inline') {
      if (align === 'center') {
        classes.push('mx-auto', 'block');
      } else if (align === 'right') {
        classes.push('ml-auto', 'block');
      }
    } else if (wrap === 'behind') {
      classes.push('left-1/2', 'top-1/2', '-translate-x-1/2', '-translate-y-1/2');
    }

    return classes.join(' ');
  };

  const getContainerClasses = () => {
    const classes = ['relative'];
    const wrap = node.attrs.wrap || 'inline';
    const align = node.attrs.align || 'left';

    if (wrap === 'behind') {
      classes.push('relative', 'w-full', 'min-h-[200px]');
    } else if (wrap === 'inline') {
      if (align === 'center') {
        classes.push('flex', 'justify-center', 'w-full');
      } else if (align === 'right') {
        classes.push('flex', 'justify-end', 'w-full');
      } else {
        classes.push('inline-block');
      }
    } else {
      classes.push('inline-block');
    }

    return classes.join(' ');
  };

  return (
    <NodeViewWrapper className={getContainerClasses()}>
      <div
        ref={containerRef}
        className={`relative ${isSelected ? 'ring-2 ring-primary' : ''}`}
        onMouseEnter={() => setIsSelected(true)}
        onMouseLeave={() => !isResizing && !showMenu && setIsSelected(false)}
        onClick={handleImageClick}
        onMouseDown={handleMouseDown}
        draggable={false}
        onDragStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          title={node.attrs.title || ''}
          width={node.attrs.width || undefined}
          height={node.attrs.height || undefined}
          className={getImageClasses()}
          draggable={false}
          onDragStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
        />
        {isSelected && (
          <>
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-primary opacity-50 hover:opacity-100 z-10"
              onMouseDown={handleResizeMouseDown}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 rounded-b-md z-10">
              {node.attrs.width ? `${node.attrs.width}px` : 'Auto'}
            </div>
            {showMenu && (
              <TooltipProvider delayDuration={200}>
                <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50">
                  <div className="flex items-center gap-2">
                    {/* Wrap text left */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            node.attrs.wrap === 'left' ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            updateAttributes({ wrap: 'left', float: 'left', align: 'left' });
                            setShowMenu(false);
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="4" width="8" height="6" fill={node.attrs.wrap === 'left' ? '#3b82f6' : '#9ca3af'} />
                            <line x1="12" y1="5" x2="22" y2="5" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="12" y1="7" x2="22" y2="7" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="12" y1="9" x2="22" y2="9" stroke="#9ca3af" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>{t('editor.wrapTextLeft', 'Bọc văn bản trái')}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Square */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            node.attrs.wrap === 'square' ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            updateAttributes({ wrap: 'square', float: 'left', align: 'left' });
                            setShowMenu(false);
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="5" width="8" height="6" fill="#9ca3af" />
                            <line x1="2" y1="3" x2="22" y2="3" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="5" x2="10" y2="5" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="12" y1="5" x2="22" y2="5" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="7" x2="10" y2="7" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="12" y1="7" x2="22" y2="7" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="9" x2="10" y2="9" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="12" y1="9" x2="22" y2="9" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="11" x2="22" y2="11" stroke="#9ca3af" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>{t('editor.wrapTextSquare', 'Bọc văn bản vuông')}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Tight */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            node.attrs.wrap === 'tight' ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            updateAttributes({ wrap: 'tight', float: 'left', align: 'left' });
                            setShowMenu(false);
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="8" y="5" width="8" height="6" fill="#9ca3af" />
                            <line x1="2" y1="3" x2="8" y2="3" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="16" y1="3" x2="22" y2="3" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="5" x2="8" y2="5" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="16" y1="5" x2="22" y2="5" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="7" x2="8" y2="7" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="16" y1="7" x2="22" y2="7" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="9" x2="8" y2="9" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="16" y1="9" x2="22" y2="9" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="11" x2="8" y2="11" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="16" y1="11" x2="22" y2="11" stroke="#9ca3af" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>{t('editor.wrapTextTight', 'Bọc văn bản chặt')}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Through */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            node.attrs.wrap === 'through' ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            updateAttributes({ wrap: 'through', float: 'left', align: 'left' });
                            setShowMenu(false);
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="8" y="5" width="8" height="6" fill="#9ca3af" opacity="0.5" />
                            <line x1="2" y1="3" x2="22" y2="3" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="5" x2="22" y2="5" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="7" x2="22" y2="7" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="9" x2="22" y2="9" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="11" x2="22" y2="11" stroke="#9ca3af" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>{t('editor.wrapTextThrough', 'Bọc văn bản xuyên qua')}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* In line with text */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            node.attrs.wrap === 'inline' ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            updateAttributes({ wrap: 'inline', float: 'none', align: 'left' });
                            setShowMenu(false);
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="8" y="5" width="8" height="6" fill="#9ca3af" />
                            <line x1="2" y1="3" x2="22" y2="3" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="5" x2="22" y2="5" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="7" x2="22" y2="7" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="9" x2="22" y2="9" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="11" x2="22" y2="11" stroke="#9ca3af" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>{t('editor.wrapTextInline', 'Cùng dòng với văn bản')}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Wrap text right */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            node.attrs.wrap === 'right' ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            updateAttributes({ wrap: 'right', float: 'right', align: 'right' });
                            setShowMenu(false);
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="14" y="4" width="8" height="6" fill={node.attrs.wrap === 'right' ? '#3b82f6' : '#9ca3af'} />
                            <line x1="2" y1="5" x2="14" y2="5" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="7" x2="14" y2="7" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="9" x2="14" y2="9" stroke="#9ca3af" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>{t('editor.wrapTextRight', 'Bọc văn bản phải')}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Behind text */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            node.attrs.wrap === 'behind' ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            updateAttributes({ wrap: 'behind', float: 'none', align: 'center' });
                            setShowMenu(false);
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="8" y="5" width="8" height="6" fill="#6b7280" />
                            <line x1="2" y1="3" x2="22" y2="3" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="5" x2="22" y2="5" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="7" x2="22" y2="7" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="9" x2="22" y2="9" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="2" y1="11" x2="22" y2="11" stroke="#9ca3af" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>{t('editor.wrapTextBehind', 'Phía sau văn bản')}</p>
                      </TooltipContent>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* More options */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="6" r="1.5" fill="#9ca3af" />
                            <circle cx="12" cy="12" r="1.5" fill="#9ca3af" />
                            <circle cx="12" cy="18" r="1.5" fill="#9ca3af" />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>{t('editor.moreOptions', 'Tùy chọn khác')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </TooltipProvider>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const ImageResize = Image.extend({
  name: 'imageResize',

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        renderHTML: (attributes: { width?: number }) => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
          };
        },
      },
      height: {
        default: null,
        renderHTML: (attributes: { height?: number }) => {
          if (!attributes.height) {
            return {};
          }
          return {
            height: attributes.height,
          };
        },
      },
      align: {
        default: 'left',
        parseHTML: (element: HTMLElement) => {
          const align = (element as HTMLElement).style.textAlign || element.getAttribute('align') || 'left';
          return align;
        },
        renderHTML: (attributes: { align?: string }) => {
          if (!attributes.align || attributes.align === 'left') {
            return {};
          }
          return {
            align: attributes.align,
          };
        },
      },
      float: {
        default: 'none',
        parseHTML: (element: HTMLElement) => {
          const float = (element as HTMLElement).style.float || 'none';
          return float;
        },
        renderHTML: (attributes: { float?: string }) => {
          if (!attributes.float || attributes.float === 'none') {
            return {};
          }
          return {
            style: `float: ${attributes.float}`,
          };
        },
      },
      wrap: {
        default: 'inline',
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute('data-wrap') || 'inline';
        },
        renderHTML: (attributes: { wrap?: string }) => {
          if (!attributes.wrap || attributes.wrap === 'inline') {
            return {};
          }
          return {
            'data-wrap': attributes.wrap,
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            dragstart: (view, event) => {
              const { selection } = view.state;
              const { $anchor } = selection;
              const node = $anchor.node();
              // Prevent drag for image nodes
              if (node && node.type.name === 'imageResize') {
                event.preventDefault();
                return true;
              }
              return false;
            },
            drop: (view, event) => {
              const { selection } = view.state;
              const { $anchor } = selection;
              const node = $anchor.node();
              // Prevent drop on image nodes
              if (node && node.type.name === 'imageResize') {
                event.preventDefault();
                return true;
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});

