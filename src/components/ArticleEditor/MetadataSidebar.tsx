import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Article } from '@/types/article';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Upload, Calendar as CalendarIcon, FileText, User, Tag, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { compressImage, isImageFile, validateImageSize } from '@/utils/imageHandler';
import { generateSlug } from '@/utils/validation';

interface MetadataSidebarProps {
  article: Partial<Article>;
  onUpdate: (updates: Partial<Article>) => void;
  stats: {
    words: number;
    characters: number;
    readingTime: number;
  };
}

export function MetadataSidebar({ article, onUpdate, stats }: MetadataSidebarProps) {
  const { t } = useTranslation();
  const [newTag, setNewTag] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const addTag = () => {
    if (newTag && !article.tags?.includes(newTag)) {
      onUpdate({ tags: [...(article.tags || []), newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    onUpdate({ tags: article.tags?.filter((t) => t !== tag) || [] });
  };

  const handleFeaturedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      setIsUploadingImage(true);
      const base64 = await compressImage(file, 800);
      onUpdate({ featuredImage: base64 });
      toast.success(t('editor.featuredImageUploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('editor.imageUploadFailed'));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const categories = [
    t('categories.technology'),
    t('categories.business'),
    t('categories.health'),
    t('categories.science'),
    t('categories.entertainment'),
    t('categories.sports'),
    t('categories.politics'),
    t('categories.education'),
    t('categories.travel'),
    t('categories.food'),
    t('categories.lifestyle'),
    t('categories.other'),
  ];

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-4">
      {/* Article Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("metadata.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t("metadata.titleLabel")}</label>
            <Input
              placeholder={t("metadata.titlePlaceholder")}
              value={article.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t("metadata.subtitle")}</label>
            <Input
              placeholder={t("metadata.subtitlePlaceholder")}
              value={article.subtitle || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t("metadata.excerpt")}</label>
            <Textarea
              placeholder={t("metadata.excerptPlaceholder")}
              value={article.excerpt || ''}
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
              value={article.author || ''}
              onChange={(e) => onUpdate({ author: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {t("metadata.tags")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder={t("metadata.addTag")}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
            />
            <Button size="icon" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {article.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            {t("metadata.category")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={article.category || ''}
            onValueChange={(value) => onUpdate({ category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("metadata.selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Featured Image */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("metadata.featuredImage")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
            onClick={() => document.getElementById('featured-image-upload')?.click()}
            disabled={isUploadingImage}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploadingImage ? t("metadata.uploading") : t("metadata.uploadImage")}
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
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t("metadata.publication")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">{t("metadata.status")}</label>
            <Select
              value={article.status || 'draft'}
              onValueChange={(value) => onUpdate({ status: value as 'draft' | 'published' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("metadata.draft")}</SelectItem>
                <SelectItem value="published">{t("metadata.published")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t("metadata.scheduleDate")}</label>
            <Input
              type="datetime-local"
              value={
                article.scheduledDate
                  ? new Date(article.scheduledDate).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) {
                  onUpdate({ scheduledDate: new Date(e.target.value).toISOString() });
                } else {
                  onUpdate({ scheduledDate: undefined });
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("metadata.seo")}</CardTitle>
          <CardDescription>{t("metadata.seoDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">{t("metadata.slug")}</label>
            <div className="flex gap-2">
              <Input
                placeholder={t("metadata.slugPlaceholder")}
                value={article.slug || ''}
                onChange={(e) => onUpdate({ slug: e.target.value })}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => article.title && onUpdate({ slug: generateSlug(article.title) })}
              >
                {t("metadata.generate")}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("metadata.metaDescription")} ({article.metaDescription?.length || 0}/160)
            </label>
            <Textarea
              placeholder={t("metadata.metaDescriptionPlaceholder")}
              value={article.metaDescription || ''}
              onChange={(e) => onUpdate({ metaDescription: e.target.value })}
              maxLength={160}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("metadata.statistics")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("metadata.words")}</span>
            <span className="font-medium">{stats.words}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("metadata.characters")}</span>
            <span className="font-medium">{stats.characters}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("metadata.readingTime")}</span>
            <span className="font-medium">{stats.readingTime} {t("metadata.minutes")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MetadataSidebar;

