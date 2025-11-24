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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { TagFormDialog } from "@/components/Tags/TagFormDialog";
import { Search, Plus, Tag as TagIcon } from "lucide-react";

interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function TagsPage() {
  const { t } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await api.tags.list(params);
      setTags(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("tags.fetchError", "Lỗi khi tải danh sách thẻ"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [pagination.page, pagination.limit, searchTerm]);

  const columns: ColumnDef<Tag>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
      },
      {
        accessorKey: "name",
        header: t("tags.name", "Tên thẻ"),
      },
      {
        accessorKey: "slug",
        header: t("tags.slug", "Slug"),
        cell: ({ row }) => (
          <span className="text-gray-500 font-mono text-sm">{row.getValue("slug")}</span>
        ),
      },
      {
        accessorKey: "description",
        header: t("tags.description", "Mô tả"),
        cell: ({ row }) => (
          <span className="text-gray-500">
            {row.getValue("description") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: t("tags.createdAt", "Ngày tạo"),
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"));
          return <div className="text-sm">{date.toLocaleDateString("vi-VN")}</div>;
        },
      },
      {
        id: "actions",
        header: t("tags.actions", "Thao tác"),
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingTag(row.original);
                setIsCreateDialogOpen(true);
              }}
            >
              {t("tags.edit", "Chỉnh sửa")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!confirm(t("tags.confirmDelete", "Bạn có chắc chắn muốn xóa thẻ này?"))) {
                  return;
                }
                try {
                  await api.tags.delete(row.original.id);
                  toast.success(t("tags.deleteSuccess", "Xóa thẻ thành công"));
                  fetchTags();
                } catch (error: any) {
                  toast.error(error.response?.data?.error || t("tags.deleteError", "Lỗi khi xóa thẻ"));
                }
              }}
              className="text-red-600 hover:text-red-700"
            >
              {t("tags.delete", "Xóa")}
            </Button>
          </div>
        ),
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: tags,
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

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    fetchTags();
  };

  const handleEditSuccess = () => {
    setIsCreateDialogOpen(false);
    setEditingTag(null);
    fetchTags();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TagIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("tags.title", "Quản lý thẻ")}</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTag(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("tags.create", "Tạo thẻ")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTag
                  ? t("tags.editTag", "Chỉnh sửa thẻ")
                  : t("tags.createTag", "Tạo thẻ mới")}
              </DialogTitle>
              <DialogDescription>
                {editingTag
                  ? t("tags.editDescription", "Cập nhật thông tin thẻ")
                  : t("tags.createDescription", "Điền thông tin để tạo thẻ mới")}
              </DialogDescription>
            </DialogHeader>
            <TagFormDialog
              tag={editingTag || undefined}
              onSuccess={editingTag ? handleEditSuccess : handleCreateSuccess}
              onCancel={() => {
                setIsCreateDialogOpen(false);
                setEditingTag(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t("tags.searchPlaceholder", "Tìm kiếm thẻ...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    {t("tags.loading", "Đang tải...")}
                  </td>
                </tr>
              ) : tags.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    {t("tags.noTags", "Không có thẻ nào")}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
          {t("tags.showing", "Hiển thị")} {pagination.page * pagination.limit - pagination.limit + 1} -{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} {t("tags.of", "của")}{" "}
          {pagination.total} {t("tags.tags", "thẻ")}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            {t("tags.previous", "Trước")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page >= pagination.totalPages}
          >
            {t("tags.next", "Sau")}
          </Button>
        </div>
      </div>
    </div>
  );
}

