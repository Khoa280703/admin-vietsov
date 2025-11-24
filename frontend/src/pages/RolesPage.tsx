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
import { RoleFormDialog } from "@/components/Roles/RoleFormDialog";
import { Plus, Search, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string;
  createdAt: string;
  updatedAt: string;
}

export function RolesPage() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.roles.list();
      setRoles(response.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("roles.fetchError", "Lỗi khi tải danh sách vai trò"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    if (!searchTerm) return roles;
    const search = searchTerm.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(search) ||
        role.description?.toLowerCase().includes(search)
    );
  }, [roles, searchTerm]);

  const parsePermissions = (permissionsString?: string): Record<string, string[]> => {
    if (!permissionsString) return {};
    try {
      return JSON.parse(permissionsString);
    } catch {
      return {};
    }
  };

  const getPermissionCount = (permissionsString?: string): number => {
    const permissions = parsePermissions(permissionsString);
    return Object.values(permissions).reduce((sum, actions) => sum + actions.length, 0);
  };

  const columns: ColumnDef<Role>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
      },
      {
        accessorKey: "name",
        header: t("roles.name", "Tên vai trò"),
      },
      {
        accessorKey: "description",
        header: t("roles.description", "Mô tả"),
        cell: ({ row }) => (
          <span className="text-gray-500">
            {row.getValue("description") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "permissions",
        header: t("roles.permissions", "Quyền"),
        cell: ({ row }) => {
          const count = getPermissionCount(row.original.permissions);
          return (
            <Badge variant="secondary">
              {count} {t("roles.permissionCount", "quyền")}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: t("roles.actions", "Thao tác"),
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingRole(row.original);
                setIsCreateDialogOpen(true);
              }}
            >
              {t("roles.edit", "Chỉnh sửa")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!confirm(t("roles.confirmDelete", "Bạn có chắc chắn muốn xóa vai trò này?"))) {
                  return;
                }
                try {
                  await api.roles.delete(row.original.id);
                  toast.success(t("roles.deleteSuccess", "Xóa vai trò thành công"));
                  fetchRoles();
                } catch (error: any) {
                  toast.error(error.response?.data?.error || t("roles.deleteError", "Lỗi khi xóa vai trò"));
                }
              }}
              className="text-red-600 hover:text-red-700"
            >
              {t("roles.delete", "Xóa")}
            </Button>
          </div>
        ),
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: filteredRoles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    fetchRoles();
  };

  const handleEditSuccess = () => {
    setIsCreateDialogOpen(false);
    setEditingRole(null);
    fetchRoles();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("roles.title", "Quản lý phân quyền")}</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRole(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("roles.create", "Tạo vai trò")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole
                  ? t("roles.editRole", "Chỉnh sửa vai trò")
                  : t("roles.createRole", "Tạo vai trò mới")}
              </DialogTitle>
              <DialogDescription>
                {editingRole
                  ? t("roles.editDescription", "Cập nhật thông tin và quyền của vai trò")
                  : t("roles.createDescription", "Điền thông tin và chọn quyền cho vai trò mới")}
              </DialogDescription>
            </DialogHeader>
            <RoleFormDialog
              role={editingRole || undefined}
              onSuccess={editingRole ? handleEditSuccess : handleCreateSuccess}
              onCancel={() => {
                setIsCreateDialogOpen(false);
                setEditingRole(null);
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
            placeholder={t("roles.searchPlaceholder", "Tìm kiếm vai trò...")}
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
                    {t("roles.loading", "Đang tải...")}
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    {t("roles.noRoles", "Không có vai trò nào")}
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
    </div>
  );
}

