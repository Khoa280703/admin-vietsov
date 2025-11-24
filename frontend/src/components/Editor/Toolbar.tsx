import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImageAlignButton } from "@/components/tiptap-ui/image-align-button";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  ListChecks,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Code2,
  Youtube,
  Minus,
  Undo,
  Redo,
  RemoveFormatting,
  Maximize,
  Type,
  Highlighter,
  Quote,
  ChevronDown,
  Indent,
  Outdent,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
  compressImage,
  isImageFile,
  validateImageSize,
} from "@/utils/imageHandler";
import { ColorPicker } from "./ColorPicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ToolbarProps {
  editor: Editor | null;
  onFullscreen?: () => void;
}

export function Toolbar({ editor, onFullscreen }: ToolbarProps) {
  const { t } = useTranslation();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showFontFamilyMenu, setShowFontFamilyMenu] = useState(false);
  const [showLineHeightMenu, setShowLineHeightMenu] = useState(false);
  const [showLetterSpacingMenu, setShowLetterSpacingMenu] = useState(false);
  const [, forceUpdate] = useState({});
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const highlightButtonRef = useRef<HTMLButtonElement>(null);

  // Force re-render when selection changes to update active states
  useEffect(() => {
    if (!editor) return;

    const update = () => {
      forceUpdate({});
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);

    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const addImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!isImageFile(file)) {
        toast.error(t("editor.imageError"));
        return;
      }

      if (!validateImageSize(file, 5)) {
        toast.error(t("editor.imageSizeError"));
        return;
      }

      try {
        const base64 = await compressImage(file);
        editor.chain().focus().setImage({ src: base64 }).run();
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error(t("editor.imageUploadFailed"));
      }
    };
    input.click();
  };

  const setLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const addYoutube = () => {
    if (youtubeUrl) {
      editor.commands.setYoutubeVideo({ src: youtubeUrl });
      setYoutubeUrl("");
      setShowYoutubeInput(false);
    }
  };

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  // Close color pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorButtonRef.current &&
        !colorButtonRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest(".color-picker-container")
      ) {
        setShowColorPicker(false);
      }
      if (
        highlightButtonRef.current &&
        !highlightButtonRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest(".color-picker-container")
      ) {
        setShowHighlightPicker(false);
      }
    };

    if (showColorPicker || showHighlightPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColorPicker, showHighlightPicker]);

  const ToolButton = ({
    onClick,
    isActive = false,
    disabled = false,
    tooltip,
    children,
    buttonRef,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    tooltip: string;
    children: React.ReactNode;
    buttonRef?: React.RefObject<HTMLButtonElement | null>;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={buttonRef}
          size="sm"
          variant="ghost"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
              onClick();
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled={disabled}
          type="button"
          className={`${isActive ? "bg-gray-200" : ""} text-gray-900`}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="flex flex-wrap gap-1 p-2">
          {/* History */}
          <ToolButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip={t("toolbar.undo")}
          >
            <Undo className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip={t("toolbar.redo")}
          >
            <Redo className="h-4 w-4" />
          </ToolButton>

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Text Formatting */}
          <ToolButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            tooltip={t("toolbar.bold")}
          >
            <Bold className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            tooltip={t("toolbar.italic")}
          >
            <Italic className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            tooltip={t("toolbar.underline")}
          >
            <Underline className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            tooltip={t("toolbar.strikethrough")}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            tooltip={t("toolbar.inlineCode")}
          >
            <Code className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={editor.isActive("subscript")}
            tooltip={t("toolbar.subscript")}
          >
            <span className="text-xs font-semibold">x₂</span>
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={editor.isActive("superscript")}
            tooltip={t("toolbar.superscript")}
          >
            <span className="text-xs font-semibold">x²</span>
          </ToolButton>

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Font Family */}
          <DropdownMenu
            open={showFontFamilyMenu}
            onOpenChange={setShowFontFamilyMenu}
          >
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={showFontFamilyMenu ? "bg-gray-200" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Type className="h-4 w-4 mr-1" />
                <span className="text-xs">
                  {editor.getAttributes("textStyle").fontFamily ||
                    t("toolbar.font")}
                </span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {[
                "Arial",
                "Times New Roman",
                "Calibri",
                "Verdana",
                "Georgia",
                "Courier New",
                "Comic Sans MS",
                "Impact",
              ].map((font) => (
                <DropdownMenuItem
                  key={font}
                  onClick={() => {
                    editor.chain().focus().setFontFamily(font).run();
                    setShowFontFamilyMenu(false);
                  }}
                  className="cursor-pointer"
                  style={{ fontFamily: font }}
                >
                  {font}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font Size */}
          <DropdownMenu
            open={showFontSizeMenu}
            onOpenChange={setShowFontSizeMenu}
          >
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={showFontSizeMenu ? "bg-gray-200" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <span className="text-xs">
                  {editor.getAttributes("textStyle").fontSize || "12pt"}
                </span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32">
              {[
                "8pt",
                "10pt",
                "12pt",
                "14pt",
                "16pt",
                "18pt",
                "24pt",
                "36pt",
                "48pt",
              ].map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => {
                    editor.chain().focus().setFontSize(size).run();
                    setShowFontSizeMenu(false);
                  }}
                  className="cursor-pointer"
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Headings */}
          <ToolButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            tooltip={t("toolbar.heading1")}
          >
            <Heading1 className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            tooltip={t("toolbar.heading2")}
          >
            <Heading2 className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            tooltip={t("toolbar.heading3")}
          >
            <Heading3 className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
            isActive={editor.isActive("heading", { level: 4 })}
            tooltip={t("toolbar.heading4")}
          >
            <Heading4 className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 5 }).run()
            }
            isActive={editor.isActive("heading", { level: 5 })}
            tooltip={t("toolbar.heading5")}
          >
            <Heading5 className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 6 }).run()
            }
            isActive={editor.isActive("heading", { level: 6 })}
            tooltip={t("toolbar.heading6")}
          >
            <Heading6 className="h-4 w-4" />
          </ToolButton>

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Lists */}
          <ToolButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            tooltip={t("toolbar.bulletList")}
          >
            <List className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            tooltip={t("toolbar.numberedList")}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive("taskList")}
            tooltip={t("toolbar.taskList")}
          >
            <ListChecks className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            tooltip={t("toolbar.blockquote")}
          >
            <Quote className="h-4 w-4" />
          </ToolButton>

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Line Height */}
          <DropdownMenu
            open={showLineHeightMenu}
            onOpenChange={setShowLineHeightMenu}
          >
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={showLineHeightMenu ? "bg-gray-200" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Type className="h-4 w-4 mr-1" />
                <span className="text-xs">
                  {editor.getAttributes("paragraph").lineHeight ||
                    editor.getAttributes("heading").lineHeight ||
                    "1.5"}
                </span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32">
              {[
                { label: "1.0", value: "1" },
                { label: "1.15", value: "1.15" },
                { label: "1.5", value: "1.5" },
                { label: "2.0", value: "2" },
                { label: "2.5", value: "2.5" },
                { label: "3.0", value: "3" },
              ].map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    editor.chain().focus().setLineHeight(option.value).run();
                    setShowLineHeightMenu(false);
                  }}
                  className="cursor-pointer"
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Letter Spacing */}
          <DropdownMenu
            open={showLetterSpacingMenu}
            onOpenChange={setShowLetterSpacingMenu}
          >
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={showLetterSpacingMenu ? "bg-gray-200" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Type className="h-4 w-4 mr-1" />
                <span className="text-xs">{t("toolbar.spacing")}</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32">
              {[
                { label: t("spacing.tight"), value: "-0.05em" },
                { label: t("spacing.normal"), value: "normal" },
                { label: t("spacing.wide"), value: "0.1em" },
                { label: t("spacing.wider"), value: "0.2em" },
                { label: t("spacing.widest"), value: "0.3em" },
              ].map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    editor.chain().focus().setLetterSpacing(option.value).run();
                    setShowLetterSpacingMenu(false);
                  }}
                  className="cursor-pointer"
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Alignment */}
          <ToolButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            tooltip={t("toolbar.alignLeft")}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            tooltip={t("toolbar.alignCenter")}
          >
            <AlignCenter className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            tooltip={t("toolbar.alignRight")}
          >
            <AlignRight className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
            tooltip={t("toolbar.justify")}
          >
            <AlignJustify className="h-4 w-4" />
          </ToolButton>

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Indent */}
          <ToolButton
            onClick={() => {
              editor.chain().focus().setIndent().run();
            }}
            tooltip={t("toolbar.increaseIndent")}
          >
            <Indent className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => {
              editor.chain().focus().unsetIndent().run();
            }}
            tooltip={t("toolbar.decreaseIndent")}
          >
            <Outdent className="h-4 w-4" />
          </ToolButton>

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Color & Highlight */}
          <div className="relative">
            <ToolButton
              onClick={() => setShowColorPicker(!showColorPicker)}
              isActive={showColorPicker}
              tooltip={t("toolbar.textColor")}
              buttonRef={colorButtonRef}
            >
              <Type className="h-4 w-4" />
            </ToolButton>
            {showColorPicker && (
              <ColorPicker
                editor={editor}
                type="text"
                onClose={() => setShowColorPicker(false)}
                triggerRef={colorButtonRef}
              />
            )}
          </div>
          <div className="relative">
            <ToolButton
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              isActive={showHighlightPicker}
              tooltip={t("toolbar.highlight")}
              buttonRef={highlightButtonRef}
            >
              <Highlighter className="h-4 w-4" />
            </ToolButton>
            {showHighlightPicker && (
              <ColorPicker
                editor={editor}
                type="highlight"
                onClose={() => setShowHighlightPicker(false)}
                triggerRef={highlightButtonRef}
              />
            )}
          </div>

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Insert */}
          <div className="relative">
            <ToolButton
              onClick={() => setShowLinkInput(!showLinkInput)}
              isActive={editor.isActive("link") || showLinkInput}
              tooltip={t("toolbar.insertLink")}
            >
              <LinkIcon className="h-4 w-4" />
            </ToolButton>
            {showLinkInput && (
              <div className="absolute top-full mt-1 bg-white text-black border border-border rounded-md shadow-lg p-2 z-20 w-64">
                <Input
                  placeholder={t("editor.enterURL")}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setLink()}
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={setLink}>
                    {t("editor.add")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editor.chain().focus().unsetLink().run()}
                  >
                    {t("editor.remove")}
                  </Button>
                </div>
              </div>
            )}
        </div>
        <ToolButton onClick={addImage} tooltip={t("toolbar.insertImage")}>
            <ImageIcon className="h-4 w-4" />
          </ToolButton>
        <div className="flex gap-1 ml-1">
          <ImageAlignButton
            editor={editor}
            align="left"
            text={t("toolbar.alignLeft")}
            hideWhenUnavailable
          />
          <ImageAlignButton
            editor={editor}
            align="center"
            text={t("toolbar.alignCenter")}
            hideWhenUnavailable
          />
          <ImageAlignButton
            editor={editor}
            align="right"
            text={t("toolbar.alignRight")}
            hideWhenUnavailable
          />
        </div>
          <ToolButton onClick={addTable} tooltip={t("toolbar.insertTable")}>
            <TableIcon className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            tooltip={t("toolbar.codeBlock")}
          >
            <Code2 className="h-4 w-4" />
          </ToolButton>
          <div className="relative">
            <ToolButton
              onClick={() => setShowYoutubeInput(!showYoutubeInput)}
              isActive={showYoutubeInput}
              tooltip={t("toolbar.youtubeVideo")}
            >
              <Youtube className="h-4 w-4" />
            </ToolButton>
            {showYoutubeInput && (
              <div className="absolute top-full mt-1 bg-white text-black border border-border rounded-md shadow-lg p-2 z-20 w-64">
                <Input
                  placeholder={t("editor.youtubeURL")}
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addYoutube()}
                />
                <Button size="sm" className="mt-2" onClick={addYoutube}>
                  {t("editor.add")}
                </Button>
              </div>
            )}
          </div>
          <ToolButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            tooltip={t("toolbar.horizontalRule")}
          >
            <Minus className="h-4 w-4" />
          </ToolButton>

          <Separator orientation="vertical" className="h-8 mx-1" />

          {/* Table Operations */}
          {editor.isActive("table") && (
            <>
              <ToolButton
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                tooltip={t("toolbar.addColumnBefore")}
              >
                <span className="text-xs">Col+</span>
              </ToolButton>
              <ToolButton
                onClick={() => {
                  try {
                    editor.chain().focus().addColumnAfter().run();
                  } catch {
                    // Fallback if command doesn't exist
                    editor.chain().focus().addColumnBefore().run();
                  }
                }}
                tooltip={t("toolbar.addColumnAfter")}
              >
                <span className="text-xs">Col+</span>
              </ToolButton>
              <ToolButton
                onClick={() => editor.chain().focus().deleteColumn().run()}
                tooltip={t("toolbar.deleteColumn")}
              >
                <span className="text-xs">Col-</span>
              </ToolButton>
              <ToolButton
                onClick={() => editor.chain().focus().addRowBefore().run()}
                tooltip={t("toolbar.addRowBefore")}
              >
                <span className="text-xs">Row+</span>
              </ToolButton>
              <ToolButton
                onClick={() => {
                  try {
                    editor.chain().focus().addRowAfter().run();
                  } catch {
                    // Fallback if command doesn't exist
                    editor.chain().focus().addRowBefore().run();
                  }
                }}
                tooltip={t("toolbar.addRowAfter")}
              >
                <span className="text-xs">Row+</span>
              </ToolButton>
              <ToolButton
                onClick={() => editor.chain().focus().deleteRow().run()}
                tooltip={t("toolbar.deleteRow")}
              >
                <span className="text-xs">Row-</span>
              </ToolButton>
              <ToolButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                tooltip={t("toolbar.deleteTable")}
              >
                <span className="text-xs">Del</span>
              </ToolButton>
              <Separator orientation="vertical" className="h-8 mx-1" />
            </>
          )}

          {/* Utilities */}
          <ToolButton
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
            tooltip={t("toolbar.clearFormatting")}
          >
            <RemoveFormatting className="h-4 w-4" />
          </ToolButton>
          {onFullscreen && (
            <ToolButton
              onClick={onFullscreen}
              tooltip={t("toolbar.fullscreen")}
            >
              <Maximize className="h-4 w-4" />
            </ToolButton>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default Toolbar;
