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
import { UserFormDialog } from "@/components/Users/UserFormDialog";
import { UserActions } from "@/components/Users/UserActions";
import { Plus, Search, Users as UsersIcon } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roleId: number;
  isActive: boolean;
  role?: {
    id: number;
    name: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (roleFilter !== "all") {
        // Note: Backend might need roleId filter, adjust if needed
      }
      const response = await api.users.list(params);
      setUsers(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("users.fetchError", "Lỗi khi tải danh sách người dùng"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, roleFilter, statusFilter]);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.fullName.toLowerCase().includes(search)
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role?.name === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (user) => (statusFilter === "active") === user.isActive
      );
    }

    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter]);

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
      },
      {
        accessorKey: "username",
        header: t("users.username", "Tên đăng nhập"),
      },
      {
        accessorKey: "email",
        header: t("users.email", "Email"),
      },
      {
        accessorKey: "fullName",
        header: t("users.fullName", "Họ tên"),
      },
      {
        accessorKey: "role",
        header: t("users.role", "Vai trò"),
        cell: ({ row }) => {
          const role = row.original.role;
          return (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {role?.name || "N/A"}
            </span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: t("users.status", "Trạng thái"),
        cell: ({ row }) => {
          const isActive = row.getValue("isActive") as boolean;
          return (
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                isActive
                  ? "bg-vietsov-green/10 text-vietsov-green border border-vietsov-green/20"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isActive ? t("users.active", "Hoạt động") : t("users.inactive", "Vô hiệu hóa")}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: t("users.actions", "Thao tác"),
        cell: ({ row }) => (
          <UserActions
            user={row.original}
            onEdit={(user) => {
              setEditingUser(user);
              setIsCreateDialogOpen(true);
            }}
            onDelete={fetchUsers}
            onRoleChange={fetchUsers}
          />
        ),
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: filteredUsers,
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
    fetchUsers();
  };

  const handleEditSuccess = () => {
    setIsCreateDialogOpen(false);
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("users.title", "Quản lý người dùng")}</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingUser(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("users.create", "Tạo người dùng")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUser
                  ? t("users.editUser", "Chỉnh sửa người dùng")
                  : t("users.createUser", "Tạo người dùng mới")}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? t("users.editDescription", "Cập nhật thông tin người dùng")
                  : t("users.createDescription", "Điền thông tin để tạo người dùng mới")}
              </DialogDescription>
            </DialogHeader>
            <UserFormDialog
              user={editingUser || undefined}
              onSuccess={editingUser ? handleEditSuccess : handleCreateSuccess}
              onCancel={() => {
                setIsCreateDialogOpen(false);
                setEditingUser(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("users.searchPlaceholder", "Tìm kiếm người dùng...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("users.filterByRole", "Lọc theo vai trò")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.allRoles", "Tất cả vai trò")}</SelectItem>
            <SelectItem value="admin">{t("users.admin", "Admin")}</SelectItem>
            <SelectItem value="user">{t("users.user", "User")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("users.filterByStatus", "Lọc theo trạng thái")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.allStatuses", "Tất cả")}</SelectItem>
            <SelectItem value="active">{t("users.active", "Hoạt động")}</SelectItem>
            <SelectItem value="inactive">{t("users.inactive", "Vô hiệu hóa")}</SelectItem>
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
                    {t("users.loading", "Đang tải...")}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    {t("users.noUsers", "Không có người dùng nào")}
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
          {t("users.showing", "Hiển thị")} {pagination.page * pagination.limit - pagination.limit + 1} -{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} {t("users.of", "của")}{" "}
          {pagination.total} {t("users.users", "người dùng")}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            {t("users.previous", "Trước")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page >= pagination.totalPages}
          >
            {t("users.next", "Sau")}
          </Button>
        </div>
      </div>
    </div>
  );
}

