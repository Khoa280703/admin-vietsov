import type { JSONContent } from '@tiptap/core';

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  content: JSONContent | string; // Support both JSON and HTML for backward compatibility
  excerpt?: string;
  author?: string;
  tags: string[];
  category?: string;
  featuredImage?: string;
  status: 'draft' | 'published';
  scheduledDate?: string;
  metaDescription?: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  characterCount: number;
  readingTime: number;
}

export interface DraftMetadata {
  id: string;
  title: string;
  lastModified: string;
  wordCount: number;
  preview: string;
}

