export enum CategoryType {
  EVENT = "event",
  NEWS_TYPE = "news_type",
  OTHER = "other",
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  type: CategoryType;
  parentId?: number;
  parent?: Category;
  children?: Category[];
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

