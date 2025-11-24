import React from "react";
import { Image } from "@tiptap/extension-image";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/core";
import { useState, useRef, useEffect, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function ResizableImageComponent({
  node,
  updateAttributes,
  editor,
}: NodeViewProps) {
  const { t } = useTranslation();
  const [isResizing, setIsResizing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const [behindHeight, setBehindHeight] = useState<number>(
    node.attrs.height || 320
  );
  const wrap = node.attrs.wrap || "inline";
  const isThrough = wrap === "through";
  const isBehind = wrap === "behind";

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
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
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
    // Allow drag for images, but prevent if clicking on resize handle
    const target = e.target as HTMLElement;
    if (target.classList.contains("cursor-ew-resize")) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (!editor || !containerRef.current) {
      return;
    }
    setShowMenu(false);

    try {
      const pos = editor.view.posAtDOM(containerRef.current, 0);
      if (typeof pos === "number") {
        editor.commands.setNodeSelection(pos);
      }
    } catch (error) {
      // Ignore if position can't be resolved
    }

    if (imgRef.current && event.dataTransfer) {
      const rect = imgRef.current.getBoundingClientRect();
      event.dataTransfer.setDragImage(
        imgRef.current,
        rect.width / 2,
        rect.height / 2
      );
    }
  };

  // Close menu when clicking outside and position menu
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
        setIsSelected(false);
      }
    };

    const updateMenuPosition = () => {
      if (containerRef.current && menuRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        menuRef.current.style.left = `${rect.left}px`;
        menuRef.current.style.top = `${rect.bottom + 8}px`;
      }
    };

    // Initial position
    updateMenuPosition();

    // Update position on scroll/resize
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [showMenu]);

  useEffect(() => {
    if (wrap === "behind" && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      if (rect.height && Math.abs(rect.height - behindHeight) > 2) {
        setBehindHeight(rect.height);
      }
    }
  }, [wrap, node.attrs.width, node.attrs.height]);

  const getImageClasses = () => {
    const classes = ["max-w-full", "h-auto", "rounded-md"];
    const wrap = node.attrs.wrap || "inline";

    // Wrap text options
    if (wrap === "inline") {
      // Trong dòng - inline with text, no float
      classes.push("inline-block");
    } else if (wrap === "square") {
      // Xuống dòng tự động - float left, text wraps around
      classes.push("float-left", "mr-4", "mb-2");
    } else if (wrap === "through") {
      // Ngắt văn bản - float left, text renders over image
      classes.push(
        "float-left",
        "mr-4",
        "mb-2",
        "opacity-60",
        "relative",
        "z-0"
      );
    } else if (wrap === "behind") {
      // Phía sau văn bản - absolute positioning, acts as background
      classes.push(
        "absolute",
        "inset-0",
        "w-full",
        "h-full",
        "object-cover",
        "z-0",
        "opacity-40"
      );
    }

    return classes.join(" ");
  };

  const getContainerClasses = () => {
    const classes = ["relative"];
    const wrap = node.attrs.wrap || "inline";

    if (wrap === "behind") {
      classes.push("relative", "w-full", "min-h-[300px]", "block");
    } else if (wrap === "through") {
      // Ngắt văn bản - container should allow text to flow through
      classes.push("inline-block", "relative", "z-0");
    } else if (wrap === "inline") {
      classes.push("inline-block");
    } else {
      classes.push("inline-block");
    }

    return classes.join(" ");
  };

  const wrapperStyle: CSSProperties | undefined =
    wrap === "behind"
      ? ({
          "--vs-behind-height": `${behindHeight}px`,
        } as CSSProperties)
      : undefined;

  return (
    <NodeViewWrapper
      className={getContainerClasses()}
      data-wrap={wrap}
      draggable
      style={wrapperStyle}
      data-image-node="true"
    >
      <div
        ref={containerRef}
        className={`relative ${isSelected ? "ring-2 ring-primary" : ""} ${
          isThrough ? "z-0" : ""
        } ${isBehind ? "min-h-[300px]" : ""}`}
        onMouseEnter={() => setIsSelected(true)}
        onMouseLeave={() => !isResizing && !showMenu && setIsSelected(false)}
        onClick={handleImageClick}
        onMouseDown={handleMouseDown}
        data-drag-handle=""
        draggable
        onDragStart={handleDragStart}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          title={node.attrs.title || ""}
          width={node.attrs.width || undefined}
          height={node.attrs.height || undefined}
          className={getImageClasses()}
          draggable={false}
        />
        {isSelected && (
          <>
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-primary opacity-50 hover:opacity-100 z-10"
              onMouseDown={handleResizeMouseDown}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 rounded-b-md z-10">
              {node.attrs.width ? `${node.attrs.width}px` : "Auto"}
            </div>
            {showMenu && (
              <TooltipProvider delayDuration={200}>
                <div
                  ref={menuRef}
                  className="fixed bg-white text-black border border-border rounded-lg shadow-xl p-3 z-[9999]"
                  style={{
                    left: containerRef.current
                      ? `${containerRef.current.getBoundingClientRect().left}px`
                      : "0",
                    top: containerRef.current
                      ? `${
                          containerRef.current.getBoundingClientRect().bottom +
                          8
                        }px`
                      : "0",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {/* Trong dòng (Inline) */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            node.attrs.wrap === "inline"
                              ? "bg-blue-100 ring-2 ring-blue-500"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            updateAttributes({ wrap: "inline", float: "none" });
                            setShowMenu(false);
                          }}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="8"
                              y="5"
                              width="8"
                              height="6"
                              fill="#9ca3af"
                            />
                            <line
                              x1="2"
                              y1="3"
                              x2="22"
                              y2="3"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="5"
                              x2="22"
                              y2="5"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="7"
                              x2="22"
                              y2="7"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="9"
                              x2="22"
                              y2="9"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="11"
                              x2="22"
                              y2="11"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>{t("editor.wrapTextInline", "Trong dòng")}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Xuống dòng tự động (Square) */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            node.attrs.wrap === "square"
                              ? "bg-blue-100 ring-2 ring-blue-500"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            updateAttributes({ wrap: "square", float: "left" });
                            setShowMenu(false);
                          }}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="2"
                              y="5"
                              width="8"
                              height="6"
                              fill="#9ca3af"
                            />
                            <line
                              x1="2"
                              y1="3"
                              x2="22"
                              y2="3"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="5"
                              x2="10"
                              y2="5"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="12"
                              y1="5"
                              x2="22"
                              y2="5"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="7"
                              x2="10"
                              y2="7"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="12"
                              y1="7"
                              x2="22"
                              y2="7"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="9"
                              x2="10"
                              y2="9"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="12"
                              y1="9"
                              x2="22"
                              y2="9"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="11"
                              x2="22"
                              y2="11"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>
                          {t("editor.wrapTextSquare", "Xuống dòng tự động")}
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Ngắt văn bản (Through) */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            node.attrs.wrap === "through"
                              ? "bg-blue-100 ring-2 ring-blue-500"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            updateAttributes({
                              wrap: "through",
                              float: "left",
                            });
                            setShowMenu(false);
                          }}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="8"
                              y="5"
                              width="8"
                              height="6"
                              fill="#9ca3af"
                              opacity="0.5"
                            />
                            <line
                              x1="2"
                              y1="3"
                              x2="22"
                              y2="3"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="5"
                              x2="22"
                              y2="5"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="7"
                              x2="22"
                              y2="7"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="9"
                              x2="22"
                              y2="9"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="11"
                              x2="22"
                              y2="11"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>{t("editor.wrapTextThrough", "Ngắt văn bản")}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Phía sau văn bản (Behind) */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            node.attrs.wrap === "behind"
                              ? "bg-blue-100 ring-2 ring-blue-500"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            updateAttributes({ wrap: "behind", float: "none" });
                            setShowMenu(false);
                          }}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="8"
                              y="5"
                              width="8"
                              height="6"
                              fill="#6b7280"
                            />
                            <line
                              x1="2"
                              y1="3"
                              x2="22"
                              y2="3"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="5"
                              x2="22"
                              y2="5"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="7"
                              x2="22"
                              y2="7"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="9"
                              x2="22"
                              y2="9"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="2"
                              y1="11"
                              x2="22"
                              y2="11"
                              stroke="#9ca3af"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p>{t("editor.wrapTextBehind", "Phía sau văn bản")}</p>
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
  name: "imageResize",

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
      float: {
        default: "none",
        parseHTML: (element: HTMLElement) => {
          const float = (element as HTMLElement).style.float || "none";
          return float;
        },
        renderHTML: (attributes: { float?: string }) => {
          if (!attributes.float || attributes.float === "none") {
            return {};
          }
          return {
            style: `float: ${attributes.float}`,
          };
        },
      },
      wrap: {
        default: "inline",
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute("data-wrap") || "inline";
        },
        renderHTML: (attributes: { wrap?: string }) => {
          if (!attributes.wrap || attributes.wrap === "inline") {
            return {};
          }
          return {
            "data-wrap": attributes.wrap,
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  // Make image selectable and draggable
  selectable: true,
  draggable: true,
});
