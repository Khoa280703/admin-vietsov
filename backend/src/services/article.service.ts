import { AppDataSource } from "../config/data-source";
import { Article, ArticleStatus } from "../entities/Article";
import { ArticleCategory } from "../entities/ArticleCategory";
import { ArticleTag } from "../entities/ArticleTag";
import { Category } from "../entities/Category";
import { Tag } from "../entities/Tag";
import { AppError } from "../middleware/error.middleware";
import { generateSlug } from "../utils/slug";
import { calculateStats } from "../utils/content";

export class ArticleService {
  static async createArticle(userId: number, data: any): Promise<Article> {
    const articleRepository = AppDataSource.getRepository(Article);
    const categoryRepository = AppDataSource.getRepository(Category);
    const tagRepository = AppDataSource.getRepository(Tag);

    const slug = data.slug || generateSlug(data.title);
    
    // Check if slug exists
    const existingArticle = await articleRepository.findOne({ where: { slug } });
    if (existingArticle) {
      throw new AppError("Article with this slug already exists", 400);
    }

    const contentJson = typeof data.content === "string" 
      ? data.content 
      : JSON.stringify(data.content || { type: "doc", content: [] });

    const stats = calculateStats(contentJson);

    const article = articleRepository.create({
      title: data.title,
      subtitle: data.subtitle,
      slug,
      excerpt: data.excerpt,
      contentJson,
      contentHtml: data.contentHtml,
      status: ArticleStatus.DRAFT,
      authorId: userId,
      featuredImage: data.featuredImage,
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription || data.excerpt,
      seoKeywords: data.seoKeywords,
      isFeatured: data.isFeatured || false,
      isBreakingNews: data.isBreakingNews || false,
      allowComments: data.allowComments !== undefined ? data.allowComments : true,
      visibility: data.visibility || "web,mobile",
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      wordCount: stats.wordCount,
      characterCount: stats.characterCount,
      readingTime: stats.readingTime,
    });

    const savedArticle = await articleRepository.save(article);

    // Handle categories
    if (data.categoryIds && Array.isArray(data.categoryIds)) {
      for (const categoryId of data.categoryIds) {
        const category = await categoryRepository.findOne({ where: { id: categoryId } });
        if (category) {
          const articleCategory = AppDataSource.getRepository(ArticleCategory).create({
            articleId: savedArticle.id,
            categoryId: category.id,
          });
          await AppDataSource.getRepository(ArticleCategory).save(articleCategory);
        }
      }
    }

    // Handle tags
    if (data.tagIds && Array.isArray(data.tagIds)) {
      for (const tagId of data.tagIds) {
        const tag = await tagRepository.findOne({ where: { id: tagId } });
        if (tag) {
          const articleTag = AppDataSource.getRepository(ArticleTag).create({
            articleId: savedArticle.id,
            tagId: tag.id,
          });
          await AppDataSource.getRepository(ArticleTag).save(articleTag);
        }
      }
    }

    return this.getArticleWithRelations(savedArticle.id);
  }

  static async updateArticle(
    articleId: number,
    userId: number,
    data: any,
    isAdmin: boolean
  ): Promise<Article> {
    const articleRepository = AppDataSource.getRepository(Article);
    const article = await articleRepository.findOne({ where: { id: articleId } });

    if (!article) {
      throw new AppError("Article not found", 404);
    }

    // Permission check: user can only update their own articles if status is draft/submitted
    if (!isAdmin) {
      if (article.authorId !== userId) {
        throw new AppError("You can only update your own articles", 403);
      }
      if (article.status !== ArticleStatus.DRAFT && article.status !== ArticleStatus.SUBMITTED) {
        throw new AppError("You can only update draft or submitted articles", 403);
      }
    }

    if (data.title) article.title = data.title;
    if (data.subtitle !== undefined) article.subtitle = data.subtitle;
    if (data.excerpt !== undefined) article.excerpt = data.excerpt;
    if (data.content !== undefined) {
      const contentJson = typeof data.content === "string"
        ? data.content
        : JSON.stringify(data.content);
      article.contentJson = contentJson;
      const stats = calculateStats(contentJson);
      article.wordCount = stats.wordCount;
      article.characterCount = stats.characterCount;
      article.readingTime = stats.readingTime;
    }
    if (data.contentHtml !== undefined) article.contentHtml = data.contentHtml;
    if (data.featuredImage !== undefined) article.featuredImage = data.featuredImage;
    if (data.seoTitle !== undefined) article.seoTitle = data.seoTitle;
    if (data.seoDescription !== undefined) article.seoDescription = data.seoDescription;
    if (data.seoKeywords !== undefined) article.seoKeywords = data.seoKeywords;
    if (data.isFeatured !== undefined) article.isFeatured = data.isFeatured;
    if (data.isBreakingNews !== undefined) article.isBreakingNews = data.isBreakingNews;
    if (data.allowComments !== undefined) article.allowComments = data.allowComments;
    if (data.visibility !== undefined) article.visibility = data.visibility;
    if (data.scheduledAt !== undefined) {
      article.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : undefined;
    }

    // Update slug if title changed
    if (data.title && data.title !== article.title) {
      const newSlug = generateSlug(data.title);
      const existingArticle = await articleRepository.findOne({ where: { slug: newSlug } });
      if (!existingArticle || existingArticle.id === article.id) {
        article.slug = newSlug;
      }
    }

    await articleRepository.save(article);

    // Update categories if provided
    if (data.categoryIds !== undefined) {
      await AppDataSource.getRepository(ArticleCategory).delete({ articleId: article.id });
      if (Array.isArray(data.categoryIds) && data.categoryIds.length > 0) {
        const categoryRepository = AppDataSource.getRepository(Category);
        for (const categoryId of data.categoryIds) {
          const category = await categoryRepository.findOne({ where: { id: categoryId } });
          if (category) {
            const articleCategory = AppDataSource.getRepository(ArticleCategory).create({
              articleId: article.id,
              categoryId: category.id,
            });
            await AppDataSource.getRepository(ArticleCategory).save(articleCategory);
          }
        }
      }
    }

    // Update tags if provided
    if (data.tagIds !== undefined) {
      await AppDataSource.getRepository(ArticleTag).delete({ articleId: article.id });
      if (Array.isArray(data.tagIds) && data.tagIds.length > 0) {
        const tagRepository = AppDataSource.getRepository(Tag);
        for (const tagId of data.tagIds) {
          const tag = await tagRepository.findOne({ where: { id: tagId } });
          if (tag) {
            const articleTag = AppDataSource.getRepository(ArticleTag).create({
              articleId: article.id,
              tagId: tag.id,
            });
            await AppDataSource.getRepository(ArticleTag).save(articleTag);
          }
        }
      }
    }

    return this.getArticleWithRelations(article.id);
  }

  static async submitArticle(articleId: number, userId: number): Promise<Article> {
    const articleRepository = AppDataSource.getRepository(Article);
    const article = await articleRepository.findOne({ where: { id: articleId } });

    if (!article) {
      throw new AppError("Article not found", 404);
    }

    if (article.authorId !== userId) {
      throw new AppError("You can only submit your own articles", 403);
    }

    if (article.status !== ArticleStatus.DRAFT) {
      throw new AppError("Only draft articles can be submitted", 400);
    }

    article.status = ArticleStatus.SUBMITTED;
    await articleRepository.save(article);

    return this.getArticleWithRelations(article.id);
  }

  static async reviewArticle(
    articleId: number,
    adminId: number,
    action: "approve" | "reject",
    notes?: string
  ): Promise<Article> {
    const articleRepository = AppDataSource.getRepository(Article);
    const article = await articleRepository.findOne({ where: { id: articleId } });

    if (!article) {
      throw new AppError("Article not found", 404);
    }

    if (article.status !== ArticleStatus.SUBMITTED && article.status !== ArticleStatus.UNDER_REVIEW) {
      throw new AppError("Article is not in a reviewable state", 400);
    }

    if (action === "approve") {
      article.status = ArticleStatus.APPROVED;
    } else {
      article.status = ArticleStatus.REJECTED;
    }

    if (notes) {
      article.reviewNotes = notes;
    }

    await articleRepository.save(article);

    return this.getArticleWithRelations(article.id);
  }

  static async publishArticle(articleId: number, userId: number, isAdmin: boolean): Promise<Article> {
    const articleRepository = AppDataSource.getRepository(Article);
    const article = await articleRepository.findOne({ where: { id: articleId } });

    if (!article) {
      throw new AppError("Article not found", 404);
    }

    // Admin can publish any article, user can only publish their own approved articles
    if (!isAdmin) {
      if (article.authorId !== userId) {
        throw new AppError("You can only publish your own articles", 403);
      }
      if (article.status !== ArticleStatus.APPROVED) {
        throw new AppError("Only approved articles can be published", 400);
      }
    }

    article.status = ArticleStatus.PUBLISHED;
    article.publishedAt = new Date();
    await articleRepository.save(article);

    return this.getArticleWithRelations(article.id);
  }

  static async getArticleWithRelations(articleId: number): Promise<Article> {
    const articleRepository = AppDataSource.getRepository(Article);
    const article = await articleRepository.findOne({
      where: { id: articleId },
      relations: ["author", "author.role", "articleCategories", "articleCategories.category", "articleTags", "articleTags.tag"],
    });

    if (!article) {
      throw new AppError("Article not found", 404);
    }

    return article;
  }
}

