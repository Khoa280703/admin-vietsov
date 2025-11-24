import { useState } from "react";
import type { Article } from "@/types/article";
import { StorageManager } from "@/utils/storage";
import { Toolbar } from "@/components/Editor/Toolbar";
import { MetadataSidebar } from "./MetadataSidebar";
import { PreviewMode } from "./PreviewMode";
import { DraftList } from "@/components/DraftManager/DraftList";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/useAutoSave";
import {
  calculateReadingTime,
  getWordCount,
  getCharacterCount,
} from "@/utils/readingTime";
import {
  Eye,
  Edit3,
  Save,
  Menu,
  X,
  PanelLeftClose,
  PanelRightClose,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Link } from "@tiptap/extension-link";
import { ImageResize } from "@/extensions/ImageResize.tsx";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Youtube } from "@tiptap/extension-youtube";
import { Typography } from "@tiptap/extension-typography";
import { Focus } from "@tiptap/extension-focus";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { FontFamily } from "@tiptap/extension-font-family";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { FontSize } from "@/extensions/FontSize";
import { LineHeight } from "@/extensions/LineHeight";
import { LetterSpacing } from "@/extensions/LetterSpacing";
import { Indent } from "@/extensions/Indent";
import { createLowlight, common } from "lowlight";
// import { BubbleMenuBar } from '@/components/Editor/BubbleMenuBar';
import { FloatingMenuBar } from "@/components/Editor/FloatingMenuBar";
import { generateSlug } from "@/utils/validation";
import api from "@/services/api";

export function ArticleEditorMain() {
  const { t } = useTranslation();
  const [article, setArticle] = useState<Partial<Article>>(() => {
    const id = StorageManager.generateId();
    return {
      id,
      title: "",
      content: { type: "doc", content: [] }, // Empty JSON document structure
      tags: [],
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 0,
      characterCount: 0,
      readingTime: 0,
    };
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showDraftPanel, setShowDraftPanel] = useState(false);
  const [showMetadataPanel, setShowMetadataPanel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const lowlight = createLowlight(common);

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
        types: ["heading", "paragraph", "imageResize"],
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
      Placeholder.configure({
        placeholder: "Start writing your article...",
      }),
      CharacterCount,
      Youtube.configure({
        width: 640,
        height: 480,
      }),
      Typography,
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
      Gapcursor,
      Dropcursor,
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
    content: article.content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[500px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      const words = getWordCount(text);
      const characters = getCharacterCount(text);
      const readingTime = calculateReadingTime(text);

      setArticle((prev) => ({
        ...prev,
        content: json,
        wordCount: words,
        characterCount: characters,
        readingTime,
        updatedAt: new Date().toISOString(),
      }));
    },
  });

  const { forceSave } = useAutoSave(article, { enabled: true });

  const handleUpdateArticle = (updates: Partial<Article>) => {
    setArticle((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleLoadDraft = (id: string) => {
    const draft = StorageManager.getDraft(id);
    if (draft) {
      // Migration: If content is HTML (string), convert to JSON
      if (typeof draft.content === "string") {
        // Load HTML into editor, then get JSON
        editor?.commands.setContent(draft.content);
        const jsonContent = editor?.getJSON();
        if (jsonContent) {
          // Update draft with JSON content and save back
          const migratedDraft = {
            ...draft,
            content: jsonContent,
            updatedAt: new Date().toISOString(),
          };
          StorageManager.saveDraft(migratedDraft as Article);
          setArticle(migratedDraft);
        } else {
          setArticle(draft);
        }
      } else {
        setArticle(draft);
      }
      // Load content into editor (works for both HTML and JSON)
      editor?.commands.setContent(draft.content);
      setShowDraftPanel(false);
      toast.success("Draft loaded");
    }
  };

  const handleNewDraft = () => {
    const id = StorageManager.generateId();
    const emptyContent = { type: "doc", content: [] };
    const newArticle: Partial<Article> = {
      id,
      title: "",
      content: emptyContent,
      tags: [],
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 0,
      characterCount: 0,
      readingTime: 0,
    };
    setArticle(newArticle);
    editor?.commands.setContent(emptyContent);
    setShowDraftPanel(false);
    toast.success("New draft created");
  };

  const stats = {
    words: article.wordCount || 0,
    characters: article.characterCount || 0,
    readingTime: article.readingTime || 0,
  };

  const handlePublish = async () => {
    setPublishMessage(null);

    if (!article.title?.trim()) {
      toast.error(t("editor.missingTitle"));
      return;
    }

    if (!article.content) {
      toast.error(t("editor.missingContent"));
      return;
    }

    const slug =
      article.slug?.trim() ||
      (article.title ? generateSlug(article.title) : "");
    if (!slug) {
      toast.error(t("editor.missingSlug"));
      return;
    }

    const contentNode = article.content ?? { type: "doc", content: [] };
    const contentJson =
      typeof contentNode === "string"
        ? JSON.parse(contentNode)
        : contentNode;

    setIsPublishing(true);
    try {
      forceSave();

      // Create or update article first
      let articleId = article.id;
      if (articleId && typeof articleId === "string") {
        // Update existing article
        await api.articles.update(parseInt(articleId), {
          title: article.title,
          subtitle: article.subtitle,
          slug,
          excerpt: article.excerpt,
          content: contentJson,
          featuredImage: article.featuredImage,
          seoTitle: article.seoTitle || article.title,
          seoDescription: article.metaDescription || article.excerpt,
          seoKeywords: article.seoKeywords || article.tags?.join(", "),
          isFeatured: article.isFeatured ?? false,
          isBreakingNews: article.isBreakingNews ?? false,
          allowComments: article.allowComments ?? true,
          visibility: article.visibility || "web,mobile",
          scheduledAt: article.scheduledDate,
          categoryIds: article.categoryId ? [article.categoryId] : [],
          tagIds: article.tags?.map((tag) => tag) || [],
        });
      } else {
        // Create new article
        const response = await api.articles.create({
          title: article.title,
          subtitle: article.subtitle,
          slug,
          excerpt: article.excerpt,
          content: contentJson,
          featuredImage: article.featuredImage,
          seoTitle: article.seoTitle || article.title,
          seoDescription: article.metaDescription || article.excerpt,
          seoKeywords: article.seoKeywords || article.tags?.join(", "),
          isFeatured: article.isFeatured ?? false,
          isBreakingNews: article.isBreakingNews ?? false,
          allowComments: article.allowComments ?? true,
          visibility: article.visibility || "web,mobile",
          scheduledAt: article.scheduledDate,
          categoryIds: article.categoryId ? [article.categoryId] : [],
          tagIds: article.tags?.map((tag) => tag) || [],
        });
        articleId = response.data.id;
      }

      // Publish the article
      if (typeof articleId === "number") {
        await api.articles.publish(articleId);
      } else {
        throw new Error("Invalid article ID");
      }

      const successText = t("editor.publishSuccess");
      toast.success(successText);
      setPublishMessage({ type: "success", text: successText });
      setArticle((prev) => ({
        ...prev,
        id: articleId,
        status: "published",
        slug,
        updatedAt: new Date().toISOString(),
      }));
    } catch (error: any) {
      const errorText = error.response?.data?.error || error.message || t("editor.publishFailed");
      toast.error(errorText);
      setPublishMessage({ type: "error", text: errorText });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Draft Panel */}
      {showDraftPanel && (
        <div className="w-80 border-r bg-white overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Drafts
            </h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowDraftPanel(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DraftList
            currentDraftId={article.id}
            onLoadDraft={handleLoadDraft}
            onNewDraft={handleNewDraft}
          />
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!showDraftPanel && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowDraftPanel(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl font-bold">{t("app.title")}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsPreviewMode(!isPreviewMode);
              }}
            >
              {isPreviewMode ? (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  {t("app.edit")}
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  {t("app.preview")}
                </>
              )}
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("editor.publishing")}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  {t("editor.publish")}
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={forceSave}>
              <Save className="h-4 w-4 mr-2" />
              {t("app.save")}
            </Button>
            {!showMetadataPanel && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowMetadataPanel(true)}
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {publishMessage && (
          <div className="px-4 mt-3">
            <div
              role="alert"
              aria-live="polite"
              className={`flex items-start justify-between rounded-lg border p-3 text-sm transition-colors ${
                publishMessage.type === "success"
                  ? "border-vietsov-green/30 bg-vietsov-green/5 text-vietsov-green"
                  : "border-red-300 bg-red-50 text-red-900"
              }`}
            >
              <span>{publishMessage.text}</span>
              <button
                type="button"
                onClick={() => setPublishMessage(null)}
                aria-label="Dismiss notification"
                className="ml-3 rounded-full p-1 text-current hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {!isPreviewMode && (
              <Toolbar
                editor={editor}
                onFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
            )}

            <div className="flex-1 overflow-y-auto">
              {isPreviewMode ? (
                <PreviewMode article={article} />
              ) : (
                <div className="p-4">
                  <div className="max-w-4xl mx-auto">
                    {editor && (
                      <>
                        {/* <BubbleMenuBar editor={editor} /> */}
                        <FloatingMenuBar editor={editor} />
                        <EditorContent editor={editor} />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Sidebar */}
          {showMetadataPanel && !isFullscreen && (
            <div className="w-96 border-l bg-white overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Metadata</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowMetadataPanel(false)}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
              <MetadataSidebar
                article={article}
                onUpdate={handleUpdateArticle}
                stats={stats}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArticleEditorMain;
