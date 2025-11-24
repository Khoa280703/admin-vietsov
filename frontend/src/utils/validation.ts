import type { Article } from '@/types/article';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateArticle(article: Partial<Article>): ValidationResult {
  const errors: string[] = [];

  if (!article.title || article.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (article.title && article.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (!article.content || article.content.trim().length === 0) {
    errors.push('Content is required');
  }

  if (article.slug && !/^[a-z0-9-]+$/.test(article.slug)) {
    errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
  }

  if (article.metaDescription && article.metaDescription.length > 160) {
    errors.push('Meta description should be less than 160 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

