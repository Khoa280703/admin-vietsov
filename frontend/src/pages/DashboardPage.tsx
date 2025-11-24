import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { toast } from "sonner";
import {
  FileText,
  Eye,
  TrendingUp,
  Calendar,
  Users,
  FolderTree,
  Tag,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { ArticleStatusBadge } from "@/components/Articles/ArticleStatusBadge";
import type { ArticleStatus } from "@/types/article";

interface DashboardStats {
  overview: {
    totalArticles: number;
    publishedCount: number;
    totalViews: number;
    thisMonthCount: number;
    thisWeekCount: number;
  };
  statusCounts: Record<string, number>;
  topArticles: Array<{
    id: number;
    title: string;
    views: number;
    status: ArticleStatus;
    createdAt: string;
    author: {
      id: number;
      username: string;
      fullName?: string;
    } | null;
  }>;
  recentArticles: Array<{
    id: number;
    title: string;
    status: ArticleStatus;
    views: number;
    createdAt: string;
    author: {
      id: number;
      username: string;
      fullName?: string;
    } | null;
  }>;
  articlesByMonth: Array<{
    year: number;
    month: number;
    count: number;
  }>;
  systemStats: {
    totalUsers: number;
    totalCategories: number;
    totalTags: number;
  } | null;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await api.dashboard.getStatistics();
      setStats(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("dashboard.fetchError", "Lỗi khi tải thống kê"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-gray-500">{t("dashboard.noData", "Không có dữ liệu")}</p>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className = "",
  }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    trend?: string;
    className?: string;
  }) => (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs text-vietsov-green mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const monthNames = [
    t("dashboard.month.jan", "Tháng 1"),
    t("dashboard.month.feb", "Tháng 2"),
    t("dashboard.month.mar", "Tháng 3"),
    t("dashboard.month.apr", "Tháng 4"),
    t("dashboard.month.may", "Tháng 5"),
    t("dashboard.month.jun", "Tháng 6"),
    t("dashboard.month.jul", "Tháng 7"),
    t("dashboard.month.aug", "Tháng 8"),
    t("dashboard.month.sep", "Tháng 9"),
    t("dashboard.month.oct", "Tháng 10"),
    t("dashboard.month.nov", "Tháng 11"),
    t("dashboard.month.dec", "Tháng 12"),
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.title", "Dashboard")}</h1>
        <p className="text-gray-500 mt-1">{t("dashboard.subtitle", "Tổng quan về hệ thống")}</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.totalArticles", "Tổng bài viết")}
          value={stats.overview.totalArticles}
          icon={FileText}
          description={t("dashboard.totalArticlesDesc", "Tất cả bài viết trong hệ thống")}
        />
        <StatCard
          title={t("dashboard.published", "Đã xuất bản")}
          value={stats.overview.publishedCount}
          icon={CheckCircle}
          description={t("dashboard.publishedDesc", "Bài viết đã được xuất bản")}
          className="border-vietsov-green/20 bg-vietsov-green/5"
        />
        <StatCard
          title={t("dashboard.totalViews", "Tổng lượt xem")}
          value={stats.overview.totalViews}
          icon={Eye}
          description={t("dashboard.totalViewsDesc", "Tổng lượt xem tất cả bài viết")}
          className="border-blue-200 bg-blue-50"
        />
        <StatCard
          title={t("dashboard.thisMonth", "Tháng này")}
          value={stats.overview.thisMonthCount}
          icon={Calendar}
          description={t("dashboard.thisMonthDesc", "Bài viết tạo trong tháng")}
        />
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("dashboard.statusBreakdown", "Phân bổ trạng thái")}</CardTitle>
            <CardDescription>{t("dashboard.statusBreakdownDesc", "Số lượng bài viết theo trạng thái")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArticleStatusBadge status={status as ArticleStatus} />
                </div>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Stats (Admin only) */}
        {stats.systemStats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("dashboard.systemStats", "Thống kê hệ thống")}</CardTitle>
              <CardDescription>{t("dashboard.systemStatsDesc", "Tổng quan hệ thống")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{t("dashboard.totalUsers", "Tổng người dùng")}</span>
                </div>
                <span className="font-semibold">{stats.systemStats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-gray-500" />
                  <span>{t("dashboard.totalCategories", "Tổng danh mục")}</span>
                </div>
                <span className="font-semibold">{stats.systemStats.totalCategories}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span>{t("dashboard.totalTags", "Tổng thẻ")}</span>
                </div>
                <span className="font-semibold">{stats.systemStats.totalTags}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* This Week */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("dashboard.thisWeek", "Tuần này")}</CardTitle>
            <CardDescription>{t("dashboard.thisWeekDesc", "Bài viết tạo trong tuần")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.overview.thisWeekCount}</div>
            <p className="text-sm text-gray-500 mt-2">
              {t("dashboard.newArticles", "bài viết mới")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Articles & Recent Articles */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("dashboard.topArticles", "Bài viết phổ biến")}
            </CardTitle>
            <CardDescription>{t("dashboard.topArticlesDesc", "Top 5 bài viết có lượt xem cao nhất")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topArticles.length === 0 ? (
                <p className="text-sm text-gray-500">{t("dashboard.noTopArticles", "Chưa có bài viết nào")}</p>
              ) : (
                stats.topArticles.map((article, index) => (
                  <div
                    key={article.id}
                    className="flex items-start justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-400">#{index + 1}</span>
                        <ArticleStatusBadge status={article.status} />
                      </div>
                      <h4 className="font-medium text-sm truncate">{article.title}</h4>
                      {article.author && (
                        <p className="text-xs text-gray-500 mt-1">
                          {article.author.fullName || article.author.username}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-sm">{article.views.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("dashboard.recentArticles", "Bài viết gần đây")}
            </CardTitle>
            <CardDescription>{t("dashboard.recentArticlesDesc", "5 bài viết được tạo gần đây nhất")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentArticles.length === 0 ? (
                <p className="text-sm text-gray-500">{t("dashboard.noRecentArticles", "Chưa có bài viết nào")}</p>
              ) : (
                stats.recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-start justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ArticleStatusBadge status={article.status} />
                      </div>
                      <h4 className="font-medium text-sm truncate">{article.title}</h4>
                      {article.author && (
                        <p className="text-xs text-gray-500 mt-1">
                          {article.author.fullName || article.author.username}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(article.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-sm">{article.views.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articles by Month Chart */}
      {stats.articlesByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("dashboard.articlesByMonth", "Bài viết theo tháng")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.articlesByMonthDesc", "Thống kê bài viết trong 6 tháng gần đây")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.articlesByMonth.map((item) => {
                const maxCount = Math.max(...stats.articlesByMonth.map((i) => i.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const monthName = monthNames[item.month - 1];

                return (
                  <div key={`${item.year}-${item.month}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {monthName} {item.year}
                      </span>
                      <span className="text-gray-500">{item.count} {t("dashboard.articles", "bài viết")}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

