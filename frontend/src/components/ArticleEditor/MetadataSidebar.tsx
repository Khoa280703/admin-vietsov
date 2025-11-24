import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Article, ArticleStatus } from "@/types/article";
import { useState, useEffect } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import {
  X,
  Plus,
  Upload,
  Calendar as CalendarIcon,
  FileText,
  User,
  Tag,
  FolderOpen,
  Shield,
  Globe,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  compressImage,
  isImageFile,
  validateImageSize,
} from "@/utils/imageHandler";
import { generateSlug } from "@/utils/validation";
import { cn } from "@/lib/utils";

interface MetadataSidebarProps {
  article: Partial<Article>;
  onUpdate: (updates: Partial<Article>) => void;
  stats: {
    words: number;
    characters: number;
    readingTime: number;
  };
}

const SECTION_DEFAULTS = {
  info: false,
  tags: false,
  categories: false,
  featured: false,
  publication: false,
  seo: false,
  statistics: false,
} as const;

type SectionId = keyof typeof SECTION_DEFAULTS;

export function MetadataSidebar({
  article,
  onUpdate,
  stats,
}: MetadataSidebarProps) {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>(
    () => ({ ...SECTION_DEFAULTS })
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [availableTags, setAvailableTags] = useState<
    Array<{ id: number; name: string; slug: string }>
  >([]);
  const [availableCategories, setAvailableCategories] = useState<
    Array<{ id: number; name: string; slug: string }>
  >([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState("");

  // Fetch tags from API
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoadingTags(true);
        const response = await api.tags.list({ page: 1, limit: 100 });
        setAvailableTags(response.data || []);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      } finally {
        setLoadingTags(false);
      }
    };
    fetchTags();
  }, []);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await api.categories.list();
        setAvailableCategories(response.data || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const addTag = (tagId: number) => {
    const tag = availableTags.find((t) => t.id === tagId);
    if (tag && !article.tags?.some((t) => t.id === tagId)) {
      const currentTags = article.tags || [];
      onUpdate({ tags: [...currentTags, tag] });
      setTagSearchTerm("");
    }
  };

  const removeTag = (tagId: number) => {
    onUpdate({ tags: article.tags?.filter((t) => t.id !== tagId) || [] });
  };

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase()) &&
      !article.tags?.some((selectedTag) => selectedTag.id === tag.id)
  );

  const handleFeaturedImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
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
      setIsUploadingImage(true);
      const base64 = await compressImage(file, 800);
      onUpdate({ featuredImage: base64 });
      toast.success(t("editor.featuredImageUploaded"));
    } catch (error) {
      console.error("Failed to upload featured image", error);
      toast.error(t("editor.imageUploadFailed"));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toggleSection = (section: SectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const SectionHeader = ({
    icon: Icon,
    title,
    section,
    description,
  }: {
    icon?: ComponentType<{ className?: string }>;
    title: string;
    section: SectionId;
    description?: string;
  }) => (
    <CardHeader className="py-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => toggleSection(section)}
      >
        <span className="flex items-center gap-2 text-base font-semibold">
          {Icon && <Icon className="h-5 w-5" />}
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            openSections[section] ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      {description && openSections[section] && (
        <CardDescription className="mt-2">{description}</CardDescription>
      )}
    </CardHeader>
  );

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-4">
      {/* Article Info */}
      <Card>
        <SectionHeader
          icon={FileText}
          title={t("metadata.title")}
          section="info"
        />
        <CardContent
          className={cn("space-y-4", !openSections.info && "hidden")}
        >
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("metadata.titleLabel")}
            </label>
            <Input
              placeholder={t("metadata.titlePlaceholder")}
              value={article.title || ""}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("metadata.subtitle")}
            </label>
            <Input
              placeholder={t("metadata.subtitlePlaceholder")}
              value={article.subtitle || ""}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("metadata.excerpt")}
            </label>
            <Textarea
              placeholder={t("metadata.excerptPlaceholder")}
              value={article.excerpt || ""}
              onChange={(e) => onUpdate({ excerpt: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("metadata.author")}
            </label>
            <Input
              placeholder={t("metadata.authorPlaceholder")}
              value={article.authorName || ""}
              onChange={(e) => onUpdate({ authorName: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <SectionHeader icon={Tag} title={t("metadata.tags")} section="tags" />
        <CardContent
          className={cn("space-y-3", !openSections.tags && "hidden")}
        >
          <div className="space-y-2">
            <Input
              placeholder={t("metadata.searchTag", "Tìm kiếm tag...")}
              value={tagSearchTerm}
              onChange={(e) => setTagSearchTerm(e.target.value)}
              disabled={loadingTags}
            />
            {loadingTags ? (
              <div className="text-sm text-muted-foreground p-2">
                Đang tải tags...
              </div>
            ) : (
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                {filteredTags.length > 0 ? (
                  filteredTags.slice(0, 20).map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => addTag(tag.id)}
                    >
                      <span className="text-sm">{tag.name}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : tagSearchTerm ? (
                  <div className="text-sm text-muted-foreground p-2">
                    Không tìm thấy tag
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-2">
                    Nhập từ khóa để tìm kiếm tags hoặc chọn từ danh sách dưới
                    đây
                  </div>
                )}
              </div>
            )}
            {/* Hiển thị tất cả tags khi không search */}
            {!tagSearchTerm && availableTags.length > 0 && (
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Tất cả tags:
                </div>
                <div className="flex flex-wrap gap-1">
                  {availableTags
                    .filter(
                      (tag) =>
                        !article.tags?.some(
                          (selectedTag) => selectedTag.id === tag.id
                        )
                    )
                    .map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => addTag(tag.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {article.tags && article.tags.length > 0 ? (
              article.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag.id)}
                  />
                </Badge>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                Chưa có tag nào được chọn
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <SectionHeader
          icon={FolderOpen}
          title={t("metadata.categories", "Danh mục")}
          section="categories"
        />
        <CardContent
          className={cn("space-y-3", !openSections.categories && "hidden")}
        >
          <Select
            value={article.categories?.[0]?.id?.toString() || ""}
            onValueChange={(value) => {
              const category = availableCategories.find(
                (c) => c.id.toString() === value
              );
              if (category) {
                onUpdate({ categories: [category] });
              }
            }}
            disabled={loadingCategories}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("metadata.selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {article.categories && article.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {cat.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => onUpdate({ categories: [] })}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Featured Image */}
      <Card>
        <SectionHeader
          icon={Upload}
          title={t("metadata.featuredImage")}
          section="featured"
        />
        <CardContent
          className={cn("space-y-3", !openSections.featured && "hidden")}
        >
          {article.featuredImage && (
            <div className="relative">
              <img
                src={article.featuredImage}
                alt="Featured"
                className="w-full h-32 object-cover rounded-md"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => onUpdate({ featuredImage: undefined })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              document.getElementById("featured-image-upload")?.click()
            }
            disabled={isUploadingImage}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploadingImage
              ? t("metadata.uploading")
              : t("metadata.uploadImage")}
          </Button>
          <input
            id="featured-image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFeaturedImage}
          />
        </CardContent>
      </Card>

      {/* Publication */}
      <Card>
        <SectionHeader
          icon={CalendarIcon}
          title={t("metadata.publication")}
          section="publication"
        />
        <CardContent
          className={cn("space-y-3", !openSections.publication && "hidden")}
        >
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("metadata.status")}
            </label>
            <Select
              value={article.status || "draft"}
              onValueChange={(value) =>
                onUpdate({ status: value as ArticleStatus })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  {t("articles.status.draft", "Bản nháp")}
                </SelectItem>
                <SelectItem value="submitted">
                  {t("articles.status.submitted", "Đã gửi")}
                </SelectItem>
                <SelectItem value="under_review">
                  {t("articles.status.under_review", "Đang duyệt")}
                </SelectItem>
                <SelectItem value="approved">
                  {t("articles.status.approved", "Đã duyệt")}
                </SelectItem>
                <SelectItem value="rejected">
                  {t("articles.status.rejected", "Đã từ chối")}
                </SelectItem>
                <SelectItem value="published">
                  {t("articles.status.published", "Đã xuất bản")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("metadata.scheduleDate")}
            </label>
            <Input
              type="datetime-local"
              value={
                article.scheduledAt
                  ? new Date(article.scheduledAt).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => {
                if (e.target.value) {
                  onUpdate({
                    scheduledAt: new Date(e.target.value).toISOString(),
                  });
                } else {
                  onUpdate({ scheduledAt: undefined });
                }
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t("metadata.visibility")}
            </label>
            <Input
              placeholder="web,mobile"
              value={article.visibility || ""}
              onChange={(e) => onUpdate({ visibility: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t("metadata.flags")}
            </label>
            <div className="space-y-2 pl-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={article.isFeatured ?? false}
                  onChange={(e) => onUpdate({ isFeatured: e.target.checked })}
                />
                {t("metadata.isFeatured")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={article.isBreakingNews ?? false}
                  onChange={(e) =>
                    onUpdate({ isBreakingNews: e.target.checked })
                  }
                />
                {t("metadata.isBreakingNews")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={article.allowComments ?? true}
                  onChange={(e) =>
                    onUpdate({ allowComments: e.target.checked })
                  }
                />
                {t("metadata.allowComments")}
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <SectionHeader
          icon={Globe}
          title={t("metadata.seo")}
          description={t("metadata.seoDescription")}
          section="seo"
        />
        <CardContent className={cn("space-y-3", !openSections.seo && "hidden")}>
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("metadata.seoTitle")}
            </label>
            <Input
              placeholder={t("metadata.seoTitlePlaceholder")}
              value={article.seoTitle || ""}
              onChange={(e) => onUpdate({ seoTitle: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("metadata.slug")}
            </label>
            <div className="flex gap-2">
              <Input
                placeholder={t("metadata.slugPlaceholder")}
                value={article.slug || ""}
                onChange={(e) => onUpdate({ slug: e.target.value })}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  article.title &&
                  onUpdate({ slug: generateSlug(article.title) })
                }
              >
                {t("metadata.generate")}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("metadata.metaDescription")} (
              {article.seoDescription?.length || 0}/160)
            </label>
            <Textarea
              placeholder={t("metadata.metaDescriptionPlaceholder")}
              value={article.seoDescription || ""}
              onChange={(e) => onUpdate({ seoDescription: e.target.value })}
              maxLength={160}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("metadata.seoKeywords")}
            </label>
            <Input
              placeholder={t("metadata.seoKeywordsPlaceholder")}
              value={article.seoKeywords || ""}
              onChange={(e) => onUpdate({ seoKeywords: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <SectionHeader title={t("metadata.statistics")} section="statistics" />
        <CardContent
          className={cn("space-y-2", !openSections.statistics && "hidden")}
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("metadata.words")}</span>
            <span className="font-medium">{stats.words}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("metadata.characters")}
            </span>
            <span className="font-medium">{stats.characters}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("metadata.readingTime")}
            </span>
            <span className="font-medium">
              {stats.readingTime} {t("metadata.minutes")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MetadataSidebar;
