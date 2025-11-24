import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Article, ArticleStatus } from "../entities/Article";
import { User } from "../entities/User";
import { Category } from "../entities/Category";
import { Tag } from "../entities/Tag";
import { AuthRequest } from "../middleware/auth.middleware";

export class DashboardController {
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const isAdmin = authReq.user?.role?.name === "admin";
      const userId = authReq.userId;

      const articleRepository = AppDataSource.getRepository(Article);
      const userRepository = AppDataSource.getRepository(User);
      const categoryRepository = AppDataSource.getRepository(Category);
      const tagRepository = AppDataSource.getRepository(Tag);

      // Helper function to create base query builder
      const createBaseQuery = () => {
        const qb = articleRepository.createQueryBuilder("article");
        if (!isAdmin) {
          qb.where("article.authorId = :userId", { userId });
        }
        return qb;
      };

      // Total articles
      const totalArticles = await createBaseQuery().getCount();

      // Articles by status
      const articlesByStatus = await createBaseQuery()
        .select("article.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("article.status")
        .getRawMany();

      const statusCounts: Record<string, number> = {
        draft: 0,
        submitted: 0,
        under_review: 0,
        approved: 0,
        rejected: 0,
        published: 0,
      };

      articlesByStatus.forEach((item) => {
        statusCounts[item.status] = parseInt(item.count);
      });

      // Total views
      const totalViewsResult = await createBaseQuery()
        .select("SUM(article.views)", "total")
        .getRawOne();
      const totalViews = parseInt(totalViewsResult?.total || "0");

      // Published articles count
      const publishedCount = await createBaseQuery()
        .andWhere("article.status = :status", { status: ArticleStatus.PUBLISHED })
        .getCount();

      // Articles created this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const thisMonthCount = await createBaseQuery()
        .andWhere("article.createdAt >= :startOfMonth", { startOfMonth })
        .getCount();

      // Articles created this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const thisWeekCount = await createBaseQuery()
        .andWhere("article.createdAt >= :startOfWeek", { startOfWeek })
        .getCount();

      // Top articles by views
      const topArticles = await createBaseQuery()
        .select([
          "article.id",
          "article.title",
          "article.views",
          "article.status",
          "article.createdAt",
        ])
        .leftJoin("article.author", "author")
        .addSelect(["author.id", "author.username", "author.fullName"])
        .orderBy("article.views", "DESC")
        .limit(5)
        .getMany();

      // Recent articles
      const recentArticles = await createBaseQuery()
        .select([
          "article.id",
          "article.title",
          "article.status",
          "article.views",
          "article.createdAt",
        ])
        .leftJoin("article.author", "author")
        .addSelect(["author.id", "author.username", "author.fullName"])
        .orderBy("article.createdAt", "DESC")
        .limit(5)
        .getMany();

      // Articles by month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const articlesByMonth = await createBaseQuery()
        .select("YEAR(article.createdAt)", "year")
        .addSelect("MONTH(article.createdAt)", "month")
        .addSelect("COUNT(*)", "count")
        .andWhere("article.createdAt >= :sixMonthsAgo", { sixMonthsAgo })
        .groupBy("YEAR(article.createdAt), MONTH(article.createdAt)")
        .orderBy("YEAR(article.createdAt), MONTH(article.createdAt)", "ASC")
        .getRawMany();

      // Additional stats (admin only)
      let totalUsers = 0;
      let totalCategories = 0;
      let totalTags = 0;

      if (isAdmin) {
        totalUsers = await userRepository.count();
        totalCategories = await categoryRepository.count();
        totalTags = await tagRepository.count();
      }

      res.json({
        overview: {
          totalArticles,
          publishedCount,
          totalViews,
          thisMonthCount,
          thisWeekCount,
        },
        statusCounts,
        topArticles: topArticles.map((article) => ({
          id: article.id,
          title: article.title,
          views: article.views,
          status: article.status,
          createdAt: article.createdAt,
          author: article.author
            ? {
                id: article.author.id,
                username: article.author.username,
                fullName: article.author.fullName,
              }
            : null,
        })),
        recentArticles: recentArticles.map((article) => ({
          id: article.id,
          title: article.title,
          status: article.status,
          views: article.views,
          createdAt: article.createdAt,
          author: article.author
            ? {
                id: article.author.id,
                username: article.author.username,
                fullName: article.author.fullName,
              }
            : null,
        })),
        articlesByMonth: articlesByMonth.map((item) => ({
          year: parseInt(item.year),
          month: parseInt(item.month),
          count: parseInt(item.count),
        })),
        systemStats: isAdmin
          ? {
              totalUsers,
              totalCategories,
              totalTags,
            }
          : null,
      });
    } catch (error) {
      console.error("Dashboard statistics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
