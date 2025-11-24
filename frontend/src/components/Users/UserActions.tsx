import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { MoreVertical, Edit, Trash2, Shield } from "lucide-react";

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
  };
}

interface UserActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: () => void;
  onRoleChange: () => void;
}

export function UserActions({ user, onEdit, onDelete, onRoleChange }: UserActionsProps) {
  const { t } = useTranslation();
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(user.roleId);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.roles.list();
        setRoles(response.data || []);
      } catch (error) {
        // Silent fail
      }
    };
    fetchRoles();
  }, []);

  const handleDelete = async () => {
    if (!confirm(t("users.confirmDelete", "Bạn có chắc chắn muốn xóa người dùng này?"))) {
      return;
    }
    try {
      await api.users.delete(user.id);
      toast.success(t("users.deleteSuccess", "Xóa người dùng thành công"));
      onDelete();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("users.deleteError", "Lỗi khi xóa người dùng"));
    }
  };

  const handleRoleChange = async () => {
    try {
      setLoading(true);
      await api.users.assignRole(user.id, { roleId: selectedRoleId });
      toast.success(t("users.roleChangeSuccess", "Thay đổi vai trò thành công"));
      setIsRoleDialogOpen(false);
      onRoleChange();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || t("users.roleChangeError", "Lỗi khi thay đổi vai trò")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(user)}>
            <Edit className="mr-2 h-4 w-4" />
            {t("users.edit", "Chỉnh sửa")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsRoleDialogOpen(true)}>
            <Shield className="mr-2 h-4 w-4" />
            {t("users.changeRole", "Thay đổi vai trò")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            {t("users.delete", "Xóa")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.changeRole", "Thay đổi vai trò")}</DialogTitle>
            <DialogDescription>
              {t("users.changeRoleDescription", "Chọn vai trò mới cho người dùng")} {user.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("users.role", "Vai trò")}
              </label>
              <Select
                value={selectedRoleId.toString()}
                onValueChange={(value) => setSelectedRoleId(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
                disabled={loading}
              >
                {t("common.cancel", "Hủy")}
              </Button>
              <Button onClick={handleRoleChange} disabled={loading}>
                {t("common.save", "Lưu")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

