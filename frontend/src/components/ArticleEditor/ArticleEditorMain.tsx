import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Article } from "@/types/article";
import { StorageManager } from "@/utils/storage";
import { Toolbar } from "@/components/Editor/Toolbar";
import { MetadataSidebar } from "./MetadataSidebar";
import { PreviewMode } from "./PreviewMode";
import { DraftList } from "@/components/DraftManager/DraftList";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
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

type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  summary?: string;
  error?: boolean;
};

export function ArticleEditorMain() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: articleIdParam } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
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
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const generateMessageId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const lowlight = createLowlight(common);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false, // Disable default Link to use custom configured one
        underline: false, // Disable default Underline to use custom one
        gapcursor: false, // Disable default Gapcursor to use custom one
        dropcursor: false, // Disable default Dropcursor to use custom one
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

  // Prevent body scroll when in editor
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Load article from API when editing existing article
  useEffect(() => {
    const loadArticle = async () => {
      if (!articleIdParam) return;

      const articleId = parseInt(articleIdParam);
      if (isNaN(articleId)) {
        toast.error(t("articles.invalidId", "ID bài viết không hợp lệ"));
        return;
      }

      try {
        setLoading(true);
        const response = await api.articles.getById(articleId);
        const articleData = response.data;

        if (!articleData) {
          toast.error(t("articles.notFound", "Không tìm thấy bài viết"));
          return;
        }

        // Parse contentJson to content object
        let content = { type: "doc", content: [] };
        if (articleData.contentJson) {
          try {
            content =
              typeof articleData.contentJson === "string"
                ? JSON.parse(articleData.contentJson)
                : articleData.contentJson;
          } catch (e) {
            console.error("Error parsing contentJson:", e);
            // If parsing fails, try to load from contentHtml
            if (articleData.contentHtml) {
              // Will be loaded into editor as HTML
              content = articleData.contentHtml;
            }
          }
        }

        // Map API response to article state
        const mappedArticle: Partial<Article> = {
          id: articleData.id,
          title: articleData.title || "",
          subtitle: articleData.subtitle,
          slug: articleData.slug || "",
          excerpt: articleData.excerpt,
          content: content,
          contentJson:
            typeof articleData.contentJson === "string"
              ? articleData.contentJson
              : JSON.stringify(articleData.contentJson || {}),
          contentHtml: articleData.contentHtml,
          status: articleData.status || "draft",
          authorName: articleData.authorName,
          featuredImage: articleData.featuredImage,
          seoTitle: articleData.seoTitle,
          seoDescription: articleData.seoDescription,
          seoKeywords: articleData.seoKeywords,
          isFeatured: articleData.isFeatured || false,
          isBreakingNews: articleData.isBreakingNews || false,
          allowComments: articleData.allowComments ?? true,
          visibility: articleData.visibility || "web,mobile",
          scheduledAt: articleData.scheduledAt,
          publishedAt: articleData.publishedAt,
          reviewNotes: articleData.reviewNotes,
          wordCount: articleData.wordCount || 0,
          characterCount: articleData.characterCount || 0,
          readingTime: articleData.readingTime || 0,
          views: articleData.views || 0,
          createdAt: articleData.createdAt,
          updatedAt: articleData.updatedAt,
          categories: articleData.categories || [],
          tags: articleData.tags || [],
        };

        setArticle(mappedArticle);

        // Load content into editor
        if (editor) {
          if (typeof content === "string") {
            // HTML content
            editor.commands.setContent(content);
          } else if (content && typeof content === "object") {
            // JSON content
            editor.commands.setContent(content);
          }
        }
      } catch (error: unknown) {
        console.error("Error loading article:", error);
        const errorMessage =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : undefined;
        toast.error(
          errorMessage || t("articles.loadError", "Lỗi khi tải bài viết")
        );
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [articleIdParam, editor, t]);

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

  const buildHistoryPayload = (messages: AiMessage[]) =>
    messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      content: msg.content,
    }));

  const applyAiContent = (jsonString: string) => {
    if (!editor) return;
    const parsed = JSON.parse(jsonString);
    editor.commands.setContent(parsed);
    setArticle((prev) => ({
      ...prev,
      content: parsed,
      contentJson: jsonString,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSendAiPrompt = async () => {
    if (!aiPrompt.trim()) {
      toast.info(t("editor.aiPromptRequired", "Nhập yêu cầu cho AI trước."));
      return;
    }

    if (!editor) {
      toast.error(
        t("editor.aiEditorUnavailable", "Editor chưa sẵn sàng để cập nhật.")
      );
      return;
    }

    const promptText = aiPrompt.trim();
    setAiPrompt("");

    const userMessage: AiMessage = {
      id: generateMessageId(),
      role: "user",
      content: promptText,
      timestamp: new Date().toISOString(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    setIsAiProcessing(true);

    try {
      const currentJson = JSON.stringify(editor.getJSON());
      const historyPayload = buildHistoryPayload([...aiMessages, userMessage]);
      const data = await api.ai.generateContent({
        prompt: promptText,
        contentJson: currentJson,
        history: historyPayload,
      });

      const assistantMessage: AiMessage = {
        id: generateMessageId(),
        role: "assistant",
        content:
          data.summary ||
          data.rawText ||
          t("editor.aiDefaultSummary", "AI đã xử lý yêu cầu của bạn."),
        summary: data.summary,
        timestamp: new Date().toISOString(),
      };

      if (data.updatedContentJson) {
        try {
          applyAiContent(data.updatedContentJson);
          toast.success(t("editor.aiApplied", "AI đã cập nhật nội dung"));
        } catch (jsonError) {
          console.error("Failed to apply AI content", jsonError);
          assistantMessage.error = true;
          assistantMessage.content = t(
            "editor.aiInvalidJson",
            "Không thể áp dụng nội dung do AI trả về."
          );
          toast.error(
            t("editor.aiInvalidJsonDetail", "AI trả về JSON không hợp lệ")
          );
        }
      } else {
        toast.info(
          t("editor.aiNoJson", "AI không trả về nội dung mới để áp dụng")
        );
      }

      setAiMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorText =
        error?.response?.data?.error ||
        error?.message ||
        t("editor.aiFailed", "Không thể gọi AI, vui lòng thử lại");
      toast.error(errorText);
      setAiMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: "assistant",
          content: errorText,
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleResetAiHistory = () => {
    setAiMessages([]);
    toast.info(t("editor.aiHistoryCleared", "Đã xoá lịch sử trò chuyện AI"));
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
      typeof contentNode === "string" ? JSON.parse(contentNode) : contentNode;

    setIsPublishing(true);
    try {
      // Don't call forceSave here as it shows a toast notification
      // We'll save directly to server instead
      // forceSave();

      // Create or update article first
      let articleId: number | undefined;

      // Check if article has a valid numeric ID (from server)
      if (article.id && typeof article.id === "number") {
        // Update existing article from server
        articleId = article.id;
        await api.articles.update(articleId, {
          title: article.title,
          subtitle: article.subtitle,
          slug,
          excerpt: article.excerpt,
          content: contentJson,
          authorName: article.authorName,
          featuredImage: article.featuredImage,
          seoTitle: article.seoTitle || article.title,
          seoDescription: article.seoDescription || article.excerpt,
          seoKeywords:
            article.seoKeywords ||
            article.tags
              ?.map((t) => (typeof t === "string" ? t : t.name))
              .join(", "),
          status: article.status || "draft", // Ensure status is always sent
          isFeatured: article.isFeatured ?? false,
          isBreakingNews: article.isBreakingNews ?? false,
          allowComments: article.allowComments ?? true,
          visibility: article.visibility || "web,mobile",
          scheduledAt: article.scheduledAt,
          categoryIds:
            article.categories
              ?.map((cat) => cat.id)
              .filter((id) => id !== undefined) || [],
          tagIds:
            article.tags
              ?.map((tag) => (typeof tag === "object" ? tag.id : undefined))
              .filter((id) => id !== undefined) || [],
        });
      } else {
        // Create new article (draft ID or no ID)
        const response = await api.articles.create({
          title: article.title,
          subtitle: article.subtitle,
          slug,
          excerpt: article.excerpt,
          content: contentJson,
          authorName: article.authorName,
          featuredImage: article.featuredImage,
          seoTitle: article.seoTitle || article.title,
          seoDescription: article.seoDescription || article.excerpt,
          seoKeywords:
            article.seoKeywords ||
            article.tags
              ?.map((t) => (typeof t === "string" ? t : t.name))
              .join(", "),
          isFeatured: article.isFeatured ?? false,
          isBreakingNews: article.isBreakingNews ?? false,
          allowComments: article.allowComments ?? true,
          visibility: article.visibility || "web,mobile",
          scheduledAt: article.scheduledAt,
          categoryIds:
            article.categories
              ?.map((cat) => cat.id)
              .filter((id) => id !== undefined) || [],
          tagIds:
            article.tags
              ?.map((tag) => (typeof tag === "object" ? tag.id : undefined))
              .filter((id) => id !== undefined) || [],
        });
        articleId = response.data.id;
      }

      // Save article (keep current status, don't auto-publish)
      const successText = t("editor.saveSuccess", "Lưu bài viết thành công");
      toast.success(successText);
      setPublishMessage({ type: "success", text: successText });

      // Update article state with saved data (keep current status, don't reload from server)
      setArticle((prev) => ({
        ...prev,
        id: articleId,
        // Keep current status, don't change it
        status: prev.status || "draft", // Ensure status is preserved
        slug,
        updatedAt: new Date().toISOString(),
      }));
    } catch (error: unknown) {
      const errorObj =
        error && typeof error === "object" && "response" in error
          ? (error as {
              response?: { data?: { error?: string } };
              message?: string;
            })
          : null;
      const errorText =
        errorObj?.response?.data?.error ||
        errorObj?.message ||
        t("editor.publishFailed");
      toast.error(errorText);
      setPublishMessage({ type: "error", text: errorText });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex fixed inset-0 bg-white z-50">
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
            currentDraftId={
              typeof article.id === "string" ? article.id : undefined
            }
            onLoadDraft={handleLoadDraft}
            onNewDraft={handleNewDraft}
          />
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Loading Indicator */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t("articles.loading", "Đang tải bài viết...")}
              </p>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/articles")}
              title={t("common.back", "Quay lại")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
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
              variant={showAiAssistant ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAiAssistant((prev) => !prev)}
              className={
                showAiAssistant
                  ? "bg-[var(--color-vietsov-green)] text-white hover:!bg-[var(--color-vietsov-green-bold)]"
                  : ""
              }
            >
              <Bot className="h-4 w-4 mr-2" />
              {t("editor.aiAssistant", "AI trợ lý")}
            </Button>
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
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing}
              style={{
                backgroundColor: isPublishing
                  ? undefined
                  : "var(--color-vietsov-green)",
                color: "white",
              }}
              className="hover:!bg-[var(--color-vietsov-green-bold)] disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("editor.saving", "Đang lưu...")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t("common.save", "Lưu")}
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

          {/* AI Assistant Panel */}
          {showAiAssistant && (
            <div className="w-96 border-l bg-white overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4 text-[var(--color-vietsov-green)]" />
                  {t("editor.aiAssistant", "AI trợ lý")}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    title={t("editor.aiClearHistory", "Xoá lịch sử")}
                    onClick={handleResetAiHistory}
                    disabled={aiMessages.length === 0}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowAiAssistant(false)}
                    title={t("common.close", "Đóng")}
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {aiMessages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {t(
                      "editor.aiEmptyState",
                      'Hãy mô tả yêu cầu (ví dụ: "viết đoạn mở bài về biến đổi khí hậu"). AI sẽ chỉnh sửa nội dung trực tiếp.'
                    )}
                  </div>
                ) : (
                  aiMessages.map((msg) => {
                    const isUser = msg.role === "user";
                    const bubbleClass = msg.error
                      ? "border border-red-200 bg-red-50 text-red-900"
                      : isUser
                      ? "border bg-white text-[var(--color-vietsov-green-bold)]"
                      : "border border-gray-200 bg-gray-50 text-gray-900";
                    const bubbleStyle =
                      !msg.error && isUser
                        ? {
                            borderColor: "var(--color-vietsov-green)",
                            backgroundColor: "var(--color-vietsov-skin)",
                            color: "var(--color-vietsov-green-bold)",
                          }
                        : undefined;

                    return (
                      <div
                        key={msg.id}
                        className={`rounded-lg p-3 text-sm shadow-sm ${bubbleClass}`}
                        style={bubbleStyle}
                      >
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span className="font-semibold">
                            {isUser
                              ? t("editor.you", "Bạn")
                              : t("editor.aiLabel", "AI")}
                          </span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t p-3 space-y-2">
                <Textarea
                  placeholder={t(
                    "editor.aiPromptPlaceholder",
                    'Ví dụ: "Viết lại đoạn này ngắn gọn hơn"'
                  )}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  disabled={isAiProcessing}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      (event.metaKey || event.ctrlKey)
                    ) {
                      event.preventDefault();
                      handleSendAiPrompt();
                    }
                  }}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t(
                      "editor.aiDisclaimer",
                      "Kết quả AI cần được bạn rà soát lại."
                    )}
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSendAiPrompt}
                    disabled={isAiProcessing}
                    className="bg-[var(--color-vietsov-green)] text-white hover:bg-[var(--color-vietsov-green-bold)]"
                  >
                    {isAiProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("common.processing", "Đang xử lý")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t("common.send", "Gửi")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArticleEditorMain;
