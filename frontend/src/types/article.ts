export type ArticleStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "published";

export interface Article {
  id: number;
  title: string;
  subtitle?: string;
  slug: string;
  excerpt?: string;
  contentJson: string;
  contentHtml?: string;
  status: ArticleStatus;
  authorId: number;
  author?: {
    id: number;
    username: string;
    fullName?: string;
    email: string;
  };
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isFeatured: boolean;
  isBreakingNews: boolean;
  allowComments: boolean;
  visibility: string;
  scheduledAt?: string;
  publishedAt?: string;
  reviewNotes?: string;
  wordCount: number;
  characterCount: number;
  readingTime: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}
