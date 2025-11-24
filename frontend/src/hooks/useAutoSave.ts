import { useEffect, useRef } from 'react';
import type { Article } from '@/types/article';
import { StorageManager } from '@/utils/storage';
import { toast } from 'sonner';

interface UseAutoSaveOptions {
  enabled?: boolean;
  interval?: number; // in milliseconds
}

export function useAutoSave(
  article: Partial<Article> | null,
  options: UseAutoSaveOptions = {}
) {
  const { enabled = true, interval = 30000 } = options; // Default: 30 seconds
  const timerRef = useRef<number | undefined>(undefined);
  const lastSaveRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !article || !article.id) {
      return;
    }

    const saveArticle = () => {
      try {
        const currentContent = JSON.stringify(article);
        
        // Only save if content has changed
        if (currentContent !== lastSaveRef.current) {
          const fullArticle: Article = {
            id: article.id!,
            title: article.title || 'Untitled',
            content: article.content || '',
            subtitle: article.subtitle,
            excerpt: article.excerpt,
            author: article.author,
            tags: article.tags || [],
            category: article.category,
            categoryId: article.categoryId,
            featuredImage: article.featuredImage,
            status: article.status || 'draft',
            scheduledDate: article.scheduledDate,
            metaDescription: article.metaDescription,
            slug: article.slug,
            seoTitle: article.seoTitle,
            seoKeywords: article.seoKeywords,
            authorId: article.authorId,
            isFeatured: article.isFeatured,
            isBreakingNews: article.isBreakingNews,
            allowComments: article.allowComments,
            visibility: article.visibility,
            createdAt: article.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            wordCount: article.wordCount || 0,
            characterCount: article.characterCount || 0,
            readingTime: article.readingTime || 0,
          };

          StorageManager.saveDraft(fullArticle);
          lastSaveRef.current = currentContent;
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    // Initial save
    saveArticle();

    // Set up interval
    timerRef.current = setInterval(saveArticle, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [article, enabled, interval]);

  const forceSave = () => {
    if (article && article.id) {
      try {
        const fullArticle: Article = {
          id: article.id,
          title: article.title || 'Untitled',
          content: article.content || '',
          subtitle: article.subtitle,
          excerpt: article.excerpt,
          author: article.author,
        tags: article.tags || [],
          category: article.category,
        categoryId: article.categoryId,
          featuredImage: article.featuredImage,
          status: article.status || 'draft',
          scheduledDate: article.scheduledDate,
          metaDescription: article.metaDescription,
          slug: article.slug,
        seoTitle: article.seoTitle,
        seoKeywords: article.seoKeywords,
        authorId: article.authorId,
        isFeatured: article.isFeatured,
        isBreakingNews: article.isBreakingNews,
        allowComments: article.allowComments,
        visibility: article.visibility,
          createdAt: article.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wordCount: article.wordCount || 0,
          characterCount: article.characterCount || 0,
          readingTime: article.readingTime || 0,
        };

        StorageManager.saveDraft(fullArticle);
        lastSaveRef.current = JSON.stringify(article);
        toast.success('Draft saved');
      } catch (error) {
        console.error('Manual save failed:', error);
        toast.error('Failed to save draft');
      }
    }
  };

  return { forceSave };
}

