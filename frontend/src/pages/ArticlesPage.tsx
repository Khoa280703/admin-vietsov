import { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ArticleActions } from "@/components/Articles/ArticleActions";
import { ArticleStatusBadge } from "@/components/Articles/ArticleStatusBadge";
import { FileText, Search, Plus } from "lucide-react";
import type { Article, ArticleStatus } from "@/types/article";

export function ArticlesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (authorFilter !== "all") {
        params.authorId = parseInt(authorFilter);
      }
      if (categoryFilter !== "all") {
        params.categoryId = parseInt(categoryFilter);
      }
      if (tagFilter !== "all") {
        params.tagId = parseInt(tagFilter);
      }
      const response = await api.articles.list(params);
      setArticles(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          t("articles.fetchError", "Lỗi khi tải danh sách bài viết")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [
    pagination.page,
    pagination.limit,
    statusFilter,
    authorFilter,
    categoryFilter,
    tagFilter,
  ]);

  const filteredArticles = useMemo(() => {
    if (!searchTerm) return articles;
    const search = searchTerm.toLowerCase();
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(search) ||
        article.subtitle?.toLowerCase().includes(search)
    );
  }, [articles, searchTerm]);

  const columns: ColumnDef<Article>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("id")}</div>
        ),
      },
      {
        accessorKey: "title",
        header: t("articles.title", "Tiêu đề"),
        cell: ({ row }) => (
          <div className="max-w-md">
            <div className="font-medium truncate">{row.getValue("title")}</div>
            {row.original.subtitle && (
              <div className="text-sm text-gray-500 truncate">
                {row.original.subtitle}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "authorName",
        header: t("articles.author", "Tác giả"),
        cell: ({ row }) => {
          const authorName = row.original.authorName;
          const author = row.original.author;
          // Prefer authorName, fallback to author object
          if (authorName) {
            return <div className="font-medium">{authorName}</div>;
          } else if (author) {
            return (
              <div>
                <div className="font-medium">
                  {author.fullName || author.username}
                </div>
                {author.email && (
                  <div className="text-sm text-gray-500">{author.email}</div>
                )}
              </div>
            );
          } else {
            return "-";
          }
        },
      },
      {
        accessorKey: "status",
        header: t("articles.statusLabel", "Trạng thái"),
        cell: ({ row }) => (
          <ArticleStatusBadge
            status={row.getValue("status") as ArticleStatus}
          />
        ),
      },
      {
        accessorKey: "categories",
        header: t("articles.categories", "Danh mục"),
        cell: ({ row }) => {
          const categories = row.original.categories || [];
          if (categories.length === 0) return "-";
          return (
            <div className="flex flex-wrap gap-1">
              {categories.slice(0, 2).map((cat) => (
                <span
                  key={cat.id}
                  className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800"
                >
                  {cat.name}
                </span>
              ))}
              {categories.length > 2 && (
                <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                  +{categories.length - 2}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "tags",
        header: t("articles.tags", "Thẻ"),
        cell: ({ row }) => {
          const tags = row.original.tags || [];
          if (tags.length === 0) return "-";
          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800"
                >
                  {tag.name}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("articles.createdAt", "Ngày tạo"),
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"));
          return (
            <div className="text-sm">{date.toLocaleDateString("vi-VN")}</div>
          );
        },
      },
      {
        id: "actions",
        header: t("articles.actions", "Thao tác"),
        cell: ({ row }) => (
          <ArticleActions article={row.original} onUpdate={fetchArticles} />
        ),
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: filteredArticles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
    state: {
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.limit,
      },
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">
            {t("articles.title", "Quản lý bài viết")}
          </h1>
        </div>
        <Button onClick={() => navigate("/")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("articles.create", "Tạo bài viết")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t(
                "articles.searchPlaceholder",
                "Tìm kiếm bài viết..."
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue
              placeholder={t("articles.filterByStatus", "Lọc theo trạng thái")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("articles.allStatuses", "Tất cả trạng thái")}
            </SelectItem>
            <SelectItem value="draft">{t("articles.status.draft")}</SelectItem>
            <SelectItem value="submitted">
              {t("articles.status.submitted")}
            </SelectItem>
            <SelectItem value="under_review">
              {t("articles.status.under_review")}
            </SelectItem>
            <SelectItem value="approved">
              {t("articles.status.approved")}
            </SelectItem>
            <SelectItem value="rejected">
              {t("articles.status.rejected")}
            </SelectItem>
            <SelectItem value="published">
              {t("articles.status.published")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {t("articles.loading", "Đang tải...")}
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {t("articles.noArticles", "Không có bài viết nào")}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 whitespace-nowrap text-sm"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          {t("articles.showing", "Hiển thị")}{" "}
          {pagination.page * pagination.limit - pagination.limit + 1} -{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
          {t("articles.of", "của")} {pagination.total}{" "}
          {t("articles.articles", "bài viết")}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page - 1 })
            }
            disabled={pagination.page === 1}
          >
            {t("articles.previous", "Trước")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page + 1 })
            }
            disabled={pagination.page >= pagination.totalPages}
          >
            {t("articles.next", "Sau")}
          </Button>
        </div>
      </div>
    </div>
  );
}
